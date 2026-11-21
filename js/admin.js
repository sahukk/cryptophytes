// Author-only page: upload the answers, see registered readers, export them, block misuse.
// Everything here is also enforced by firestore.rules: other users cannot write or list anything.
import { initFirebase, auth, db, A, F, $, esc, niceError } from "./fb.js";
import { OWNER_UID } from "./config.js";

const view = $("#view");
const show = (h) => (view.innerHTML = h);

function csvCell(v) { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }

async function ownerView(user) {
  show(`<h1>Author page</h1>
    <div class="card"><h2 style="margin-top:0">1. Upload or update the answers</h2>
      <p>Choose the file <code>answers.json</code> made on the Mac (folder <em>answers/site_data</em>). Uploading again replaces the old version.</p>
      <input type="file" id="file" accept=".json"><p><button class="btn" id="up">Upload</button></p><div id="upout"></div></div>
    <div class="card"><h2 style="margin-top:0">2. Registered readers</h2>
      <p><button class="btn" id="load">Show readers</button> <button class="btn secondary" id="csv" disabled>Download as CSV (Excel)</button></p>
      <div id="readers"></div></div>`);
  $("#up").onclick = async () => {
    const f = $("#file").files[0];
    if (!f) return ($("#upout").innerHTML = '<div class="err">Choose the file first.</div>');
    try {
      const data = JSON.parse(await f.text());
      const batch = F.writeBatch(db);
      data.chapters.forEach((c) => batch.set(F.doc(db, "answers", c.id), { n: c.n, title: c.title, html: c.html, updated: F.serverTimestamp() }));
      await batch.commit();
      $("#upout").innerHTML = `<div class="msg">Uploaded ${data.chapters.length} chapters.</div>`;
    } catch (e) { $("#upout").innerHTML = `<div class="err">${esc(niceError(e))}</div>`; }
  };
  let rows = [];
  $("#load").onclick = async () => {
    const snap = await F.getDocs(F.collection(db, "readers"));
    rows = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    rows.sort((a, b) => (b.registered?.seconds || 0) - (a.registered?.seconds || 0));
    $("#readers").innerHTML = `<p><strong>${rows.length}</strong> registered readers.</p><div class="admin"><table>
      <tr><th>Date</th><th>Name</th><th>E-mail</th><th>College</th><th>City</th><th>Role</th><th>Book from</th><th>Mobile</th><th>WhatsApp</th><th>Access</th></tr>
      ${rows.map((r) => `<tr><td>${r.registered ? new Date(r.registered.seconds * 1000).toLocaleDateString("en-IN") : ""}</td>
        <td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.college)}</td><td>${esc(r.city)}</td><td>${esc(r.role)}</td>
        <td>${esc(r.source)}</td><td>${esc(r.mobile)}</td><td>${r.whatsappUpdates ? "yes" : ""}</td>
        <td><button class="btn secondary" data-uid="${r.uid}" data-b="${r.blocked ? 1 : 0}">${r.blocked ? "Allow" : "Block"}</button></td></tr>`).join("")}
      </table></div>`;
    $("#csv").disabled = false;
    view.querySelectorAll("button[data-uid]").forEach((b) => (b.onclick = async () => {
      await F.updateDoc(F.doc(db, "readers", b.dataset.uid), { blocked: b.dataset.b !== "1" });
      $("#load").click();
    }));
  };
  $("#csv").onclick = () => {
    const keys = ["name", "email", "college", "city", "role", "source", "mobile", "whatsappUpdates", "blocked"];
    const lines = [["date", ...keys].join(",")].concat(rows.map((r) =>
      [r.registered ? new Date(r.registered.seconds * 1000).toISOString().slice(0, 10) : "", ...keys.map((k) => r[k])].map(csvCell).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv" }));
    a.download = "cryptophytes_readers.csv"; a.click();
  };
}

(async () => {
  if (!(await initFirebase())) return show('<div class="msg">Firebase is not set up yet (js/config.js).</div>');
  A.onAuthStateChanged(auth, (user) => {
    $("#who").innerHTML = user ? `${esc(user.email)} &nbsp; <a href="#" id="so">Sign out</a>` : "";
    if ($("#so")) $("#so").onclick = async (e) => { e.preventDefault(); await A.signOut(auth); };
    if (!user) {
      show('<h1>Author page</h1><p><button class="btn" id="g">Sign in with Google</button></p>');
      $("#g").onclick = () => A.signInWithPopup(auth, new A.GoogleAuthProvider()).catch((e) => alert(niceError(e)));
      return;
    }
    if (!OWNER_UID || user.uid !== OWNER_UID)
      return show(`<h1>Author page</h1><div class="msg">This page is only for the author.</div>
        <p class="muted">Your user ID: <code>${esc(user.uid)}</code> (the author copies this into js/config.js and firestore.rules once).</p>`);
    ownerView(user);
  });
})();
