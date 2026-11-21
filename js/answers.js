import { initFirebase, auth, db, A, F, $, esc, niceError } from "./fb.js";

const view = $("#view");
const show = (html) => { view.innerHTML = html; window.scrollTo(0, 0); };
const params = new URLSearchParams(location.search);
const MAXCH = 12;   // chapters 1–11 plus the Puzzle Page (12)

function signedInBar(user) {
  $("#who").innerHTML = user
    ? `${esc(user.email || "")} &nbsp; <a href="#" id="signout">Sign out</a>`
    : "";
  const so = $("#signout");
  if (so) so.onclick = async (e) => { e.preventDefault(); await A.signOut(auth); location.href = "answers.html"; };
}

function notReady() {
  show(`<h1>Model answers</h1>
    <div class="msg">The model-answer section is being set up and will open soon. Please visit again in a few days.</div>
    <p><a href="index.html">Back to the home page</a></p>`);
}

function signInView(note = "") {
  show(`<h1>Sign in to read the model answers</h1>
    <p>Access is free for readers of the book. Sign in once; you will stay signed in on this device.</p>
    ${note}
    <div class="card">
      <button class="btn" id="g">Sign in with Google</button>
      <p class="or">or use your e-mail address:</p>
      <label for="em">E-mail</label><input id="em" type="email" autocomplete="email">
      <label for="pw">Password (at least 6 characters)</label><input id="pw" type="password" autocomplete="current-password">
      <p style="margin-top:14px"><button class="btn" id="si">Sign in</button>
      <button class="btn secondary" id="su">Create a new account</button></p>
      <p><a href="#" id="fp">Forgot your password?</a></p>
      <div id="out"></div>
    </div>`);
  const out = $("#out");
  const say = (t, cls = "err") => (out.innerHTML = `<div class="${cls}">${esc(t)}</div>`);
  $("#g").onclick = async () => {
    try { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); } catch (e) { say(niceError(e)); }
  };
  $("#si").onclick = async () => {
    try { await A.signInWithEmailAndPassword(auth, $("#em").value.trim(), $("#pw").value); } catch (e) { say(niceError(e)); }
  };
  $("#su").onclick = async () => {
    try {
      const c = await A.createUserWithEmailAndPassword(auth, $("#em").value.trim(), $("#pw").value);
      await A.sendEmailVerification(c.user);
    } catch (e) { say(niceError(e)); }
  };
  $("#fp").onclick = async (ev) => {
    ev.preventDefault();
    const em = $("#em").value.trim();
    if (!em) return say("Type your e-mail address above first, then click 'Forgot your password?' again.");
    try { await A.sendPasswordResetEmail(auth, em); say("A link to reset your password has been sent to " + em + ". Please check your inbox (and spam folder).", "msg"); }
    catch (e) { say(niceError(e)); }
  };
}

function verifyView(user) {
  show(`<h1>Please confirm your e-mail address</h1>
    <div class="msg">We have sent a confirmation link to <strong>${esc(user.email)}</strong>. Open the e-mail (check the spam folder too), click the link, and then come back and press the button below.</div>
    <p><button class="btn" id="done">I have confirmed my e-mail</button>
    <button class="btn secondary" id="again">Send the link again</button></p><div id="out"></div>`);
  $("#done").onclick = async () => { await user.reload(); location.reload(); };
  $("#again").onclick = async () => {
    try { await A.sendEmailVerification(user); $("#out").innerHTML = '<div class="msg">Sent again.</div>'; }
    catch (e) { $("#out").innerHTML = `<div class="err">${esc(niceError(e))}</div>`; }
  };
}

