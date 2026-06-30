-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null default 'Untitled',
  canvas_width int not null default 1440,
  canvas_height int not null default 900,
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists project_data (
  project_id uuid primary key references projects(id) on delete cascade,
  elements jsonb not null default '{}',
  root_element_ids jsonb not null default '[]',
  canvas_state jsonb not null default '{"x":0,"y":0,"scale":1}',
  updated_at timestamptz default now()
);

create table if not exists cms_collections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  fields jsonb not null default '[]',
  created_at timestamptz default now()
);

create table if not exists cms_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references cms_collections(id) on delete cascade,
  values jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

alter table projects enable row level security;
alter table project_data enable row level security;
alter table cms_collections enable row level security;
alter table cms_items enable row level security;

-- Projects: users can only see/edit their own
create policy "Users own their projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Project data: accessible if the project belongs to the user
create policy "Users own their project data"
  on project_data for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  )
  with check (
    project_id in (select id from projects where user_id = auth.uid())
  );

-- CMS Collections: tied to user's projects
create policy "CMS collections tied to project"
  on cms_collections for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  )
  with check (
    project_id in (select id from projects where user_id = auth.uid())
  );

-- CMS Items: tied to user's collections
create policy "CMS items tied to collection"
  on cms_items for all
  using (
    collection_id in (
      select cc.id from cms_collections cc
      join projects p on p.id = cc.project_id
      where p.user_id = auth.uid()
    )
  )
  with check (
    collection_id in (
      select cc.id from cms_collections cc
      join projects p on p.id = cc.project_id
      where p.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE (for published site files)
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('sites', 'sites', true)
on conflict (id) do nothing;

create policy "Users can upload their own sites"
  on storage.objects for insert
  with check (
    bucket_id = 'sites'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view published sites"
  on storage.objects for select
  using (bucket_id = 'sites');

create policy "Users can update their own sites"
  on storage.objects for update
  using (
    bucket_id = 'sites'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
