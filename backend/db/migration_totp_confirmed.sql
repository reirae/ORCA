-- ============================================================================
-- Migration: add totp_secrets.confirmed_at
--
-- Fresh deploys already get this column from init.sql (docker-entrypoint-initdb
-- only runs on an empty data volume). Run this ONCE against any EXISTING
-- database that was created before the column was added.
--
-- Why: previously a totp_secrets row existed the moment a user clicked "Set up
-- 2FA" (the /totp/setup step generates + stores the secret). Login treated the
-- mere existence of that row as "2FA enabled" and prompted for a code — so a
-- user who generated a QR but never scanned/confirmed it was locked out on
-- their next login. confirmed_at makes "enabled" mean "the user proved they can
-- generate a valid code" (the /totp/enable step), not just "a secret exists".
--
-- Lockout-safety: every pre-existing row gets confirmed_at = NULL (unconfirmed).
-- That means anyone currently stuck in the half-set-up state is immediately
-- un-stuck — they simply won't be prompted for a code until they complete a
-- real enable. Anyone who wants 2FA just re-runs the setup + enable flow.
--
-- MySQL 8.4 has no "ADD COLUMN IF NOT EXISTS", so this is a plain ALTER: run it
-- exactly once. Re-running it errors with ER_DUP_FIELDNAME, which is harmless.
-- ============================================================================

USE orca_db;

ALTER TABLE totp_secrets
    ADD COLUMN confirmed_at DATETIME DEFAULT NULL AFTER secret_encrypted;
