# Taking Bumpalong public

The public site is `web/index.html` plus `web/app.js`. It signs people in with Supabase Auth and keeps
everything in a Supabase Postgres database. Nothing below has been run against a live Supabase project yet, so
treat the first setup as a dry run.

## One-time setup

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/schema.sql`.
3. Authentication > Providers: leave Email on. To add Google sign-in, create a Google OAuth client and paste it in.
4. Authentication > URL Configuration: set the Site URL to your site's address (for example
   `https://yutika-agarwal.github.io/BumpAlong/`) and add the same address under Redirect URLs.
5. Copy `web/config.example.js` to `web/config.js` and fill in the project URL and anon key
   (Project settings > API). The anon key is meant to be public.
6. Turn on GitHub Pages (Settings > Pages > Source: GitHub Actions) and push to `main`. The workflow in
   `.github/workflows/pages.yml` publishes the `web` folder.

After changing anything in `web/src`, run `node web/build.mjs` and commit the result.

## What the database enforces

- Everyone signed in can read listings, interests, requests and members. Only the giver and the receiver can read
  a pickup (the hold, its chat and its slot).
- People can only write their own member record, listings, interests and requests.
- The draw, first-come claims, passing a hold on and crediting the giver run as database functions, so a browser can't fake them.

## Known gaps before a wide launch

- **Points are trusted from the browser.** A member can edit their own balance. That is fine for a group of
  neighbors who know each other. For an open public launch, move all balance changes into database functions
  (or the Fastify API in `apps/api`, which already has the append-only ledger).
- **No phone verification, reports, moderation queue or recall lookup yet.** These are on the README's "Next" list and
  matter before strangers share car seats and cribs.
- **No email or push notifications.** People see a win when they open the app.
- **Privacy policy and terms** are needed before you collect emails.
- **The Amazon tag in `web/src/_data.js`** (`AMZ_TAG`) must be your own approved Associates tag.
