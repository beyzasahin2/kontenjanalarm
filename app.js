"use strict";

/* =========================================================
   YaşarOBS — demo öğrenci bilgi sistemi + KontenjanAlarm Sistemi
   Yaşar Üniversitesi Enerji Sistemleri Mühendisliği (örnek veri)
   Ders projesi prototipi – Yaşar Üniversitesi'nin resmi sistemi değildir.
   ========================================================= */

const ME = "Siz";
const STORAGE = {
  session: "ka2_session",
  follows: "ka2_follows",
  sections: "ka2_sections",
  basket: "ka2_basket",
  status: "ka2_status"
};
const SIM_INTERVAL_MS = 3000;
const APPROVAL_DELAY_MS = 4000;
const LOG_LIMIT = 4;
// route -> page view, title and menu group (for the breadcrumb)
const ROUTES = {
  "ana-sayfa": { view: "ana-sayfa", title: "Ana Sayfa", group: "Genel" },
  "ders-kayit": { view: "ders-kayit", title: "Ders Kayıt", group: "Dersler ve Dönem İşlemleri" },
  "notlar": { view: "placeholder", title: "Notlar", group: "Dersler ve Dönem İşlemleri" },
  "ders-programi": { view: "ders-programi", title: "Ders Programı", group: "Dersler ve Dönem İşlemleri" },
  "transkript": { view: "placeholder", title: "Transkript", group: "Dersler ve Dönem İşlemleri" },
  "formlar": { view: "placeholder", title: "Formlar", group: "Formlar" },
  "belge-talepleri": { view: "placeholder", title: "Belge Talepleri", group: "Belge Talepleri" },
  "kredi-transferi": { view: "placeholder", title: "Kredi Transferi", group: "Akademik" },
  "hazirlik-okulu": { view: "placeholder", title: "Hazırlık Okulu", group: "Akademik" },
  "basvurular": { view: "placeholder", title: "Başvurular", group: "Başvurular" },
  "kullanici-ayarlari": { view: "placeholder", title: "Kullanıcı Ayarları", group: "Hesap" }
};
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum"];
const DAY_START = 8 * 60 + 30; // 08:30
const DAY_HOURS = 9;           // 08:30–17:30

// Kurallar: dönem başına normal yük 30 AKTS; azami 35, asgari 20 (örnek uygulama).
const STUDENT = {
  name: "Demo Öğrenci",
  no: "22050111001",
  dept: "Enerji Sistemleri Mühendisliği (İngilizce)",
  year: "3. sınıf (5. yarıyıl)",
  gpa: "2,87",
  gpaValue: 2.87,
  completedEcts: 120,
  email: "demo.ogrenci@example.com",
  advisor: "Dr. Öğr. Üyesi Elif Aras",
  advisorEmail: "elif.aras@example.com",
  advisorHours: "Salı 14:00–16:00",
  maxEcts: 35,
  minEcts: 20,
  passed: ["ESE 1001", "ESE 2001", "ESE 2011", "ESE 2031", "MATH 1131", "MATH 1132", "PHYS 1101"]
};

// Örnek ders verisi (gerçek müfredata erişilemedi; ESE + 4 haneli kod biçimi korunmuştur).
const COURSES = [
  {
    code: "ESE 3011", name: "Yenilenebilir Enerji Sistemleri", ects: 6, type: "Zorunlu", prereq: "ESE 2011",
    sections: [
      { id: "ESE3011-1", no: 1, instructor: "Doç. Dr. Ayşe Yılmaz", slots: [{ day: 0, start: "09:30", end: "12:20" }], capacity: 40, enrolled: 40, waitlist: ["Mehmet K.", "Zeynep A."] },
      { id: "ESE3011-2", no: 2, instructor: "Dr. Öğr. Üyesi Can Demir", slots: [{ day: 2, start: "13:30", end: "16:20" }], capacity: 40, enrolled: 38, waitlist: [] },
      { id: "ESE3011-3", no: 3, instructor: "Prof. Dr. Selim Arslan", slots: [{ day: 4, start: "09:30", end: "12:20" }], capacity: 40, enrolled: 40, waitlist: [] }
    ]
  },
  {
    code: "ESE 3001", name: "Isı Transferi", ects: 6, type: "Zorunlu", prereq: "ESE 2001",
    sections: [
      { id: "ESE3001-1", no: 1, instructor: "Prof. Dr. Oya Güneş", slots: [{ day: 1, start: "09:30", end: "12:20" }], capacity: 45, enrolled: 45, waitlist: ["Ali R.", "Elif S."] },
      { id: "ESE3001-2", no: 2, instructor: "Dr. Öğr. Üyesi Tolga Er", slots: [{ day: 3, start: "13:30", end: "16:20" }], capacity: 45, enrolled: 45, waitlist: ["Deniz Y."] }
    ]
  },
  {
    code: "ESE 3021", name: "Akışkanlar Mekaniği", ects: 6, type: "Zorunlu", prereq: "ESE 2001",
    sections: [
      { id: "ESE3021-1", no: 1, instructor: "Doç. Dr. Kemal Aksoy", slots: [{ day: 0, start: "13:30", end: "16:20" }], capacity: 40, enrolled: 36, waitlist: [] },
      { id: "ESE3021-2", no: 2, instructor: "Dr. Öğr. Üyesi Seda Koç", slots: [{ day: 3, start: "09:30", end: "12:20" }], capacity: 40, enrolled: 40, waitlist: [] }
    ]
  },
  {
    code: "ESE 3031", name: "Elektrik Makineleri", ects: 5, type: "Zorunlu", prereq: "ESE 2031",
    sections: [
      { id: "ESE3031-1", no: 1, instructor: "Dr. Öğr. Üyesi Murat Şen", slots: [{ day: 1, start: "13:30", end: "15:20" }], capacity: 30, enrolled: 30, waitlist: ["Ece B."] },
      { id: "ESE3031-2", no: 2, instructor: "Dr. Öğr. Üyesi Pınar Doğan", slots: [{ day: 2, start: "09:30", end: "11:20" }], capacity: 30, enrolled: 22, waitlist: [] }
    ]
  },
  {
    code: "ESE 3041", name: "Sayısal Yöntemler", ects: 5, type: "Zorunlu", prereq: null,
    sections: [
      { id: "ESE3041-1", no: 1, instructor: "Doç. Dr. Nur Kaya", slots: [{ day: 0, start: "14:30", end: "16:20" }], capacity: 40, enrolled: 33, waitlist: [] }
    ]
  },
  {
    code: "ESE 3013", name: "Güneş Enerjisi Sistemleri", ects: 5, type: "Seçmeli", prereq: null,
    sections: [
      { id: "ESE3013-1", no: 1, instructor: "Dr. Öğr. Üyesi Emre Çelik", slots: [{ day: 2, start: "09:30", end: "11:20" }], capacity: 30, enrolled: 28, waitlist: [] }
    ]
  },
  {
    code: "ESE 4011", name: "Rüzgâr Enerjisi Sistemleri", ects: 5, type: "Seçmeli", prereq: "ESE 3011",
    sections: [
      { id: "ESE4011-1", no: 1, instructor: "Prof. Dr. Hakan Öztürk", slots: [{ day: 4, start: "13:30", end: "15:20" }], capacity: 30, enrolled: 18, waitlist: [] }
    ]
  },
  {
    code: "ESE 4021", name: "Enerji Ekonomisi ve Politikası", ects: 5, type: "Seçmeli", prereq: null,
    sections: [
      { id: "ESE4021-1", no: 1, instructor: "Dr. Öğr. Üyesi Serkan Yıldız", slots: [{ day: 3, start: "15:30", end: "17:20" }], capacity: 80, enrolled: 70, waitlist: [] }
    ]
  },
  {
    code: "ENG 3001", name: "Teknik İngilizce", ects: 3, type: "Zorunlu", prereq: null,
    sections: [
      { id: "ENG3001-1", no: 1, instructor: "Öğr. Gör. John Miller", slots: [{ day: 0, start: "08:30", end: "09:20" }, { day: 2, start: "08:30", end: "09:20" }], capacity: 25, enrolled: 25, waitlist: [] },
      { id: "ENG3001-2", no: 2, instructor: "Öğr. Gör. Merve Tan", slots: [{ day: 1, start: "08:30", end: "09:20" }, { day: 3, start: "08:30", end: "09:20" }], capacity: 25, enrolled: 24, waitlist: [] }
    ]
  },
  {
    code: "MATH 2051", name: "Olasılık ve İstatistik", ects: 5, type: "Zorunlu", prereq: "MATH 1132",
    sections: [
      { id: "MATH2051-1", no: 1, instructor: "Dr. Öğr. Üyesi Gizem Ateş", slots: [{ day: 4, start: "13:30", end: "16:20" }], capacity: 50, enrolled: 48, waitlist: [] }
    ]
  }
];

