/* =========================================================
   logic.js — Thuật toán & dữ liệu thuần (không phụ thuộc DOM/Leaflet)
   Dùng chung cho: app.js (trình duyệt), kiểm thử Vitest, build tài liệu.
   ========================================================= */

// ---------- DỮ LIỆU CỬA HÀNG & ĐỊA DANH MẪU ----------
export const STORES = [
  { id: 1, name: "Cửa hàng Bách Hóa Xanh - Lê Lợi", lat: 10.7769, lng: 106.7009, isDefault: true },
  { id: 2, name: "Cửa hàng WinMart - Nguyễn Huệ", lat: 10.7753, lng: 106.7038, isDefault: true },
  { id: 3, name: "Cửa hàng Co.opMart - Cống Quỳnh", lat: 10.7725, lng: 106.6960, isDefault: true },
  { id: 4, name: "Cửa hàng CircleK - Nam Kỳ Khởi Nghĩa", lat: 10.7801, lng: 106.6945, isDefault: true },
  { id: 5, name: "Cửa hàng Mega Market - An Phú", lat: 10.8015, lng: 106.7305, isDefault: true },
  { id: 6, name: "Cửa hàng GS25 - Hai Bà Trưng", lat: 10.7863, lng: 106.6981, isDefault: true },
];

// Danh mục gợi ý địa điểm nổi tiếng
export const LANDMARKS = [
  { name: "Chợ Bến Thành, TP.HCM", lat: 10.7720, lng: 106.6980 },
  { name: "Dinh Độc Lập, TP.HCM", lat: 10.7768, lng: 106.6957 },
  { name: "Phố Đi Bộ Nguyễn Huệ", lat: 10.7745, lng: 106.7032 },
  { name: "Nhà thờ Đức Bà Sài Gòn", lat: 10.7798, lng: 106.6990 },
  { name: "Cầu Sài Gòn / Landmark 81", lat: 10.7951, lng: 106.7220 },
  { name: "Sân bay Tân Sơn Nhất", lat: 10.8020, lng: 106.6560 },
  { name: "Đại học Bách Khoa TP.HCM", lat: 10.7911, lng: 106.7063 },
  { name: "Khu du lịch Suối Tiên", lat: 10.8659, lng: 106.8027 },
  { name: "Hồ Hoàn Kiếm, Hà Nội", lat: 21.0287, lng: 105.8524 },
  { name: "Cầu Rồng, Đà Nẵng", lat: 16.0611, lng: 108.2208 },
];

export const DEFAULT_MAP_VIEW = { lat: 10.78, lng: 106.70, zoom: 13 };

// ---------- THUẬT TOÁN KHOẢNG CÁCH (HAVERSINE) ----------
/**
 * Tính khoảng cách đại viên (Great Circle Distance) giữa 2 tọa độ theo công thức Haversine
 * @param {{lat: number, lng: number}} a
 * @param {{lat: number, lng: number}} b
 * @returns {number} Khoảng cách tính bằng mét
 */
