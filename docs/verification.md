# Local verification — 4 October 2026

- Mobile TypeScript check: passed.
- Android production JavaScript export with Expo Router: passed (1,320 modules).
- Expo Doctor: 21/21 checks passed.
- API regression test: passed. Checks cookie sessions, valid mobile tokens, forged/malformed tokens, JSON requirements and request-origin checks.
- Local PostgreSQL cart-sync test: passed. Checks add, set, remove, checkout, RLS, denied revision writes and account deletion.
- Website TypeScript and lint checks after the two-file API update: passed.
- Deployed `GET https://fihan-store.vercel.app/api/products`: responded with six products.

These checks do not build an APK, deploy the modified website, apply the hosted SQL migration, or verify Google login/Realtime on a physical phone. Those steps remain pending in `phone-test.md`.

## First cloud build dependency failure

The first preview build failed during `npm ci --include=dev` because the lockfile resolved `react-dom` to 19.3.0, which requires React 19.3, while Expo SDK 57 uses React 19.2.3. A local clean-install dry run reproduced the same ERESOLVE error.

The manifest now explicitly pins `react-dom` to 19.2.3 and the animation dependencies to Expo's SDK 57 versions (`react-native-reanimated` 4.5.1, `react-native-worklets` 0.10.1). The lockfile was regenerated using `expo install`.

After the correction, a fresh `npm ci --ignore-scripts --no-audit --no-fund` completed successfully. Lint, TypeScript and all 21 Expo Doctor checks passed. A new cloud preview build was submitted: `ee879b5e-ef99-43af-968d-612f89c42f31`.

The retry finished successfully and produced an Android APK: [Expo build](https://expo.dev/accounts/khay-team/projects/fihan-store-mobile/builds/ee879b5e-ef99-43af-968d-612f89c42f31). Physical-phone login and cart-sync verification remain pending.