// The student's starting basket (these seats are already counted in "enrolled").
const DEFAULT_BASKET = ["ESE3021-1", "ESE3031-2", "ENG3001-2"];

const RANDOM_NAMES = ["Ahmet Y.", "Büşra K.", "Cem D.", "Damla T.", "Emir S.", "Fatma G.", "Gökhan A.", "Hande B.", "İrem Ç.", "Kerem O.", "Melis U.", "Onur P."];
const STATUS_LABEL = { free: "Müsait", almost: "Az kaldı", full: "Dolu" };
const REG_STATUS = {
  secim: "Ders seçimi yapılıyor",
  bekliyor: "Danışman onayı bekleniyor",
  onaylandi: "Danışman onayladı ✓"
};

/* ---------- State ---------- */
let sections = {};            // id -> section (+ course reference)
let follows = new Set();      // followed section ids
let basket = new Set();       // section ids in the student's basket (seat held)
let regStatus = "secim";
let loggedIn = false;
let openedAlerts = new Set(); // followed sections where a seat just opened
let filter = "all";
let searchTerm = "";
let simTimer = null;
let approvalTimer = null;
let logEntries = [];
let flashIds = new Set();
let prevPct = {};
let audioCtx = null;

/* ---------- DOM ---------- */
const $ = id => document.getElementById(id);
const dom = {
  loginView: $("login-view"),
  loginForm: $("login-form"),
  app: $("app"),
  sidebar: $("sidebar"),
  drawerBackdrop: $("drawer-backdrop"),
  menuBtn: $("menu-btn"),
  logoutBtn: $("logout-btn"),
  navBadge: $("nav-badge"),
  pageTitle: $("page-title"),
  breadcrumb: $("breadcrumb"),
  menuSearch: $("menu-search"),
  navEmpty: $("nav-empty"),
  captchaQ: $("captcha-q"),
  captchaAnswer: $("captcha-answer"),
  captchaRefresh: $("captcha-refresh"),
  captchaError: $("captcha-error"),
  forgotLink: $("forgot-link"),
  bellBtn: $("bell-btn"),
  bellCount: $("bell-count"),
  notifyBtn: $("notify-btn"),
  infoGrid: $("info-grid"),
  placeholderTitle: $("placeholder-title"),
  timetablePage: $("timetable-page"),
  programRows: $("program-rows"),
  alarmPanel: $("alarm-panel"),
  alarmStats: $("alarm-stats"),
  alarmList: $("alarm-list"),
  simBtn: $("sim-btn"),
  simStatus: $("sim-status"),
  simLog: $("sim-log"),
  resetBtn: $("reset-btn"),
  search: $("search"),
  courseList: $("course-list"),
  basketList: $("basket-list"),
  ectsMeter: $("ects-meter"),
  basketWarnings: $("basket-warnings"),
  submitBtn: $("submit-btn"),
  timetable: $("timetable"),
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

  const b = load(STORAGE.basket);
  basket = new Set((Array.isArray(b) ? b : DEFAULT_BASKET).filter(id => sections[id]));

  const st = load(STORAGE.status);
  regStatus = REG_STATUS[st] ? st : "secim";

  loggedIn = load(STORAGE.session) === true;
  openedAlerts = new Set();
}

