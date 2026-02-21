# Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In SQL Editor, run the migration: `migrations/20250219000000_initial_schema.sql`.
3. In Dashboard > Storage, create a bucket named `id-cards`, set it to **Private**.
   - Add policy: Allow authenticated users to upload/read/update their own objects (e.g. path `{user_id}/*` or use RLS on storage.objects).
4. Copy **Project URL** and **anon public** key into `src/environments/environment.ts` (or `environment.local.ts`):
   - `supabaseUrl`: Project URL
   - `supabaseAnonKey`: anon public key
5. Optional: create an admin user, then in SQL Editor: `UPDATE profiles SET role = 'admin' WHERE id = '<your-user-uuid>';`