function registerView(user) {
  show(`<h1>One-time registration</h1>
    <p>Please tell us a little about yourself. You need to do this only once.</p>
    <div class="card">
      <label for="nm">Full name *</label><input id="nm" value="${esc(user.displayName || "")}">
      <label for="col">College or university *</label><input id="col">
      <label for="city">City and state *</label><input id="city">
      <label for="role">You are *</label>
      <select id="role"><option value="">Choose…</option><option>Undergraduate student</option><option>Postgraduate student</option><option>Teacher</option><option>Researcher</option><option>Other</option></select>
      <label for="src">Where did you obtain the book? *</label>
      <select id="src"><option value="">Choose…</option><option>Amazon Kindle</option><option>Paperback</option><option>College or library copy</option><option>Other</option></select>
      <label for="mob">Mobile / WhatsApp number (optional)</label><input id="mob" inputmode="tel">
      <label class="inline"><input type="checkbox" id="upd"> Send me updates about corrections and new editions on WhatsApp (optional).</label>
      <label class="inline"><input type="checkbox" id="ok"> I agree that my details will be used only for this book and will not be shared with anyone. *</label>
      <p><button class="btn" id="save">Register and open the answers</button></p>
      <div id="out"></div>
    </div>`);
  $("#save").onclick = async () => {
    const v = (id) => $(id).value.trim();
    if (!v("#nm") || !v("#col") || !v("#city") || !v("#role") || !v("#src"))
      return ($("#out").innerHTML = '<div class="err">Please fill in all the fields marked *.</div>');
    if (!$("#ok").checked)
      return ($("#out").innerHTML = '<div class="err">Please tick the consent box to continue.</div>');
    try {
      await F.setDoc(F.doc(db, "readers", user.uid), {
        name: v("#nm"), email: user.email || "", college: v("#col"), city: v("#city"), role: v("#role"),
        source: v("#src"), mobile: v("#mob"), whatsappUpdates: $("#upd").checked, consent: true,
        blocked: false, registered: F.serverTimestamp()
      });
      location.reload();
    } catch (e) { $("#out").innerHTML = `<div class="err">${esc(niceError(e))}</div>`; }
  };
}

async function listView() {
  const snap = await F.getDocs(F.collection(db, "answers"));
  const ch = snap.docs.map((d) => d.data()).sort((a, b) => a.n - b.n);
  if (!ch.length) return show(`<h1>Model answers</h1><div class="msg">The answers are being uploaded. Please visit again soon.</div>`);
  show(`<h1>Model answers</h1>
    <p>Choose a chapter. Each page has the answers to the multiple choice, short answer and long answer questions of that chapter. The last item has the answers to the Puzzle Page at the end of the book.</p>
    <ul class="chlist">${ch.map((c) => `<li><a href="answers.html?ch=${c.n}">${esc(c.title)}</a></li>`).join("")}</ul>`);
}

async function chapterView(n) {
  const id = "ch" + String(n).padStart(2, "0");
  const d = await F.getDoc(F.doc(db, "answers", id));
  if (!d.exists()) return listView();
  const c = d.data();
  const prev = n > 1 ? `<a class="btn secondary" href="answers.html?ch=${n - 1}">← Previous</a>` : "<span></span>";
  const next = n < MAXCH ? `<a class="btn secondary" href="answers.html?ch=${n + 1}">Next →</a>` : "<span></span>";
  show(`<p class="noprint"><a href="answers.html">All chapters</a></p>
    <div class="answer">${c.html}</div>
    <div class="navrow">${prev}<a class="btn secondary" href="#" onclick="window.print();return false;">Print or save as PDF</a>${next}</div>`);
}

(async () => {
  if (!(await initFirebase())) return notReady();
  A.onAuthStateChanged(auth, async (user) => {
    signedInBar(user);
    if (!user) return signInView();
    const pwUser = user.providerData.some((p) => p.providerId === "password");
    if (pwUser && !user.emailVerified) return verifyView(user);
    try {
      const r = await F.getDoc(F.doc(db, "readers", user.uid));
      if (!r.exists()) return registerView(user);
      if (r.data().blocked) return show('<div class="err">Access for this account has been stopped. Please contact the author.</div>');
      const n = parseInt(params.get("ch"), 10);
      return n >= 1 && n <= MAXCH ? chapterView(n) : listView();
    } catch (e) {
      show(`<div class="err">${esc(niceError(e))}</div>`);
    }
  });
})();
