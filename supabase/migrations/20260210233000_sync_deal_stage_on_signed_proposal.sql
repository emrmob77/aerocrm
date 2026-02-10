-- Keep deals and signed proposals in sync even when API-level deal updates fail.
create or replace function public.sync_deal_stage_on_proposal_signed()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_signed_at timestamptz;
begin
  if new.deal_id is null then
    return new;
  end if;

  if lower(coalesce(new.status, '')) <> 'signed' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and lower(coalesce(old.status, '')) = 'signed'
     and old.deal_id = new.deal_id then
    return new;
  end if;

  v_signed_at := coalesce(new.signed_at, timezone('utc', now()));

  update public.deals
  set stage = 'won',
      updated_at = v_signed_at
  where id = new.deal_id
    and (new.team_id is null or team_id = new.team_id)
    and lower(coalesce(stage, '')) <> 'won';

  return new;
end;
$function$;

drop trigger if exists trg_sync_deal_stage_on_proposal_signed on public.proposals;
create trigger trg_sync_deal_stage_on_proposal_signed
after insert or update of status, signed_at, deal_id
on public.proposals
for each row
when (
  new.deal_id is not null
  and lower(coalesce(new.status, '')) = 'signed'
)
execute function public.sync_deal_stage_on_proposal_signed();

-- Backfill already-signed proposals that still have non-won deals.
update public.deals as d
set stage = 'won',
    updated_at = coalesce(p.signed_at, timezone('utc', now()))
from public.proposals as p
where p.deal_id = d.id
  and p.deleted_at is null
  and lower(coalesce(p.status, '')) = 'signed'
  and (p.team_id is null or d.team_id = p.team_id)
  and lower(coalesce(d.stage, '')) <> 'won';
