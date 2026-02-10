-- Ensure activity logging works for public proposal signing flows where auth.uid() can be null.
create or replace function public.create_activity(
  p_type text,
  p_title text,
  p_description text default null::text,
  p_entity_type text default null::text,
  p_entity_id uuid default null::uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $function$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_activity_id uuid;
begin
  select id, team_id
    into v_user_id, v_team_id
  from users
  where id = auth.uid();

  if v_user_id is null then
    if p_entity_type = 'deal' and p_entity_id is not null then
      select user_id, team_id
        into v_user_id, v_team_id
      from deals
      where id = p_entity_id;
    elsif p_entity_type = 'proposal' and p_entity_id is not null then
      select user_id, team_id
        into v_user_id, v_team_id
      from proposals
      where id = p_entity_id;
    elsif p_entity_type = 'contact' and p_entity_id is not null then
      select user_id, team_id
        into v_user_id, v_team_id
      from contacts
      where id = p_entity_id;
    end if;
  end if;

  -- If actor resolution is impossible, skip activity to avoid breaking the business action.
  if v_user_id is null or v_team_id is null then
    return null;
  end if;

  insert into activities (type, title, description, user_id, team_id, entity_type, entity_id, metadata)
  values (p_type, p_title, p_description, v_user_id, v_team_id, p_entity_type, p_entity_id, p_metadata)
  returning id into v_activity_id;

  return v_activity_id;
end;
$function$;