function saveState() {
  const out = {};
  Object.values(sections).forEach(s => { out[s.id] = { enrolled: s.enrolled, waitlist: s.waitlist }; });
  store(STORAGE.sections, out);
  store(STORAGE.follows, [...follows]);
  store(STORAGE.basket, [...basket]);
  store(STORAGE.status, regStatus);
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
const prereqOk = course => !course.prereq || STUDENT.passed.includes(course.prereq);
const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const formatSlot = sl => `${DAYS[sl.day]} ${sl.start}–${sl.end}`;
const formatSlots = s => s.slots.map(formatSlot).join(", ");

function statusOf(s) {
  if (isFull(s)) return "full";
  if (freeSeats(s) <= 2 || s.enrolled / s.capacity >= 0.9) return "almost";
  return "free";
}

function slotsOverlap(a, b) {
  return a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
}

function sectionsClash(a, b) {
  return a.slots.some(x => b.slots.some(y => slotsOverlap(x, y)));
}

// Basket sections (of other courses) that would clash with s.
function clashesWithBasket(s) {
  return [...basket].map(id => sections[id]).filter(b => b.course !== s.course && sectionsClash(s, b));
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
    if (isFull(s)) openedAlerts.delete(id);
    if (source === "sim") addLog(`${label(s)}: bir öğrenci kaydoldu (${s.enrolled}/${s.capacity})`, "fill");
    return;
  }

  if (s.enrolled <= 0) return;
  const wasFull = isFull(s);
  s.enrolled--;
  flashIds.add(id);

  const reason = { manual: "1 yer açıldı (demo)", me: "sepetinizden çıkardınız, 1 yer açıldı", sim: "bir öğrenci dersi bıraktı, 1 yer açıldı" }[source];
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

  if (wasFull && source !== "me" && follows.has(id) && !basket.has(id)) notifyOpen(s);
}

function removeFromWaitlist(s) {
  const i = s.waitlist.indexOf(ME);
  if (i >= 0) s.waitlist.splice(i, 1);
}

// Any basket change sends the registration back to "seçim" so it must be re-submitted.
function basketChanged() {
  if (regStatus === "secim") return;
  regStatus = "secim";
  clearTimeout(approvalTimer);
  approvalTimer = null;
  toast("Sepet değişti; danışman onayına yeniden göndermeniz gerekiyor.", "info");
}

// Puts s into the basket; leaves other sections of the same course (section switch).
function putInBasket(s) {
  siblings(s).forEach(x => {
    removeFromWaitlist(x);
    if (basket.has(x.id)) {
      basket.delete(x.id);
      changeEnrolled(x.id, -1, "me");
    }
  });
  removeFromWaitlist(s);
  basket.add(s.id);
  openedAlerts.delete(s.id);
  basketChanged();
}

function giveSeatToMe(s) {
  putInBasket(s);
  addLog(`${label(s)}: sıra sizdeydi, yer size ayrıldı`, "me");
  beep();
  browserNotify(`Sıranız geldi! ${label(s)} sepetinize eklendi.`);
  showModal({
    icon: "🎟️",
    tone: "success",
    title: "Sıranız geldi!",
    text: "Bekleme listesinde ilk sıradaydınız. Açılan yer otomatik olarak size ayrıldı ve ders sepetinize eklendi. Sayfayı yenilemenize gerek kalmadı.",
    section: s,
    actions: [{ label: "Harika!", cls: "btn-success", run: closeModal }]
  });
}

/* ---------- Basket rules ---------- */
function validateBasket() {
  const items = [...basket].map(id => sections[id]);
  const ects = items.reduce((sum, s) => sum + s.course.ects, 0);
  const clashes = [];
  items.forEach((a, i) => items.slice(i + 1).forEach(b => {
    a.slots.forEach(x => b.slots.forEach(y => {
      if (slotsOverlap(x, y)) clashes.push({ a, b, day: DAYS[x.day] });
    }));
  }));
  const prereqMissing = items.filter(s => !prereqOk(s.course));
  const overLimit = ects > STUDENT.maxEcts;
  const underMin = ects < STUDENT.minEcts;
  return { items, ects, clashes, prereqMissing, overLimit, underMin, blocking: clashes.length > 0 || prereqMissing.length > 0 || overLimit || underMin };
}

/* ---------- User actions ---------- */
function addToBasket(id) {
  const s = sections[id];
  if (!s || basket.has(id)) return false;
  if (isFull(s)) {
    toast("Maalesef bu şube doldu.", "error");
    return false;
  }
  const switched = siblings(s).some(x => basket.has(x.id));
  s.enrolled++;
  flashIds.add(id);
  putInBasket(s);
  addLog(`${label(s)}: sepetinize eklendi`, "me");
  toast(switched ? `Şube değiştirildi: ${label(s)} ✅` : `${label(s)} sepetinize eklendi ✅`, "success");

  if (!prereqOk(s.course)) toast(`⚠ Önkoşul sağlanmadı: ${s.course.code} için ${s.course.prereq} gerekli.`, "error");
  const clash = clashesWithBasket(s);
  if (clash.length) toast(`⚠ Ders saati çakışması: ${clash.map(c => c.course.code).join(", ")}`, "error");
  const { ects } = validateBasket();
  if (ects > STUDENT.maxEcts) toast(`⚠ AKTS sınırı aşıldı: ${ects}/${STUDENT.maxEcts}`, "error");
  return true;
}

function removeFromBasket(id) {
  const s = sections[id];
  if (!basket.has(id)) return;
  basket.delete(id);
  changeEnrolled(id, -1, "me");
  basketChanged();
  toast(`${label(s)} sepetinizden çıkarıldı.`);
}

function joinWaitlist(id) {
  const s = sections[id];
  if (!isFull(s) || myPosition(s) || basket.has(id)) return;
  s.waitlist.push(ME);
  follows.add(id);
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
    openedAlerts.delete(id);
    toast(`${label(s)} alarmdan çıkarıldı.`);
  } else {
    follows.add(id);
    ensureAudio();
    toast(isFull(s) ? `🔔 ${label(s)} alarmda. Yer açılınca haber vereceğiz.` : `${label(s)} alarm listenize eklendi.`, "success");
  }
}

