/* =====================================================================
   Công cụ tư vấn website F&B — JavaScript thuần, chạy hoàn toàn trên trình duyệt.
   Dữ liệu lưu bằng localStorage của trình duyệt/thiết bị hiện tại (không có cloud).
   ===================================================================== */
(function () {
'use strict';

/* ---------- Hằng số ---------- */
var KEYS = { config: 'fbpitch.config.v1', plans: 'fbpitch.plans.v1', current: 'fbpitch.current.v1' };
var APP_ID = 'fbpitch';
var DATA_VERSION = 1;
var STEPS = [
  { short: 'Nhu cầu', title: 'Tìm hiểu nhu cầu & hiện trạng' },
  { short: 'Phân tích', title: 'Mở trang thực tế để phân tích' },
  { short: 'Giải pháp', title: 'Phương án & công việc cụ thể' },
  { short: 'Báo giá', title: 'Báo giá các gói website' },
  { short: 'Triển khai', title: 'Quy trình & thanh toán' },
  { short: 'Tổng kết', title: 'Tổng kết & chốt gói' }
];
var LINK_GROUPS = [
  { id: 'cweb', title: 'Website của khách hàng' },
  { id: 'cfan', title: 'Fanpage của khách hàng' },
  { id: 'demo', title: 'Website / Fanpage mẫu đã triển khai' },
  { id: 'other', title: 'Liên kết khác (Google Maps, TikTok…)' }
];
var TASK_GROUPS = [
  { id: 'web', title: 'A. Công việc thuộc gói thiết kế website', badge: 'Nằm trong giá gói', cls: 'ok',
    sub: 'Những việc cụ thể khách nhận được khi làm website.' },
  { id: 'addon', title: 'B. Dịch vụ bổ trợ (khách chọn thêm)', badge: 'Tính riêng', cls: 'warn',
    sub: 'Không tự cộng vào giá website. Chỉ tính vào tổng khi bạn bật “Tính vào tổng”.' },
  { id: 'third', title: 'C. Chi phí bên thứ ba (chưa gồm)', badge: 'Chưa bao gồm', cls: 'gray',
    sub: 'Tên miền, hosting… là khoản chi phí riêng, tư vấn và xác nhận theo nhu cầu.' }
];
var PRESENCE = [
  { id: 'website', label: 'Website' }, { id: 'fanpage', label: 'Fanpage' },
  { id: 'maps', label: 'Google Maps' }, { id: 'tiktok', label: 'TikTok' }
];
var PRESENCE_STATUS = ['Chưa có', 'Đang có', 'Có nhưng chưa hiệu quả'];

/* ---------- Tiện ích ---------- */
function uid(p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 2000) : (typeof v === 'number' && isFinite(v) ? String(v) : ''); }
function num(v, min, max, def) {
  var n = typeof v === 'number' ? v : parseFloat(v);
  if (!isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}
function bool(v, def) { return typeof v === 'boolean' ? v : def; }
function list(v, max) { return Array.isArray(v) ? v.slice(0, max || 200) : []; }
function strList(v, max) { return list(v, max || 100).map(function (x) { return str(x, 500).trim(); }).filter(Boolean); }
function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
var fmt = new Intl.NumberFormat('vi-VN');
function money(n) { return fmt.format(Math.round(Number(n) || 0)) + ' đ'; }
function pctText(n) { return (Math.round(n * 100) / 100).toString().replace('.', ',') + '%'; }
function dateText(ts) {
  try { return new Date(ts).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return ''; }
}
function normalizeUrl(u) {
  u = (u || '').trim();
  if (!u) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
  try {
    var x = new URL(u);
    return (x.protocol === 'http:' || x.protocol === 'https:') ? x.href : '';
  } catch (e) { return ''; }
}

/* ---------- Dữ liệu demo mặc định ---------- */
function T(group, name, desc, qty, freq, time, note, price) {
  return { id: uid('t'), group: group, name: name, desc: desc, qty: qty, freq: freq, time: time, note: note,
    price: price || 0, enabled: true, counted: false };
}
function defaultCatalog() {
  return {
    packages: [
      { id: 'pk_basic', name: 'Phổ thông', price: 8000000, duration: "Dự kiến 10–14 ngày làm việc kể từ khi nhận đủ nội dung",
        desc: "Website giới thiệu quán gọn gàng, đủ thông tin để khách tìm và liên hệ.", featured: false,
        includes: ["Thiết kế giao diện theo nhận diện thương hiệu của quán", "Tối đa 5 trang: Trang chủ, Giới thiệu, Thực đơn, Liên hệ, Tin tức/Khuyến mãi",
          "Hiển thị tốt trên điện thoại và máy tính bảng", "Nút gọi điện, Zalo và chỉ đường Google Maps", "Form đặt bàn gửi về email của quán", "1 buổi hướng dẫn cập nhật nội dung"],
        limits: ["Thực đơn nhập sẵn tối đa 30 món", "1 ngôn ngữ (tiếng Việt)", "Tối đa 2 lần chỉnh sửa giao diện", "Chưa gồm chụp ảnh, quay video"] },
      { id: 'pk_plus', name: 'Ưa thích', price: 10000000, duration: "Dự kiến 14–20 ngày làm việc kể từ khi nhận đủ nội dung",
        desc: "Website đầy đủ để quảng bá menu, hình ảnh và nhận đặt bàn chuyên nghiệp.", featured: true,
        includes: ["Toàn bộ hạng mục của gói Phổ thông", "Tối đa 8 trang, thêm thư viện ảnh/không gian quán", "Thực đơn có phân loại, hình món và giá",
          "Gắn Fanpage / khung chat Messenger", "Cài Google Analytics và Google Search Console", "Hỗ trợ cập nhật menu, thông tin liên hệ trong 1 tháng sau bàn giao"],
        limits: ["Thực đơn nhập sẵn tối đa 60 món", "1 ngôn ngữ (tiếng Việt)", "Tối đa 3 lần chỉnh sửa giao diện", "Ảnh do khách cung cấp hoặc mua thêm gói chụp ảnh"] },
      { id: 'pk_vip', name: 'VIP', price: 12000000, duration: "Dự kiến 20–28 ngày làm việc kể từ khi nhận đủ nội dung",
        desc: "Website cao cấp cho thương hiệu nhiều chi nhánh hoặc cần trải nghiệm riêng biệt.", featured: false,
        includes: ["Toàn bộ hạng mục của gói Ưa thích", "Tối đa 12 trang, có trang riêng cho từng chi nhánh", "Thiết kế banner đầu trang riêng theo chiến dịch",
          "Giao diện 2 ngôn ngữ (Việt – Anh)", "Hỗ trợ cập nhật menu, thông tin liên hệ trong 3 tháng sau bàn giao", "1 buổi đào tạo quản trị website cho nhân viên quán"],
        limits: ["Thực đơn nhập sẵn tối đa 120 món", "Tối đa 5 lần chỉnh sửa giao diện", "Nội dung bản tiếng Anh do khách cung cấp hoặc báo giá riêng"] }
    ],
    tasks: [
      T('web', "Họp thống nhất sơ đồ trang", "Chốt các trang cần có, nội dung từng trang và chức năng chính của website.", "1 bản sơ đồ trang", "1 lần", "1–2 ngày", ""),
      T('web', "Thiết kế giao diện theo nhận diện thương hiệu", "Dùng logo, màu sắc, hình ảnh của quán để thiết kế trang chủ và các trang con.", "1 mẫu trang chủ + các trang con theo gói", "Chỉnh sửa theo số lần của gói", "3–5 ngày", "Khách duyệt bản thiết kế trước khi lập trình."),
      T('web', "Lập trình các trang theo phạm vi gói", "Dựng website hoàn chỉnh, chạy được trên trình duyệt phổ biến.", "Theo số trang của gói đã chọn", "", "5–10 ngày", ""),
      T('web', "Tối ưu hiển thị trên điện thoại", "Kiểm tra và chỉnh bố cục cho điện thoại, máy tính bảng.", "Điện thoại + máy tính bảng + máy tính", "", "Trong giai đoạn lập trình", ""),
      T('web', "Nhập thực đơn, hình ảnh và thông tin liên hệ", "Nhập nội dung do khách cung cấp: món, giá, giờ mở cửa, địa chỉ, bản đồ.", "Theo giới hạn món của gói", "1 lần khi dựng website", "2–3 ngày", "Khách cung cấp đủ nội dung mới tính thời gian."),
      T('web', "Gắn nút gọi điện, Zalo và chỉ đường", "Khách xem trên điện thoại bấm một lần để gọi, nhắn Zalo hoặc mở Google Maps.", "3 nút liên hệ nhanh", "", "", ""),
      T('web', "Bàn giao và hướng dẫn cập nhật nội dung", "Hướng dẫn nhân viên quán tự sửa thực đơn, hình ảnh, thông tin liên hệ.", "1 buổi hướng dẫn (online hoặc trực tiếp)", "1 lần", "Khi bàn giao", ""),
      T('web', "Hỗ trợ cập nhật menu và thông tin liên hệ", "Hỗ trợ chỉnh sửa nội dung khi quán đổi menu, giá, giờ mở cửa.", "Theo thỏa thuận", "Theo yêu cầu của quán", "Theo gói đã chọn (ví dụ: 1 tháng)", "Ghi rõ số lượt chỉnh sửa nếu có giới hạn."),
      T('addon', "Chăm sóc Fanpage Facebook", "Tạo nhóm làm việc, lên nội dung, gửi khách duyệt trước khi đăng, đăng bài theo lịch.", "Khoảng 2–3 bài mỗi tuần", "Hằng tuần", "3 tháng đầu", "Ví dụ minh họa. Chỉnh theo phạm vi đã thống nhất với khách. Giá demo.", 4500000),
      T('addon', "Tối ưu hồ sơ Google Maps", "Cập nhật tên, giờ mở cửa, ảnh, danh mục, liên kết website cho hồ sơ Google Maps của quán.", "1 hồ sơ", "1 lần", "3–5 ngày", "Giá demo.", 1500000),
      T('addon', "Thiết lập kênh TikTok", "Tạo và hoàn thiện hồ sơ TikTok, hướng dẫn nội dung cơ bản.", "1 kênh", "1 lần", "3–5 ngày", "Chưa gồm quay dựng video. Giá demo.", 2000000),
      T('addon', "Chụp ảnh món ăn và không gian", "Chụp tại quán, chỉnh sửa cơ bản và bàn giao file.", "1 buổi, khoảng 20 ảnh đã chỉnh", "1 lần", "Hẹn lịch theo quán", "Giá demo.", 2500000),
      T('addon', "Quay video giới thiệu quán", "Quay và dựng 1 video ngắn dùng cho website và mạng xã hội.", "1 video 30–60 giây", "1 lần", "5–7 ngày sau buổi quay", "Giá demo.", 3500000),
      T('third', "Tên miền (domain)", "Khoản phí đăng ký và gia hạn tên miền. Tư vấn chọn tên và xác nhận theo nhu cầu của khách.", "", "Gia hạn hằng năm", "", "Chi phí riêng, trả cho nhà cung cấp. Chưa gồm trong giá gói."),
      T('third', "Hosting (lưu trữ website)", "Khoản phí thuê lưu trữ website. Tư vấn cấu hình phù hợp và xác nhận theo nhu cầu của khách.", "", "Gia hạn hằng năm", "", "Chi phí riêng, trả cho nhà cung cấp. Chưa gồm trong giá gói.")
    ],
    process: [
      { id: 'st1', name: "Xác nhận triển khai", work: "Thống nhất phạm vi và gói, xác nhận hợp đồng, họp chốt sơ đồ trang.", provide: "Logo, tên thương hiệu, thông tin người đầu mối duyệt nội dung.", deliverable: "Hợp đồng đã xác nhận và sơ đồ trang.", time: "1–2 ngày", payId: 'pay1', enabled: true },
      { id: 'st2', name: "Thu thập nội dung", work: "Hướng dẫn khách chuẩn bị nội dung, nhận và sắp xếp tài liệu.", provide: "Thực đơn và giá, hình ảnh món/không gian, giới thiệu quán, giờ mở cửa, địa chỉ, số điện thoại, Zalo.", deliverable: "Danh sách nội dung đã nhận đủ.", time: "Tùy tốc độ khách chuẩn bị", payId: '', enabled: true },
      { id: 'st3', name: "Thiết kế giao diện", work: "Thiết kế trang chủ và các trang con theo nhận diện thương hiệu của quán.", provide: "Phản hồi, duyệt bản thiết kế.", deliverable: "Bản thiết kế để khách duyệt.", time: "3–5 ngày làm việc", payId: '', enabled: true },
      { id: 'st4', name: "Lập trình và nhập nội dung", work: "Dựng website, nhập thực đơn, hình ảnh, thông tin liên hệ, kiểm tra trên điện thoại.", provide: "Bổ sung nội dung còn thiếu nếu có.", deliverable: "Website bản chạy thử để khách xem.", time: "5–10 ngày làm việc", payId: 'pay2', enabled: true },
      { id: 'st5', name: "Chỉnh sửa và kiểm tra", work: "Chỉnh sửa theo góp ý, trong số lần của gói. Kiểm tra liên kết, form, tốc độ.", provide: "Gộp góp ý thành một danh sách cho mỗi lần chỉnh sửa.", deliverable: "Bản website đã chỉnh sửa.", time: "2–4 ngày làm việc", payId: '', enabled: true },
      { id: 'st6', name: "Nghiệm thu và bàn giao", work: "Gắn tên miền, bàn giao tài khoản quản trị, hướng dẫn cập nhật nội dung.", provide: "Xác nhận nghiệm thu.", deliverable: "Website chính thức hoạt động, tài khoản quản trị, hướng dẫn sử dụng.", time: "1–2 ngày", payId: 'pay3', enabled: true }
    ],
    payment: [
      { id: 'pay1', label: "Đợt 1", pct: 50, milestone: "Khi xác nhận triển khai" },
      { id: 'pay2', label: "Đợt 2", pct: 30, milestone: "Khi khách duyệt bản thiết kế / có bản chạy thử" },
      { id: 'pay3', label: "Đợt 3", pct: 20, milestone: "Khi nghiệm thu và bàn giao" }
    ],
    terms: [
      "Giá gói chưa bao gồm tên miền, hosting và các chi phí bên thứ ba.",
      "Dịch vụ bổ trợ (Fanpage, Google Maps, TikTok, chụp ảnh, quay video) tính riêng, chỉ thực hiện khi khách đồng ý.",
      "Phạm vi công việc theo gói đã chọn. Hạng mục ngoài phạm vi được báo giá riêng trước khi thực hiện.",
      "Thời gian tính từ lúc khách cung cấp đủ nội dung. Khách chậm cung cấp hoặc phản hồi thì tiến độ lùi tương ứng."
    ],
    confirmations: [
      "Tên miền mong muốn",
      "Nhà cung cấp hosting hoặc nhờ tư vấn",
      "Người đầu mối duyệt nội dung và thiết kế",
      "Thời điểm khách muốn website hoạt động",
      "Hình thức thanh toán các đợt"
    ]
  };
}
function defaultConfig() {
  return {
    brand: { name: "Web F&B Studio", logoText: "W", logoUrl: "" },
    title: "Giải pháp website cho nhà hàng, quán cà phê",
    intro: "Buổi tư vấn hôm nay: tìm hiểu quán, phân tích hiện trạng, đề xuất phương án cụ thể và chốt gói website phù hợp.",
    options: {
      models: ["Nhà hàng", "Quán ăn", "Quán cà phê", "Quán nhậu", "Tiệm bánh", "Chuỗi / thương hiệu ẩm thực", "Khác"],
      goals: ["Tăng nhận diện thương hiệu", "Tăng khách đặt bàn", "Nhận đơn mang đi / giao hàng", "Quảng bá thực đơn", "Xây dựng hình ảnh chuyên nghiệp", "Được tìm thấy trên Google"],
      problems: ["Khách khó tìm thấy quán trên mạng", "Chưa có nơi giới thiệu thực đơn rõ ràng", "Hình ảnh thương hiệu chưa đồng bộ", "Phụ thuộc vào Fanpage / app giao hàng", "Đặt bàn qua tin nhắn mất thời gian", "Fanpage ít tương tác"]
    },
    linkTemplates: [
      { group: 'cweb', label: "Website hiện tại của khách", url: "" },
      { group: 'cfan', label: "Fanpage của khách", url: "" },
      { group: 'demo', label: "Website mẫu đã làm", url: "" },
      { group: 'demo', label: "Fanpage mẫu đã làm", url: "" },
      { group: 'other', label: "Google Maps", url: "https://www.google.com/maps" },
      { group: 'other', label: "TikTok của khách", url: "" }
    ],
    catalog: defaultCatalog()
  };
}

/* ---------- Làm sạch / kiểm tra dữ liệu (dùng khi tải và khi nhập JSON) ---------- */
function uniqueIds(items) {
  var seen = {};
  items.forEach(function (it) { if (!it.id || seen[it.id]) it.id = uid('i'); seen[it.id] = 1; });
  return items;
}
function sanTask(t) {
  t = isObj(t) ? t : {};
  var g = ['web', 'addon', 'third'].indexOf(t.group) >= 0 ? t.group : 'web';
  return { id: str(t.id, 60) || uid('t'), group: g, name: str(t.name, 200), desc: str(t.desc, 1000), qty: str(t.qty, 300),
    freq: str(t.freq, 300), time: str(t.time, 300), note: str(t.note, 1000), price: num(t.price, 0, 1e11, 0),
    enabled: bool(t.enabled, true), counted: bool(t.counted, false) };
}
function sanPackage(p) {
  p = isObj(p) ? p : {};
  return { id: str(p.id, 60) || uid('pk'), name: str(p.name, 100), price: num(p.price, 0, 1e11, 0), duration: str(p.duration, 300),
    desc: str(p.desc, 1000), featured: bool(p.featured, false), includes: strList(p.includes), limits: strList(p.limits) };
}
function sanStage(s) {
  s = isObj(s) ? s : {};
  return { id: str(s.id, 60) || uid('st'), name: str(s.name, 200), work: str(s.work, 1500), provide: str(s.provide, 1500),
    deliverable: str(s.deliverable, 1500), time: str(s.time, 300), payId: str(s.payId, 60), enabled: bool(s.enabled, true) };
}
function sanPayment(p) {
  p = isObj(p) ? p : {};
  return { id: str(p.id, 60) || uid('pay'), label: str(p.label, 100), pct: num(p.pct, 0, 100, 0), milestone: str(p.milestone, 500) };
}
function sanCatalog(c) {
  if (!isObj(c)) throw new Error('Thiếu phần danh mục (gói, công việc, quy trình, thanh toán).');
  var out = {
    packages: uniqueIds(list(c.packages).map(sanPackage)),
    tasks: uniqueIds(list(c.tasks, 300).map(sanTask)),
    process: uniqueIds(list(c.process).map(sanStage)),
    payment: uniqueIds(list(c.payment, 20).map(sanPayment)),
    terms: strList(c.terms), confirmations: strList(c.confirmations)
  };
  var payIds = out.payment.map(function (p) { return p.id; });
  out.process.forEach(function (s) { if (payIds.indexOf(s.payId) < 0) s.payId = ''; });
  return out;
}
function sanLink(l) {
  l = isObj(l) ? l : {};
  var g = LINK_GROUPS.some(function (x) { return x.id === l.group; }) ? l.group : 'other';
  return { id: str(l.id, 60) || uid('l'), group: g, label: str(l.label, 200), url: str(l.url, 800) };
}
function sanConfig(c) {
  if (!isObj(c)) throw new Error('Cấu hình không hợp lệ.');
  var d = defaultConfig();
  var b = isObj(c.brand) ? c.brand : {};
  var o = isObj(c.options) ? c.options : {};
  return {
    brand: { name: str(b.name, 100) || d.brand.name, logoText: str(b.logoText, 4), logoUrl: str(b.logoUrl, 800) },
    title: str(c.title, 200), intro: str(c.intro, 1000),
    options: { models: strList(o.models, 30), goals: strList(o.goals, 30), problems: strList(o.problems, 30) },
    linkTemplates: uniqueIds(list(c.linkTemplates, 30).map(sanLink)),
    catalog: sanCatalog(c.catalog || d.catalog)
  };
}
function sanPlan(p) {
  if (!isObj(p)) throw new Error('Phương án không hợp lệ.');
  var cu = isObj(p.customer) ? p.customer : {};
  var n = isObj(p.needs) ? p.needs : {};
  var pr = isObj(n.presence) ? n.presence : {};
  var presence = {};
  PRESENCE.forEach(function (x) {
    var v = isObj(pr[x.id]) ? pr[x.id] : {};
    presence[x.id] = { status: PRESENCE_STATUS.indexOf(v.status) >= 0 ? v.status : '', note: str(v.note, 500) };
  });
  var cat = sanCatalog(p.catalog);
  var sel = str(p.selectedPackageId, 60);
  if (!cat.packages.some(function (x) { return x.id === sel; })) sel = '';
  var now = Date.now();
  return {
    id: str(p.id, 60) || uid('plan'), name: str(p.name, 150) || 'Phương án', nameAuto: bool(p.nameAuto, false),
    createdAt: num(p.createdAt, 0, 8.64e15, now), updatedAt: num(p.updatedAt, 0, 8.64e15, now),
    step: Math.round(num(p.step, 0, STEPS.length - 1, 0)),
    customer: { name: str(cu.name, 200), contact: str(cu.contact, 200), phone: str(cu.phone, 60), area: str(cu.area, 300) },
    needs: { model: str(n.model, 200), goals: strList(n.goals, 30), problems: strList(n.problems, 30), problemNote: str(n.problemNote, 2000),
      result: str(n.result, 2000), note: str(n.note, 3000), presence: presence },
    links: uniqueIds(list(p.links, 60).map(sanLink)),
    selectedPackageId: sel, catalog: cat
  };
}

/* ---------- Trạng thái & lưu trữ ---------- */
var S = { config: null, plans: {}, currentId: null, storageBad: false, scope: 'config', tab: 'brand', settings: null };

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { S.storageBad = true; return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { S.storageBad = true; return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { S.storageBad = true; } }

function newPlan(name, fromConfig) {
  var cfg = fromConfig || S.config;
  var now = Date.now();
  var presence = {};
  PRESENCE.forEach(function (x) { presence[x.id] = { status: '', note: '' }; });
  return {
    id: uid('plan'), name: name || 'Phương án mới', nameAuto: !name, createdAt: now, updatedAt: now, step: 0,
    customer: { name: '', contact: '', phone: '', area: '' },
    needs: { model: '', goals: [], problems: [], problemNote: '', result: '', note: '', presence: presence },
    links: clone(cfg.linkTemplates).map(function (l) { l.id = uid('l'); return l; }),
    selectedPackageId: '', catalog: clone(cfg.catalog)
  };
}
function cur() { return S.plans[S.currentId]; }

function loadAll() {
  var cfg = null;
  try { var raw = lsGet(KEYS.config); if (raw) cfg = sanConfig(JSON.parse(raw)); } catch (e) { cfg = null; }
  S.config = cfg || defaultConfig();
  S.plans = {};
  try {
    var rp = lsGet(KEYS.plans);
    if (rp) {
      var obj = JSON.parse(rp);
      Object.keys(obj).forEach(function (k) {
        try { var p = sanPlan(obj[k]); S.plans[p.id] = p; } catch (e) { /* bỏ qua phương án hỏng */ }
      });
    }
  } catch (e) { S.plans = {}; }
  var cid = lsGet(KEYS.current);
  if (!cid || !S.plans[cid]) cid = Object.keys(S.plans).sort(function (a, b) { return S.plans[b].updatedAt - S.plans[a].updatedAt; })[0];
  if (!cid) { var p0 = newPlan(); S.plans[p0.id] = p0; cid = p0.id; }
  S.currentId = cid;
}
var saveTimer = null, warned = false;
function saveNow() {
  clearTimeout(saveTimer); saveTimer = null;
  var ok = lsSet(KEYS.config, JSON.stringify(S.config)) &&
    lsSet(KEYS.plans, JSON.stringify(S.plans)) && lsSet(KEYS.current, S.currentId || '');
  if (!ok && !warned) { warned = true; toast('Không lưu được vào trình duyệt (bộ nhớ đầy hoặc bị chặn). Hãy xuất JSON để giữ dữ liệu.'); }
  return ok;
}
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 200); }
function touch() { var p = cur(); if (p) p.updatedAt = Date.now(); save(); }
window.addEventListener('beforeunload', function () { if (saveTimer) saveNow(); });

/* ---------- Tính toán tiền ---------- */
function sumBy(arr, fn) { return arr.reduce(function (s, x) { return s + (Number(fn(x)) || 0); }, 0); }
function installments(price, pay) {
  var rows = pay.map(function (x) { return { pay: x, amount: Math.round(price * x.pct / 100) }; });
  var totalPct = sumBy(pay, function (x) { return x.pct; });
  if (rows.length && Math.abs(totalPct - 100) < 0.0001) {
    var s = sumBy(rows.slice(0, -1), function (r) { return r.amount; });
    rows[rows.length - 1].amount = price - s;
  }
  return rows;
}
function calc(p) {
  var c = p.catalog;
  var pkg = c.packages.filter(function (x) { return x.id === p.selectedPackageId; })[0] || null;
  var addonsOn = c.tasks.filter(function (t) { return t.group === 'addon' && t.enabled; });
  var addonsCounted = addonsOn.filter(function (t) { return t.counted; });
  var pkgPrice = pkg ? pkg.price : 0;
  var addonTotal = sumBy(addonsCounted, function (t) { return t.price; });
  var totalPct = sumBy(c.payment, function (x) { return x.pct; });
  return {
    pkg: pkg, pkgPrice: pkgPrice,
    web: c.tasks.filter(function (t) { return t.group === 'web' && t.enabled; }),
    addonsOn: addonsOn, addonsCounted: addonsCounted, addonTotal: addonTotal,
    addonsNotCounted: addonsOn.filter(function (t) { return !t.counted; }),
    third: c.tasks.filter(function (t) { return t.group === 'third' && t.enabled; }),
    total: pkgPrice + addonTotal, totalPct: totalPct, pctOk: Math.abs(totalPct - 100) < 0.0001,
    inst: installments(pkgPrice, c.payment)
  };
}

/* ---------- Tạo DOM an toàn (luôn dùng textContent, không innerHTML với dữ liệu người dùng) ---------- */
function append(e, c) {
  if (c === null || c === undefined || c === false) return;
  if (Array.isArray(c)) { c.forEach(function (x) { append(e, x); }); return; }
  e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
}
function h(tag, props) {
  var e = document.createElement(tag), later = null;
  props = props || {};
  Object.keys(props).forEach(function (k) {
    var v = props[k];
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') later = v;
    else if (k === 'checked' || k === 'disabled' || k === 'selected') e[k] = true;
    else e.setAttribute(k, v === true ? '' : String(v));
  });
  for (var i = 2; i < arguments.length; i++) append(e, arguments[i]);
  if (later !== null) e.value = later;
  return e;
}
var ICONS = {
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6z|M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  up: 'M18 15l-6-6-6 6', down: 'M6 9l6 6 6-6',
  edit: 'M12 20h9|M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18|M8 6V4h8v2|M19 6l-1 14H6L5 6', plus: 'M12 5v14|M5 12h14',
  ext: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6|M15 3h6v6|M10 14L21 3',
  full: 'M8 3H5a2 2 0 00-2 2v3|M21 8V5a2 2 0 00-2-2h-3|M3 16v3a2 2 0 002 2h3|M16 21h3a2 2 0 002-2v-3',
  print: 'M6 9V2h12v7|M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2|M6 14h12v8H6z',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4|M7 10l5 5 5-5|M12 15V3',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4|M17 8l-5-5-5 5|M12 3v12',
  folder: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
  copy: 'M9 9h11v11H9z|M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1',
  save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z|M17 21v-8H7v8|M7 3v5h8',
  left: 'M19 12H5|M12 19l-7-7 7-7', right: 'M5 12h14|M12 5l7 7-7 7', x: 'M18 6L6 18|M6 6l12 12',
  swap: 'M7 16V4|M3 8l4-4 4 4|M17 8v12|M21 16l-4 4-4-4', check: 'M20 6L9 17l-5-5'
};
function icon(name, size) {
  var s = size || 18, span = h('span', { class: 'icon', 'aria-hidden': 'true' });
  // Chuỗi SVG cố định trong mã nguồn, không chứa dữ liệu người dùng.
  span.innerHTML = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    ICONS[name].split('|').map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</svg>';
  return span;
}
function iconBtn(name, title, fn, extra) {
  return h('button', { type: 'button', class: 'icon-btn ' + (extra || ''), title: title, 'aria-label': title, onClick: fn }, icon(name, 17));
}
function btn(label, cls, fn, iconName) {
  return h('button', { type: 'button', class: 'btn ' + (cls || ''), onClick: fn }, iconName ? icon(iconName, 17) : null, label);
}

/* ---------- Thông báo ngắn ---------- */
function toast(msg) {
  var root = document.getElementById('toast-root');
  var t = h('div', { class: 'toast', text: msg });
  root.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
}

/* ---------- Modal (xếp chồng được) ---------- */
var modalStack = [];
function openModal(opts) {
  var root = document.getElementById('modal-root');
  var body = h('div', { class: 'modal-body' });
  var foot = h('div', { class: 'modal-foot' });
  var m = { opts: opts, body: body, foot: foot };
  m.close = function () {
    var i = modalStack.indexOf(m);
    if (i < 0) return;
    modalStack.splice(i, 1);
    if (m.overlay.parentNode) m.overlay.parentNode.removeChild(m.overlay);
    if (!modalStack.length) document.body.classList.remove('modal-open');
    if (opts.onClose) opts.onClose();
  };
  var head = h('div', { class: 'modal-head' }, h('h2', { text: opts.title || '' }), iconBtn('x', 'Đóng', m.close));
  var box = h('div', { class: 'modal' + (opts.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' }, head, body, opts.footer === false ? null : foot);
  m.overlay = h('div', { class: 'overlay', onMousedown: function (e) { if (e.target === m.overlay && !opts.sticky) m.close(); } }, box);
  root.appendChild(m.overlay);
  document.body.classList.add('modal-open');
  modalStack.push(m);
  if (opts.render) opts.render(m);
  var first = body.querySelector('input[type=text],input[type=number],textarea,select');
  if (first && !opts.noFocus) first.focus();
  return m;
}
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && modalStack.length) modalStack[modalStack.length - 1].close();
});
function confirmDialog(message, okLabel, danger, onOk) {
  openModal({
    title: 'Xác nhận', sticky: true, noFocus: true,
    render: function (m) {
      m.body.appendChild(h('p', { class: 'pre', text: message }));
      m.foot.appendChild(btn('Hủy', '', m.close));
      m.foot.appendChild(btn(okLabel || 'Đồng ý', danger ? 'btn-danger solid' : 'btn-primary', function () { m.close(); onOk(); }));
    }
  });
}
/* Form chỉnh sửa tổng quát. fields: {key,label,type:text|textarea|number|select|checkbox|lines,options,hint,required} */
function formModal(title, fields, values, onSave) {
  openModal({
    title: title,
    render: function (m) {
      var inputs = {};
      var err = h('div', { class: 'form-error', style: 'display:none' });
      var form = h('form', { class: 'form', onSubmit: function (e) { e.preventDefault(); submit(); } });
      fields.forEach(function (f) {
        var el, v = values[f.key];
        if (f.type === 'textarea' || f.type === 'lines') el = h('textarea', { rows: f.rows || (f.type === 'lines' ? 5 : 3), value: f.type === 'lines' ? (v || []).join('\n') : (v || '') });
        else if (f.type === 'select') el = h('select', { value: v || '' }, f.options.map(function (o) { return h('option', { value: o.v, text: o.t }); }));
        else if (f.type === 'checkbox') el = h('input', { type: 'checkbox', checked: !!v });
        else if (f.type === 'number') el = h('input', { type: 'number', min: '0', step: f.step || '1', value: v === undefined ? '' : v });
        else el = h('input', { type: 'text', value: v || '' });
        inputs[f.key] = el;
        if (f.type === 'checkbox') form.appendChild(h('label', { class: 'check-row' }, el, f.label));
        else form.appendChild(h('label', { class: 'field' }, h('span', { class: 'lbl', text: f.label }), el, f.hint ? h('span', { class: 'hint', text: f.hint }) : null));
      });
      form.appendChild(err);
      form.appendChild(h('button', { type: 'submit', style: 'display:none' }));
      m.body.appendChild(form);
      function submit() {
        var out = {}, bad = '';
        fields.forEach(function (f) {
          var el = inputs[f.key];
          if (f.type === 'checkbox') out[f.key] = el.checked;
          else if (f.type === 'number') out[f.key] = el.value === '' ? 0 : parseFloat(el.value);
          else if (f.type === 'lines') out[f.key] = el.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
          else out[f.key] = el.value.trim();
          if (f.required && !out[f.key] && !bad) bad = 'Vui lòng nhập: ' + f.label;
          if (f.type === 'number' && !isFinite(out[f.key]) && !bad) bad = 'Giá trị số không hợp lệ: ' + f.label;
        });
        if (!bad && onSave) bad = onSave(out) || '';
        if (bad) { err.textContent = bad; err.style.display = ''; return; }
        m.close();
      }
      m.foot.appendChild(btn('Hủy', '', m.close));
      m.foot.appendChild(btn('Lưu', 'btn-primary', submit));
    }
  });
}

/* ---------- Ô nhập gắn trực tiếp vào dữ liệu ---------- */
function bindInput(obj, key, attrs, after) {
  var el = h('input', Object.assign({ type: 'text', value: obj[key] || '' }, attrs || {}));
  el.addEventListener('input', function () { obj[key] = el.value; if (after) after(el.value); touch(); });
  return el;
}
function bindArea(obj, key, attrs, after) {
  var el = h('textarea', Object.assign({ value: obj[key] || '' }, attrs || {}));
  el.addEventListener('input', function () { obj[key] = el.value; if (after) after(el.value); touch(); });
  return el;
}
function field(label, el, hint) {
  return h('label', { class: 'field' }, h('span', { class: 'lbl', text: label }), el, hint ? h('span', { class: 'hint', text: hint }) : null);
}
function card(title, sub, children) {
  var c = h('section', { class: 'card' });
  if (title) c.appendChild(h('h3', { text: title }));
  if (sub) c.appendChild(h('p', { class: 'card-sub', text: sub }));
  for (var i = 2; i < arguments.length; i++) append(c, arguments[i]);
  return c;
}
function chipsSingle(obj, key, options) {
  var wrap = h('div', { class: 'chipgroup' }), chips = h('div', { class: 'chips' });
  function draw() {
    chips.textContent = '';
    options.concat(obj[key] && options.indexOf(obj[key]) < 0 ? [obj[key]] : []).forEach(function (o) {
      chips.appendChild(h('button', { type: 'button', class: 'chip' + (obj[key] === o ? ' on' : ''), 'aria-pressed': obj[key] === o ? 'true' : 'false',
        onClick: function () { obj[key] = obj[key] === o ? '' : o; touch(); draw(); } }, o));
    });
  }
  draw(); wrap.appendChild(chips);
  var add = h('input', { type: 'text', class: 'chip-add', placeholder: 'Khác… (gõ rồi Enter)' });
  add.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); if (add.value.trim()) { obj[key] = add.value.trim().slice(0, 200); add.value = ''; touch(); draw(); } } });
  wrap.appendChild(add);
  return wrap;
}
function chipsMulti(arr, options, onChange) {
  var wrap = h('div', { class: 'chipgroup' }), chips = h('div', { class: 'chips' });
  function draw() {
    chips.textContent = '';
    options.concat(arr.filter(function (x) { return options.indexOf(x) < 0; })).forEach(function (o) {
      var on = arr.indexOf(o) >= 0;
      chips.appendChild(h('button', { type: 'button', class: 'chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false',
        onClick: function () { var i = arr.indexOf(o); if (i >= 0) arr.splice(i, 1); else arr.push(o); touch(); draw(); } }, o));
    });
  }
  draw(); wrap.appendChild(chips);
  var add = h('input', { type: 'text', class: 'chip-add', placeholder: 'Thêm ý khác… (gõ rồi Enter)' });
  add.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var v = add.value.trim().slice(0, 200); if (v && arr.indexOf(v) < 0) { arr.push(v); add.value = ''; touch(); draw(); } } });
  wrap.appendChild(add);
  return wrap;
}
function switchEl(checked, onChange, label) {
  var inp = h('input', { type: 'checkbox', checked: !!checked, 'aria-label': label || 'Bật/tắt' });
  inp.addEventListener('change', function () { onChange(inp.checked); });
  return h('label', { class: 'switch', title: label || '' }, inp, h('span', { class: 'slider' }));
}

