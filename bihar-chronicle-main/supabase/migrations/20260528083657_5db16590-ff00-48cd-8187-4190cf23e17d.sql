
-- ============ Roles ============
create type public.app_role as enum ('admin', 'editor');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "users read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ============ Categories ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_hi text not null,
  name_en text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

create policy "categories public read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories admin write" on public.categories
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ Authors ============
create table public.authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

grant select on public.authors to anon, authenticated;
grant all on public.authors to service_role;
alter table public.authors enable row level security;

create policy "authors public read" on public.authors
  for select to anon, authenticated using (true);
create policy "authors admin write" on public.authors
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ News articles ============
create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  summary text,
  content text not null,
  image_url text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.authors(id) on delete set null,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  featured_rank int,
  view_count int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_articles_published_idx on public.news_articles (status, published_at desc);
create index news_articles_category_idx on public.news_articles (category_id, published_at desc);
create index news_articles_featured_idx on public.news_articles (is_featured, featured_rank);

grant select on public.news_articles to anon, authenticated;
grant all on public.news_articles to service_role;
alter table public.news_articles enable row level security;

create policy "published articles public read" on public.news_articles
  for select to anon, authenticated using (status = 'published');
create policy "admin read all articles" on public.news_articles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin write articles" on public.news_articles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger news_articles_touch
before update on public.news_articles
for each row execute function public.touch_updated_at();

-- ============ Breaking news ticker ============
create table public.breaking_news (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  link text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.breaking_news to anon, authenticated;
grant all on public.breaking_news to service_role;
alter table public.breaking_news enable row level security;

create policy "breaking public read" on public.breaking_news
  for select to anon, authenticated using (is_active);
create policy "breaking admin write" on public.breaking_news
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ Storage bucket ============
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

create policy "news images public read" on storage.objects
  for select using (bucket_id = 'news-images');
create policy "news images admin write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'news-images' and public.has_role(auth.uid(), 'admin'));
create policy "news images admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'news-images' and public.has_role(auth.uid(), 'admin'));
create policy "news images admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'news-images' and public.has_role(auth.uid(), 'admin'));

-- ============ Seed categories ============
insert into public.categories (slug, name_hi, name_en, sort_order) values
  ('bihar', 'बिहार', 'Bihar', 1),
  ('india', 'भारत', 'India', 2),
  ('world', 'विश्व', 'World', 3),
  ('politics', 'राजनीति', 'Politics', 4),
  ('sports', 'खेल', 'Sports', 5),
  ('business', 'व्यापार', 'Business', 6),
  ('education', 'शिक्षा', 'Education', 7),
  ('entertainment', 'मनोरंजन', 'Entertainment', 8),
  ('crime', 'अपराध', 'Crime', 9),
  ('tech', 'टेक्नोलॉजी', 'Tech', 10);