export function haversineMeters(a, b) {
  const R = 6371000; // Bán kính trung bình của Trái Đất (mét)
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Tìm cửa hàng có khoảng cách Haversine ngắn nhất từ 1 điểm bất kỳ
 * @param {{lat: number, lng: number}} point
 * @param {Array<{lat: number, lng: number}>} [stores] - mặc định dùng STORES
 */
export function findNearestStore(point, stores = STORES) {
  if (stores.length === 0) return null;
  let best = null;
  stores.forEach((s) => {
    const d = haversineMeters(point, s);
    if (!best || d < best.distance) {
      best = { store: s, distance: d };
    }
  });
  return best;
}

// ---------- THUẬT TOÁN TỐI ƯU LỘ TRÌNH (TSP - NEAREST NEIGHBOR) ----------
/**
 * Thuật toán Nearest Neighbor giải bài toán người giao hàng (TSP)
 * Giữ nguyên điểm xuất phát đầu tiên, sắp xếp lại các điểm kế tiếp
 * để tối thiểu tổng khoảng cách.
 */
export function optimizePointsOrder(points) {
  if (points.length <= 2) return points;

  const remaining = [...points.slice(1)];
  const ordered = [points[0]];

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let minD = haversineMeters(current, remaining[0]);

    for (let i = 1; i < remaining.length; i++) {
      const d = haversineMeters(current, remaining[i]);
      if (d < minD) {
        minD = d;
        nearestIdx = i;
      }
    }

    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return ordered;
}

// ---------- THỜI GIAN DI CHUYÊN THEO PHƯƠNG TIỆN ----------
/**
 * Điều chỉnh thời gian dựa trên phương tiện thực tế
 * @returns {number|null} số giây, hoặc null nếu giữ nguyên thời gian của OSRM (driving)
 */
export function calculateEstimatedDuration(distanceMeters, profile) {
  if (profile === "walking") {
    // Tốc độ đi bộ trung bình ~ 4.5 km/h ≈ 1.25 m/s
    return Math.round(distanceMeters / 1.25);
  } else if (profile === "bike") {
    // Tốc độ đạp xe trung bình ~ 15 km/h ≈ 4.17 m/s
    return Math.round(distanceMeters / 4.17);
  }
  return null; // Giữ nguyên thời gian lái xe từ OSRM
}

// ---------- PHÂN TÍCH TỌA ĐỘ TỪ CHUỖI NHẬP ----------
/**
 * Phân tích chuỗi "lat, lng" thành đối tượng tọa độ hợp lệ.
 * @returns {{lat: number, lng: number}|null}
 */
export function parseCoordinates(str) {
  const m = str.trim().match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { lat, lng };
}

// ---------- CẤU HÌNH ĐỊNH TUYẾN THEO PHƯƠNG TIỆN ----------
// Server demo FOSSGIS: ô tô dùng router.project-osrm.org; xe đạp / đi bộ dùng
// routing.openstreetmap.de với đường dẫn riêng (routed-bike / routed-foot).
// Lưu ý: với các endpoint này, phần "profile" trong URL luôn là "driving".
export const ROUTING_PROFILES = {
  driving: { label: "🚗 Ô tô / Xe máy", serviceUrl: "https://router.project-osrm.org/route/v1", osrmProfile: "driving" },
  bike: { label: "🚲 Xe đạp", serviceUrl: "https://routing.openstreetmap.de/routed-bike/route/v1", osrmProfile: "driving" },
  walking: { label: "🚶 Đi bộ", serviceUrl: "https://routing.openstreetmap.de/routed-foot/route/v1", osrmProfile: "driving" },
};

// ---------- CHỐNG CHÈN HTML (XSS) ----------
/**
 * Escape ký tự đặc biệt để chèn chuỗi người dùng nhập vào HTML an toàn.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------- LƯU / KHÔI PHỤC CỬA HÀNG TỰ THÊM ----------
/**
 * Sinh id cửa hàng tiếp theo (lớn nhất hiện có + 1).
 * @param {Array<{id:number}>} stores
 */
export function nextStoreIdFrom(stores) {
  return stores.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0) + 1;
}

/**
 * Lọc dữ liệu đọc từ localStorage: bỏ phần tử sai định dạng / toạ độ ngoài phạm vi,
 * luôn đánh dấu isDefault = false.
 * @param {unknown} raw
 * @returns {Array<{id:number,name:string,lat:number,lng:number,isDefault:false}>}
 */
export function sanitizeStoredStores(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") continue;
    const lat = Number(s.lat);
    const lng = Number(s.lng);
    const name = typeof s.name === "string" ? s.name.trim() : "";
    const id = Number(s.id);
    if (!name || !Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    out.push({ id, name: name.slice(0, 120), lat, lng, isDefault: false });
  }
  return out;
}

// ---------- TÁCH CÁC CHẶNG TỪ KẾT QUẢ ĐỊNH TUYẾN ----------
/**
 * Leaflet Routing Machine không trả về `route.legs`, nên tự tính từng chặng
 * (điểm i → điểm i+1) từ danh sách hướng dẫn và chỉ số các điểm dừng.
 * @param {Array<{index:number,distance:number,time:number}>} instructions
 * @param {number[]} waypointIndices - chỉ số toạ độ của từng điểm dừng
 * @param {{totalDistance:number,totalTime:number}} [summary] - dùng khi chỉ có 1 chặng
 * @returns {Array<{distance:number,time:number}>}
 */
export function computeLegs(instructions, waypointIndices, summary) {
  const idx = Array.isArray(waypointIndices) ? waypointIndices : [];
  if (idx.length < 2 || !Array.isArray(instructions)) {
    return summary ? [{ distance: summary.totalDistance, time: summary.totalTime }] : [];
  }
  const legs = [];
  for (let i = 0; i < idx.length - 1; i++) {
    const from = idx[i];
    const to = idx[i + 1];
    let distance = 0;
    let time = 0;
    for (const step of instructions) {
      if (step.index >= from && step.index < to) {
        distance += step.distance || 0;
        time += step.time || 0;
      }
    }
    legs.push({ distance, time });
  }
  return legs;
}
