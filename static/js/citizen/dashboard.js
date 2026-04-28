const expectedRole = "citizen";
const token = localStorage.getItem("access_token") || "";
let map;
let selectedLatLng = null;
let selectedMarker = null;
const infraLayers = [];
const loaiStyleCache = new Map();
const stylePalette = [
  { color: "#0ea5e9", symbol: "C" },
  { color: "#22c55e", symbol: "D" },
  { color: "#f97316", symbol: "T" },
  { color: "#a855f7", symbol: "N" },
  { color: "#ef4444", symbol: "H" },
  { color: "#14b8a6", symbol: "K" },
];
const navButtons = document.querySelectorAll(".role-nav-btn");
const sectionMap = {
  overview: document.getElementById("overview-section"),
  report: document.getElementById("report-section"),
  tracking: document.getElementById("tracking-section"),
};

function logout() {
  localStorage.removeItem("access_token");
  window.location.href = "/";
}

function activateSection(sectionKey) {
  Object.entries(sectionMap).forEach(([key, sectionEl]) => {
    if (!sectionEl) return;
    sectionEl.classList.toggle("hidden", key !== sectionKey);
  });
  navButtons.forEach((btn) => {
    btn.classList.toggle("role-nav-active", btn.dataset.section === sectionKey);
  });
  if (sectionKey === "report" && map) {
    setTimeout(() => map.invalidateSize(), 50);
  }
}

function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

function normalizeListResponse(data) {
  return data?.results || data || [];
}

function getIncidentStatusLabel(status) {
  if (status === "chua_xu_ly") return "Chưa xử lý";
  if (status === "dang_xu_ly") return "Đang xử lý";
  if (status === "da_hoan_thanh") return "Đã hoàn thành";
  return status || "Không xác định";
}

