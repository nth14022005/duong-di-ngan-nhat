import {
  STORES,
  LANDMARKS,
  DEFAULT_MAP_VIEW,
  haversineMeters,
  findNearestStore,
  optimizePointsOrder,
  calculateEstimatedDuration,
  parseCoordinates,
  ROUTING_PROFILES,
  escapeHtml,
  nextStoreIdFrom,
  sanitizeStoredStores,
  computeLegs,
} from "./logic.js";

// ---------- LƯU CỬA HÀNG TỰ THÊM (localStorage) ----------
const STORAGE_KEY = "dtdm.customStores.v1";

function loadCustomStores() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    sanitizeStoredStores(raw).forEach((s) => STORES.push(s));
  } catch (err) {
    console.warn("Không đọc được cửa hàng đã lưu:", err);
  }
}

function saveCustomStores() {
  try {
    const custom = STORES.filter((s) => !s.isDefault);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } catch (err) {
    console.warn("Không lưu được cửa hàng:", err);
  }
}

loadCustomStores();
let nextStoreId = nextStoreIdFrom(STORES);

// ---------- 2. TRẠNG THÁI ỨNG DỤNG (STATE) ----------
const state = {
  mode: "nearest", // nearest | twoPoints | multiPoints
  profile: "driving", // driving | bike | walking
  userPoints: [], // Danh sách tọa độ [{lat, lng, label?}]
  routingControl: null,
  nearestStoreInfo: null, // Thông tin kết quả tìm cửa hàng gần nhất
};

// ---------- 3. KHỞI TẠO BẢN ĐỒ & LAYER QUẢN LÝ ----------
const map = L.map("map", {
  zoomControl: true,
}).setView([DEFAULT_MAP_VIEW.lat, DEFAULT_MAP_VIEW.lng], DEFAULT_MAP_VIEW.zoom);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Phân tách các LayerGroup chuyên biệt để tránh rác marker & memory leak
const storeLayer = L.layerGroup().addTo(map);
const userMarkerLayer = L.layerGroup().addTo(map);
const routeMarkerLayer = L.layerGroup().addTo(map);
const haversineLineLayer = L.layerGroup().addTo(map);
const gpsLayer = L.layerGroup().addTo(map);

