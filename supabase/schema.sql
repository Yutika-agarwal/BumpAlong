-- Bumpalong on Supabase. Run once in the SQL editor of a new project.
-- NOT YET TESTED against a live project: run it on a throwaway project first.
--
-- One generic table holds every kind of record ("col"): members, listings, interests, requests, holds.
-- Row-level security decides who can read or write each kind. The four functions at the bottom do
-- the moves that touch more than one person (the draw, claiming, releasing a hold, crediting the giver).

create table if not exists public.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  owner uuid not null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
create index if not exists docs_col_idx on public.docs (col);
alter table public.docs enable row level security;

-- Who may write a row of each kind.
create or replace function public.can_write(c text, i text, d jsonb)
returns boolean language sql stable as $$
  select case c
    when 'members'   then i = auth.uid()::text
    when 'listings'  then d->>'giverId' = auth.uid()::text
    when 'interests' then d->>'userId'  = auth.uid()::text
    when 'requests'  then d->>'whoId'   = auth.uid()::text
    when 'holds'     then d->>'giverId' = auth.uid()::text or d->>'receiverId' = auth.uid()::text
    else false
  end
$$;

-- Everyone signed in can read everything except holds, which only the giver and receiver can read.
drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to authenticated
  using (col <> 'holds' or can_write(col, id, data));

-- Holds are created only by the functions below, never straight from the browser.
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated
  with check (col <> 'holds' and can_write(col, id, data));

drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated
  using (can_write(col, id, data)) with check (can_write(col, id, data));

drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete to authenticated
  using (col <> 'holds' and col <> 'members' and can_write(col, id, data));

alter publication supabase_realtime add table public.docs;

-- ---------------------------------------------------------------------------------------------
-- Helpers
create or replace function public.now_ms() returns bigint language sql stable as $$
  select (extract(epoch from clock_timestamp()) * 1000)::bigint
$$;