/* ---------- Chỉnh sửa danh mục dùng chung (màn hình + cài đặt) ---------- */
function changed(target) {
  if (S.config && target === S.config.catalog) save(); else touch();
  render(true);
  refreshSettings();
}
function payOptions(cat) {
  return [{ v: '', t: 'Không gắn khoản thanh toán' }].concat(cat.payment.map(function (p) { return { v: p.id, t: p.label + ' (' + pctText(p.pct) + ')' }; }));
}
var KINDS = {
  tasks: { title: 'công việc', san: sanTask,
    blank: function (g) { return sanTask({ group: g || 'web', enabled: true }); },
    fields: function () { return [
      { key: 'group', label: 'Nhóm dịch vụ', type: 'select', options: TASK_GROUPS.map(function (g) { return { v: g.id, t: g.title }; }) },
      { key: 'name', label: 'Tên công việc', type: 'text', required: true },
      { key: 'desc', label: 'Mô tả', type: 'textarea' },
      { key: 'qty', label: 'Số lượng', type: 'text' }, { key: 'freq', label: 'Tần suất', type: 'text' },
      { key: 'time', label: 'Thời gian thực hiện', type: 'text' }, { key: 'note', label: 'Ghi chú', type: 'textarea', rows: 2 },
      { key: 'price', label: 'Giá bổ trợ (VNĐ, chỉ cho dịch vụ bổ trợ)', type: 'number', step: '1000', hint: 'Giá riêng, không cộng vào giá gói website.' },
      { key: 'enabled', label: 'Đang bật (đưa vào phương án)', type: 'checkbox' },
      { key: 'counted', label: 'Tính vào tổng (chỉ dịch vụ bổ trợ khách đã chọn)', type: 'checkbox' }
    ]; } },
  packages: { title: 'gói website', san: sanPackage,
    blank: function () { return sanPackage({ name: '', price: 0 }); },
    fields: function () { return [
      { key: 'name', label: 'Tên gói', type: 'text', required: true },
      { key: 'price', label: 'Giá (VNĐ)', type: 'number', step: '1000' },
      { key: 'duration', label: 'Thời gian dự kiến', type: 'text' },
      { key: 'desc', label: 'Mô tả ngắn', type: 'textarea', rows: 2 },
      { key: 'includes', label: 'Hạng mục bao gồm (mỗi dòng một mục)', type: 'lines', rows: 7 },
      { key: 'limits', label: 'Giới hạn / phạm vi cụ thể (mỗi dòng một mục)', type: 'lines', rows: 5 },
      { key: 'featured', label: 'Làm nổi bật gói này', type: 'checkbox' }
    ]; } },
  process: { title: 'giai đoạn', san: sanStage,
    blank: function () { return sanStage({ enabled: true }); },
    fields: function (cat) { return [
      { key: 'name', label: 'Giai đoạn', type: 'text', required: true },
      { key: 'work', label: 'Công việc thực hiện', type: 'textarea' },
      { key: 'provide', label: 'Thông tin / tài liệu khách cần cung cấp', type: 'textarea' },
      { key: 'deliverable', label: 'Kết quả / mốc bàn giao', type: 'textarea', rows: 2 },
      { key: 'time', label: 'Thời gian dự kiến', type: 'text' },
      { key: 'payId', label: 'Khoản thanh toán tương ứng', type: 'select', options: payOptions(cat) },
      { key: 'enabled', label: 'Đang bật', type: 'checkbox' }
    ]; } },
  payment: { title: 'đợt thanh toán', san: sanPayment,
    blank: function () { return sanPayment({ label: 'Đợt mới', pct: 0 }); },
    fields: function () { return [
      { key: 'label', label: 'Tên đợt', type: 'text', required: true },
      { key: 'pct', label: 'Tỷ lệ (%)', type: 'number', step: '0.5' },
      { key: 'milestone', label: 'Mốc thanh toán', type: 'text' }
    ]; } }
};
function editItem(kind, target, item, isNew) {
  var K = KINDS[kind];
  formModal((isNew ? 'Thêm ' : 'Sửa ') + K.title, K.fields(target, item), item, function (vals) {
    var clean = K.san(Object.assign({}, item, vals));
    Object.assign(item, clean);
    if (isNew) target[kind].push(item);
    changed(target);
  });
}
function addItem(kind, target, group) { editItem(kind, target, KINDS[kind].blank(group), true); }
function moveItem(target, kind, item, d) {
  var a = target[kind], i = a.indexOf(item), j = i + d;
  if (kind === 'tasks') while (j >= 0 && j < a.length && a[j].group !== item.group) j += d;
  if (i < 0 || j < 0 || j >= a.length) return;
  a.splice(i, 1); a.splice(j, 0, item);
  changed(target);
}
function deleteItem(kind, target, item) {
  var name = item.name || item.label || 'mục này';
  confirmDialog('Xóa ' + KINDS[kind].title + ' “' + name + '”?', 'Xóa', true, function () {
    var a = target[kind], i = a.indexOf(item);
    if (i >= 0) a.splice(i, 1);
    var p = cur();
    if (kind === 'packages' && p && target === p.catalog && p.selectedPackageId === item.id) p.selectedPackageId = '';
    if (kind === 'payment') target.process.forEach(function (s) { if (s.payId === item.id) s.payId = ''; });
    changed(target);
  });
}
function rowTools(kind, target, item) {
  return h('div', { class: 'row-actions' },
    iconBtn('up', 'Lên', function () { moveItem(target, kind, item, -1); }),
    iconBtn('down', 'Xuống', function () { moveItem(target, kind, item, 1); }),
    iconBtn('edit', 'Sửa', function () { editItem(kind, target, item, false); }),
    iconBtn('trash', 'Xóa', function () { deleteItem(kind, target, item); }, 'danger'));
}