function openSeat(id) {
  changeEnrolled(id, -1, "manual");
}

function submitToAdvisor() {
  const v = validateBasket();
  if (v.blocking) {
    toast("Önce sepetteki uyarıları düzeltin.", "error");
    return;
  }
  regStatus = "bekliyor";
  scheduleApproval();
  toast(`Ders seçiminiz danışmanınıza (${STUDENT.advisor}) gönderildi.`, "success");
}

function scheduleApproval() {
  clearTimeout(approvalTimer);
  approvalTimer = setTimeout(() => {
    if (regStatus !== "bekliyor") return;
    regStatus = "onaylandi";
    toast("Danışmanınız ders seçiminizi onayladı ✓ (demo)", "success");
    commit();
  }, APPROVAL_DELAY_MS);
}

const ACTIONS = {
  follow: toggleFollow,
  add: addToBasket,
  remove: removeFromBasket,
  join: joinWaitlist,
  leave: leaveWaitlist,
  open: openSeat
};

/* ---------- Alerts: modal, sound, browser notification ---------- */
function notifyOpen(s) {
  openedAlerts.add(s.id);
  beep();
  browserNotify(`${label(s)} (${s.course.name}) şubesinde yer açıldı! Hemen kaydolun.`);
  showModal({
    icon: "🎉",
    tone: "success",
    title: "Yer açıldı!",
    text: `Takip ettiğiniz şubede ${freeSeats(s)} boş yer var. Yer tekrar dolmadan tek tıkla sepetinize ekleyin.`,
    section: s,
    actions: [
      { label: "Hemen kaydol", cls: "btn-success", run: () => modalAdd(s.id) },
      { label: "Kapat", cls: "btn-ghost", run: closeModal }
    ]
  });
}

function modalAdd(id) {
  const s = sections[id];
  if (!isFull(s)) {
    addToBasket(id);
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
      { label: "Bekleme listesine katıl", cls: "btn-amber", run: () => { joinWaitlist(id); closeModal(); commit(); } },
      { label: "Kapat", cls: "btn-ghost", run: closeModal }
    ]
  });
  commit();
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
      el("div", "sec-meta", `👤 ${section.instructor} · 🕘 ${formatSlots(section)}`),
      el("div", "sec-meta", `Kontenjan: ${section.enrolled}/${section.capacity} · ${section.course.ects} AKTS`)
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
  [[880, 0], [1320, 0.2], [1760, 0.4]].forEach(([freq, offset]) => {
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
    new Notification("YaşarOBS · KontenjanAlarm", { body, tag: "kontenjanalarm" });
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
  b.textContent = p === "granted" ? "🔔 Bildirimler açık" : p === "denied" ? "🔕 Bildirimler engellendi" : "Bildirimlere izin ver";
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
  }, 3400);
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
      const minimum = basket.has(s.id) ? 1 : 0;
      if (Math.random() < 0.65 || s.enrolled <= minimum) changeEnrolled(s.id, 1, "sim");
      else changeEnrolled(s.id, -1, "sim");
    }
  }
  commit();
}

function stopSim() {
  clearInterval(simTimer);
  simTimer = null;
  updateSimControls();
}

function toggleSim() {
  if (simTimer) {
    stopSim();
    toast("Simülasyon durduruldu.");
    return;
  }
  ensureAudio();
  simTimer = setInterval(simTick, SIM_INTERVAL_MS);
  toast("Simülasyon başladı: yerler birkaç saniyede bir değişecek.", "success");
  updateSimControls();
}

function updateSimControls() {
  const running = Boolean(simTimer);
  dom.simBtn.textContent = running ? "⏸ Simülasyonu durdur" : "▶ Simülasyonu başlat";
  dom.simBtn.className = `btn btn-sm ${running ? "btn-ghost" : "btn-primary"}`;
  dom.simStatus.textContent = running ? "Çalışıyor" : "Durdu";
  dom.simStatus.classList.toggle("running", running);
}

function resetAll() {
  if (!confirm("Alarm listesi, sepet ve kontenjanlar başlangıç durumuna dönsün mü?")) return;
  stopSim();
  clearTimeout(approvalTimer);
  [STORAGE.follows, STORAGE.sections, STORAGE.basket, STORAGE.status].forEach(key => {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  });
  loadState();
  logEntries = [];
  prevPct = {};
  closeModal();
  render();
  toast("Veriler sıfırlandı.");
}

/* ---------- Rendering: shared pieces ---------- */
function capacityBar(s, small) {
  const st = statusOf(s);
  const pct = Math.round((s.enrolled / s.capacity) * 100);
  const wrap = el("div", small ? "cap cap-sm" : "cap");

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
  const top = el("div", "waitlist-top");
  const pos = myPosition(s);
  top.append(el("span", null, `⏳ Bekleme listesi: ${s.waitlist.length} kişi`));
  if (pos) top.append(el("span", "position", pos === 1 ? "Sıradaki 1. kişisiniz, ilk açılan yer sizin!" : `Sıradaki ${pos}. kişisiniz`));
  box.append(top, el("span", "fair", "Yer açılınca sıradaki kişiye verilir, en hızlı yenileyene değil."));
  return box;
}

function alternativesBox(s, inModal) {
  const alts = alternativesOf(s);
  const box = el("div", alts.length ? "alts" : "alts none");
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
    info.append(`Şube ${a.no} · ${formatSlots(a)} · `, el("span", "free", `${freeSeats(a)} boş yer`));
    if (basket.has(a.id)) {
      li.append(info, el("span", "mine-badge", "Sepette ✓"));
    } else if (inModal) {
      const b = el("button", "btn btn-success btn-sm", "Sepete ekle");
      b.type = "button";
      b.addEventListener("click", () => { addToBasket(a.id); closeModal(); commit(); });
      li.append(info, b);
    } else {
      li.append(info, actionBtn("Sepete ekle", "btn-success btn-sm", "add", a.id));
    }
    list.append(li);
  });
  box.append(list);
  return box;
}

