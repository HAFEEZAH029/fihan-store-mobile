# Physical phone test — Lesson 3

Deadline: Monday, 5 October 2026, 11:59 PM WAT.

Status: **Not yet tested on a physical phone.** Replace this status only after completing the steps below.

Prerequisites: deploy the Bearer API update, run the cart-sync migration in the existing Supabase project, allow `fihanstore://auth/callback`, install a development or preview APK.

1. Sign in to `https://fihan-store.vercel.app` with Google.
2. Open Fihan Store on the physical Android phone. Tap Account → Continue with Google and select the same Google account. Confirm Google returns to the app and the email matches the website.
3. Open Bag on the phone. Keep it visible and confirm the live sync connection. Add a product/size on the website. Confirm the exact product, size and quantity appear on the phone without pulling to refresh. Record observed delay; the five-second recovery poll alone does not demonstrate instant Realtime delivery.
4. Change the website quantity and remove the item. Verify both appear on the phone without manual refresh.
5. Add a piece on the phone. Focus or reload the website and verify its bag matches. The existing website refreshes its cart when its window regains focus.
6. Restart the mobile app. Confirm the Google session and server cart persist.
7. Put the phone offline, make a website cart change, reconnect and return to the app. Confirm it reloads the latest cart.
8. Sign out on the phone. Confirm the private bag disappears and the website remains signed in. Sign in with a different Google test account and confirm it cannot see the first account's cart.
9. Optional: complete the website's simulated checkout and verify the phone bag clears. No real payment is charged.

Record:

| Check | Result / evidence |
| --- | --- |
| Phone model and Android version | Pending |
| APK/build ID | Pending |
| Test date/time (WAT) | Pending |
| Same-account Google login | Pending |
| Website → phone add delay | Pending |
| Website quantity/removal sync | Pending |
| Phone → website cart | Pending |
| Restart/session persistence | Pending |
| Offline recovery | Pending |
| Different account isolation | Pending |

Capture a short video with the website and physical phone visible, demonstrating same-account login and a website addition appearing on the phone. Hide tokens and unrelated account details.