/* ---------- Khung hiển thị ---------- */
var LEADS = [
  function () { return S.config.intro; },
  function () { return 'Mở website, Fanpage của khách hoặc trang mẫu ở tab mới để giải thích trực tiếp. Màn hình tư vấn này vẫn được giữ nguyên.'; },
  function () { return 'Những việc cụ thể khách nhận được. Bật/tắt từng việc ngay trong buổi tư vấn, chỉ việc đang bật mới vào phương án.'; },
  function () { return 'Website là dịch vụ chính. So sánh ba gói và chọn gói phù hợp với quán.'; },
  function () { return 'Quy trình theo giai đoạn và số tiền từng đợt thanh toán, tự tính theo gói đang chọn.'; },
  function () { return 'Rà soát phương án cùng khách trước khi chốt.'; }
];
function screenHead(i) {
  return h('div', { class: 'screen-head no-print' },
    h('span', { class: 'eyebrow', text: 'Bước ' + (i + 1) + ' / ' + STEPS.length }),
    h('h1', { text: STEPS[i].title }), h('p', { class: 'lead', text: LEADS[i]() }));
}
function renderHeader() {
  var p = cur(), b = S.config.brand, hd = document.getElementById('app-header');
  hd.textContent = '';
  var logoUrl = normalizeUrl(b.logoUrl);
  var logo = logoUrl ? h('img', { class: 'logo-img', src: logoUrl, alt: '' }) : h('div', { class: 'logo-box', text: b.logoText || (b.name || 'W').charAt(0).toUpperCase() });
  var chip = h('button', { type: 'button', class: 'plan-chip', title: 'Quản lý phương án khách hàng', onClick: openPlans },
    icon('folder', 16), h('span', { class: 't', id: 'plan-chip-text', text: p.name }));
  hd.appendChild(h('div', { class: 'hd-top' },
    h('div', { class: 'brand' }, logo, h('div', { class: 'brand-text' }, h('strong', { text: b.name }), h('span', { text: S.config.title }))),
    h('div', { class: 'hd-actions' }, chip,
      iconBtn('full', 'Toàn màn hình (trình chiếu)', toggleFullscreen),
      iconBtn('gear', 'Cài đặt', function () { openSettings(); }, 'gear'))));
  var ol = h('ol', { class: 'stepper' });
  STEPS.forEach(function (s, i) {
    ol.appendChild(h('li', { class: 'step' + (i === p.step ? ' active' : (i < p.step ? ' done' : '')) },
      h('button', { type: 'button', class: 'step-btn', 'aria-current': i === p.step ? 'step' : null, onClick: function () { goStep(i); } },
        h('span', { class: 'step-num', text: i < p.step ? '✓' : String(i + 1) }), h('span', { class: 'step-label', text: s.short }))));
  });
  hd.appendChild(ol);
  hd.appendChild(h('div', { class: 'progress' }, h('div', { class: 'progress-bar', style: 'width:' + Math.round((p.step + 1) / STEPS.length * 100) + '%' })));
}
function renderFooter() {
  var p = cur(), f = document.getElementById('app-footer');
  f.textContent = '';
  f.appendChild(btn('Quay lại', '', function () { goStep(p.step - 1); }, 'left')).disabled = p.step === 0;
  f.appendChild(h('div', { class: 'foot-mid' }, h('strong', { text: STEPS[p.step].short }), h('span', { class: 'muted', text: 'Bước ' + (p.step + 1) + '/' + STEPS.length + ' · ←/→ để chuyển bước' })));
  if (p.step < STEPS.length - 1) f.appendChild(btn('Tiếp theo', 'btn-primary', function () { goStep(p.step + 1); }, 'right'));
  else f.appendChild(btn('Lưu phương án', 'btn-blue', savePlan, 'save'));
}
function renderScreen(keep) {
  var p = cur(), main = document.getElementById('screen');
  main.textContent = '';
  var inner = h('div', { class: 'screen-inner', style: keep ? 'animation:none' : null }, screenHead(p.step), SCREENS[p.step](p));
  main.appendChild(inner);
}
function render(keep) {
  var y = window.scrollY;
  renderHeader(); renderScreen(keep); renderFooter();
  document.title = (cur().customer.name ? cur().customer.name + ' · ' : '') + 'Tư vấn website F&B';
  if (keep) window.scrollTo(0, y);
}
function goStep(i) {
  var p = cur();
  if (i < 0 || i >= STEPS.length) return;
  p.step = i; touch(); render(false); window.scrollTo(0, 0);
}
function savePlan() {
  var p = cur(); p.updatedAt = Date.now();
  var ok = saveNow();
  toast(ok ? 'Đã lưu “' + p.name + '” trong trình duyệt này (không đồng bộ lên cloud).' : 'Chưa lưu được vào trình duyệt. Hãy xuất JSON để giữ dữ liệu.');
}
function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    else toast('Trình duyệt này không hỗ trợ toàn màn hình.');
  } catch (e) { toast('Không bật được toàn màn hình.'); }
}

