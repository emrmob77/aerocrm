ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Team managers insert notifications for members" ON public.notifications;
CREATE POLICY "Team managers insert notifications for members"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users actor
    JOIN public.users target ON target.id = notifications.user_id
    WHERE actor.id = auth.uid()
      AND actor.role IN ('owner', 'admin')
      AND actor.team_id IS NOT NULL
      AND actor.team_id = target.team_id
  )
);

DROP POLICY IF EXISTS "Public proposal event notifications" ON public.notifications;
CREATE POLICY "Public proposal event notifications"
ON public.notifications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  type IN ('proposal_viewed', 'proposal_signed')
  AND COALESCE(metadata->>'proposal_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM public.proposals p
    WHERE p.id = (metadata->>'proposal_id')::uuid
      AND p.user_id = notifications.user_id
      AND p.public_url IS NOT NULL
  )
);
