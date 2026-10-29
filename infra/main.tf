terraform {
  required_version = ">= 1.6"

  # ponytail: local state, single operator only. Move to a remote backend once someone else runs this.
  required_providers {
    supabase = { source = "supabase/supabase", version = "~> 1.0" }
    vercel   = { source = "vercel/vercel", version = ">= 4.8" }
    github   = { source = "integrations/github", version = "~> 6.0" }
    random   = { source = "hashicorp/random", version = "~> 3.6" }
  }
}

# SUPABASE_ACCESS_TOKEN and GITHUB_TOKEN come from the environment.
provider "supabase" {}
provider "github" { owner = var.github_owner }
provider "vercel" {
  api_token = var.vercel_api_token
  team      = startswith(var.vercel_org_id, "team_") ? var.vercel_org_id : null
}

# ---- Supabase ----

# Shared by both APIs: ai-reporter verifies the cookie signed by backend.
resource "random_password" "cookie" {
  length  = 48
  special = false
}

# Adopts the project that already exists (created before terraform).
import {
  to = supabase_project.db
  id = var.supabase_project_ref
}

resource "supabase_project" "db" {
  organization_id   = var.supabase_org_slug
  name              = var.supabase_project_name
  database_password = var.supabase_db_password
  region            = var.supabase_region
}

data "supabase_pooler" "db" {
  project_ref = supabase_project.db.id
}

locals {
  # The data source only returns the transaction pooler (:6543). Same host on :5432 is the session pooler,
  # which suits migrations and pg, and is IPv4 (the direct DB host is IPv6-only, unreachable from GitHub Actions).
  database_url = replace(replace(data.supabase_pooler.db.url["transaction"], ":6543/", ":5432/"), "[YOUR-PASSWORD]", var.supabase_db_password)
  secrets = {
    api = { DATABASE_URL = local.database_url, COOKIE_SECRET = random_password.cookie.result }
    ai = {
      DATABASE_URL   = local.database_url
      COOKIE_SECRET  = random_password.cookie.result
      OPENAI_API_KEY = var.openai_api_key
    }
  }
  ci_secrets = {
    FLY_API_TOKEN     = var.fly_api_token
    VERCEL_TOKEN      = var.vercel_api_token
    VERCEL_ORG_ID     = var.vercel_org_id
    VERCEL_PROJECT_ID = vercel_project.web.id
    DATABASE_URL      = local.database_url
  }
}

# ---- Fly (no maintained provider: shell out to flyctl; idempotent) ----

resource "terraform_data" "fly_app" {
  for_each         = toset(keys(nonsensitive(local.secrets)))
  triggers_replace = [each.key, var.name_prefix]
  provisioner "local-exec" {
    environment = { FLY_API_TOKEN = var.fly_api_token }
    command     = "fly status -a ${var.name_prefix}-${each.key} >/dev/null 2>&1 || fly apps create ${var.name_prefix}-${each.key} --org ${var.fly_org}"
  }
}

resource "terraform_data" "fly_secrets" {
  for_each         = toset(keys(nonsensitive(local.secrets)))
  depends_on       = [terraform_data.fly_app]
  triggers_replace = [sha256(jsonencode(local.secrets[each.key]))]
  provisioner "local-exec" {
    environment = merge({ FLY_API_TOKEN = var.fly_api_token }, local.secrets[each.key])
    # Staged: applied by the next `fly deploy` (CI), no machines needed yet.
    command = "env | grep -E '^(${join("|", keys(nonsensitive(local.secrets[each.key])))})=' | fly secrets import --stage -a ${var.name_prefix}-${each.key}"
  }
}

# ---- Vercel ----

resource "vercel_project" "web" {
  name      = "${var.name_prefix}-web"
  framework = "vite"
  # No git_repository: deployments come only from the GitHub Actions pipeline.
  vercel_authentication = { deployment_type = "none" }
}

resource "vercel_project_environment_variable" "mock" {
  for_each   = toset(["VITE_MOCK_AI", "VITE_MOCK_CORE"])
  project_id = vercel_project.web.id
  key        = each.key
  value      = "false"
  target     = ["production"]
  sensitive  = false
}

# ---- GitHub Actions secrets ----

resource "github_actions_secret" "ci" {
  for_each        = toset(keys(nonsensitive(local.ci_secrets)))
  repository      = var.github_repo
  secret_name     = each.key
  plaintext_value = local.ci_secrets[each.key]
}

output "url" {
  value = "https://${vercel_project.web.name}.vercel.app"
}
