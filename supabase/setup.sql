-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  idea_text text not null check (char_length(idea_text) > 0 and char_length(idea_text) <= 5000),
  created_at timestamptz not null default now()
);

alter table public.ideas enable row level security;

drop policy if exists "Anyone can insert ideas" on public.ideas;
create policy "Anyone can insert ideas"
  on public.ideas
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Only authenticated users can read ideas" on public.ideas;
create policy "Only authenticated users can read ideas"
  on public.ideas
  for select
  to authenticated
  using (true);
