-- ClientCollect prototype schema.
-- This Supabase project is shared with other work, so every table here is
-- prefixed `cc_` to stay out of the way of anything else in the project.
-- All access happens server-side with the service role (secret) key, which
-- bypasses RLS — RLS is enabled with no policies anyway as a safety net so
-- the publishable (anon) key can never read/write this data even if it's
-- ever used client-side by mistake.

create table if not exists cc_organizations (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists cc_clients (
  id text primary key,
  org_id text not null references cc_organizations(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists cc_clients_org_id_idx on cc_clients(org_id);

create table if not exists cc_document_requests (
  id text primary key,
  org_id text not null references cc_organizations(id) on delete cascade,
  client_id text not null references cc_clients(id) on delete cascade,
  label text not null,
  description text,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'complete')),
  created_at timestamptz not null default now(),
  first_opened_at timestamptz,
  completed_at timestamptz
);
create index if not exists cc_document_requests_org_id_idx on cc_document_requests(org_id);
create index if not exists cc_document_requests_client_id_idx on cc_document_requests(client_id);

create table if not exists cc_required_documents (
  id text primary key,
  request_id text not null references cc_document_requests(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);
create index if not exists cc_required_documents_request_id_idx on cc_required_documents(request_id);

create table if not exists cc_uploaded_documents (
  id text primary key,
  required_document_id text not null references cc_required_documents(id) on delete cascade,
  file_name text not null,
  storage_key text not null,
  mime_type text not null,
  size_bytes bigint not null,
  version int not null default 1,
  is_current boolean not null default true,
  uploaded_at timestamptz not null default now()
);
create index if not exists cc_uploaded_documents_required_document_id_idx
  on cc_uploaded_documents(required_document_id);
-- only one "current" file per required document at a time
create unique index if not exists cc_uploaded_documents_one_current_idx
  on cc_uploaded_documents(required_document_id)
  where is_current;

create table if not exists cc_activity_logs (
  id text primary key,
  org_id text not null references cc_organizations(id) on delete cascade,
  client_id text references cc_clients(id) on delete set null,
  request_id text references cc_document_requests(id) on delete set null,
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists cc_activity_logs_org_id_created_at_idx
  on cc_activity_logs(org_id, created_at desc);

alter table cc_organizations enable row level security;
alter table cc_clients enable row level security;
alter table cc_document_requests enable row level security;
alter table cc_required_documents enable row level security;
alter table cc_uploaded_documents enable row level security;
alter table cc_activity_logs enable row level security;