function statusChip(node) {
  node.className = `status-chip js-status status-${regStatus}`;
  node.textContent = REG_STATUS[regStatus];
}

/* ---------- Rendering: KontenjanAlarm Sistemi ---------- */
function alarmCard(s) {
  const li = el("li", "alarm-card");
  const top = el("div", "alarm-card-top");
  const text = el("div");
  text.append(el("strong", null, label(s)), el("span", null, `${s.course.name} · ${formatSlots(s)}`));
  const remove = actionBtn("×", "btn-ghost btn-icon", "follow", s.id, { title: "Alarmdan çıkar" });
  remove.setAttribute("aria-label", `${label(s)} alarmdan çıkar`);
  top.append(text, remove);
  li.append(top, capacityBar(s));

  const pos = myPosition(s);
  if (basket.has(s.id)) {
    li.classList.add("inbasket");
    li.append(el("div", "alarm-msg green", "Sepette ✓"));
  } else if (openedAlerts.has(s.id) && !isFull(s)) {
    li.classList.add("opened");
    li.append(
      el("div", "alarm-msg green", `🎉 Yer açıldı! ${freeSeats(s)} boş yer`),
      actionBtn("Hemen kaydol", "btn-success btn-lg btn-glow", "add", s.id)
    );
  } else if (pos) {
    li.classList.add("waiting");
    li.append(el("div", "alarm-msg amber", pos === 1 ? "⏳ Sıradaki 1. kişisiniz, ilk açılan yer sizin!" : `⏳ Sıradaki ${pos}. kişisiniz`));
  } else if (isFull(s)) {
    li.classList.add("full");
    li.append(
      el("div", "alarm-msg red", "Dolu. Yer açılınca haber vereceğiz 🔔"),
      actionBtn("⏳ Bekleme listesine katıl", "btn-amber btn-sm", "join", s.id)
    );
  } else {
    li.append(
      el("div", "alarm-msg green", `${freeSeats(s)} boş yer var`),
      actionBtn("Sepete ekle", "btn-success", "add", s.id)
    );
  }
  return li;
}

function renderAlarmPanel() {
  const followed = [...follows].map(id => sections[id]);
  const fullCount = followed.filter(s => isFull(s) && !basket.has(s.id)).length;
  const waitCount = Object.values(sections).filter(s => myPosition(s)).length;

  dom.alarmStats.replaceChildren();
  [["", follows.size, "Takip edilen"], ["red", fullCount, "Dolu"], ["amber", waitCount, "Bekleme listesinde"]].forEach(([cls, n, text]) => {
    const st = el("div", `stat ${cls}`);
    st.append(el("strong", null, String(n)), el("span", null, text));
    dom.alarmStats.append(st);
  });

  dom.alarmList.replaceChildren();
  if (!followed.length) {
    dom.alarmList.append(el("li", "alarm-empty", "Henüz alarm kurmadınız. Aşağıda dolu bir şubede “🔔 Takip et”e basın; yer açıldığı an burada ve ekranda uyarı alırsınız."));
    return;
  }
  // Seats that just opened come first.
  followed
    .sort((a, b) => (openedAlerts.has(b.id) && !isFull(b)) - (openedAlerts.has(a.id) && !isFull(a)))
    .forEach(s => dom.alarmList.append(alarmCard(s)));
}

function renderBadges() {
  const hot = [...openedAlerts].filter(id => follows.has(id) && !isFull(sections[id]) && !basket.has(id)).length;
  dom.navBadge.hidden = follows.size === 0;
  dom.navBadge.textContent = hot ? `${hot} yer!` : String(follows.size);
  dom.navBadge.classList.toggle("hot", hot > 0);
  dom.bellCount.textContent = String(hot || follows.size);
  dom.bellBtn.classList.toggle("hot", hot > 0);
  dom.bellBtn.setAttribute("aria-label", hot ? `${hot} takip ettiğiniz şubede yer açıldı` : "Kontenjan alarmına git");
}

/* ---------- Rendering: course list ---------- */
function sectionRow(s) {
  const st = statusOf(s);
  const mine = basket.has(s.id);
  const row = el("div", `section status-${st}`);
  row.dataset.id = s.id;
  if (flashIds.has(s.id)) row.classList.add("flash");

  const info = el("div", "sec-info");
  const title = el("div", "sec-title");
  title.append(el("strong", null, `Şube ${s.no}`));
  if (mine) title.append(el("span", "mine-badge", "Sepette ✓"));
  info.append(title, el("div", "sec-meta", `👤 ${s.instructor}`), el("div", "sec-meta", `🕘 ${formatSlots(s)}`));

  const main = el("div", "sec-main");
  main.append(info, capacityBar(s));

  const actions = el("div", "sec-actions");
  const following = follows.has(s.id);
  if (mine) {
    actions.append(actionBtn("Sepetten çıkar", "btn-ghost", "remove", s.id));
    actions.append(actionBtn(following ? "🔔 Takipte ✓" : "Takip et", following ? "btn-following" : "btn-outline", "follow", s.id));
  } else if (!isFull(s)) {
    actions.append(actionBtn("Sepete ekle", "btn-success", "add", s.id));
    actions.append(actionBtn(following ? "🔔 Takipte ✓" : "Takip et", following ? "btn-following" : "btn-outline", "follow", s.id));
  } else {
    actions.append(actionBtn(following ? "🔔 Takipte ✓" : "🔔 Takip et", following ? "btn-following" : "btn-alarm", "follow", s.id));
    actions.append(myPosition(s)
      ? actionBtn("Listeden çık", "btn-ghost", "leave", s.id)
      : actionBtn("⏳ Bekleme listesine katıl", "btn-amber", "join", s.id));
  }
  actions.append(actionBtn("+ Yer aç (demo)", "btn-demo btn-sm", "open", s.id, {
    disabled: s.enrolled === 0,
    title: "Demo: bu şubede bir öğrenci dersi bırakmış gibi 1 yer açar"
  }));

  row.append(main, actions);

  if (!mine && !isFull(s)) {
    const clash = clashesWithBasket(s);
    if (clash.length) row.append(el("div", "clash-hint", `⚠ Sepetinizdeki ${clash.map(c => c.course.code).join(", ")} ile saat çakışması var`));
  }
  if (isFull(s) && !mine) row.append(waitlistInfo(s), alternativesBox(s, false));
  return row;
}

