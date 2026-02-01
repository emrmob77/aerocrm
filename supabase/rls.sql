-- Webhook yönetimi için RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members manage webhooks" ON webhooks;
CREATE POLICY "Team members manage webhooks" ON webhooks
FOR ALL
USING (team_id = (SELECT team_id FROM users WHERE id = auth.uid()))
WITH CHECK (team_id = (SELECT team_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Team members manage webhook logs" ON webhook_logs;
CREATE POLICY "Team members manage webhook logs" ON webhook_logs
FOR ALL
USING (webhook_id IN (SELECT id FROM webhooks WHERE team_id = (SELECT team_id FROM users WHERE id = auth.uid())))
WITH CHECK (webhook_id IN (SELECT id FROM webhooks WHERE team_id = (SELECT team_id FROM users WHERE id = auth.uid())));

-- Public teklif görüntüleme ve imza akışı için RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read proposals" ON proposals;
CREATE POLICY "Public read proposals" ON proposals
FOR SELECT
USING (public_url IS NOT NULL);

DROP POLICY IF EXISTS "Public update proposals" ON proposals;
CREATE POLICY "Public update proposals" ON proposals
FOR UPDATE
USING (public_url IS NOT NULL)
WITH CHECK (public_url IS NOT NULL);

DROP POLICY IF EXISTS "Public insert proposal views" ON proposal_views;
CREATE POLICY "Public insert proposal views" ON proposal_views
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM proposals p
    WHERE p.id = proposal_id
      AND p.public_url IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Team members manage invites" ON team_invites;
CREATE POLICY "Team members manage invites" ON team_invites
FOR ALL
USING (team_id = (SELECT team_id FROM users WHERE id = auth.uid()))
WITH CHECK (team_id = (SELECT team_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Invitee can view invite" ON team_invites;
CREATE POLICY "Invitee can view invite" ON team_invites
FOR SELECT
USING (email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Invitee can accept invite" ON team_invites;
CREATE POLICY "Invitee can accept invite" ON team_invites
FOR UPDATE
USING (email = (auth.jwt() ->> 'email'))
WITH CHECK (email = (auth.jwt() ->> 'email'));

-- Bildirim tercihleri için RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage notification preferences" ON notification_preferences;
CREATE POLICY "Users manage notification preferences" ON notification_preferences
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Push abonelikleri için RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage push subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage push subscriptions" ON push_subscriptions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
