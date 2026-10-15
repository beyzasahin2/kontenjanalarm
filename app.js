"use strict";

/* =========================================================
   KontenjanAlarm — prototip
   Sahte ders verisi + takip, alarm, alternatif şube ve
   bekleme listesi mantığı. Her şey tarayıcıda çalışır.
   ========================================================= */

const ME = "Siz";
const STORAGE = { follows: "ka_follows", sections: "ka_sections", me: "ka_me" };
const SIM_INTERVAL_MS = 3000;
const LOG_LIMIT = 6;

const COURSES = [
  {
    code: "ENE 301", name: "Yenilenebilir Enerji Sistemleri",
    sections: [
      { id: "ENE301-1", no: 1, instructor: "Doç. Dr. Ayşe Yılmaz", schedule: "Pzt 09:00–11:50", capacity: 40, enrolled: 40, waitlist: ["Mehmet K.", "Zeynep A."] },
      { id: "ENE301-2", no: 2, instructor: "Dr. Öğr. Üyesi Can Demir", schedule: "Çar 13:00–15:50", capacity: 40, enrolled: 38, waitlist: [] },
      { id: "ENE301-3", no: 3, instructor: "Prof. Dr. Selim Arslan", schedule: "Cum 09:00–11:50", capacity: 40, enrolled: 40, waitlist: [] }
    ]
  },
  {
    code: "MAT 201", name: "Diferansiyel Denklemler",
    sections: [
      { id: "MAT201-1", no: 1, instructor: "Prof. Dr. Hakan Öztürk", schedule: "Sal 10:00–11:50", capacity: 60, enrolled: 60, waitlist: ["Ali R.", "Elif S."] },
      { id: "MAT201-2", no: 2, instructor: "Doç. Dr. Nur Kaya", schedule: "Per 14:00–15:50", capacity: 60, enrolled: 60, waitlist: ["Deniz Y."] }
    ]
  },
  {
    code: "FİZ 102", name: "Fizik II",
    sections: [
      { id: "FIZ102-1", no: 1, instructor: "Dr. Öğr. Üyesi Emre Çelik", schedule: "Pzt 13:00–14:50", capacity: 50, enrolled: 45, waitlist: [] },
      { id: "FIZ102-2", no: 2, instructor: "Prof. Dr. Gül Aydın", schedule: "Çar 09:00–10:50", capacity: 50, enrolled: 50, waitlist: [] }
    ]
  },
  {
    code: "BİL 101", name: "Programlamaya Giriş",
    sections: [
      { id: "BIL101-1", no: 1, instructor: "Dr. Öğr. Üyesi Murat Şen", schedule: "Sal 13:00–15:50", capacity: 35, enrolled: 35, waitlist: ["Ece B."] },
      { id: "BIL101-2", no: 2, instructor: "Dr. Öğr. Üyesi Seda Koç", schedule: "Per 09:00–11:50", capacity: 35, enrolled: 22, waitlist: [] }
    ]
  },
  {
    code: "EEM 210", name: "Devre Analizi",
    sections: [
      { id: "EEM210-1", no: 1, instructor: "Doç. Dr. Kemal Aksoy", schedule: "Cum 13:00–15:50", capacity: 30, enrolled: 28, waitlist: [] }
    ]
  },
  {
    code: "MAK 305", name: "Isı Transferi",
    sections: [
      { id: "MAK305-1", no: 1, instructor: "Prof. Dr. Oya Güneş", schedule: "Pzt 15:00–16:50", capacity: 40, enrolled: 40, waitlist: [] },
      { id: "MAK305-2", no: 2, instructor: "Dr. Öğr. Üyesi Tolga Er", schedule: "Per 10:00–11:50", capacity: 40, enrolled: 33, waitlist: [] }
    ]
  },
  {
    code: "İŞL 220", name: "Pazarlama İlkeleri",
    sections: [
      { id: "ISL220-1", no: 1, instructor: "Dr. Öğr. Üyesi Pınar Doğan", schedule: "Çar 10:00–11:50", capacity: 80, enrolled: 70, waitlist: [] }
    ]
  },
  {
    code: "TÜR 101", name: "Türk Dili I",
    sections: [
      { id: "TUR101-1", no: 1, instructor: "Öğr. Gör. Hatice Uçar", schedule: "Sal 08:30–09:50", capacity: 50, enrolled: 48, waitlist: [] }
    ]
  },
  {
    code: "İNG 202", name: "Akademik İngilizce",
    sections: [
      { id: "ING202-1", no: 1, instructor: "Öğr. Gör. John Miller", schedule: "Pzt 10:00–11:50", capacity: 25, enrolled: 25, waitlist: [] },
      { id: "ING202-2", no: 2, instructor: "Öğr. Gör. Merve Tan", schedule: "Çar 15:00–16:50", capacity: 25, enrolled: 24, waitlist: [] }
    ]
  },
  {
    code: "END 410", name: "Yöneylem Araştırması",
    sections: [
      { id: "END410-1", no: 1, instructor: "Doç. Dr. Serkan Yıldız", schedule: "Per 13:00–15:50", capacity: 40, enrolled: 18, waitlist: [] }
    ]
  }
];