function courseMatches(c) {
  const term = searchTerm.trim().toLocaleLowerCase("tr");
  if (term && !`${c.code} ${c.name}`.toLocaleLowerCase("tr").includes(term)) return false;
  if (filter === "full") return c.sections.some(x => isFull(sections[x.id]));
  if (filter === "follow") return c.sections.some(x => follows.has(x.id));
  return true;
}

function renderCourses() {
  const matches = COURSES.filter(courseMatches);
  dom.courseList.replaceChildren();
  if (!matches.length) {
    dom.courseList.append(el("div", "card empty", filter === "follow" ? "Henüz takip ettiğiniz şube yok." : "Aramanıza uygun ders bulunamadı."));
    return;
  }

  matches.forEach(c => {
    const card = el("article", "card course");
    const head = el("header", "course-head");
    const meta = el("div", "course-meta");
    meta.append(el("span", "meta", `${c.ects} AKTS`), el("span", "meta", c.type));
    if (c.prereq) {
      const ok = prereqOk(c);
      meta.append(el("span", ok ? "meta ok" : "meta bad", `Önkoşul: ${c.prereq} ${ok ? "✓" : "✗"}`));
    }
    head.append(el("span", "course-code", c.code), el("h3", null, c.name), meta);
    card.append(head);
    c.sections.forEach(sec => card.append(sectionRow(sections[sec.id])));
    dom.courseList.append(card);
  });
}

/* ---------- Rendering: basket + timetable ---------- */
function renderBasket() {
  const v = validateBasket();
  const clashIds = new Set(v.clashes.flatMap(c => [c.a.id, c.b.id]));

  dom.basketList.replaceChildren();
  if (!v.items.length) {
    dom.basketList.append(el("li", "basket-empty", "Sepetiniz boş."));
  }
  v.items.forEach(s => {
    const bad = clashIds.has(s.id) || !prereqOk(s.course);
    const li = el("li", bad ? "bad" : null);
    const info = el("div", "b-info");
    info.append(el("strong", null, `${s.course.code} · Ş${s.no}`), el("span", null, `${s.course.name} · ${formatSlots(s)}`));
    const right = el("div", "sec-actions");
    const remove = actionBtn("×", "btn-ghost btn-icon", "remove", s.id, { title: "Sepetten çıkar" });
    remove.setAttribute("aria-label", `${label(s)} sepetten çıkar`);
    right.append(el("span", "b-ects", `${s.course.ects} AKTS`), remove);
    li.append(info, right);
    dom.basketList.append(li);
  });

  // AKTS meter
  dom.ectsMeter.replaceChildren();
  const top = el("div", "cap-top");
  top.append(el("span", null, "Toplam AKTS"), el("span", "cap-count", `${v.ects} / ${STUDENT.maxEcts}`));
  const bar = el("div", "bar");
  const fillCls = v.overLimit ? "fill-full" : v.underMin ? "fill-almost" : "fill-free";
  const fill = el("div", `bar-fill ${fillCls}`);
  fill.style.width = `${Math.min(100, (v.ects / STUDENT.maxEcts) * 100)}%`;
  bar.append(fill);
  dom.ectsMeter.append(top, bar, el("div", "ects-limit small", `Asgari ${STUDENT.minEcts} · Normal yük 30 · Azami ${STUDENT.maxEcts} AKTS`));

  // Warnings
  dom.basketWarnings.replaceChildren();
  const warn = (cls, text) => dom.basketWarnings.append(el("li", cls, text));
  v.clashes.forEach(c => warn("warn", `⚠ Ders saati çakışması: ${c.a.course.code} ve ${c.b.course.code} (${c.day})`));
  v.prereqMissing.forEach(s => warn("warn", `⚠ Önkoşul sağlanmadı: ${s.course.code} için ${s.course.prereq} dersini geçmiş olmalısınız`));
  if (v.overLimit) warn("warn", `⚠ AKTS sınırı aşıldı: ${v.ects} AKTS (azami ${STUDENT.maxEcts})`);
  if (v.underMin) warn("info", `ℹ Asgari yük ${STUDENT.minEcts} AKTS; şu an ${v.ects} AKTS`);
  if (!v.blocking) warn("good", "✓ Çakışma, AKTS ve önkoşul kontrolleri tamam");

  dom.submitBtn.disabled = v.blocking || regStatus !== "secim";
  dom.submitBtn.textContent = regStatus === "secim" ? "Danışman onayına gönder" : regStatus === "bekliyor" ? "Onay bekleniyor…" : "Onaylandı ✓";
}

function renderTimetable(tt) {
  tt.replaceChildren();
  tt.append(el("div", "tt-head", ""));
  DAYS.forEach(d => tt.append(el("div", "tt-head", d)));

  const times = el("div", "tt-times");
  for (let i = 0; i < DAY_HOURS; i++) {
    const m = DAY_START + i * 60;
    times.append(el("span", null, `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`));
  }
  tt.append(times);

  const items = [...basket].map(id => sections[id]);
  if (!items.length) {
    tt.append(el("div", "tt-empty", "Sepetinize ders ekleyince program burada görünür."));
    return;
  }
  const blocks = items.flatMap(s => s.slots.map(sl => ({ s, sl })));

  DAYS.forEach((d, day) => {
    const col = el("div", "tt-day");
    const dayBlocks = blocks.filter(b => b.sl.day === day).sort((a, b) => toMin(a.sl.start) - toMin(b.sl.start));
    dayBlocks.forEach((b, i) => {
      const overlapping = dayBlocks.filter(o => o !== b && slotsOverlap(o.sl, b.sl));
      const block = el("div", overlapping.length ? "tt-block clash" : "tt-block");
      const startH = (toMin(b.sl.start) - DAY_START) / 60;
      const lenH = (toMin(b.sl.end) - toMin(b.sl.start)) / 60;
      block.style.top = `calc(var(--row-h) * ${startH})`;
      block.style.height = `calc(var(--row-h) * ${lenH})`;
      if (overlapping.length) {
        const idx = dayBlocks.slice(0, i).filter(o => slotsOverlap(o.sl, b.sl)).length;
        block.style.left = idx ? "50%" : "2px";
        block.style.right = idx ? "2px" : "50%";
      }
      block.title = `${label(b.s)} · ${formatSlot(b.sl)}`;
      block.append(el("strong", null, b.s.course.code), el("span", null, `Ş${b.s.no}`));
      col.append(block);
    });
    tt.append(col);
  });
}

