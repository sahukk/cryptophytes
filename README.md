# Cryptophytes: The Hidden Algae — companion website

Companion website of the textbook *Cryptophytes: The Hidden Algae — An Introduction for Students* by K.K. Sahu.

Live at **https://sahukk.github.io/cryptophytes/**

- `index.html` — public home page (about the book, how to get access, corrections, other books).
- `answers.html` — model answers. Readers sign in (Google, or e-mail + password with e-mail confirmation) and register once; the answers are then loaded from Cloud Firestore.
- `admin.html` — author-only page: upload the answers, list and export registered readers, block misuse.
- `firestore.rules` — the security rules that protect the answers and reader details.

The model answers themselves are **not** stored in this repository; they are uploaded to Firestore from the author's computer.

## One-time Firebase setup (author)

1. Go to https://console.firebase.google.com, sign in with the author's Google account, click **Create a project**, name it `cryptophytes-book` (Google Analytics not needed).
2. **Build → Authentication → Get started → Sign-in method**: enable **Google** and **Email/Password**.
3. **Authentication → Settings → Authorized domains → Add domain**: `sahukk.github.io`.
4. **Build → Firestore Database → Create database** (production mode, location `asia-south1` (Mumbai)).
5. **Project settings (gear) → General → Your apps → Web (</>)**: register an app named `website`; copy the `firebaseConfig` object.
6. Put the config into `js/config.js`, push; open `admin.html`, sign in with Google, copy the user ID shown into `js/config.js` (`OWNER_UID`) and `firestore.rules` (`OWNER_UID_HERE`), push again.
7. **Firestore → Rules**: paste `firestore.rules`, **Publish**.
8. On `admin.html`, upload `answers/site_data/answers.json` (made by `code/answers_export.py` in the book folder).

Firebase's free (Spark) plan is enough; no payment card is needed (phone/SMS sign-in is deliberately not used).