/* ---------- MÀN 1: Nhu cầu & hiện trạng ---------- */
function screenNeeds(p) {
  var c = p.customer, n = p.needs, o = S.config.options;
  var nameInput = bindInput(c, 'name', { placeholder: 'Ví dụ: Quán Cà Phê Góc Phố' }, function (v) {
    if (p.nameAuto) { p.name = v.trim() || 'Phương án mới'; var t = document.getElementById('plan-chip-text'); if (t) t.textContent = p.name; }
  });
  var presence = h('div');
  PRESENCE.forEach(function (x) {
    var pr = n.presence[x.id], chips = h('div', { class: 'chips' });
    function draw() {
      chips.textContent = '';
      PRESENCE_STATUS.forEach(function (s) {
        chips.appendChild(h('button', { type: 'button', class: 'chip' + (pr.status === s ? ' on' : ''), 'aria-pressed': pr.status === s ? 'true' : 'false',
          onClick: function () { pr.status = pr.status === s ? '' : s; touch(); draw(); } }, s));
      });
    }
    draw();
    presence.appendChild(h('div', { class: 'presence-row' }, h('strong', { text: x.label }),
      h('div', {}, chips, bindInput(pr, 'note', { placeholder: 'Ghi chú ngắn (link, số theo dõi, tình trạng…)', class: 'chip-add', style: 'max-width:none' }))));
  });
  var left = h('div', { class: 'stack' },
    card('Thông tin khách hàng', 'Điền nhanh, có thể để trống.', h('div', { class: 'fields' },
      field('Tên quán / thương hiệu', nameInput),
      field('Người liên hệ', bindInput(c, 'contact')), field('Số điện thoại / Zalo', bindInput(c, 'phone')),
      field('Khu vực / địa chỉ', bindInput(c, 'area')))),
    card('Mô hình kinh doanh', 'Khách đang kinh doanh mô hình F&B nào?', chipsSingle(n, 'model', o.models)),
    card('Hiện trạng kênh online', 'Khách đã có những kênh nào?', presence));
  var right = h('div', { class: 'stack' },
    card('Khách muốn gì?', 'Chọn nhanh một hoặc nhiều mục.', chipsMulti(n.goals, o.goals)),
    card('Vấn đề lớn nhất hiện nay', null, chipsMulti(n.problems, o.problems),
      h('div', { style: 'margin-top:12px' }, field('Ghi thêm bằng lời của khách', bindArea(n, 'problemNote', { rows: 3 })))),
    card('Kết quả khách muốn đạt sau triển khai', null, bindArea(n, 'result', { rows: 3, placeholder: 'Ví dụ: có 20 lượt đặt bàn/tuần qua website…' })),
    card('Ghi chú buổi tư vấn', null, bindArea(n, 'note', { rows: 3 })));
  return h('div', { class: 'grid g2' }, left, right);
}

