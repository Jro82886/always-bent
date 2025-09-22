-- Create chat_messages table for inlet-based chat
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  inlet_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- Create index for efficient queries
create index idx_chat_messages_inlet_created 
  on public.chat_messages(inlet_id, created_at desc);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- RLS policies
-- Everyone can read messages
create policy "chat_messages_select" on public.chat_messages
  for select using (true);

-- Users can only insert their own messages
create policy "chat_messages_insert" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- Users cannot update or delete messages
-- (No update/delete policies = denied by default)
