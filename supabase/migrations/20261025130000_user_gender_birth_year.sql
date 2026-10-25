alter table users
  add column gender text check (gender in ('male', 'female', 'other')),
  add column birth_year int check (birth_year between 1900 and 2100);
