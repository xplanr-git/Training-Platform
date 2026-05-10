-- ============================================================
-- 008_reset_abram_passwords.sql
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Forcefully resets passwords for:
--   1. abram.jamorabo@outdure.com
--   2. aljamorabo@gmail.com
--
-- New Password: outdure
-- ============================================================

-- Ensure pgcrypto is enabled for password hashing
create extension if not exists pgcrypto;

-- Update Abram (Platform Admin)
update auth.users
set encrypted_password = crypt('outdure', gen_salt('bf')),
    updated_at = now()
where email = 'abram.jamorabo@outdure.com';

-- Update Al (Company Admin)
update auth.users
set encrypted_password = crypt('outdure', gen_salt('bf')),
    updated_at = now()
where email = 'aljamorabo@gmail.com';

-- Verify the update happened (should return the updated rows)
select email, updated_at from auth.users 
where email in ('abram.jamorabo@outdure.com', 'aljamorabo@gmail.com');