/* ---------- Rendering: Ana Sayfa, Ders Programı, log ---------- */
function infoCard(icon, title, rows, extra) {
  const card = el("article", "card info-card");
  card.append(el("h2", null, `${icon} ${title}`));
  const dl = el("dl");
  rows.forEach(([k, val]) => {
    const d = el("div");
    const dd = el("dd");
    dd.append(val);
    d.append(el("dt", null, k), dd);
    dl.append(d);
  });
  card.append(dl);
  if (extra) card.append(...extra);
  return card;
}

function renderHome() {
  const v = validateBasket();
  const hot = [...openedAlerts].filter(id => follows.has(id) && !isFull(sections[id]) && !basket.has(id)).length;

  const status = el("span");
  statusChip(status);
  status.classList.remove("js-status");
  const alarmText = follows.size
    ? `${follows.size} şube takipte${hot ? `, ${hot} tanesinde yer açıldı!` : ""}`
    : "Alarm kurulmadı";
  const go = el("a", hot ? "btn btn-success btn-glow" : "btn btn-primary", hot ? "Hemen kaydol →" : "Ders Kayıt'a git →");
  go.href = "#/ders-kayit";
  if (hot) go.dataset.scroll = "alarm";

  const gpaBar = el("div", "gpa-bar");
  const gpaFill = el("span");
  gpaFill.style.width = `${(STUDENT.gpaValue / 4) * 100}%`;
  gpaBar.append(gpaFill);

  const regCard = infoCard("📝", "Ders Kaydı", [
    ["Durum", status],
    ["Sepetteki AKTS", `${v.ects} / ${STUDENT.maxEcts}`],
    ["🔔 KontenjanAlarm", alarmText]
  ], [go]);
  if (hot) regCard.classList.add("highlight");

  dom.infoGrid.replaceChildren(
    infoCard("🪪", "Öğrenci Kimlik", [["Ad Soyad", STUDENT.name], ["Öğrenci No", STUDENT.no], ["E-posta", STUDENT.email]]),
    infoCard("🎓", "Program", [["Fakülte", "Mühendislik Fakültesi"], ["Bölüm", "Enerji Sistemleri Mühendisliği"], ["Derece", "Lisans"], ["Öğretim dili", "İngilizce"]]),
    infoCard("🗃️", "Kayıt Bilgileri", [["Kayıt tarihi", "Eylül 2022"], ["Kayıt türü", "ÖSYM"], ["Sınıf", "3"], ["Durum", "Aktif"]]),
    infoCard("⏱️", "Öğrenim Süresi", [["Normal süre", "4 yıl (8 yarıyıl)"], ["Bulunduğu yarıyıl", "5. yarıyıl"], ["Azami süre", "7 yıl"]]),
    regCard,
    infoCard("👩‍🏫", "Danışman", [["Ad Soyad", STUDENT.advisor], ["E-posta", STUDENT.advisorEmail], ["Görüşme saati", STUDENT.advisorHours]]),
    infoCard("📈", "Akademik Özet", [["GNO", `${STUDENT.gpa} / 4,00`], ["Tamamlanan AKTS", `${STUDENT.completedEcts} / 240`]], [gpaBar]),
    infoCard("ℹ️", "Ek Bilgiler", [["Azami AKTS (dönem)", `${STUDENT.maxEcts} AKTS`], ["Asgari AKTS (dönem)", `${STUDENT.minEcts} AKTS`], ["Hazırlık", "Muaf"]])
  );
}

function renderProgram() {
  renderTimetable(dom.timetablePage);
  const v = validateBasket();
  dom.programRows.replaceChildren();
  if (!v.items.length) {
    const tr = el("tr");
    const td = el("td", "muted", "Sepetiniz boş – Ders Kayıt'tan ders ekleyin.");
    td.colSpan = 6;
    tr.append(td);
    dom.programRows.append(tr);
    return;
  }
  v.items.forEach(s => {
    const tr = el("tr");
    [s.course.code, s.course.name, `Şube ${s.no}`, s.instructor, formatSlots(s), String(s.course.ects)]
      .forEach(text => tr.append(el("td", null, text)));
    dom.programRows.append(tr);
  });
  const total = el("tr");
  const totalLabel = el("td", null, "Toplam");
  totalLabel.colSpan = 5;
  total.append(totalLabel, el("td", null, `${v.ects} AKTS`));
  total.style.fontWeight = "700";
  dom.programRows.append(total);
}

