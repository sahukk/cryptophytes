import { firebaseConfig } from "./config.js";
const V = "10.12.2";
export let app = null, auth = null, db = null, A = null, F = null;
export async function initFirebase() {
  if (!firebaseConfig) return false;
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  A = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
  F = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
  app = initializeApp(firebaseConfig);
  auth = A.getAuth(app);
  db = F.getFirestore(app);
  return true;
}
export const $ = (s) => document.querySelector(s);
export function esc(t) { const d = document.createElement("div"); d.textContent = t ?? ""; return d.innerHTML; }
export function niceError(e) {
  const c = (e && e.code) || "";
  const m = {
    "auth/invalid-credential": "The e-mail or password is not correct.",
    "auth/wrong-password": "The password is not correct.",
    "auth/user-not-found": "No account found with this e-mail. Please create an account first.",
    "auth/email-already-in-use": "An account with this e-mail already exists. Please sign in instead.",
    "auth/weak-password": "Please choose a password of at least 6 characters.",
    "auth/invalid-email": "Please enter a valid e-mail address.",
    "auth/popup-closed-by-user": "The sign-in window was closed before finishing.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "permission-denied": "Access denied. If you have just registered, please reload the page."
  };
  return m[c] || (e && e.message) || "Something went wrong. Please try again.";
}