/* ---------- MÀN 2: Mở trang thực tế ---------- */
function screenLinks(p) {
  var cards = h('div');
  function drawCards() {
    cards.textContent = '';
    LINK_GROUPS.forEach(function (g) {
      var items = p.links.filter(function (l) { return l.group === g.id; });
      var shown = items.filter(function (l) { return normalizeUrl(l.url); });
      var box = h('div', { class: 'link-group' }, h('h3', { text: g.title }));
      if (!shown.length) box.appendChild(h('div', { class: 'empty', text: 'Chưa có liên kết. Thêm URL ở phần chỉnh sửa bên dưới, nút sẽ tự hiện.' }));
      else {
        var grid = h('div', { class: 'links' });
        shown.forEach(function (l) {
          var url = normalizeUrl(l.url);
          grid.appendChild(h('a', { class: 'linkcard', href: url, target: '_blank', rel: 'noopener noreferrer' },
            h('span', {}, h('span', { class: 'lt', text: l.label || url }), h('span', { class: 'lh', text: url })), icon('ext', 20)));
        });
        box.appendChild(grid);
      }
      cards.appendChild(box);
    });
  }
  drawCards();
  var rows = h('div');
  function drawRows() {
    rows.textContent = '';
    p.links.forEach(function (l) {
      var lab = h('input', { type: 'text', value: l.label, placeholder: 'Tên nút' });
      var url = h('input', { type: 'text', value: l.url, placeholder: 'https://… (để trống để ẩn nút)' });
      lab.addEventListener('input', function () { l.label = lab.value; touch(); drawCards(); });
      url.addEventListener('input', function () { l.url = url.value; url.classList.toggle('invalid', !!url.value.trim() && !normalizeUrl(url.value)); touch(); drawCards(); });
      var sel = h('select', { value: l.group }, LINK_GROUPS.map(function (g) { return h('option', { value: g.id, text: g.title }); }));
      sel.addEventListener('change', function () { l.group = sel.value; touch(); drawCards(); });
      rows.appendChild(h('div', { class: 'link-edit' }, lab, url, sel,
        iconBtn('trash', 'Xóa liên kết', function () { p.links.splice(p.links.indexOf(l), 1); touch(); drawRows(); drawCards(); }, 'danger')));
    });
  }
  drawRows();
  var tip = h('div', { class: 'backtip' },
    h('strong', { text: 'Cách quay lại màn hình tư vấn' }),
    h('ul', {},
      h('li', {}, 'Liên kết luôn mở ở tab mới. Màn hình tư vấn này vẫn đang mở ở tab trước đó.'),
      h('li', {}, 'Xem xong, đóng tab vừa mở bằng ', h('kbd', { text: 'Ctrl + W' }), ' (Mac: ', h('kbd', { text: '⌘ + W' }), ') hoặc bấm vào tab “Tư vấn website F&B” trên thanh tab.'),
      h('li', {}, 'Nếu đang trình chiếu toàn màn hình, thoát bằng ', h('kbd', { text: 'Esc' }), ' trước khi chuyển tab.')));
  var edit = card('Chỉnh sửa liên kết cho khách này', 'Sửa tên nút và URL. Nếu chưa có URL, nút sẽ tự ẩn. Chỉ nhận liên kết http/https.', rows,
    h('div', { class: 'toolbar', style: 'margin:10px 0 0' },
      btn('Thêm liên kết', '', function () { p.links.push({ id: uid('l'), group: 'other', label: '', url: '' }); touch(); drawRows(); }, 'plus')));
  return h('div', {}, tip, cards, edit);
}

/* ---------- MÀN 3: Giải pháp & công việc ---------- */
function screenTasks(p) {
  var c = p.catalog, k = calc(p);
  var stats = h('div', { class: 'stats' },
    h('div', { class: 'stat' }, h('div', { class: 'n', text: String(k.web.length) }), h('div', { class: 'l', text: 'Công việc website đang bật' })),
    h('div', { class: 'stat' }, h('div', { class: 'n', text: String(k.addonsCounted.length) + '/' + k.addonsOn.length }), h('div', { class: 'l', text: 'Dịch vụ bổ trợ đã chọn / đang bật' })),
    h('div', { class: 'stat' }, h('div', { class: 'n', text: money(k.addonTotal) }), h('div', { class: 'l', text: 'Giá dịch vụ bổ trợ đã chọn (tính riêng)' })));
  var out = h('div', {}, stats);
  TASK_GROUPS.forEach(function (g) {
    var items = c.tasks.filter(function (t) { return t.group === g.id; });
    var box = h('div', { class: 'task-group' },
      h('h3', {}, g.title, h('span', { class: 'badge ' + g.cls, text: g.badge })), h('p', { class: 'card-sub', text: g.sub }));
    if (!items.length) box.appendChild(h('div', { class: 'empty', text: 'Chưa có mục nào trong nhóm này.' }));
    items.forEach(function (t) {
      var meta = h('div', { class: 'meta' });
      [['Số lượng', t.qty], ['Tần suất', t.freq], ['Thời gian', t.time]].forEach(function (m) {
        if (m[1]) meta.appendChild(h('span', {}, h('b', { text: m[0] + ': ' }), m[1]));
      });
      var priceCol = h('div', { class: 'task-price' });
      if (g.id === 'addon') {
        priceCol.appendChild(h('span', { text: t.price ? money(t.price) : 'Chưa nhập giá' }));
        priceCol.appendChild(h('small', { text: t.counted ? 'Đã tính vào tổng' : 'Chưa tính vào tổng' }));
        priceCol.appendChild(h('div', { style: 'margin-top:6px;display:flex;justify-content:flex-end;gap:8px;align-items:center' },
          h('small', { text: 'Tính vào tổng' }), switchEl(t.counted, function (v) { t.counted = v; touch(); render(true); }, 'Tính vào tổng')));
      } else priceCol.appendChild(h('small', { text: g.id === 'web' ? 'Trong giá gói' : 'Chi phí riêng' }));
      box.appendChild(h('div', { class: 'task' + (t.enabled ? '' : ' off') },
        switchEl(t.enabled, function (v) { t.enabled = v; touch(); render(true); }, 'Bật/tắt công việc'),
        h('div', { class: 'task-main' }, h('div', { class: 'task-name', text: t.name || '(chưa đặt tên)' }),
          t.desc ? h('p', { text: t.desc }) : null, meta, t.note ? h('p', { class: 'note', text: 'Ghi chú: ' + t.note }) : null),
        priceCol, rowTools('tasks', c, t)));
    });
    box.appendChild(btn('Thêm vào nhóm này', 'btn-sm', function () { addItem('tasks', c, g.id); }, 'plus'));
    out.appendChild(box);
  });
  return out;
}