function renderLog() {
  dom.simLog.replaceChildren();
  if (!logEntries.length) {
    dom.simLog.append(el("li", "log-empty", "Henüz bir değişiklik yok."));
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
  const scope = active && active.closest && active.closest("#alarm-list, #course-list, #basket-list");
  const focusKey = scope && active.dataset.action ? { scope: scope.id, action: active.dataset.action, id: active.dataset.id } : null;

  renderAlarmPanel();
  renderBadges();
  renderCourses();
  renderBasket();
  renderTimetable(dom.timetable);
  renderProgram();
  renderHome();
  renderLog();
  document.querySelectorAll(".js-status").forEach(statusChip);

  if (focusKey) {
    const target = $(focusKey.scope).querySelector(`[data-action="${focusKey.action}"][data-id="${focusKey.id}"]`);
    if (target) target.focus();
  }

  Object.values(sections).forEach(s => { prevPct[s.id] = Math.round((s.enrolled / s.capacity) * 100); });
  flashIds.clear();
}

/* ---------- Router + drawer ---------- */
function openDrawer() {
  dom.sidebar.classList.add("open");
  dom.drawerBackdrop.hidden = false;
  dom.menuBtn.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  dom.sidebar.classList.remove("open");
  dom.drawerBackdrop.hidden = true;
  dom.menuBtn.setAttribute("aria-expanded", "false");
}

function route() {
  const path = location.hash.replace(/^#\/?/, "");
  if (!loggedIn) {
    dom.app.hidden = true;
    dom.loginView.hidden = false;
    document.title = "Giriş · YaşarOBS";
    if (path !== "giris") history.replaceState(null, "", "#/giris");
    if (!dom.captchaQ.textContent) newCaptcha();
    return;
  }
  const r = ROUTES[path];
  if (!r) {
    history.replaceState(null, "", "#/ders-kayit");
    route();
    return;
  }
  dom.loginView.hidden = true;
  dom.app.hidden = false;
  document.querySelectorAll("[data-view]").forEach(v => { v.hidden = v.dataset.view !== r.view; });
  document.querySelectorAll("[data-nav]").forEach(a => {
    if (a.dataset.nav === path) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  dom.pageTitle.textContent = r.title;
  dom.breadcrumb.textContent = r.group === r.title ? `YaşarOBS › ${r.title}` : `YaşarOBS › ${r.group} › ${r.title}`;
  dom.placeholderTitle.textContent = r.title;
  document.title = `${r.title} · YaşarOBS`;
  closeDrawer();
  window.scrollTo(0, 0);
}

/* ---------- Login: demo captcha ---------- */
let captchaResult = null;

function newCaptcha() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 9);
  captchaResult = a + b;
  dom.captchaQ.textContent = `${a} + ${b} = ?`;
  dom.captchaAnswer.value = "";
}

/* ---------- Menu search ---------- */
function filterMenu() {
  const term = dom.menuSearch.value.trim().toLocaleLowerCase("tr");
  let any = false;
  document.querySelectorAll(".nav-group").forEach(group => {
    const groupHit = group.querySelector(".nav-title").textContent.toLocaleLowerCase("tr").includes(term);
    let visible = 0;
    group.querySelectorAll("a").forEach(a => {
      const hit = !term || groupHit || a.textContent.toLocaleLowerCase("tr").includes(term);
      a.hidden = !hit;
      if (hit) visible++;
    });
    group.hidden = visible === 0;
    if (visible) any = true;
  });
  dom.navEmpty.hidden = any;
}

function goToAlarm() {
  if (location.hash !== "#/ders-kayit") location.hash = "#/ders-kayit";
  setTimeout(() => dom.alarmPanel.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
}

function login(e) {
  e.preventDefault();
  ensureAudio();
  if (Number(dom.captchaAnswer.value.trim()) !== captchaResult || dom.captchaAnswer.value.trim() === "") {
    dom.captchaError.textContent = "Güvenlik sorusunun cevabı hatalı. Yeni soruyu cevaplayın.";
    dom.captchaError.hidden = false;
    newCaptcha();
    dom.captchaAnswer.focus();
    return;
  }
  dom.captchaError.hidden = true;
  loggedIn = true;
  store(STORAGE.session, true);
  newCaptcha();
  location.hash = "#/ders-kayit";
  route();
  toast(`Hoş geldiniz, ${STUDENT.name}! Ders seçimi açık.`, "success");
}

function logout() {
  loggedIn = false;
  store(STORAGE.session, false);
  stopSim();
  closeModal();
  location.hash = "#/giris";
  route();
}

/* ---------- Events ---------- */
document.addEventListener("click", e => {
  const scrollLink = e.target.closest("[data-scroll='alarm']");
  if (scrollLink) {
    e.preventDefault();
    goToAlarm();
    return;
  }
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const fn = ACTIONS[b.dataset.action];
  if (!fn) return;
  fn(b.dataset.id);
  commit();
});

document.querySelectorAll("[data-filter]").forEach(chip => chip.addEventListener("click", () => {
  filter = chip.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
  renderCourses();
}));

dom.loginForm.addEventListener("submit", login);
dom.captchaRefresh.addEventListener("click", () => { newCaptcha(); dom.captchaAnswer.focus(); });
dom.forgotLink.addEventListener("click", e => {
  e.preventDefault();
  toast("Şifremi unuttum özelliği demoda kullanılmamaktadır.", "info");
});
dom.menuSearch.addEventListener("input", filterMenu);
document.querySelectorAll("[data-lang]").forEach(btn => btn.addEventListener("click", () => {
  if (btn.dataset.lang === "en") toast("İngilizce arayüz demoda gösterilmemektedir.", "info");
}));
dom.logoutBtn.addEventListener("click", logout);
dom.menuBtn.addEventListener("click", () => (dom.sidebar.classList.contains("open") ? closeDrawer() : openDrawer()));
dom.drawerBackdrop.addEventListener("click", closeDrawer);
dom.bellBtn.addEventListener("click", goToAlarm);
dom.simBtn.addEventListener("click", toggleSim);
dom.resetBtn.addEventListener("click", resetAll);
dom.submitBtn.addEventListener("click", () => { submitToAdvisor(); commit(); });
dom.search.addEventListener("input", () => {
  searchTerm = dom.search.value;
  renderCourses();
});
window.addEventListener("hashchange", route);

if ("Notification" in window) dom.notifyBtn.addEventListener("click", requestNotifications);

dom.modal.addEventListener("click", e => { if (e.target === dom.modal) closeModal(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!dom.modal.hidden) closeModal();
  else closeDrawer();
});

// Browsers only allow sound after a user gesture, so unlock audio on the first interaction.
["pointerdown", "keydown"].forEach(type => document.addEventListener(type, ensureAudio, { once: true }));

/* ---------- Init ---------- */
loadState();
if (regStatus === "bekliyor") scheduleApproval();
updateNotifyButton();
updateSimControls();
render();
route();