const RANDOM_NAMES = ["Ahmet Y.", "Büşra K.", "Cem D.", "Damla T.", "Emir S.", "Fatma G.", "Gökhan A.", "Hande B.", "İrem Ç.", "Kerem O.", "Melis U.", "Onur P."];
const STATUS_LABEL = { free: "Müsait", almost: "Az kaldı", full: "Dolu" };

/* ---------- State ---------- */
let sections = {};          // id -> section (+ course reference)
let follows = new Set();    // followed section ids
let myEnrolled = new Set(); // sections the current student is registered in
let simTimer = null;
let logEntries = [];
let flashIds = new Set();
let prevPct = {};
let searchTerm = "";
let audioCtx = null;

/* ---------- DOM ---------- */
const $ = id => document.getElementById(id);
const dom = {
  courseList: $("course-list"),
  followList: $("follow-list"),
  followCount: $("follow-count"),
  simBtn: $("sim-btn"),
  simStatus: $("sim-status"),
  simLog: $("sim-log"),
  resetBtn: $("reset-btn"),
  notifyBtn: $("notify-btn"),
  search: $("search"),
  modal: $("modal"),
  modalBox: document.querySelector("#modal .modal"),
  modalIcon: $("modal-icon"),
  modalTitle: $("modal-title"),
  modalText: $("modal-text"),
  modalExtra: $("modal-extra"),
  modalActions: $("modal-actions"),
  toasts: $("toasts")
};

/* ---------- Storage ---------- */
function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
}

function buildSections() {
  sections = {};
  COURSES.forEach(course => course.sections.forEach(s => {
    sections[s.id] = { ...s, waitlist: [...s.waitlist], course };
  }));
}

function loadState() {
  buildSections();

  const saved = load(STORAGE.sections);
  if (saved && typeof saved === "object") {
    Object.keys(saved).forEach(id => {
      const s = sections[id];
      const v = saved[id];
      if (!s || !v) return;
      if (Number.isFinite(v.enrolled)) s.enrolled = Math.max(0, Math.min(s.capacity, v.enrolled));
      if (Array.isArray(v.waitlist)) s.waitlist = v.waitlist.filter(n => typeof n === "string");
    });
  }

  const f = load(STORAGE.follows);
  follows = new Set(Array.isArray(f) ? f.filter(id => sections[id]) : []);

  const m = load(STORAGE.me);
  myEnrolled = new Set(m && Array.isArray(m.enrolled) ? m.enrolled.filter(id => sections[id]) : []);
}

function saveState() {
  const out = {};
  Object.values(sections).forEach(s => { out[s.id] = { enrolled: s.enrolled, waitlist: s.waitlist }; });
  store(STORAGE.sections, out);
  store(STORAGE.follows, [...follows]);
  store(STORAGE.me, { enrolled: [...myEnrolled] });
}

function commit() {
  saveState();
  render();
}

/* ---------- Helpers ---------- */
const freeSeats = s => s.capacity - s.enrolled;
const isFull = s => s.enrolled >= s.capacity;
const label = s => `${s.course.code} Şube ${s.no}`;
const siblings = s => s.course.sections.map(x => sections[x.id]).filter(x => x.id !== s.id);
const alternativesOf = s => siblings(s).filter(x => !isFull(x));
const myPosition = s => s.waitlist.indexOf(ME) + 1; // 0 = not in queue

