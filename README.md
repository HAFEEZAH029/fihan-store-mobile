# Fihan Store Mobile

Expo React Native Android app, written in TypeScript. It uses the existing Fihan Store Supabase project for Google accounts and the existing website API for products and cart reads/writes.

## What is implemented

- Collection, abaya/hijab filters, product details and size selection.
- Google browser OAuth with PKCE, persistent phone session and token refresh.
- Shared cart through `GET/POST/PATCH/DELETE /api/cart` using a Supabase Bearer access token.
- Supabase Realtime refreshes the mobile cart after website additions, quantity changes, removals and checkout. A private `cart_sync` revision row avoids cross-user delete notifications. Refresh on foreground/reconnect and a five-second recovery poll cover interrupted connections.
- Account page and sign-out on this phone (does not sign out the website).

Mobile checkout is not included in this first version. Prices follow the existing API's USD cents.

## Configuration

The local `.env.local` is configured for `https://fihan-store.vercel.app` and uses the public Supabase settings from the sibling website project. It is ignored by Git. For another machine, copy `.env.example` to `.env.local` and enter the same Supabase URL and publishable key used by the website. Never put a service-role key or Google client secret in the app.

The mobile app must use the exact same Supabase project as the website; using the same email in a separate project does not share a cart.

## Required backend setup

1. **The website code update has already been applied on this laptop. You do not need to copy or replace files.** Two files in the separate `FihanStore` website folder were updated so its existing cart API can recognise a user signed in on the phone. Supabase still handles Google login and the database. Publish those website changes through your existing GitHub/Vercel workflow so the deployed website receives them. Redeploying an old commit will not include these changes. The `backend/` folder here holds copies of the update; `scripts/apply-backend.ps1` was the helper used to apply it and should not be rerun now.
2. In the existing Supabase project's SQL Editor, run `supabase/migrations/202610040001_cart_sync.sql` once. It adds the private revision table, cart-change trigger, RLS and Realtime publication. Do not rerun a successful migration. This requires the original website store migration to be applied already.
3. Under Supabase **Authentication → URL Configuration → Redirect URLs**, add exactly `fihanstore://auth/callback`. Keep the existing website redirect and Site URL. Google remains configured to redirect to the same Supabase `/auth/v1/callback`; no second Google provider or native OAuth client is required for this browser OAuth flow.

## Build and run on your Android phone

Google OAuth requires an app build with the `fihanstore` scheme. Expo Go can preview the collection but cannot complete this app's Google login.

```powershell
npm install
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

Use your Expo account. EAS will link this folder to an Expo project and add its project ID. When it asks for an Android signing keystore, let EAS generate one. Download and install the resulting APK on the physical Android phone.

Before building, open your linked project on expo.dev → Environment variables. Add the three values from `.env.local` to the **development** environment with plaintext visibility. Add them to **preview** too if you build a standalone APK. These are public app settings. The ignored `.env.local` stays on your computer and is not available to cloud builds. See [EAS environment variables](https://docs.expo.dev/eas/environment-variables/).

```powershell
npx eas-cli@latest build --platform android --profile development
```

```powershell
npm start
```

Connect the laptop and phone to the same Wi-Fi and scan the development server QR with the installed Fihan Store development app. For separate networks, run `npx expo start --dev-client --tunnel` (Expo may request its tunnel dependency). For a standalone APK that does not need Metro, build the `preview` profile instead:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

For a local website API, replace `EXPO_PUBLIC_API_URL` with `http://YOUR_LAPTOP_LAN_IP:3000`, run the web server bound to `0.0.0.0`, and use an Android build configured to permit local HTTP. The deployed HTTPS URL is the preferred test path.

## Validation

```powershell
npm run typecheck
npm run lint
npm run export:android
npx expo-doctor
```

Authentication and database notification tests use mocks and a local PostgreSQL engine; they do not change the hosted store:

```powershell
npm test
```

Follow `docs/phone-test.md` for the required physical-phone verification. Automated SQL and bundling checks cannot prove Google OAuth or actual delivery latency on your phone.

References: [Expo OAuth](https://docs.expo.dev/guides/authentication/), [Supabase mobile deep links](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [Supabase React Native sessions](https://supabase.com/docs/guides/auth/quickstarts/react-native), [Supabase Realtime](https://supabase.com/docs/guides/realtime/postgres-changes).