/* ---------- MÀN 4: Báo giá gói website ---------- */
function screenPackages(p) {
  var c = p.catalog, k = calc(p);
  var grid = h('div', { class: 'grid g3', style: 'margin-top:14px' });
  c.packages.forEach(function (pkg) {
    var sel = p.selectedPackageId === pkg.id;
    var cta = h('div', { class: 'pkg-cta' },
      btn(sel ? 'Đang chọn: bấm để bỏ chọn' : 'Chọn gói ' + pkg.name, sel ? 'btn-primary' : 'btn-blue btn-lg', function () {
        p.selectedPackageId = sel ? '' : pkg.id; touch(); render(true);
      }, sel ? 'check' : null),
      h('div', { class: 'pkg-tools' },
        iconBtn('left', 'Sang trái', function () { moveItem(c, 'packages', pkg, -1); }),
        iconBtn('right', 'Sang phải', function () { moveItem(c, 'packages', pkg, 1); }),
        iconBtn('edit', 'Sửa gói', function () { editItem('packages', c, pkg, false); }),
        iconBtn('trash', 'Xóa gói', function () { deleteItem('packages', c, pkg); }, 'danger')));
    grid.appendChild(h('article', { class: 'pkg' + (pkg.featured ? ' featured' : '') + (sel ? ' selected' : '') },
      pkg.featured ? h('span', { class: 'tag', text: 'Nhiều khách chọn' }) : null,
      sel ? h('span', { class: 'tag sel', text: 'Đang cân nhắc' }) : null,
      h('h3', { text: pkg.name }), h('div', { class: 'price', text: money(pkg.price) }),
      h('div', { class: 'dur', text: pkg.duration }), pkg.desc ? h('p', { class: 'desc', text: pkg.desc }) : null,
      h('h4', { text: 'Bao gồm' }), h('ul', {}, pkg.includes.map(function (x) { return h('li', { class: 'inc', text: x }); })),
      pkg.limits.length ? [h('h4', { text: 'Giới hạn / phạm vi' }), h('ul', {}, pkg.limits.map(function (x) { return h('li', { class: 'lim', text: x }); }))] : null,
      cta));
  });
  var bar;
  if (k.pkg) bar = h('div', { class: 'choice-bar' },
    h('div', { class: 'cb-main' }, h('span', { text: 'Khách đang cân nhắc:' }), h('strong', { text: 'Gói ' + k.pkg.name }), h('span', { class: 'cb-price', text: money(k.pkg.price) })),
    h('div', { style: 'display:flex;gap:8px' }, btn('Bỏ chọn', '', function () { p.selectedPackageId = ''; touch(); render(true); }),
      btn('Xem thanh toán', 'light', function () { goStep(4); }, 'right')));
  else bar = h('div', { class: 'choice-bar none' }, h('span', { text: 'Chưa chọn gói. Hỏi khách đang quan tâm gói nào rồi bấm “Chọn gói”.' }));
  return h('div', {},
    h('div', { class: 'toolbar', style: 'margin-bottom:0' }, btn('Thêm gói', '', function () { addItem('packages', c); }, 'plus')),
    grid, bar,
    h('div', { class: 'note-box' }, h('strong', { text: 'Chưa bao gồm trong giá gói: ' }),
      'tên miền và hosting là khoản chi phí riêng, sẽ tư vấn và xác nhận theo nhu cầu. Fanpage, Google Maps, TikTok, chụp ảnh, quay video là dịch vụ bổ trợ, tính riêng và chỉ khi khách chọn.'));
}

/* ---------- MÀN 5: Quy trình & thanh toán ---------- */
function screenPay(p) {
  var c = p.catalog, k = calc(p);
  var wrap = h('div', { class: 'stack' });
  if (k.pkg) wrap.appendChild(h('div', { class: 'pkg-banner' },
    h('div', {}, h('span', { class: 'muted', text: 'Gói đang cân nhắc' }), h('strong', { text: 'Gói ' + k.pkg.name })),
    h('div', { class: 'big', text: money(k.pkg.price) }), btn('Đổi gói', '', function () { goStep(3); }, 'swap')));
  else wrap.appendChild(h('div', { class: 'pkg-banner empty' },
    h('div', {}, h('strong', { text: 'Chưa chọn gói website' }), h('span', { class: 'muted', style: 'color:inherit', text: 'Chọn gói để xem số tiền từng đợt.' })),
    btn('Chọn gói', '', function () { goStep(3); })));

  var amountEls = [], totalPctEl = h('span'), totalAmtEl = h('span', { class: 'amount' }), alertBox = h('div');
  var stagesBox = h('div', { class: 'timeline' });
  function updateDerived() {
    var kk = calc(p);
    kk.inst.forEach(function (r, i) { if (amountEls[i]) amountEls[i].textContent = kk.pkg ? money(r.amount) : '—'; });
    totalPctEl.textContent = pctText(kk.totalPct);
    totalAmtEl.textContent = kk.pkg ? money(sumBy(kk.inst, function (r) { return r.amount; })) : '—';
    alertBox.textContent = '';
    if (!kk.pctOk) alertBox.appendChild(h('div', { class: 'alert danger', text: 'Cảnh báo: tổng tỷ lệ là ' + pctText(kk.totalPct) + ', chưa bằng 100%. Hãy chỉnh lại các đợt.' }));
    else alertBox.appendChild(h('div', { class: 'alert ok', text: 'Tổng tỷ lệ bằng 100%.' }));
    drawStages();
  }
  function drawStages() {
    var kk = calc(p);
    stagesBox.textContent = '';
    c.process.forEach(function (s, i) {
      var pr = kk.inst.filter(function (r) { return r.pay.id === s.payId; })[0];
      var cardEl = h('div', { class: 'stage-card', style: s.enabled ? null : 'opacity:.5' },
        h('div', { class: 'stage-head' }, h('h4', { text: s.name || '(chưa đặt tên)' }),
          h('div', { style: 'display:flex;align-items:center;gap:6px' }, switchEl(s.enabled, function (v) { s.enabled = v; touch(); render(true); }, 'Bật/tắt giai đoạn'), rowTools('process', c, s))),
        h('div', { class: 'stage-grid' },
          h('div', {}, h('h5', { text: 'Công việc thực hiện' }), h('p', { text: s.work || '—' })),
          h('div', {}, h('h5', { text: 'Khách cần cung cấp' }), h('p', { text: s.provide || '—' })),
          h('div', {}, h('h5', { text: 'Kết quả / mốc bàn giao' }), h('p', { text: s.deliverable || '—' })),
          h('div', {}, h('h5', { text: 'Thời gian dự kiến' }), h('p', { text: s.time || '—' }))),
        pr ? h('div', { class: 'pay-chip' }, h('span', { text: 'Thanh toán ' + pr.pay.label + ' (' + pctText(pr.pay.pct) + '):' }), h('strong', { text: kk.pkg ? money(pr.amount) : 'chọn gói để tính' })) : null);
      stagesBox.appendChild(h('div', { class: 'stage' }, h('div', { class: 'stage-num', text: String(i + 1) }), cardEl));
    });
    if (!c.process.length) stagesBox.appendChild(h('div', { class: 'empty', text: 'Chưa có giai đoạn nào.' }));
  }
  var table = h('div', { class: 'pay-table' },
    h('div', { class: 'pay-row pay-head' }, h('span', { text: 'Đợt' }), h('span', { text: 'Mốc thanh toán' }), h('span', { text: 'Tỷ lệ %' }), h('span', { class: 'amount', text: 'Số tiền', style: 'font-size:12.5px;color:inherit;font-weight:700' }), h('span')));
  c.payment.forEach(function (pay, i) {
    var amt = h('span', { class: 'amount' }); amountEls[i] = amt;
    var pct = h('input', { type: 'number', min: '0', max: '100', step: '0.5', value: pay.pct, 'aria-label': 'Tỷ lệ %' });
    pct.addEventListener('input', function () { pay.pct = num(pct.value, 0, 100, 0); touch(); updateDerived(); });
    table.appendChild(h('div', { class: 'pay-row' }, bindInput(pay, 'label'), bindInput(pay, 'milestone', { placeholder: 'Mốc thanh toán' }),
      h('div', { class: 'pct-wrap' }, pct, h('span', { text: '%' })), amt, iconBtn('trash', 'Xóa đợt', function () { deleteItem('payment', c, pay); }, 'danger')));
  });
  table.appendChild(h('div', { class: 'pay-row pay-total' }, h('strong', { text: 'Tổng' }), h('span'), h('strong', {}, totalPctEl), totalAmtEl, h('span')));
  var payCard = card('Lịch thanh toán theo gói đã chọn', 'Tiền từng đợt tự tính từ giá gói website × tỷ lệ. Dịch vụ bổ trợ và chi phí bên thứ ba không nằm trong lịch này.',
    table, h('div', { style: 'margin-top:12px' }, alertBox),
    h('div', { class: 'toolbar', style: 'margin:12px 0 0' }, btn('Thêm đợt', '', function () { addItem('payment', c); }, 'plus')));
  wrap.appendChild(payCard);
  wrap.appendChild(h('div', {}, h('div', { class: 'toolbar', style: 'margin-bottom:6px' }, h('h3', { text: 'Quy trình triển khai', style: 'font-size:20px' }), h('span', { class: 'spacer' }),
    btn('Thêm giai đoạn', '', function () { addItem('process', c); }, 'plus')),
    h('p', { class: 'card-sub', text: 'Thời gian chỉ là dự kiến, phụ thuộc việc khách cung cấp nội dung và phản hồi. Có thể chỉnh từng giai đoạn.' }), stagesBox));
  updateDerived();
  return wrap;
}

