const expectedRole = "operator";
const token = localStorage.getItem("access_token") || "";
let map;
const mapLayers = [];
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
  infrastructure: document.getElementById("infrastructure-section"),
  incidents: document.getElementById("incidents-section"),
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
  if (sectionKey === "infrastructure" && map) {
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
  map = L.map("operator-map").setView([10.7769, 106.7009], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
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

function renderMap(featureCollection) {
  ensureMap();
  mapLayers.forEach((layer) => layer.remove());
  mapLayers.length = 0;
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
        Loại: ${feature.properties.loai} (${loaiStyle.symbol})<br/>
        Trạng thái: ${feature.properties.trang_thai}
      </div>
    `);
    layer.addTo(map);
    mapLayers.push(layer);
  });
  if (bounds.length) {
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }
}

function renderAssetStatusList(assets) {
  const container = document.getElementById("asset-status-list");
  container.innerHTML = "";
  if (!assets.length) {
    container.innerHTML = "<p class='section-note'>Chưa có dữ liệu hạ tầng.</p>";
    return;
  }
  assets.forEach((asset) => {
    const row = document.createElement("div");
    row.className = "flat-stat";
    row.innerHTML = `
      <p style="margin:0;font-weight:700;">${asset.ten}</p>
      <p class="section-note" style="margin:4px 0 0;">${asset.loai_ten || asset.loai} | ${asset.trang_thai_ten || asset.trang_thai || "N/A"}</p>
    `;
    container.appendChild(row);
  });
}

function renderOperatorNotifications(notifications) {
  const container = document.getElementById("operator-notification-list");
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

function renderIncidentList(incidents, techRanking) {
  const container = document.getElementById("incident-operator-list");
  container.innerHTML = "";
  if (!incidents.length) {
    container.innerHTML = "<p class='section-note'>Chưa có cảnh báo/sự cố.</p>";
    return;
  }

  incidents.forEach((item) => {
    const assignedTechIds = new Set((item.ky_thuat_vien_duoc_giao_info || []).map((tech) => tech.id));
    const requiredCount = Number(item.so_ky_thuat_can || 0);
    const assignedCount = Number(item.so_ky_thuat_da_phan_cong || 0);
    const isClosedForAssign = Boolean(item.da_du_ky_thuat);
    const row = document.createElement("div");
    row.className = "flat-stat";
    const availableTechOptions = techRanking
      .filter((tech) => !assignedTechIds.has(tech.id))
      .map((tech) => `<option value="${tech.id}">${tech.username} (${tech.so_su_co_duoc_giao} sự cố)</option>`)
      .join("");
    const assignedTechNames = (item.ky_thuat_vien_duoc_giao_info || []).map((tech) => tech.username).join(", ");
    row.innerHTML = `
      <p style="margin:0;font-weight:700;">${item.tieu_de}</p>
      <p class="section-note" style="margin:4px 0 8px;">${item.mo_ta}</p>
      <p class="section-note" style="margin:0 0 6px;">Trạng thái: ${getIncidentStatusLabel(item.trang_thai)} | Mức độ: ${item.muc_do}</p>
      <p class="section-note" style="margin:0 0 10px;">Kỹ thuật viên: ${assignedCount}/${requiredCount} ${assignedTechNames ? `| Đã giao: ${assignedTechNames}` : ""}</p>
      <div class="stack">
        <div class="field">
          <label class="label">Phân công kỹ thuật viên</label>
          <select data-tech-select="${item.id}" ${isClosedForAssign ? "disabled" : ""}>
            <option value="">${isClosedForAssign ? "-- Đã đủ kỹ thuật viên --" : "-- Chọn kỹ thuật viên --"}</option>
            ${availableTechOptions}
          </select>
        </div>
        <div class="field">
          <label class="label">Cập nhật trạng thái</label>
          <select data-status-select="${item.id}">
            <option value="chua_xu_ly" ${item.trang_thai === "chua_xu_ly" ? "selected" : ""}>Chưa xử lý</option>
            <option value="dang_xu_ly" ${item.trang_thai === "dang_xu_ly" ? "selected" : ""}>Đang xử lý</option>
            <option value="da_hoan_thanh" ${item.trang_thai === "da_hoan_thanh" ? "selected" : ""}>Đã hoàn thành</option>
          </select>
        </div>
        <button class="btn btn-primary" type="button" data-confirm-incident="${item.id}" ${isClosedForAssign ? "disabled" : ""}>
          ${isClosedForAssign ? "Đã đóng điều hướng kỹ thuật" : "Xác nhận & gửi kỹ thuật"}
        </button>
      </div>
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
  const [assetRes, incidentRes, techRes, mapRes, notificationRes] = await Promise.all([
    apiFetch("/api/hatang/"),
    apiFetch("/api/suco/"),
    apiFetch("/api/kythuatvien-xephang/"),
    fetch("/api/dulieubando/"),
    apiFetch("/api/suco/thongbao/"),
  ]);
  const assets = assetRes.ok ? normalizeListResponse(await assetRes.json()) : [];
  const incidents = incidentRes.ok ? normalizeListResponse(await incidentRes.json()) : [];
  const techRanking = techRes.ok ? normalizeListResponse(await techRes.json()) : [];
  const mapData = mapRes.ok ? await mapRes.json() : { type: "FeatureCollection", features: [] };
  const notifications = notificationRes.ok ? normalizeListResponse(await notificationRes.json()) : [];

  renderAssetStatusList(assets);
  renderIncidentList(incidents, techRanking);
  renderMap(mapData);
  renderOperatorNotifications(notifications);

  const activeCount = assets.filter((a) => (a.trang_thai_ten || "").toLowerCase().includes("hoạt động")).length;
  const issueCount = assets.length - activeCount;
  const pendingCount = incidents.filter((i) => i.trang_thai === "chua_xu_ly").length;
  document.getElementById("metric-active").textContent = String(activeCount);
  document.getElementById("metric-issue").textContent = String(issueCount);
  document.getElementById("metric-pending").textContent = String(pendingCount);
}

document.getElementById("incident-operator-list").addEventListener("click", async (event) => {
  const incidentId = event.target.getAttribute("data-confirm-incident");
  if (!incidentId) return;
  const techSelect = document.querySelector(`select[data-tech-select='${incidentId}']`);
  const statusSelect = document.querySelector(`select[data-status-select='${incidentId}']`);
  if (!techSelect?.value) {
    alert("Vui lòng chọn kỹ thuật viên để điều hướng.");
    return;
  }
  const payload = {
    nhan_vien_ky_thuat_id: techSelect?.value || null,
    trang_thai: statusSelect?.value || "dang_xu_ly",
  };
  const res = await apiFetch(`/api/suco/${incidentId}/xacnhan/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    alert("Xác nhận/phân công thất bại.");
    return;
  }
  await loadDashboardData();
});

document.getElementById("logout-btn").addEventListener("click", logout);
navButtons.forEach((btn) => btn.addEventListener("click", () => activateSection(btn.dataset.section)));
activateSection("overview");
loadProfile().then(loadDashboardData);
setInterval(loadDashboardData, 30000);
