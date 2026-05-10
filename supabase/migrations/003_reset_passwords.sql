-- ============================================================
-- Reset demo account passwords
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

update auth.users
set
  encrypted_password = crypt('outdure', gen_salt('bf')),
  updated_at         = now()
where email = 'curtis@outdure.com';

update auth.users
set
  encrypted_password = crypt('outdure', gen_salt('bf')),
  updated_at         = now()
where email = 'admin@democompany.com';

-- Verify both rows were updated (should return 2 rows)
select email, updated_at
from auth.users
where email in ('curtis@outdure.com', 'admin@democompany.com')
order by email;
