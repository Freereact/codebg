-- 003_messages.sql
-- Threaded messaging on feedback items (ContentRequest)

CREATE TABLE messages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_request_id UUID NOT NULL REFERENCES content_requests(id) ON DELETE CASCADE,
  author_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  author_role        TEXT NOT NULL CHECK (author_role IN ('client', 'admin')),
  body               TEXT NOT NULL,
  read_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_thread_idx ON messages (content_request_id, created_at);
CREATE INDEX messages_unread_idx ON messages (author_id, read_at) WHERE read_at IS NULL;