create or replace function public.new_hold(p_listing text, p_hold text, p_giver text, p_receiver text, p_backups jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into docs (col, id, owner, data) values ('holds', p_hold, auth.uid(), jsonb_build_object(
    'id', p_hold, 'listingId', p_listing, 'giverId', p_giver, 'receiverId', p_receiver,
    'receiverName', coalesce((select data->>'name' from docs where col = 'members' and id = p_receiver), 'A neighbor'),
    'backups', p_backups, 'state', 'offered', 'acceptBy', now_ms() + 6 * 3600 * 1000, 'slot', null,
    'messages', jsonb_build_array(jsonb_build_object('sys', true, 'by', '', 't', 'Chat stays in the app. Phone numbers and links are hidden.')),
    'createdAt', now_ms()));
end $$;

-- ---------------------------------------------------------------------------------------------
-- The draw: runs after the claim window closes. Safe to call twice; the second call changes nothing.
create or replace function public.run_draw(p_listing text) returns void
language plpgsql security definer set search_path = public as $$
declare
  l docs%rowtype; v_round text; v_hid text; v_order text[];
begin
  if auth.uid() is null then raise exception 'sign_in_required'; end if;
  select * into l from docs where col = 'listings' and id = p_listing;
  if not found or l.data->>'status' <> 'open' then return; end if;
  if (l.data->>'closes') is null or (l.data->>'closes')::bigint > now_ms() then return; end if;
  v_round := coalesce(l.data->>'round', '0');
  v_hid := 'hold_' || p_listing || '_' || v_round;
  if exists (select 1 from docs where col = 'holds' and id = v_hid) then
    update docs set data = data || '{"status":"drawn"}' where col = 'listings' and id = p_listing;
    return;
  end if;
  select coalesce(array_agg(uid order by md5(p_listing || ':' || v_round || ':' || uid)), '{}') into v_order
  from (
    select distinct i.data->>'userId' as uid
    from docs i join docs m on m.col = 'members' and m.id = i.data->>'userId'
    where i.col = 'interests' and i.data->>'listingId' = p_listing
      and i.data->>'userId' <> l.data->>'giverId'
      and coalesce((m.data->>'reliability')::int, 80) >= 40
  ) q;
  if cardinality(v_order) = 0 then
    update docs set data = data || jsonb_build_object('closes', now_ms() + 12 * 3600 * 1000) where col = 'listings' and id = p_listing;
    return;
  end if;
  perform new_hold(p_listing, v_hid, l.data->>'giverId', v_order[1], to_jsonb(v_order[2:4]));
  update docs set data = data || '{"status":"drawn"}' where col = 'listings' and id = p_listing;
end $$;

-- First come, first served items: the claimer gets the hold at once.
create or replace function public.claim_first_come(p_listing text) returns boolean
language plpgsql security definer set search_path = public as $$
declare l docs%rowtype; v_hid text;
begin
  if auth.uid() is null then raise exception 'sign_in_required'; end if;
  select * into l from docs where col = 'listings' and id = p_listing for update;
  if not found or l.data->>'status' <> 'open' or l.data->>'mode' <> 'First come' then return false; end if;
  if l.data->>'giverId' = auth.uid()::text then return false; end if;
  v_hid := 'hold_' || p_listing || '_' || coalesce(l.data->>'round', '0');
  if exists (select 1 from docs where col = 'holds' and id = v_hid) then return false; end if;
  perform new_hold(p_listing, v_hid, l.data->>'giverId', auth.uid()::text, '[]'::jsonb);
  update docs set data = data || '{"status":"drawn"}' where col = 'listings' and id = p_listing;
  return true;
end $$;

-- Pass on, expire or decline a hold. mode 'next' offers it to the next backup (or reopens the listing);
-- mode 'reopen' puts the listing back up. The giver can only do this once the accept time has run out.
create or replace function public.release_hold(p_hold text, p_mode text, p_result_r text, p_result_g text) returns void
language plpgsql security definer set search_path = public as $$
declare h docs%rowtype; l docs%rowtype; v_next text; v_uid text := auth.uid()::text;
begin
  if v_uid is null then raise exception 'sign_in_required'; end if;
  select * into h from docs where col = 'holds' and id = p_hold for update;
  if not found then return; end if;
  if v_uid not in (h.data->>'giverId', h.data->>'receiverId') then raise exception 'not_a_participant'; end if;
  if h.data->>'state' in ('released', 'done') then return; end if;
  if v_uid = h.data->>'giverId' and not (h.data->>'state' = 'offered' and (h.data->>'acceptBy')::bigint < now_ms()) then
    raise exception 'giver_can_only_release_expired_offers';
  end if;
  select * into l from docs where col = 'listings' and id = h.data->>'listingId';
  update docs set data = data || jsonb_build_object('state', 'released', 'result', p_result_r, 'resultGiver', p_result_g)
    where col = 'holds' and id = p_hold;
  if p_mode = 'next' and jsonb_array_length(coalesce(h.data->'backups', '[]'::jsonb)) > 0 then
    v_next := h.data->'backups'->>0;
    if not exists (select 1 from docs where col = 'holds' and id = p_hold || '_n') then
      perform new_hold(h.data->>'listingId', p_hold || '_n', h.data->>'giverId', v_next, (h.data->'backups') - 0);
    end if;
  else
    delete from docs where col = 'interests' and data->>'listingId' = h.data->>'listingId';
    update docs set data = data || jsonb_build_object(
      'status', 'open', 'round', coalesce((l.data->>'round')::int, 0) + 1,
      'closes', case when l.data->>'mode' = 'First come' then null else now_ms() + 12 * 3600 * 1000 end)
      where col = 'listings' and id = l.id;
  end if;
end $$;

-- The receiver confirms the handoff; the giver is credited once, using the tier stored on the listing.
create or replace function public.credit_giver(p_hold text) returns void
language plpgsql security definer set search_path = public as $$
declare h docs%rowtype; l docs%rowtype; v_earn int;
begin
  if auth.uid() is null then raise exception 'sign_in_required'; end if;
  select * into h from docs where col = 'holds' and id = p_hold for update;
  if not found or h.data->>'receiverId' <> auth.uid()::text or h.data->>'state' <> 'done' then return; end if;
  if coalesce((h.data->>'credited')::boolean, false) then return; end if;
  select * into l from docs where col = 'listings' and id = h.data->>'listingId';
  v_earn := case l.data->>'tier' when 'Large' then 300 when 'Medium' then 150 else 50 end;
  update docs set data = data || jsonb_build_object(
    'balance', coalesce((data->>'balance')::int, 0) + v_earn,
    'ledger', coalesce(data->'ledger', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('t', now_ms(), 'what', 'Gave: ' || (l.data->>'title'), 'amt', v_earn)))
    where col = 'members' and id = h.data->>'giverId';
  update docs set data = data || '{"credited":true}' where col = 'holds' and id = p_hold;
  update docs set data = data || '{"status":"done"}' where col = 'listings' and id = l.id;
end $$;

grant execute on function public.run_draw(text), public.claim_first_come(text),
  public.release_hold(text, text, text, text), public.credit_giver(text) to authenticated;