function ensureMap() {
  if (map) return;
  map = L.map("citizen-map").setView([10.7769, 106.7009], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
  map.on("click", (e) => {
    selectedLatLng = e.latlng;
    if (selectedMarker) selectedMarker.remove();
    selectedMarker = L.marker(e.latlng).addTo(map);
    document.getElementById("selected-location-text").textContent =
      `Đã chọn vị trí: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
  });
}

function getLoaiStyle(loaiName) {
  const key = (loaiName || "Khác").trim();
  if (!loaiStyleCache.has(key)) {
    const paletteItem = stylePalette[loaiStyleCache.size % stylePalette.length];
    const symbol = key.charAt(0).toUpperCase() || paletteItem.symbol;
    loaiStyleCache.set(key, { ...paletteItem, symbol });
  }
  return loaiStyleCache.get(key);
}

function renderInfrastructureOnMap(featureCollection) {
  ensureMap();
  infraLayers.forEach((layer) => layer.remove());
  infraLayers.length = 0;
  const bounds = [];
  featureCollection.features.forEach((feature) => {
    const geometry = typeof feature.geometry === "string" ? JSON.parse(feature.geometry) : feature.geometry;
    if (!geometry) return;
    const loaiStyle = getLoaiStyle(feature.properties?.loai);
    let layer = null;
    if (geometry.type === "Point") {
      layer = L.circleMarker([geometry.coordinates[1], geometry.coordinates[0]], {
        radius: 9,
        color: loaiStyle.color,
        fillColor: loaiStyle.color,
        fillOpacity: 0.85,
        weight: 2,
      });
      bounds.push([geometry.coordinates[1], geometry.coordinates[0]]);
    } else if (geometry.type === "LineString") {
      const latLngs = geometry.coordinates.map((coord) => [coord[1], coord[0]]);
      layer = L.polyline(latLngs, { color: loaiStyle.color, weight: 5, opacity: 0.9 });
      latLngs.forEach((latlng) => bounds.push(latlng));
    }
    if (!layer) return;
    layer.bindPopup(`
      <div>
        <b>${feature.properties.ten}</b><br/>
        Loại thiết bị: ${feature.properties.loai} (${loaiStyle.symbol})<br/>
        Trạng thái: ${feature.properties.trang_thai}
      </div>
    `);
    layer.addTo(map);
    infraLayers.push(layer);
  });
  if (bounds.length) {
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }
}

function renderMyIncidentList(incidents) {
  const container = document.getElementById("citizen-incident-list");
  container.innerHTML = "";
  if (!incidents.length) {
    container.innerHTML = "<p class='section-note'>Bạn chưa gửi báo cáo nào.</p>";
    return;
  }
  incidents.forEach((item) => {
    const row = document.createElement("div");
    row.className = "flat-stat";
    row.innerHTML = `
      <p style="margin:0;font-weight:700;">${item.tieu_de}</p>
      <p class="section-note" style="margin:4px 0 0;">${item.mo_ta}</p>
      <p class="section-note" style="margin:6px 0 0;">Trạng thái: ${getIncidentStatusLabel(item.trang_thai)} | Mức độ: ${item.muc_do}</p>
    `;
    container.appendChild(row);
  });
}

function renderCitizenNotifications(notifications) {
  const container = document.getElementById("citizen-notification-list");
  if (!container) return;
  container.innerHTML = "";
  if (!notifications.length) {
    container.innerHTML = "<p class='section-note'>Chưa có thông báo mới.</p>";
    return;
  }
  notifications.slice(0, 5).forEach((item) => {
    const row = document.createElement("div");
    row.className = "flat-stat";
    row.innerHTML = `
      <p style="margin:0;font-weight:700;">${item.tieu_de}</p>
      <p class="section-note" style="margin:4px 0 0;">${item.noi_dung}</p>
    `;
    container.appendChild(row);
  });
}

async function loadProfile() {
  if (!token) {
    logout();
    return;
  }

  const res = await fetch("/api/me/", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    logout();
    return;
  }

  const user = await res.json();
  if (user.vai_tro !== expectedRole) {
    window.location.href = "/";
    return;
  }

  const welcomeText = document.getElementById("welcome-text");
  welcomeText.textContent = `Xin chào ${user.username} (${user.vai_tro}).`;
}

async function loadDashboardData() {
  const [mapRes, incidentRes, notificationRes] = await Promise.all([
    fetch("/api/dulieubando/"),
    apiFetch("/api/suco/"),
    apiFetch("/api/suco/thongbao/"),
  ]);
  const mapData = mapRes.ok ? await mapRes.json() : { type: "FeatureCollection", features: [] };
  const incidents = incidentRes.ok ? normalizeListResponse(await incidentRes.json()) : [];
  const notifications = notificationRes.ok ? normalizeListResponse(await notificationRes.json()) : [];
  renderInfrastructureOnMap(mapData);
  renderMyIncidentList(incidents);
  renderCitizenNotifications(notifications);

  document.getElementById("metric-sent").textContent = String(incidents.length);
  document.getElementById("metric-processing").textContent = String(incidents.filter((i) => i.trang_thai === "dang_xu_ly").length);
  document.getElementById("metric-done").textContent = String(incidents.filter((i) => i.trang_thai === "da_hoan_thanh").length);
}

document.getElementById("citizen-incident-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedLatLng) {
    alert("Vui lòng nhấp bản đồ để chọn vị trí sự cố.");
    return;
  }
  const formData = new FormData(event.target);
  formData.append("vi_tri_lat", selectedLatLng.lat);
  formData.append("vi_tri_lng", selectedLatLng.lng);
  const res = await apiFetch("/api/suco/", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    alert("Gửi báo cáo sự cố thất bại.");
    return;
  }
  event.target.reset();
  selectedLatLng = null;
  if (selectedMarker) {
    selectedMarker.remove();
    selectedMarker = null;
  }
  document.getElementById("selected-location-text").textContent = "Chưa chọn vị trí sự cố.";
  await loadDashboardData();
});

document.getElementById("logout-btn").addEventListener("click", logout);
navButtons.forEach((btn) => btn.addEventListener("click", () => activateSection(btn.dataset.section)));
activateSection("overview");
loadProfile().then(loadDashboardData);