function statusOf(s) {
  if (isFull(s)) return "full";
  if (freeSeats(s) <= 2 || s.enrolled / s.capacity >= 0.9) return "almost";
  return "free";
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function actionBtn(text, cls, action, id, opts = {}) {
  const b = el("button", `btn ${cls}`, text);
  b.type = "button";
  b.dataset.action = action;
  b.dataset.id = id;
  if (opts.disabled) b.disabled = true;
  if (opts.title) b.title = opts.title;
  return b;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------- Core: seat changes ---------- */
// Every seat change goes through here so the waitlist and alarms always apply.
function changeEnrolled(id, delta, source) {
  const s = sections[id];
  if (!s) return;

  if (delta > 0) {
    if (isFull(s)) return;
    s.enrolled++;
    flashIds.add(id);
    if (source === "sim") addLog(`${label(s)}: bir öğrenci kaydoldu (${s.enrolled}/${s.capacity})`, "fill");
    return;
  }

  if (s.enrolled <= 0) return;
  const wasFull = isFull(s);
  s.enrolled--;
  flashIds.add(id);

  const reason = { manual: "1 yer açıldı (demo)", me: "kaydınızı bıraktınız, 1 yer açıldı", sim: "bir öğrenci dersi bıraktı, 1 yer açıldı" }[source];
  addLog(`${label(s)}: ${reason}`, "open");

  // Fair rule: a freed seat goes to the head of the waitlist, not to the fastest refresher.
  if (s.waitlist.length) {
    const next = s.waitlist.shift();
    s.enrolled++;
    if (next === ME) {
      giveSeatToMe(s);
    } else {
      addLog(`${label(s)}: yer sıradaki öğrenciye (${next}) verildi`, "queue");
      const pos = myPosition(s);
      if (pos) toast(`${label(s)}: sıranız yükseldi, artık sıradaki ${pos}. kişisiniz`, "info");
    }
    return;
  }

  if (wasFull && source !== "me" && follows.has(id) && !myEnrolled.has(id)) notifyOpen(s);
}

function removeFromWaitlist(s) {
  const i = s.waitlist.indexOf(ME);
  if (i >= 0) s.waitlist.splice(i, 1);
}

// Records the student in a section; leaves other sections of the same course (switching).
function recordEnrollment(s) {
  siblings(s).forEach(x => {
    removeFromWaitlist(x);
    if (myEnrolled.has(x.id)) {
      myEnrolled.delete(x.id);
      changeEnrolled(x.id, -1, "me");
    }
  });
  removeFromWaitlist(s);
  myEnrolled.add(s.id);
}

function giveSeatToMe(s) {
  recordEnrollment(s);
  addLog(`${label(s)}: sıra sizdeydi, yer size ayrıldı`, "me");
  beep();
  browserNotify(`Sıranız geldi! ${label(s)} kaydınız yapıldı.`);
  showModal({
    icon: "🎟️",
    tone: "success",
    title: "Sıranız geldi!",
    text: "Bekleme listesinde ilk sıradaydınız. Açılan yer otomatik olarak size ayrıldı. Sayfayı yenilemenize gerek kalmadı.",
    section: s,
    actions: [{ label: "Harika!", cls: "btn-success", run: closeModal }]
  });
}

/* ---------- User actions ---------- */
function register(id) {
  const s = sections[id];
  if (!s || myEnrolled.has(id)) return false;
  if (isFull(s)) {
    toast("Maalesef bu şube doldu.", "error");
    return false;
  }
  const switched = siblings(s).some(x => myEnrolled.has(x.id));
  s.enrolled++;
  flashIds.add(id);
  recordEnrollment(s);
  addLog(`${label(s)}: kaydınız yapıldı`, "me");
  toast(switched ? `Şube değiştirildi: ${label(s)} ✅` : `Kaydınız tamamlandı: ${label(s)} ✅`, "success");
  return true;
}

function dropCourse(id) {
  const s = sections[id];
  if (!myEnrolled.has(id)) return;
  myEnrolled.delete(id);
  changeEnrolled(id, -1, "me");
  toast(`${label(s)} kaydınız silindi.`);
}

function joinWaitlist(id) {
  const s = sections[id];
  if (!isFull(s) || myPosition(s) || myEnrolled.has(id)) return;
  s.waitlist.push(ME);
  addLog(`${label(s)}: bekleme listesine katıldınız`, "me");
  toast(`Bekleme listesine eklendiniz. Sıradaki ${myPosition(s)}. kişisiniz.`, "success");
}

function leaveWaitlist(id) {
  const s = sections[id];
  removeFromWaitlist(s);
  toast(`${label(s)} bekleme listesinden çıktınız.`);
}

function toggleFollow(id) {
  const s = sections[id];
  if (follows.has(id)) {
    follows.delete(id);
    toast(`${label(s)} takipten çıkarıldı.`);
  } else {
    follows.add(id);
    ensureAudio();
    toast(isFull(s) ? `${label(s)} takipte. Yer açılınca haber vereceğiz 🔔` : `${label(s)} takip listenize eklendi.`, "success");
  }
}

function openSeat(id) {
  changeEnrolled(id, -1, "manual");
}

const ACTIONS = {
  follow: toggleFollow,
  register: register,
  drop: dropCourse,
  join: joinWaitlist,
  leave: leaveWaitlist,
  open: openSeat
};

/* ---------- Alerts: modal, sound, browser notification ---------- */
function notifyOpen(s) {
  beep();
  browserNotify(`${label(s)} (${s.course.name}) şubesinde yer açıldı!`);
  showModal({
    icon: "🎉",
    tone: "success",
    title: "Yer açıldı!",
    text: `Takip ettiğiniz şubede ${freeSeats(s)} boş yer var. Yer tekrar dolmadan hemen kaydolun!`,
    section: s,
    actions: [
      { label: "Kaydol", cls: "btn-success", run: () => modalRegister(s.id) },
      { label: "Kapat", cls: "btn-ghost", run: closeModal }
    ]
  });
}

function modalRegister(id) {
  const s = sections[id];
  if (!isFull(s)) {
    register(id);
    closeModal();
    commit();
    return;
  }
  showModal({
    icon: "😕",
    tone: "danger",
    title: "Maalesef yer tekrar doldu",
    text: "Siz tıklayana kadar başka biri kaydoldu. İşte bu yüzden bekleme listesi daha adil: sıra sizdeyse yer otomatik olarak size ayrılır.",
    section: s,
    alternatives: true,
    actions: [
      { label: "Bekleme listesine katıl", cls: "btn-warn", run: () => { joinWaitlist(id); closeModal(); commit(); } },
      { label: "Kapat", cls: "btn-ghost", run: closeModal }
    ]
  });
}

function showModal({ icon, tone, title, text, section, alternatives, actions }) {
  dom.modalBox.className = `modal tone-${tone || "info"}`;
  dom.modalIcon.textContent = icon;
  dom.modalTitle.textContent = title;
  dom.modalText.textContent = text;

  dom.modalExtra.replaceChildren();
  if (section) {
    const box = el("div", "modal-section");
    box.append(
      el("strong", null, `${label(section)} · ${section.course.name}`),
      el("div", "sec-meta", `👤 ${section.instructor} · 🕘 ${section.schedule}`),
      el("div", "sec-meta", `Kontenjan: ${section.enrolled}/${section.capacity}`)
    );
    dom.modalExtra.append(box);
    if (alternatives) dom.modalExtra.append(alternativesBox(section, true));
  }

  dom.modalActions.replaceChildren();
  actions.forEach(a => {
    const b = el("button", `btn ${a.cls}`, a.label);
    b.type = "button";
    b.addEventListener("click", a.run);
    dom.modalActions.append(b);
  });

  dom.modal.hidden = false;
  const first = dom.modalActions.querySelector("button");
  if (first) first.focus();
}

function closeModal() {
  dom.modal.hidden = true;
}

function ensureAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function beep() {
  const ctx = ensureAudio();
  if (!ctx) return;
  [[880, 0], [1320, 0.2]].forEach(([freq, offset]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + offset;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.18);
  });
}

function browserNotify(body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification("KontenjanAlarm", { body, tag: "kontenjanalarm" });
  } catch (e) { /* e.g. mobile Chrome requires a service worker */ }
}

