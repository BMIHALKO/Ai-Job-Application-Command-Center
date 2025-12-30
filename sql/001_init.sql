-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- ENUM TYPES
-- =========================

DO $$ BEGIN
    CREATE TYPE application_status as ENUM (
        'draft',
        'applied',
        'screen',
        'interview',
        'offer',
        'rejected',
        'withdrawn',
        'ghosted'
    );
exception when duplicate_object then null;
end $$;

DO $$ BEGIN
    create TYPE message_channel as ENUM (
        'linkedin',
        'email',
        'text',
        'phone_note',
        'other'
    );
exception when duplicate_object then null;
end $$;

DO $$ BEGIN
    create TYPE followup_kind as ENUM (
        'after_apply',
        'after_message',
        'after_interview',
        'thank_you',
        'check_in',
        'custom'
    );
exception when duplicate_object then null;
end $$;

-- =========================
-- USERS
-- =========================

create table if not exists users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email           text UNIQUE NOT NULL,
    display_name    text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- COMPANIES
-- =========================

create table if not exists companies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            text NOT NULL,
    website         text,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE          (user_id, name)
);

-- =========================
-- CONTACTS (RECRUITERS, ETC.)
-- =========================

create table if not exists contacts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id      uuid REFERENCES companies(id) ON DELETE SET NULL,
    name            text NOT NULL,
    title           text,
    email           text,
    phone           text,
    linkedin_url    text,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- RESUME VERSIONS
-- =========================

create table if not exists resumes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           text NOT NULL,
    file_url        text,
    sha256          text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- JOB POST SNAPSHOT
-- =========================

CREATE TABLE IF NOT EXISTS job_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id      uuid REFERENCES companies(id) ON DELETE SET NULL,
  title           text NOT NULL,
  location        text,
  work_mode       text, -- remote / hybrid / onsite
  source_url      text,
  description_raw text NOT NULL,
  posted_at       date,
  captured_at     timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- APPLICATIONS (CORE)
-- =========================

CREATE TABLE IF NOT EXISTS applications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id       uuid REFERENCES companies(id) ON DELETE SET NULL,
  job_post_id      uuid REFERENCES job_posts(id) ON DELETE SET NULL,
  resume_id        uuid REFERENCES resumes(id) ON DELETE SET NULL,

  role_title       text NOT NULL,
  location         text,
  status           application_status NOT NULL DEFAULT 'draft',

  applied_at       date,
  last_touch_at    timestamptz,
  next_action_at   timestamptz,
  priority         int NOT NULL DEFAULT 3, -- 1 high, 5 low

  compensation_min int,
  compensation_max int,
  notes            text,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_status
  ON applications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_user_next_action
  ON applications(user_id, next_action_at);

-- =========================
-- AI PROMPTS (VERSIONED)
-- =========================

CREATE TABLE IF NOT EXISTS ai_prompts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  version     int NOT NULL,
  model       text NOT NULL,
  template    text NOT NULL,
  schema_json jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, version)
);

-- =========================
-- JOB ANALYSIS (AI OUTPUT)
-- =========================

CREATE TABLE IF NOT EXISTS job_analysis (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_post_id   uuid NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  prompt_id     uuid REFERENCES ai_prompts(id) ON DELETE SET NULL,

  extracted_json jsonb NOT NULL,
  fit_score      numeric(5,2),
  seniority      text,
  tags           text[],
  confidence     numeric(4,3),
  cost_cents     int,

  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_analysis_job_post
  ON job_analysis(job_post_id);

-- =========================
-- MESSAGES (RECRUITER COMMS)
-- =========================

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id  uuid REFERENCES applications(id) ON DELETE CASCADE,
  contact_id      uuid REFERENCES contacts(id) ON DELETE SET NULL,

  channel         message_channel NOT NULL,
  direction       text NOT NULL CHECK (direction IN ('in','out')),
  subject         text,
  body_raw        text NOT NULL,
  received_at     timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_app
  ON messages(application_id, created_at DESC);

-- =========================
-- MESSAGE ANALYSIS (AI OUTPUT)
-- =========================

CREATE TABLE IF NOT EXISTS message_analysis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id      uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  prompt_id       uuid REFERENCES ai_prompts(id) ON DELETE SET NULL,

  verdict         text,
  risk_score      numeric(5,2),
  fit_score       numeric(5,2),
  red_flags       text[],
  suggested_reply text,
  extracted_json  jsonb,
  confidence      numeric(4,3),
  cost_cents      int,

  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_analysis_message
  ON message_analysis(message_id);

-- =========================
-- FOLLOW-UP TASKS
-- =========================

CREATE TABLE IF NOT EXISTS followups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

  kind           followup_kind NOT NULL,
  due_at         timestamptz NOT NULL,
  completed_at   timestamptz,
  outcome        text,
  notes          text,

  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followups_due
  ON followups(user_id, due_at)
  WHERE completed_at IS NULL;