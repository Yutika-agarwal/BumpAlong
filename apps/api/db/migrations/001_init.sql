-- Bumpalong initial schema. Postgres 15+ with PostGIS.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name     text NOT NULL,
  phone_verified   boolean NOT NULL DEFAULT false,
  zip              text NOT NULL,
  -- Fuzzed home point: never the exact address (PRD PRV-*).
  approx_location  geography(Point, 4326),
  reliability      smallint NOT NULL DEFAULT 80 CHECK (reliability BETWEEN 0 AND 100),
  family_stage     text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

CREATE TYPE listing_status AS ENUM ('open', 'drawn', 'handed_off', 'withdrawn', 'hidden');
CREATE TYPE item_tier AS ENUM ('Small', 'Medium', 'Large');

CREATE TABLE listings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id      uuid NOT NULL REFERENCES users(id),
  title         text NOT NULL CHECK (length(title) BETWEEN 1 AND 80),
  description   text NOT NULL DEFAULT '',
  category      text NOT NULL,
  subcategory   text NOT NULL,
  condition     text NOT NULL,
  tier          item_tier NOT NULL,
  stages        text[] NOT NULL,
  badges        text[] NOT NULL DEFAULT '{}',
  safety        jsonb NOT NULL DEFAULT '{}',  -- car seat expiry, pump type, model for recall checks
  pickup_point  geography(Point, 4326),
  status        listing_status NOT NULL DEFAULT 'open',
  closes_at     timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listings_open_geo ON listings USING gist (pickup_point) WHERE status = 'open';
CREATE INDEX listings_open_recent ON listings (created_at DESC) WHERE status = 'open';

CREATE TABLE interests (
  listing_id  uuid NOT NULL REFERENCES listings(id),
  user_id     uuid NOT NULL REFERENCES users(id),
  chips       text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (listing_id, user_id)
);

CREATE TYPE hold_status AS ENUM ('offered', 'accepted', 'completed', 'released');

CREATE TABLE holds (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL UNIQUE REFERENCES listings(id),  -- one draw per listing
  receiver_id  uuid NOT NULL REFERENCES users(id),
  backups      uuid[] NOT NULL DEFAULT '{}',
  status       hold_status NOT NULL DEFAULT 'offered',
  accept_by    timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE ledger_reason AS ENUM ('starting_points', 'gave', 'received', 'adjustment');

-- Append-only. Balance = SUM(delta). Never UPDATE or DELETE rows; correct with an adjustment.
CREATE TABLE ledger_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id),
  delta            integer NOT NULL,
  reason           ledger_reason NOT NULL,
  hold_id          uuid REFERENCES holds(id),
  note             text,
  idempotency_key  text NOT NULL UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ledger_by_user ON ledger_entries (user_id, created_at);

CREATE TABLE monthly_usage (
  user_id            uuid NOT NULL REFERENCES users(id),
  month              date NOT NULL,  -- first day of the month
  received_slots     smallint NOT NULL DEFAULT 0,
  allowance_small    smallint NOT NULL DEFAULT 0,
  allowance_medium   smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

CREATE TABLE reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid NOT NULL REFERENCES users(id),
  listing_id   uuid REFERENCES listings(id),
  user_id      uuid REFERENCES users(id),
  reason       text NOT NULL,
  status       text NOT NULL DEFAULT 'open',
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (listing_id IS NOT NULL OR user_id IS NOT NULL)
);