// ---------- 6. QUẢN LÝ HIỂN THỊ CỬA HÀNG ----------
function renderStoreMarkers() {
  storeLayer.clearLayers();
  STORES.forEach((s) => {
    const marker = L.marker([s.lat, s.lng], {
      icon: L.divIcon({
        className: "custom-store-pin",
        html: `<div class="marker-store-icon">🏬</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
      }),
    });

    const box = document.createElement("div");
    box.style.cssText = "font-size:13px; line-height:1.4";
    box.innerHTML =
      `<b>${escapeHtml(s.name)}</b><br>` +
      `<span style="color:#94a3b8">Tọa độ:</span> ${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}<br>`;
    const pickBtn = document.createElement("button");
    pickBtn.textContent = "🚩 Chọn làm điểm lộ trình";
    pickBtn.style.cssText =
      "margin-top:6px; padding:3px 8px; background:#0284c7; color:#fff; border:none; border-radius:4px; cursor:pointer;";
    pickBtn.addEventListener("click", () => {
      map.closePopup();
      handlePointAdd({ lat: s.lat, lng: s.lng, label: s.name });
    });
    box.appendChild(pickBtn);
    marker.bindPopup(box);
    marker.addTo(storeLayer);
  });
}

function renderStoreList() {
  const ul = document.getElementById("store-list");
  const countEl = document.getElementById("store-count");
  if (countEl) countEl.textContent = STORES.length;
  ul.innerHTML = "";

  STORES.forEach((s) => {
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = `🏬 ${s.name}`;
    nameSpan.style.flex = "1";

    const actions = document.createElement("div");
    actions.className = "store-actions";

    if (!s.isDefault) {
      const delBtn = document.createElement("span");
      delBtn.className = "btn-del";
      delBtn.textContent = "✕";
      delBtn.title = "Xóa cửa hàng này";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteStore(s.id);
      };
      actions.appendChild(delBtn);
    }

    li.appendChild(nameSpan);
    li.appendChild(actions);

    li.onclick = () => {
      map.flyTo([s.lat, s.lng], 16, { duration: 1 });
    };

    ul.appendChild(li);
  });
}

function deleteStore(id) {
  const idx = STORES.findIndex((s) => s.id === id);
  if (idx !== -1) {
    STORES.splice(idx, 1);
    saveCustomStores();
    renderStoreMarkers();
    renderStoreList();
    if (state.mode === "nearest" && state.userPoints.length > 0) {
      handlePointAdd(state.userPoints[0]);
    }
  }
}

// ---------- 7. VẼ ĐƯỜNG ĐI (ROUTING) & ĐƯỜNG CHIM BAY ----------
/**
 * Gỡ control định tuyến hiện tại một cách an toàn.
 * Xóa waypoint trước khi gỡ để LRM bỏ qua phản hồi OSRM đang chờ, tránh việc
 * phản hồi cũ (mạng chậm) cập nhật giao diện hoặc ném lỗi sau khi đã gỡ control.
 */
function removeRoutingControl() {
  const control = state.routingControl;
  if (!control) return;
  state.routingControl = null;
  try {
    control.getPlan().setWaypoints([]);
  } catch (err) {
    /* bỏ qua */
  }
  try {
    map.removeControl(control);
  } catch (err) {
    /* bỏ qua */
  }
}

function drawRoute(points) {
  removeRoutingControl();
  routeMarkerLayer.clearLayers();

  if (points.length < 2) return;

  const waypoints = points.map((p) => L.latLng(p.lat, p.lng));

  const control = L.Routing.control({
    waypoints: waypoints,
    router: L.Routing.osrmv1({
      serviceUrl: (ROUTING_PROFILES[state.profile] || ROUTING_PROFILES.driving).serviceUrl,
      profile: (ROUTING_PROFILES[state.profile] || ROUTING_PROFILES.driving).osrmProfile,
    }),
    routeWhileDragging: false,
    addWaypoints: false,
    showAlternatives: false,
    show: false,
    fitSelectedRoutes: false,
    lineOptions: {
      styles: [
        { color: "#0284c7", weight: 6, opacity: 0.9 },
        { color: "#38bdf8", weight: 2, opacity: 1 },
      ],
    },
    createMarker: () => null,
  });
  state.routingControl = control;

  control
    .on("routesfound", (e) => {
      if (state.routingControl !== control) return; // phản hồi cũ -> bỏ qua
      const route = e.routes[0];
      showRouteSummary(route, points);

      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    })
    .on("routingerror", (err) => {
      if (state.routingControl !== control) return; // phản hồi cũ -> bỏ qua
      console.warn("Lỗi OSRM routing:", err);
      const routeInfoEl = document.getElementById("route-info");
      routeInfoEl.innerHTML = `
        <div style="color: #f87171; padding: 6px 0;">
          ⚠️ Không tìm thấy đường đi di chuyển bằng phương tiện này.<br>
          <small>Có thể do các điểm quá xa hoặc nằm trên vùng không có dữ liệu đường bộ.</small>
        </div>
      `;
    })
    .addTo(map);

  points.forEach((p, i) => {
    const isStart = i === 0;
    const isEnd = i === points.length - 1;
    let extraClass = "";
    if (isStart) extraClass = " start-point";
    else if (isEnd) extraClass = " end-point";

    const label = p.label ? `<br><i>${escapeHtml(p.label)}</i>` : "";

    L.marker([p.lat, p.lng], {
      icon: L.divIcon({
        className: "custom-user-pin",
        html: `<div class="marker-user-icon${extraClass}">${i + 1}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    })
      .bindPopup(`<b>Điểm ${i + 1}</b>${label}<br>Tọa độ: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`)
      .addTo(routeMarkerLayer);
  });
}

// ---------- 8. HIỂN THỊ CHI TIẾT CHỈ ĐƯỜNG (CÓ HƯỚNG DẪN RẼ CHI TIẾT) ----------
function showRouteSummary(route, points) {
  const routeInfoEl = document.getElementById("route-info");
  const actualDistanceKm = (route.summary.totalDistance / 1000).toFixed(2);

  let totalSeconds = route.summary.totalTime;
  const customSec = calculateEstimatedDuration(route.summary.totalDistance, state.profile);
  if (customSec !== null) totalSeconds = customSec;

  const mins = Math.max(1, Math.round(totalSeconds / 60));
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  const timeStr = hours > 0 ? `${hours} giờ ${remainMins} phút` : `${mins} phút`;

  let html = `
    <div class="stats-card">
      <div class="stat-row">
        <span class="stat-label">Phương tiện:</span>
        <span class="stat-val highlight">${escapeHtml((ROUTING_PROFILES[state.profile] || {}).label || state.profile)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Đường đi thực tế:</span>
        <span class="stat-val highlight">${actualDistanceKm} km</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Thời gian ước tính:</span>
        <span class="stat-val">${timeStr}</span>
      </div>
  `;

  if (state.mode === "nearest" && state.nearestStoreInfo) {
    const havKm = (state.nearestStoreInfo.distance / 1000).toFixed(2);
    html += `
      <div class="stat-row" style="margin-top:4px; padding-top:4px; border-top:1px dashed rgba(255,255,255,0.15)">
        <span class="stat-label">Khoảng cách chim bay:</span>
        <span class="stat-val haversine">${havKm} km</span>
      </div>
      <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">
        🏬 Cửa hàng: <b>${escapeHtml(state.nearestStoreInfo.store.name)}</b>
      </div>
    `;
  }

  html += `</div>`;

  // Liệt kê các chặng di chuyển (LRM không có route.legs nên tự tính)
  const legs = computeLegs(route.instructions, route.waypointIndices, route.summary);
  if (legs.length > 1) {
    html += `<div class="leg-list">`;
    legs.forEach((leg, i) => {
      const legKm = (leg.distance / 1000).toFixed(2);
      let legSec = leg.time;
      const cSec = calculateEstimatedDuration(leg.distance, state.profile);
      if (cSec !== null) legSec = cSec;
      const legMin = Math.max(1, Math.round(legSec / 60));

      html += `
        <div class="leg-item">
          <b>Chặng ${i + 1}</b> (Điểm ${i + 1} → Điểm ${i + 2}):
          <span>${legKm} km (~${legMin} phút)</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Bổ sung bảng chỉ đường chi tiết từng bước (Turn-by-turn instructions) theo đúng yêu cầu đề bài
  if (route.instructions && route.instructions.length > 0) {
    html += `
      <div style="margin-top: 10px;">
        <b style="color: #38bdf8; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px;">🧭 Hướng dẫn chi tiết từng bước:</b>
        <div class="instruction-list">
    `;
    route.instructions.forEach((step, idx) => {
      const distM = Math.round(step.distance);
      const distStr = distM > 0 ? ` (${distM}m)` : "";
      html += `
        <div class="instruction-item">
          <span class="inst-num">${idx + 1}.</span>
          <span class="inst-text">${escapeHtml(step.text)}${distStr}</span>
        </div>
      `;
    });
    html += `</div></div>`;
  }

  routeInfoEl.innerHTML = html;
}

// ---------- 9. XỬ LÝ SỰ KIỆN THÊM ĐIỂM ----------
function handlePointAdd(rawPoint) {
  const p = {
    lat: +Number(rawPoint.lat).toFixed(6),
    lng: +Number(rawPoint.lng).toFixed(6),
    label: rawPoint.label || "",
  };

  if (state.mode === "nearest") {
    userMarkerLayer.clearLayers();
    haversineLineLayer.clearLayers();

    const nearest = findNearestStore(p);
    if (!nearest) {
      alert("Chưa có danh sách cửa hàng nào để tìm kiếm!");
      return;
    }

    state.userPoints = [p];
    state.nearestStoreInfo = nearest;

    L.circleMarker([p.lat, p.lng], {
      color: "#f43f5e",
      fillColor: "#f43f5e",
      fillOpacity: 0.9,
      radius: 8,
      weight: 2,
    })
      .bindPopup(`<b>Điểm bạn chọn</b><br>Tọa độ: ${p.lat}, ${p.lng}`)
      .addTo(userMarkerLayer);

    L.polyline(
      [
        [p.lat, p.lng],
        [nearest.store.lat, nearest.store.lng],
      ],
      {
        color: "#f43f5e",
        weight: 3,
        dashArray: "6, 8",
        opacity: 0.85,
      }
    )
      .bindPopup(
        `<b>Đường thẳng chim bay (Haversine)</b><br>Khoảng cách: ${(
          nearest.distance / 1000
        ).toFixed(2)} km`
      )
      .addTo(haversineLineLayer);

    drawRoute([p, { lat: nearest.store.lat, lng: nearest.store.lng, label: nearest.store.name }]);
  } else if (state.mode === "twoPoints") {
    haversineLineLayer.clearLayers();
    state.nearestStoreInfo = null;

    if (state.userPoints.length >= 2) {
      state.userPoints = [];
      userMarkerLayer.clearLayers();
      removeRoutingControl();
    }

    state.userPoints.push(p);

    if (state.userPoints.length === 1) {
      L.circleMarker([p.lat, p.lng], {
        color: "#16a34a",
        fillColor: "#16a34a",
        fillOpacity: 0.9,
        radius: 7,
      })
        .bindPopup("Điểm 1 (Xuất phát)")
        .addTo(userMarkerLayer);

      document.getElementById("route-info").innerHTML = `
        <div class="muted">Đã chọn Điểm 1. Vui lòng click thêm Điểm 2 trên bản đồ để tìm đường.</div>
      `;
    } else if (state.userPoints.length === 2) {
      userMarkerLayer.clearLayers();
      drawRoute(state.userPoints);
    }
  } else {
    // Chế độ 3: Nhiều điểm trung gian (thêm 1 hoặc nhiều điểm sau khi đã có sẵn điểm)
    haversineLineLayer.clearLayers();
    state.nearestStoreInfo = null;
    state.userPoints.push(p);

    if (state.userPoints.length === 1) {
      userMarkerLayer.clearLayers();
      L.circleMarker([p.lat, p.lng], {
        color: "#16a34a",
        fillColor: "#16a34a",
        fillOpacity: 0.9,
        radius: 7,
      })
        .bindPopup("Điểm 1 (Bắt đầu)")
        .addTo(userMarkerLayer);

      document.getElementById("route-info").innerHTML = `
        <div class="muted">Đã thêm Điểm 1. Hãy click thêm các điểm tiếp theo trên bản đồ.</div>
      `;
    } else {
      userMarkerLayer.clearLayers();
      drawRoute(state.userPoints);
    }
  }

  renderPointList();
}

map.on("click", (e) => {
  const { lat, lng } = e.latlng;
  showClickedCoords(lat, lng);
  handlePointAdd({ lat, lng });
});

// ---------- 10. GIAO DIỆN: ĐIỀU KHIỂN & DANH SÁCH ĐIỂM ----------
const coordBox = document.getElementById("coord-input");
function showClickedCoords(lat, lng) {
  coordBox.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function renderPointList() {
  const ul = document.getElementById("point-list");
  const countEl = document.getElementById("point-count");
  if (countEl) countEl.textContent = state.userPoints.length;
  ul.innerHTML = "";

  if (state.userPoints.length === 0) {
    ul.innerHTML = `<li style="background:transparent; color:#64748b; font-style:italic;">Chưa chọn điểm nào</li>`;
    return;
  }

  state.userPoints.forEach((p, i) => {
    const li = document.createElement("li");

    const textSpan = document.createElement("span");
    const labelText = p.label ? ` (${p.label})` : "";
    textSpan.textContent = `Điểm ${i + 1}${labelText}: ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`;
    textSpan.style.flex = "1";

    const actions = document.createElement("div");
    actions.className = "point-actions";

    const delBtn = document.createElement("span");
    delBtn.className = "btn-del";
    delBtn.textContent = "✕";
    delBtn.title = "Xóa điểm này";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      state.userPoints.splice(i, 1);
      redrawFromState();
    };

    actions.appendChild(delBtn);
    li.appendChild(textSpan);
    li.appendChild(actions);

    li.onclick = () => {
      map.flyTo([p.lat, p.lng], 15, { duration: 0.8 });
    };

    ul.appendChild(li);
  });
}

function redrawFromState() {
  userMarkerLayer.clearLayers();
  routeMarkerLayer.clearLayers();
  haversineLineLayer.clearLayers();

  removeRoutingControl();

  if (state.userPoints.length === 0) {
    document.getElementById("route-info").textContent = "Chưa có đường đi.";
    renderPointList();
    return;
  }

  if (state.mode === "nearest") {
    handlePointAdd(state.userPoints[0]);
  } else if (state.userPoints.length === 1) {
    L.circleMarker([state.userPoints[0].lat, state.userPoints[0].lng], {
      color: "#16a34a",
      radius: 7,
    }).addTo(userMarkerLayer);
    document.getElementById("route-info").innerHTML =
      `<div class="muted">Đã chọn Điểm 1. Cần thêm ít nhất 1 điểm nữa.</div>`;
  } else {
    drawRoute(state.userPoints);
  }

  renderPointList();
}

function clearAll() {
  state.userPoints = [];
  state.nearestStoreInfo = null;
  userMarkerLayer.clearLayers();
  routeMarkerLayer.clearLayers();
  haversineLineLayer.clearLayers();
  gpsLayer.clearLayers();

  removeRoutingControl();

  document.getElementById("route-info").textContent =
    "Chưa có đường đi. Click lên bản đồ hoặc dùng định vị để bắt đầu.";
  renderPointList();
}

// ---------- 11. NHẬP TỌA ĐỘ VÀ GỢI Ý ĐỊA DANH ----------
const sugEl = document.getElementById("coord-suggestions");
coordBox.addEventListener("input", () => {
  const q = coordBox.value.trim().toLowerCase();
  sugEl.innerHTML = "";
  if (q.length < 1) return;

  const matches = LANDMARKS.filter((l) => l.name.toLowerCase().includes(q));
  matches.forEach((l) => {
    const li = document.createElement("li");
    li.textContent = `📍 ${l.name} (${l.lat}, ${l.lng})`;
    li.onclick = () => {
      coordBox.value = `${l.lat}, ${l.lng}`;
      sugEl.innerHTML = "";
      map.flyTo([l.lat, l.lng], 15);
      handlePointAdd({ lat: l.lat, lng: l.lng, label: l.name });
    };
    sugEl.appendChild(li);
  });
});

document.addEventListener("click", (e) => {
  if (!coordBox.contains(e.target) && !sugEl.contains(e.target)) {
    sugEl.innerHTML = "";
  }
});

document.getElementById("btn-add-coord").onclick = () => {
  const coords = parseCoordinates(coordBox.value);
  if (!coords) {
    alert("Tọa độ không hợp lệ! Vui lòng nhập đúng dạng: lat, lng (VD: 10.7769, 106.7009)");
    return;
  }
  map.setView([coords.lat, coords.lng], 15);
  handlePointAdd(coords);
};

coordBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("btn-add-coord").click();
  }
});

document.getElementById("btn-add-store").onclick = () => {
  const coords = parseCoordinates(coordBox.value);
  if (!coords) {
    alert("Vui lòng click trên bản đồ hoặc nhập tọa độ hợp lệ trước khi tạo cửa hàng!");
    return;
  }
  const name = prompt("Nhập tên cho cửa hàng mới:", `Cửa hàng chi nhánh #${nextStoreId}`);
  if (!name || !name.trim()) return;

  const newStore = {
    id: nextStoreId++,
    name: name.trim(),
    lat: coords.lat,
    lng: coords.lng,
    isDefault: false,
  };

  STORES.push(newStore);
  saveCustomStores();
  renderStoreMarkers();
  renderStoreList();
  map.flyTo([newStore.lat, newStore.lng], 15);

  if (state.mode === "nearest" && state.userPoints.length > 0) {
    handlePointAdd(state.userPoints[0]);
  }
};

// ---------- 12. TÍNH NĂNG ĐỊNH VỊ GPS ----------
document.getElementById("btn-gps").onclick = () => {
  if (!navigator.geolocation) {
    alert("Trình duyệt của bạn không hỗ trợ Geolocation API!");
    return;
  }

  const btn = document.getElementById("btn-gps");
  const origText = btn.textContent;
  btn.textContent = "⏳ Đang định vị...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.textContent = origText;
      const { latitude, longitude } = pos.coords;
      gpsLayer.clearLayers();

      L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: "custom-gps-pin",
          html: '<div class="marker-gps-icon" title="Vị trí hiện tại của bạn"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      })
        .bindPopup("<b>📍 Vị trí hiện tại của bạn</b>")
        .addTo(gpsLayer);

      showClickedCoords(latitude, longitude);
      map.flyTo([latitude, longitude], 15);
      handlePointAdd({ lat: latitude, lng: longitude, label: "Vị trí của tôi" });
    },
    (err) => {
      btn.textContent = origText;
      let msg = "Không thể lấy vị trí hiện tại: ";
      switch (err.code) {
        case err.PERMISSION_DENIED:
          msg += "Người dùng từ chối cấp quyền truy cập vị trí.";
          break;
        case err.POSITION_UNAVAILABLE:
          msg += "Không nhận được tín hiệu định vị.";
          break;
        case err.TIMEOUT:
          msg += "Hết thời gian chờ phản hồi định vị.";
          break;
        default:
          msg += err.message;
      }
      alert(msg);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

// ---------- 13. TỐI ƯU HÓA LỘ TRÌNH (TSP BUTTON) ----------
document.getElementById("btn-optimize").onclick = () => {
  if (state.userPoints.length < 3) {
    alert("Tính năng tối ưu lộ trình (TSP) áp dụng khi có từ 3 điểm trở lên!");
    return;
  }

  const optimized = optimizePointsOrder(state.userPoints);
  state.userPoints = optimized;
  drawRoute(state.userPoints);
  renderPointList();
};

// ---------- 14. CHUYỂN ĐỔI CHẾ ĐỘ & PHƯƠNG TIỆN (GIỮ LẠI ĐIỂM KHI ĐỔI CHẾ ĐỘ) ----------
document.querySelectorAll('input[name="mode"]').forEach((r) => {
  r.addEventListener("change", (e) => {
    state.mode = e.target.value;
    
    // Nếu chuyển sang chế độ nearest, chỉ giữ lại điểm đầu tiên (nếu có)
    if (state.mode === "nearest" && state.userPoints.length > 0) {
      state.userPoints = [state.userPoints[0]];
    } else if (state.mode === "twoPoints" && state.userPoints.length > 2) {
      state.userPoints = state.userPoints.slice(0, 2);
    }
    
    // Vẽ lại từ trạng thái hiện tại thay vì xóa sạch toàn bộ
    redrawFromState();
  });
});

document.getElementById("travel-profile").addEventListener("change", (e) => {
  state.profile = e.target.value;
  if (state.userPoints.length >= 2) {
    drawRoute(state.userPoints);
  } else if (state.mode === "nearest" && state.userPoints.length === 1) {
    handlePointAdd(state.userPoints[0]);
  }
});

document.getElementById("btn-clear").onclick = clearAll;

// ---------- 15. RESPONSIVE SIDEBAR MOBILE TOGGLE ----------
const sidebarEl = document.getElementById("sidebar");
const toggleBtn = document.getElementById("sidebar-toggle");
const closeBtn = document.getElementById("sidebar-close");

if (toggleBtn && sidebarEl) {
  toggleBtn.onclick = () => {
    sidebarEl.classList.toggle("active");
  };
}

if (closeBtn && sidebarEl) {
  closeBtn.onclick = () => {
    sidebarEl.classList.remove("active");
  };
}

map.on("click", () => {
  if (window.innerWidth <= 768 && sidebarEl && sidebarEl.classList.contains("active")) {
    sidebarEl.classList.remove("active");
  }
});

// ---------- 16. KHỞI TẠO DỮ LIỆU BAN ĐẦU ----------
renderStoreMarkers();
renderStoreList();
renderPointList();