/* ---------- MÀN 6: Tổng kết ---------- */
function slug(s) {
  return (s || 'khach').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'khach';
}
function ymd() { var d = new Date(); return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }
function downloadJson(name, obj) {
  var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = h('a', { href: url, download: name });
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 500);
}
function exportPlan() {
  var p = cur();
  downloadJson('phuong-an-' + slug(p.customer.name || p.name) + '-' + ymd() + '.json',
    { app: APP_ID, version: DATA_VERSION, type: 'plan', exportedAt: new Date().toISOString(), plan: p });
  toast('Đã xuất phương án ra tệp JSON.');
}
function printPlan() {
  if (cur().step !== STEPS.length - 1) goStep(STEPS.length - 1);
  setTimeout(function () { window.print(); }, 150);
}
function screenSummary(p) {
  var c = p.catalog, k = calc(p), cu = p.customer, n = p.needs, b = S.config.brand;
  function kvRows(rows) {
    var dl = h('dl', { class: 'kv' }), any = false;
    rows.forEach(function (r) { if (r[1]) { any = true; dl.appendChild(h('dt', { text: r[0] })); dl.appendChild(h('dd', { text: r[1] })); } });
    return any ? dl : h('p', { class: 'muted', text: 'Chưa nhập.' });
  }
  function section(title, content) { return h('section', {}, h('h3', { text: title }), content); }
  function ul(items) { return h('ul', { class: 'plain-list' }, items.map(function (x) { return h('li', { text: x }); })); }
  function table(head, rows, rightCols) {
    return h('table', {}, h('thead', {}, h('tr', {}, head.map(function (t, i) { return h('th', { class: rightCols.indexOf(i) >= 0 ? 'r' : '', text: t }); }))),
      h('tbody', {}, rows.map(function (r) { return h('tr', {}, r.map(function (cell, i) { return h('td', { class: rightCols.indexOf(i) >= 0 ? 'r' : '' }, cell); })); })));
  }
  function nameCell(t) { return [h('strong', { text: t.name }), t.desc ? h('span', { class: 'sm', text: t.desc }) : null, t.note ? h('span', { class: 'sm', text: 'Ghi chú: ' + t.note }) : null]; }
  function det(t) { return [t.qty, t.freq, t.time].filter(Boolean).join(' · ') || '—'; }

  var doc = h('article', { class: 'doc' });
  doc.appendChild(h('div', { class: 'doc-head' },
    h('div', {}, h('h2', { text: 'Phương án thiết kế website' }), h('div', { class: 'sub', text: b.name + ' · ' + new Date().toLocaleDateString('vi-VN') })),
    h('div', { style: 'text-align:right' }, h('strong', { text: cu.name || p.name }), cu.contact ? h('div', { class: 'sub', text: cu.contact + (cu.phone ? ' · ' + cu.phone : '') }) : null)));
  doc.appendChild(section('Thông tin khách hàng', kvRows([
    ['Tên quán / thương hiệu', cu.name], ['Người liên hệ', cu.contact], ['Điện thoại / Zalo', cu.phone], ['Khu vực', cu.area],
    ['Mô hình', n.model], ['Mục tiêu', n.goals.join('; ')], ['Vấn đề hiện tại', n.problems.concat(n.problemNote ? [n.problemNote] : []).join('; ')],
    ['Kết quả mong muốn', n.result]])));
  if (k.pkg) {
    doc.appendChild(section('Gói website đang chọn', h('div', {},
      kvRows([['Gói', k.pkg.name], ['Giá gói', money(k.pkg.price)], ['Thời gian dự kiến', k.pkg.duration]]),
      k.pkg.includes.length ? h('div', { style: 'margin-top:10px' }, h('strong', { text: 'Bao gồm' }), ul(k.pkg.includes)) : null,
      k.pkg.limits.length ? h('div', { style: 'margin-top:10px' }, h('strong', { text: 'Giới hạn / phạm vi' }), ul(k.pkg.limits)) : null)));
  } else doc.appendChild(section('Gói website đang chọn', h('div', { class: 'alert warn', text: 'Chưa chọn gói. Bấm “Đổi gói” để chọn.' })));
  doc.appendChild(section('Công việc thuộc gói website (đang bật)', k.web.length ?
    table(['Công việc', 'Số lượng · Tần suất · Thời gian'], k.web.map(function (t) { return [nameCell(t), det(t)]; }), []) : h('p', { class: 'muted', text: 'Chưa bật công việc nào.' })));
  doc.appendChild(section('Dịch vụ bổ trợ (tính riêng)', k.addonsOn.length ?
    table(['Dịch vụ', 'Chi tiết', 'Giá', 'Trạng thái'], k.addonsOn.map(function (t) {
      return [nameCell(t), det(t), t.price ? money(t.price) : '—', t.counted ? 'Khách đã chọn' : 'Đề xuất, chưa chọn'];
    }), [2]) : h('p', { class: 'muted', text: 'Không có dịch vụ bổ trợ.' })));
  doc.appendChild(section('Chi phí bên thứ ba (chưa bao gồm)', k.third.length ?
    table(['Hạng mục', 'Ghi chú'], k.third.map(function (t) { return [nameCell(t), t.freq || '']; }), []) : h('p', { class: 'muted', text: 'Không có.' })));
  doc.appendChild(section('Tổng tiền dịch vụ của chúng tôi', h('div', { class: 'total-box' },
    h('div', { class: 'tl' }, h('span', { text: 'Gói website' + (k.pkg ? ' ' + k.pkg.name : '') }), h('span', { text: k.pkg ? money(k.pkgPrice) : 'Chưa chọn' })),
    h('div', { class: 'tl' }, h('span', { text: 'Dịch vụ bổ trợ đã chọn (' + k.addonsCounted.length + ')' }), h('span', { text: money(k.addonTotal) })),
    h('div', { class: 'tl big' }, h('span', { text: 'Tổng cộng' }), h('span', { text: money(k.total) })),
    h('div', { class: 'tnote', text: 'Chưa gồm tên miền, hosting và các chi phí bên thứ ba.' }))));
  var payBlock = h('div', {});
  if (!k.pkg) payBlock.appendChild(h('p', { class: 'muted', text: 'Chọn gói để tính số tiền từng đợt.' }));
  else {
    payBlock.appendChild(table(['Đợt', 'Mốc thanh toán', 'Tỷ lệ', 'Số tiền'], k.inst.map(function (r) { return [r.pay.label, r.pay.milestone, pctText(r.pay.pct), money(r.amount)]; }), [2, 3]));
    payBlock.appendChild(h('p', { class: 'hint', style: 'margin-top:6px', text: 'Lịch này áp dụng cho giá gói website. Dịch vụ bổ trợ thanh toán theo thỏa thuận riêng.' }));
  }
  if (!k.pctOk) payBlock.appendChild(h('div', { class: 'alert danger', style: 'margin-top:8px', text: 'Cảnh báo: tổng tỷ lệ là ' + pctText(k.totalPct) + ', chưa bằng 100%.' }));
  doc.appendChild(section('Lịch thanh toán', payBlock));
  var stages = c.process.filter(function (s) { return s.enabled; });
  if (stages.length) doc.appendChild(section('Quy trình dự kiến', h('ol', { class: 'plain-list' }, stages.map(function (s) { return h('li', { text: s.name + (s.time ? ' (' + s.time + ')' : '') + (s.deliverable ? ': ' + s.deliverable : '') }); }))));
  if (c.confirmations.length) doc.appendChild(section('Nội dung cần xác nhận thêm', ul(c.confirmations)));
  if (c.terms.length) doc.appendChild(section('Ghi chú và điều khoản', ul(c.terms)));

  var actions = h('div', { class: 'summary-actions no-print' },
    btn('Quay lại chỉnh sửa', '', function () { goStep(2); }, 'left'), btn('Đổi gói', '', function () { goStep(3); }, 'swap'),
    btn('Sửa ghi chú & điều khoản', '', function () {
      formModal('Ghi chú và nội dung cần xác nhận', [
        { key: 'confirmations', label: 'Nội dung cần xác nhận thêm (mỗi dòng một mục)', type: 'lines', rows: 6 },
        { key: 'terms', label: 'Ghi chú và điều khoản (mỗi dòng một mục)', type: 'lines', rows: 8 }],
        { confirmations: c.confirmations, terms: c.terms }, function (v) { c.confirmations = strList(v.confirmations); c.terms = strList(v.terms); changed(c); });
    }, 'edit'),
    h('span', { class: 'spacer', style: 'flex:1' }),
    btn('Lưu phương án', 'btn-blue', savePlan, 'save'), btn('Xuất JSON', '', exportPlan, 'download'), btn('In / Lưu PDF', 'btn-primary', printPlan, 'print'));
  return h('div', {}, doc, actions);
}
var SCREENS = [screenNeeds, screenLinks, screenTasks, screenPackages, screenPay, screenSummary];

/* ---------- Cài đặt ---------- */
function openSettings(tab) {
  if (tab) S.tab = tab;
  if (S.settings) return;
  S.settings = openModal({ title: 'Cài đặt', wide: true, footer: false, noFocus: true,
    onClose: function () { S.settings = null; render(true); },
    render: function (m) { drawSettings(m); } });
}
function refreshSettings() { if (S.settings) drawSettings(S.settings); }
function linesArea(obj, key, rows) {
  var el = h('textarea', { rows: rows || 5, value: (obj[key] || []).join('\n') });
  el.addEventListener('input', function () { obj[key] = el.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); save(); });
  return el;
}
var SETTING_TABS = [['brand', 'Thương hiệu & trình chiếu'], ['packages', 'Gói website'], ['tasks', 'Danh sách công việc'],
  ['process', 'Quy trình'], ['payment', 'Tỷ lệ thanh toán'], ['notes', 'Ghi chú & điều khoản'], ['data', 'Dữ liệu']];
function drawSettings(m) {
  var st = m.body.scrollTop, body = m.body;
  body.textContent = '';
  var tabs = h('div', { class: 'tabs', role: 'tablist' });
  SETTING_TABS.forEach(function (t) {
    tabs.appendChild(h('button', { type: 'button', role: 'tab', class: 'tab' + (S.tab === t[0] ? ' on' : ''), onClick: function () { S.tab = t[0]; drawSettings(m); } }, t[1]));
  });
  body.appendChild(tabs);
  var catalogTab = ['packages', 'tasks', 'process', 'payment', 'notes'].indexOf(S.tab) >= 0;
  var target = (S.scope === 'plan') ? cur().catalog : S.config.catalog;
  if (catalogTab) body.appendChild(scopeBar());
  if (S.tab === 'brand') body.appendChild(tabBrand());
  else if (S.tab === 'notes') body.appendChild(tabNotes(target));
  else if (S.tab === 'data') body.appendChild(tabData());
  else body.appendChild(listEditor(S.tab, target));
  body.scrollTop = st;
}
function scopeBar() {
  var p = cur();
  var box = h('div', { class: 'card', style: 'margin-bottom:14px;padding:14px 18px' });
  var chips = h('div', { class: 'chips' });
  [['config', 'Mẫu chung (dùng cho phương án mới)'], ['plan', 'Phương án đang mở: ' + p.name]].forEach(function (o) {
    chips.appendChild(h('button', { type: 'button', class: 'chip' + (S.scope === o[0] ? ' on' : ''), onClick: function () { S.scope = o[0]; refreshSettings(); } }, o[1]));
  });
  box.appendChild(chips);
  box.appendChild(h('p', { class: 'hint', style: 'margin-top:8px', text: S.scope === 'config' ?
    'Sửa mẫu chung không làm thay đổi các phương án đã tạo. Mỗi khách có bản sao danh mục riêng.' :
    'Chỉ sửa danh mục của khách này, các khách khác không bị ảnh hưởng.' }));
  if (S.scope === 'plan') box.appendChild(h('div', { class: 'toolbar', style: 'margin:10px 0 0' },
    btn('Nạp lại từ mẫu chung', 'btn-sm', function () {
      confirmDialog('Ghi đè danh mục của phương án “' + p.name + '” bằng mẫu chung hiện tại? Các chỉnh sửa riêng của khách này sẽ mất.', 'Ghi đè', true, function () {
        p.catalog = clone(S.config.catalog);
        if (!p.catalog.packages.some(function (x) { return x.id === p.selectedPackageId; })) p.selectedPackageId = '';
        touch(); render(true); refreshSettings(); toast('Đã nạp lại danh mục từ mẫu chung.');
      });
    }),
    btn('Lưu thành mẫu chung', 'btn-sm', function () {
      confirmDialog('Dùng danh mục của phương án này làm mẫu chung cho các phương án mới?', 'Lưu mẫu', false, function () {
        S.config.catalog = clone(p.catalog); save(); refreshSettings(); toast('Đã cập nhật mẫu chung.');
      });
    })));
  return box;
}
function tabBrand() {
  var cfg = S.config, b = cfg.brand, o = cfg.options;
  var hdr = function () { renderHeader(); };
  return h('div', { class: 'grid g2' },
    card('Thương hiệu của bạn', 'Hiện ở đầu màn hình và trên bản in.', h('div', { class: 'fields' },
      field('Tên thương hiệu', bindInput(b, 'name', {}, hdr)), field('Chữ trên logo (1–2 ký tự)', bindInput(b, 'logoText', { maxlength: 4 }, hdr)),
      field('Địa chỉ ảnh logo (tùy chọn, http/https)', bindInput(b, 'logoUrl', { placeholder: 'https://…/logo.png' }, hdr), 'Nếu nhập, ảnh sẽ thay cho chữ trên logo. Dán link ảnh hoặc dùng tệp trong cùng thư mục, ví dụ logo.png.'),
      field('Tiêu đề trình chiếu', bindInput(cfg, 'title', {}, hdr)), field('Mô tả mở đầu', bindArea(cfg, 'intro', { rows: 3 })))),
    card('Lựa chọn nhanh ở màn Nhu cầu', 'Mỗi dòng một lựa chọn.', h('div', { class: 'fields' },
      field('Mô hình F&B', linesArea(o, 'models', 5)), field('Mục tiêu của khách', linesArea(o, 'goals', 5)), field('Vấn đề thường gặp', linesArea(o, 'problems', 5)))));
}
function tabNotes(target) {
  return h('div', { class: 'grid g2' },
    card('Nội dung cần xác nhận thêm', 'Hiện ở màn Tổng kết. Mỗi dòng một mục.', linesArea(target, 'confirmations', 8)),
    card('Ghi chú và điều khoản', 'Hiện ở màn Tổng kết và bản in. Mỗi dòng một mục.', linesArea(target, 'terms', 8)));
}
function listEditor(kind, target) {
  var K = KINDS[kind], wrap = h('div', { class: 'list-editor' });
  var hasToggle = kind === 'tasks' || kind === 'process';
  function row(it, title, sub) {
    return h('div', { class: 'le-row' + (hasToggle && !it.enabled ? ' off' : '') },
      hasToggle ? switchEl(it.enabled, function (v) { it.enabled = v; changed(target); }, 'Bật/tắt') : null,
      h('div', { class: 'le-main' }, h('div', { class: 'le-title', text: title || '(chưa đặt tên)' }), h('div', { class: 'le-sub', text: sub || '' })),
      rowTools(kind, target, it));
  }
  if (kind === 'payment') {
    var tp = sumBy(target.payment, function (x) { return x.pct; });
    wrap.appendChild(h('div', { class: 'alert ' + (Math.abs(tp - 100) < 0.0001 ? 'ok' : 'danger'), style: 'margin-bottom:12px',
      text: 'Tổng tỷ lệ: ' + pctText(tp) + (Math.abs(tp - 100) < 0.0001 ? ' (đủ 100%)' : ' (chưa bằng 100%)') }));
  }
  if (kind === 'tasks') {
    TASK_GROUPS.forEach(function (g) {
      wrap.appendChild(h('h3', { text: g.title, style: 'margin:14px 0 8px;font-size:16px' }));
      target.tasks.filter(function (t) { return t.group === g.id; }).forEach(function (t) {
        wrap.appendChild(row(t, t.name, [t.qty, t.freq, t.time].filter(Boolean).join(' · ') + (g.id === 'addon' && t.price ? ' · ' + money(t.price) : '')));
      });
      wrap.appendChild(btn('Thêm vào nhóm này', 'btn-sm', function () { addItem('tasks', target, g.id); }, 'plus'));
    });
    return wrap;
  }
  target[kind].forEach(function (it) {
    if (kind === 'packages') wrap.appendChild(row(it, it.name + ' · ' + money(it.price), it.duration));
    else if (kind === 'process') wrap.appendChild(row(it, it.name, it.time));
    else wrap.appendChild(row(it, it.label + ' · ' + pctText(it.pct), it.milestone));
  });
  wrap.appendChild(h('div', { style: 'margin-top:10px' }, btn('Thêm ' + K.title, '', function () { addItem(kind, target); }, 'plus')));
  return wrap;
}

