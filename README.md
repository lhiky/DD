<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/85cf61d4-65ff-4cc8-bbd2-bf7cf4390295

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example` and set your Firebase and Gemini credentials.
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_OAUTH_CLIENT_ID`
   - `FIREBASE_SERVICE_ACCOUNT_KEY` or `GOOGLE_APPLICATION_CREDENTIALS`
   - `GEMINI_API_KEY`
3. Run the app:
   `npm run dev`

## Firebase Auth Setup
- Use the Firebase project linked to your service account (`spr4-c2c65`).
- In Firebase Console, go to `Authentication -> Sign-in method` and enable `Google`.
- Add this authorized domain to Firebase Auth:
  - `spr-gw4exj9r4-stackdigitz-5790s-projects.vercel.app`
- Ensure the client config values in `.env.local` or your deployed environment match the same Firebase project:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_OAUTH_CLIENT_ID`
- `firebase-applet-config.json` is now aligned to `spr4-c2c65` as a fallback placeholder. For local runs, prefer setting valid `VITE_FIREBASE_*` values in `.env.local`.
