# Smart Bookmark App

Next.js App Router app using Supabase for:
- Google OAuth login (no password auth)
- Private per-user bookmarks
- Realtime bookmark updates across open tabs
- Bookmark deletion

## Tech stack
- Next.js (App Router)
- Supabase Auth + Postgres + Realtime
- Tailwind CSS

## Local setup
1. Install dependencies:
```bash
npm install
```
2. Create `.env.local` from `.env.example` and set:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
3. In Supabase SQL editor, run `supabase/schema.sql`.
4. In Supabase dashboard:
- `Authentication -> Providers -> Email`: disable Email provider.
- `Authentication -> Providers -> Google`: enable Google provider and add your Google client ID/secret.
- `Authentication -> URL Configuration`: add callback URLs for local and production (example: `http://localhost:3000`, `https://your-vercel-url.vercel.app`).
5. Run the app:
```bash
npm run dev
```

## Deploy to Vercel
1. Push project to GitHub.
2. Import repo in Vercel.
3. Set environment variables in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Copy deployed URL and add it to Supabase Auth URL configuration + Google OAuth allowed redirect origins.

## Notes on privacy and realtime
- The `bookmarks` table is protected by Row Level Security (RLS): users can only select/insert/delete rows where `user_id = auth.uid()`.
- Realtime is enabled on `public.bookmarks` via publication `supabase_realtime`.


## Challenges that were faced during this assignment
- It took a while to generate the secret and client ID from the google cloud console for the OAuth Sign In
- The realtime listener did not work the first time. The generated code used some different socket connection which upon realised that supabase library provides it already.
- Had to add a vercel.json file to explicitly mention to use index.html from the build as it is app based and not pages based.