/* ---------- Dữ liệu: xuất / nhập / khôi phục ---------- */
function exportAll() {
  downloadJson('tu-van-website-fnb-toan-bo-' + ymd() + '.json', { app: APP_ID, version: DATA_VERSION, type: 'all', exportedAt: new Date().toISOString(),
    config: S.config, plans: Object.keys(S.plans).map(function (k) { return S.plans[k]; }), currentId: S.currentId });
  toast('Đã xuất toàn bộ dữ liệu ra tệp JSON.');
}
function parseImport(text) {
  var data;
  try { data = JSON.parse(text); } catch (e) { throw new Error('Tệp không phải JSON hợp lệ.'); }
  if (!isObj(data) || data.app !== APP_ID) throw new Error('Tệp không phải dữ liệu xuất từ công cụ này.');
  if (typeof data.version !== 'number' || data.version > DATA_VERSION) throw new Error('Phiên bản tệp không được hỗ trợ.');
  if (data.type === 'plan') return { config: null, plans: [sanPlan(data.plan)] };
  if (data.type === 'all') {
    if (!Array.isArray(data.plans)) throw new Error('Thiếu danh sách phương án.');
    return { config: data.config ? sanConfig(data.config) : null, plans: data.plans.slice(0, 200).map(sanPlan) };
  }
  throw new Error('Loại dữ liệu không nhận dạng được.');
}
function importFile(file, afterDone) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { toast('Tệp quá lớn (tối đa 10 MB).'); return; }
  var fr = new FileReader();
  fr.onerror = function () { toast('Không đọc được tệp.'); };
  fr.onload = function () {
    var res;
    try { res = parseImport(String(fr.result)); } catch (e) { toast('Nhập thất bại: ' + e.message); return; }
    if (!res.plans.length && !res.config) { toast('Tệp không có dữ liệu để nhập.'); return; }
    var msg = 'Nhập ' + res.plans.length + ' phương án (thêm mới, không ghi đè phương án đang có).' +
      (res.config ? '\nMẫu chung và thương hiệu hiện tại sẽ được thay bằng dữ liệu trong tệp.' : '');
    confirmDialog(msg, 'Nhập dữ liệu', false, function () {
      var first = null;
      res.plans.forEach(function (p) {
        if (S.plans[p.id]) { p.id = uid('plan'); p.name = p.name + ' (nhập)'; }
        S.plans[p.id] = p; if (!first) first = p.id;
      });
      if (res.config) S.config = res.config;
      if (first) S.currentId = first;
      saveNow(); render(false); if (afterDone) afterDone();
      toast('Đã nhập dữ liệu.');
    });
  };
  fr.readAsText(file);
}
function tabData() {
  var fileIn = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
  fileIn.addEventListener('change', function () { importFile(fileIn.files[0], refreshSettings); fileIn.value = ''; });
  return h('div', { class: 'data-actions' },
    S.storageBad ? h('div', { class: 'alert danger', text: 'Trình duyệt đang chặn hoặc đầy bộ nhớ lưu trữ: dữ liệu có thể không được giữ sau khi tải lại. Hãy xuất JSON.' }) : null,
    h('div', { class: 'box' }, h('h4', { text: 'Nơi lưu dữ liệu' }),
      h('p', { text: 'Dữ liệu lưu bằng localStorage, chỉ nằm trong trình duyệt và thiết bị này. Không có đồng bộ cloud. Xóa dữ liệu duyệt web hoặc đổi máy sẽ mất, nên hãy xuất JSON để sao lưu.' })),
    h('div', { class: 'box' }, h('h4', { text: 'Xuất / nhập JSON' }),
      h('p', { text: 'Xuất toàn bộ gồm cấu hình mẫu và mọi phương án khách hàng. Nhập sẽ thêm phương án mới, không ghi đè phương án đang có.' }),
      h('div', { class: 'toolbar', style: 'margin:0' }, btn('Xuất toàn bộ dữ liệu', 'btn-primary', exportAll, 'download'),
        btn('Nhập từ tệp JSON', '', function () { fileIn.click(); }, 'upload'), fileIn)),
    h('div', { class: 'box' }, h('h4', { text: 'Khôi phục dữ liệu demo' }),
      h('p', { text: 'Khôi phục mẫu chung về demo không đụng tới phương án đã lưu. Xóa toàn bộ sẽ xóa cả phương án khách hàng.' }),
      h('div', { class: 'toolbar', style: 'margin:0' },
        btn('Khôi phục mẫu chung về demo', '', function () {
          confirmDialog('Đặt lại thương hiệu, lựa chọn nhanh và mẫu chung về dữ liệu demo? Các phương án đã lưu vẫn giữ nguyên.', 'Khôi phục', true, function () {
            S.config = defaultConfig(); saveNow(); render(true); refreshSettings(); toast('Đã khôi phục mẫu chung về demo.');
          });
        }),
        btn('Xóa toàn bộ & khôi phục demo', 'btn-danger', function () {
          confirmDialog('XÓA TẤT CẢ phương án khách hàng và khôi phục dữ liệu demo? Không thể hoàn tác. Hãy xuất JSON trước nếu cần.', 'Xóa tất cả', true, function () {
            S.config = defaultConfig(); S.plans = {}; var np = newPlan(); S.plans[np.id] = np; S.currentId = np.id; S.scope = 'config';
            saveNow(); render(false); refreshSettings(); toast('Đã khôi phục dữ liệu demo.');
          });
        }))));
}

/* ---------- Quản lý phương án khách hàng ---------- */
function switchPlan(id) { saveNow(); S.currentId = id; saveNow(); render(false); window.scrollTo(0, 0); }
function openPlans() {
  openModal({ title: 'Phương án khách hàng', wide: true, footer: false, noFocus: true, render: function (m) { drawPlans(m); } });
}
function openBtn(isCur, fn) {
  var b = btn(isCur ? 'Đang mở' : 'Mở', isCur ? 'btn-sm' : 'btn-primary btn-sm', fn);
  b.disabled = isCur;
  return b;
}
function drawPlans(m) {
  var body = m.body; body.textContent = '';
  var nameIn = h('input', { type: 'text', placeholder: 'Tên phương án mới (ví dụ: Quán Cà Phê Góc Phố)' });
  function create() {
    var p = newPlan(nameIn.value.trim() || null);
    S.plans[p.id] = p; saveNow(); m.close(); switchPlan(p.id); toast('Đã tạo phương án mới. Các phương án cũ vẫn được giữ.');
  }
  nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') create(); });
  body.appendChild(h('div', { class: 'new-plan' }, nameIn, btn('Tạo phương án mới', 'btn-primary', create, 'plus')));
  var ids = Object.keys(S.plans).sort(function (a, b) { return S.plans[b].updatedAt - S.plans[a].updatedAt; });
  ids.forEach(function (id) {
    var p = S.plans[id], isCur = id === S.currentId;
    var pm = h('div', { class: 'pm' }, h('strong', { text: p.name }),
      h('span', { text: (p.customer.name ? p.customer.name + ' · ' : '') + 'cập nhật ' + dateText(p.updatedAt) + (p.selectedPackageId ? ' · đã chọn gói' : '') }));
    body.appendChild(h('div', { class: 'plan-row' + (isCur ? ' current' : '') }, pm,
      openBtn(isCur, function () { m.close(); switchPlan(id); }),
      btn('Đổi tên', 'btn-sm', function () {
        formModal('Đổi tên phương án', [{ key: 'name', label: 'Tên phương án', type: 'text', required: true }], { name: p.name }, function (v) {
          p.name = v.name.slice(0, 150); p.nameAuto = false; p.updatedAt = Date.now(); saveNow(); renderHeader(); drawPlans(m);
        });
      }, 'edit'),
      btn('Nhân bản', 'btn-sm', function () {
        var c = clone(p); c.id = uid('plan'); c.name = p.name + ' (bản sao)'; c.nameAuto = false; c.createdAt = c.updatedAt = Date.now();
        S.plans[c.id] = c; saveNow(); drawPlans(m); toast('Đã nhân bản phương án.');
      }, 'copy'),
      btn('Xóa', 'btn-sm btn-danger', function () {
        confirmDialog('Xóa phương án “' + p.name + '”? Không thể hoàn tác. Nếu cần, hãy xuất JSON trước.', 'Xóa phương án', true, function () {
          delete S.plans[id];
          if (!Object.keys(S.plans).length) { var np = newPlan(); S.plans[np.id] = np; }
          if (!S.plans[S.currentId]) S.currentId = Object.keys(S.plans).sort(function (a, b) { return S.plans[b].updatedAt - S.plans[a].updatedAt; })[0];
          saveNow(); render(false); drawPlans(m);
        });
      }, 'trash')));
  });
  body.appendChild(h('div', { class: 'toolbar', style: 'margin:14px 0 0' }, btn('Xuất toàn bộ (JSON)', '', exportAll, 'download'),
    btn('Cài đặt & nhập JSON', '', function () { m.close(); openSettings('data'); }, 'gear')));
}

/* ---------- Phím tắt & khởi động ---------- */
document.addEventListener('keydown', function (e) {
  if (modalStack.length || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
  var t = e.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
  if (e.key === 'ArrowRight') goStep(cur().step + 1);
  else if (e.key === 'ArrowLeft') goStep(cur().step - 1);
});
loadAll();
render(false);
if (S.storageBad) toast('Trình duyệt chặn lưu trữ cục bộ: dữ liệu sẽ không được giữ sau khi tải lại.');
})();