function updateNotifyButton() {
  const b = dom.notifyBtn;
  if (!("Notification" in window)) {
    b.textContent = "Bildirim desteklenmiyor";
    b.disabled = true;
    return;
  }
  const p = Notification.permission;
  b.textContent = p === "granted" ? "🔔 Bildirimler açık" : p === "denied" ? "🔕 Bildirimler engellendi" : "🔔 Bildirimlere izin ver";
  b.disabled = p !== "default";
}

function requestNotifications() {
  ensureAudio();
  Promise.resolve(Notification.requestPermission()).then(p => {
    updateNotifyButton();
    if (p === "granted") toast("Bildirimler açıldı. Yer açılınca haber vereceğiz.", "success");
    else if (p === "denied") toast("Bildirim izni verilmedi. Ekran uyarısı ve ses yine çalışır.", "error");
  });
}

function toast(text, type = "info") {
  const t = el("div", `toast toast-${type}`, text);
  t.setAttribute("role", "status");
  dom.toasts.append(t);
  while (dom.toasts.children.length > 3) dom.toasts.firstChild.remove();
  setTimeout(() => {
    t.classList.add("hide");
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

/* ---------- Simulation ---------- */
function addLog(text, type) {
  const time = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  logEntries.unshift({ time, text, type });
  logEntries = logEntries.slice(0, LOG_LIMIT);
}

function pickSimSection() {
  // Favour sections the student cares about so the demo produces alerts quickly.
  const all = Object.values(sections);
  const watched = all.filter(s => follows.has(s.id) || myPosition(s));
  return watched.length && Math.random() < 0.5 ? randomItem(watched) : randomItem(all);
}

function simTick() {
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const s = pickSimSection();
    if (isFull(s)) {
      const r = Math.random();
      if (r < 0.55) {
        changeEnrolled(s.id, -1, "sim");
      } else if (r < 0.75 && s.waitlist.length < 5) {
        const name = randomItem(RANDOM_NAMES.filter(n => !s.waitlist.includes(n)));
        s.waitlist.push(name);
        addLog(`${label(s)}: ${name} bekleme listesine katıldı`, "queue");
      }
    } else {
      // Non-full sections tend to fill up, which sets up the next "seat opened" moment.
      const minimum = myEnrolled.has(s.id) ? 1 : 0;
      if (Math.random() < 0.65 || s.enrolled <= minimum) changeEnrolled(s.id, 1, "sim");
      else changeEnrolled(s.id, -1, "sim");
    }
  }
  commit();
}

function toggleSim() {
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
    toast("Simülasyon durduruldu.");
  } else {
    ensureAudio();
    simTimer = setInterval(simTick, SIM_INTERVAL_MS);
    toast("Simülasyon başladı: yerler birkaç saniyede bir değişecek.", "success");
  }
  updateSimControls();
}

function updateSimControls() {
  const running = Boolean(simTimer);
  dom.simBtn.textContent = running ? "⏸ Simülasyonu durdur" : "▶ Simülasyonu başlat";
  dom.simBtn.className = `btn ${running ? "btn-ghost" : "btn-primary"}`;
  dom.simStatus.textContent = running ? "Çalışıyor" : "Durdu";
  dom.simStatus.classList.toggle("running", running);
}

function resetAll() {
  if (!confirm("Takip listesi, kayıtlar ve kontenjanlar başlangıç durumuna dönsün mü?")) return;
  if (simTimer) clearInterval(simTimer);
  simTimer = null;
  Object.values(STORAGE).forEach(key => {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  });
  loadState();
  logEntries = [];
  prevPct = {};
  closeModal();
  updateSimControls();
  render();
  toast("Veriler sıfırlandı.");
}

/* ---------- Rendering ---------- */
function capacityBar(s) {
  const st = statusOf(s);
  const pct = Math.round((s.enrolled / s.capacity) * 100);
  const wrap = el("div", "cap");

  const top = el("div", "cap-top");
  top.append(el("span", `pill pill-${st}`, STATUS_LABEL[st]), el("span", "cap-count", `${s.enrolled}/${s.capacity}`));

  const bar = el("div", "bar");
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", String(s.capacity));
  bar.setAttribute("aria-valuenow", String(s.enrolled));
  bar.setAttribute("aria-label", `${label(s)} kontenjan: ${s.enrolled}/${s.capacity}`);

  const fill = el("div", `bar-fill fill-${st}`);
  const from = prevPct[s.id] ?? pct;
  fill.style.width = `${from}%`;
  if (from !== pct) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${pct}%`; }));
  bar.append(fill);

  wrap.append(top, bar);
  return wrap;
}

function waitlistInfo(s) {
  const box = el("div", "waitlist");
  const pos = myPosition(s);
  box.append(el("span", null, `⏳ Bekleme listesi: ${s.waitlist.length} kişi`));
  if (pos) {
    const text = pos === 1 ? "Sıradaki 1. kişisiniz, ilk açılan yer sizin!" : `Sıradaki ${pos}. kişisiniz`;
    box.append(el("span", "position", text));
  }
  return box;
}

function alternativesBox(s, inModal) {
  const box = el("div", "alts");
  const alts = alternativesOf(s);
  box.append(el("div", "alts-title", "🔀 Alternatif şubeler"));

  if (!alts.length) {
    const msg = siblings(s).length
      ? "Bu dersin boş şubesi yok. Bekleme listesine katılabilirsiniz."
      : "Bu dersin başka şubesi yok. Bekleme listesine katılabilirsiniz.";
    box.append(el("div", "muted", msg));
    return box;
  }

  const list = el("ul");
  alts.forEach(a => {
    const li = el("li", "alt-item");
    const info = el("span");
    info.append(`Şube ${a.no} · ${a.schedule} · `, el("span", "free", `${freeSeats(a)} boş yer`));
    const actions = el("div", "alt-actions");
    if (myEnrolled.has(a.id)) {
      actions.append(el("span", "mine-badge", "Kayıtlısınız ✓"));
    } else if (inModal) {
      const b = el("button", "btn btn-success btn-sm", "Kaydol");
      b.type = "button";
      b.addEventListener("click", () => { register(a.id); closeModal(); commit(); });
      actions.append(b);
    } else {
      actions.append(actionBtn("Kaydol", "btn-success btn-sm", "register", a.id));
    }
    li.append(info, actions);
    list.append(li);
  });
  box.append(list);
  return box;
}

function sectionRow(s) {
  const st = statusOf(s);
  const mine = myEnrolled.has(s.id);
  const row = el("div", `section status-${st}`);
  row.dataset.id = s.id;
  if (flashIds.has(s.id)) row.classList.add("flash");

  const info = el("div", "sec-info");
  const title = el("div", "sec-title");
  title.append(el("strong", null, `Şube ${s.no}`));
  if (mine) title.append(el("span", "mine-badge", "Kayıtlısınız ✓"));
  info.append(title, el("div", "sec-meta", `👤 ${s.instructor}`), el("div", "sec-meta", `🕘 ${s.schedule}`));

  const main = el("div", "sec-main");
  main.append(info, capacityBar(s));

  const actions = el("div", "sec-actions");
  if (mine) {
    actions.append(actionBtn("Kaydı bırak", "btn-ghost", "drop", s.id));
  } else if (!isFull(s)) {
    actions.append(actionBtn("Kaydol", "btn-success", "register", s.id));
  } else if (myPosition(s)) {
    actions.append(actionBtn("Listeden çık", "btn-ghost", "leave", s.id));
  } else {
    actions.append(actionBtn("Bekleme listesine katıl", "btn-warn", "join", s.id));
  }
  const following = follows.has(s.id);
  actions.append(actionBtn(following ? "Takipte ✓" : "Takip et", following ? "btn-following" : "btn-outline", "follow", s.id));
  actions.append(actionBtn("+ Yer aç", "btn-demo", "open", s.id, {
    disabled: s.enrolled === 0,
    title: "Demo: bu şubede bir öğrenci dersi bırakmış gibi 1 yer açar"
  }));

  row.append(main, actions);
  if (isFull(s) && !mine) row.append(waitlistInfo(s), alternativesBox(s, false));
  return row;
}

function renderCourses() {
  const term = searchTerm.trim().toLocaleLowerCase("tr");
  const matches = COURSES.filter(c =>
    !term || `${c.code} ${c.name}`.toLocaleLowerCase("tr").includes(term)
  );

  dom.courseList.replaceChildren();
  if (!matches.length) {
    dom.courseList.append(el("div", "card empty", "Aramanıza uygun ders bulunamadı."));
    return;
  }

  matches.forEach(c => {
    const card = el("article", "card course");
    const head = el("header", "course-head");
    head.append(
      el("span", "course-code", c.code),
      el("h3", null, c.name),
      el("span", "course-sub", c.sections.length > 1 ? `${c.sections.length} şube` : "Tek şube")
    );
    card.append(head);
    c.sections.forEach(sec => card.append(sectionRow(sections[sec.id])));
    dom.courseList.append(card);
  });
}

function renderFollows() {
  dom.followList.replaceChildren();
  dom.followCount.textContent = String(follows.size);

  if (!follows.size) {
    dom.followList.append(el("li", "follow-empty", "Henüz takip ettiğiniz şube yok. Bir şubedeki “Takip et” butonuna basın."));
    return;
  }

  follows.forEach(id => {
    const s = sections[id];
    const li = el("li", "follow-item");

    const top = el("div", "follow-top");
    const text = el("div");
    text.append(el("strong", null, label(s)), el("span", null, s.course.name));
    const remove = actionBtn("×", "btn-ghost btn-icon", "follow", id, { title: "Takipten çıkar" });
    remove.setAttribute("aria-label", `${label(s)} takipten çıkar`);
    top.append(text, remove);

    const pos = myPosition(s);
    let note;
    if (myEnrolled.has(id)) note = el("div", "follow-note ok", "Kayıtlısınız ✓");
    else if (pos) note = el("div", "follow-note wait", `⏳ Bekleme listesinde sıradaki ${pos}. kişisiniz`);
    else if (isFull(s)) note = el("div", "follow-note", "Dolu. Yer açılınca haber vereceğiz 🔔");
    else note = el("div", "follow-note ok", `${freeSeats(s)} boş yer var, hemen kaydolabilirsiniz`);

    li.append(top, capacityBar(s), note);
    dom.followList.append(li);
  });
}

function renderLog() {
  dom.simLog.replaceChildren();
  if (!logEntries.length) {
    dom.simLog.append(el("li", "log-empty", "Henüz bir değişiklik yok. Simülasyonu başlatın veya bir şubede “Yer aç”a basın."));
    return;
  }
  logEntries.forEach(e => {
    const li = el("li", `log-${e.type}`);
    li.append(el("time", null, e.time), el("span", null, e.text));
    dom.simLog.append(li);
  });
}

function render() {
  // Keep keyboard focus on the same button across re-renders.
  const active = document.activeElement;
  const focusKey = active && active.dataset && active.dataset.action
    ? { action: active.dataset.action, id: active.dataset.id, inFollow: Boolean(active.closest("#follow-list")) }
    : null;

  renderCourses();
  renderFollows();
  renderLog();

  if (focusKey) {
    const root = focusKey.inFollow ? dom.followList : dom.courseList;
    const target = root.querySelector(`[data-action="${focusKey.action}"][data-id="${focusKey.id}"]`);
    if (target) target.focus();
  }

  Object.values(sections).forEach(s => { prevPct[s.id] = Math.round((s.enrolled / s.capacity) * 100); });
  flashIds.clear();
}

/* ---------- Events ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const fn = ACTIONS[b.dataset.action];
  if (!fn) return;
  fn(b.dataset.id);
  commit();
});

dom.simBtn.addEventListener("click", toggleSim);
dom.resetBtn.addEventListener("click", resetAll);
dom.search.addEventListener("input", () => {
  searchTerm = dom.search.value;
  renderCourses();
});

if ("Notification" in window) dom.notifyBtn.addEventListener("click", requestNotifications);

dom.modal.addEventListener("click", e => { if (e.target === dom.modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !dom.modal.hidden) closeModal(); });

// Browsers only allow sound after a user gesture, so unlock audio on the first interaction.
["pointerdown", "keydown"].forEach(type => document.addEventListener(type, ensureAudio, { once: true }));

/* ---------- Init ---------- */
loadState();
updateNotifyButton();
updateSimControls();
render();
