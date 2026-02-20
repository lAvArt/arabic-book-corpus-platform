create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists source (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null,
  title_en text,
  author text,
  work_type text not null default 'dictionary',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists edition (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references source(id) on delete cascade,
  edition_name text not null,
  publisher text,
  publication_year integer,
  is_canonical boolean not null default false,
  manifest_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists volume (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references edition(id) on delete cascade,
  volume_number integer not null,
  page_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, volume_number)
);

create table if not exists page_image (
  id uuid primary key default gen_random_uuid(),
  volume_id uuid not null references volume(id) on delete cascade,
  page_number integer not null,
  storage_path text not null,
  image_sha256 text not null,
  width_px integer,
  height_px integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (volume_id, page_number)
);

create table if not exists ocr_result (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references page_image(id) on delete cascade,
  engine_name text not null,
  engine_version text,
  result_json jsonb not null,
  avg_confidence numeric(5,4),
  created_at timestamptz not null default now(),
  unique (page_id, engine_name, engine_version)
);

create table if not exists page_line (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references page_image(id) on delete cascade,
  line_no integer not null,
  text_raw text not null,
  text_normalized text not null,
  confidence numeric(5,4),
  bbox jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, line_no)
);

create table if not exists passage (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references edition(id) on delete cascade,
  volume_no integer not null,
  page_no integer not null,
  line_start integer not null,
  line_end integer not null,
  text_raw text not null,
  text_normalized text not null,
  search_vector tsvector generated always as (to_tsvector('simple', text_normalized)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, volume_no, page_no, line_start, line_end)
);

create index if not exists idx_passage_search_vector on passage using gin (search_vector);
create index if not exists idx_passage_text_normalized_trgm on passage using gin (text_normalized gin_trgm_ops);
create index if not exists idx_passage_citation on passage (edition_id, volume_no, page_no);

create table if not exists passage_anchor (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references passage(id) on delete cascade,
  page_id uuid not null references page_image(id) on delete cascade,
  bbox jsonb not null,
  char_start integer not null,
  char_end integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_passage_anchor_passage on passage_anchor (passage_id);

create table if not exists token (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references passage(id) on delete cascade,
  position integer not null,
  surface_raw text not null,
  surface_normalized text not null,
  lemma text,
  root text,
  pos text,
  morph_features_json jsonb,
  char_start integer not null,
  char_end integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (passage_id, position)
);

create index if not exists idx_token_surface_normalized on token (surface_normalized);
create index if not exists idx_token_surface_trgm on token using gin (surface_normalized gin_trgm_ops);
create index if not exists idx_token_root on token (root);
create index if not exists idx_token_lemma on token (lemma);
create index if not exists idx_token_pos on token (pos);

create table if not exists review_task (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  reason_code text not null,
  status text not null default 'open',
  priority smallint not null default 3,
  created_by text,
  assigned_to text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_review_task_status on review_task (status, priority desc, created_at asc);

create table if not exists review_assignment (
  id uuid primary key default gen_random_uuid(),
  review_task_id uuid not null references review_task(id) on delete cascade,
  reviewer_user_id text not null,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists correction_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  before_json jsonb not null,
  after_json jsonb not null,
  editor_user_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists dataset_release (
  id uuid primary key default gen_random_uuid(),
  version_tag text not null unique,
  release_month date not null,
  generated_at timestamptz not null default now(),
  checksum_sha256 text not null,
  item_count integer not null default 0,
  changelog_md text not null default '',
  created_by text not null
);

create table if not exists dataset_manifest (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references dataset_release(id) on delete cascade,
  manifest_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (release_id)
);

create table if not exists dataset_release_item (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references dataset_release(id) on delete cascade,
  source_id uuid not null references source(id) on delete cascade,
  edition_id uuid not null references edition(id) on delete cascade,
  passage_count integer not null,
  token_count integer not null,
  created_at timestamptz not null default now(),
  unique (release_id, edition_id)
);

create table if not exists rate_limit_policy (
  id uuid primary key default gen_random_uuid(),
  policy_name text not null unique,
  requests_per_minute integer not null,
  requests_per_day integer not null,
  created_at timestamptz not null default now()
);

insert into rate_limit_policy (policy_name, requests_per_minute, requests_per_day)
values ('default-free', 120, 25000)
on conflict (policy_name) do nothing;

create table if not exists api_key (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null,
  key_name text not null,
  key_prefix text not null,
  key_hash text not null,
  rate_limit_policy_id uuid references rate_limit_policy(id),
  expires_at timestamptz,
  revoked_at timestamptz,
  rotated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_api_key_owner on api_key (owner_user_id);
create index if not exists idx_api_key_prefix on api_key (key_prefix);
create unique index if not exists idx_api_key_hash_unique on api_key (key_hash);

create table if not exists api_key_usage_daily (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid not null references api_key(id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0,
  last_request_at timestamptz not null default now(),
  unique (api_key_id, usage_date)
);

create table if not exists audit_event (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null,
  actor_id text,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ingest_job (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references edition(id) on delete cascade,
  status text not null default 'queued',
  progress_pct numeric(5,2) not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ingest_job_stage (
  id uuid primary key default gen_random_uuid(),
  ingest_job_id uuid not null references ingest_job(id) on delete cascade,
  page_id uuid references page_image(id) on delete cascade,
  stage_name text not null,
  status text not null default 'queued',
  error_message text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_ingest_job_stage_unique
  on ingest_job_stage (ingest_job_id, coalesce(page_id, '00000000-0000-0000-0000-000000000000'::uuid), stage_name);

create index if not exists idx_ingest_job_stage_status on ingest_job_stage (status, updated_at desc);
