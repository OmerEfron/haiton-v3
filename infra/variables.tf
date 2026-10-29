variable "supabase_org_slug" {
  type        = string
  description = "Supabase organization slug (`supabase orgs list`)."
}

variable "supabase_project_ref" {
  type    = string
  default = "ijchuppvtlbcdcodyzpv"
}

variable "supabase_project_name" {
  type    = string
  default = "haiton-v3"
}

variable "supabase_db_password" {
  type        = string
  sensitive   = true
  description = "Database password of the existing Supabase project."
}

variable "supabase_region" {
  type    = string
  default = "eu-west-1"
}

variable "vercel_org_id" {
  type        = string
  description = "Vercel team id (team_...) or personal account id (see `vercel teams ls` / account settings)."
}

variable "fly_org" {
  type    = string
  default = "personal"
}

variable "fly_region" {
  type    = string
  default = "fra"
}

variable "fly_api_token" {
  type        = string
  sensitive   = true
  description = "`fly tokens create org`. Used by terraform and stored as the CI secret."
}

variable "vercel_api_token" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "github_owner" {
  type    = string
  default = "OmerEfron"
}

variable "github_repo" {
  type    = string
  default = "haiton-v3"
}

# Fly app names are global. Keep in sync with backend/fly.toml, ai-reporter/fly.toml, frontend/vercel.json.
variable "name_prefix" {
  type    = string
  default = "haiton"
}
