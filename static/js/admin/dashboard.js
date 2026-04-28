const expectedRole = "admin";
const token = localStorage.getItem("access_token") || "";
const navButtons = document.querySelectorAll(".role-nav-btn");
const sectionMap = {
  overview: document.getElementById("overview-section"),
  assets: document.getElementById("assets-section"),
  users: document.getElementById("users-section"),
};
const userSearchInput = document.getElementById("user-search-input");
const userSortSelect = document.getElementById("user-sort-select");
let usersCache = [];
let incidentsCache = [];
let assetMap;
let assetMapMarker = null;
let assetMapLine = null;
let selectedLineCoords = [];
const loaiOptionsById = {};

function normalizeListResponse(data) {
  return data?.results || data || [];
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

function logout() {
  localStorage.removeItem("access_token");
  window.location.href = "/";
}

function ensureAssetMap() {
  if (assetMap) return;
  assetMap = L.map("asset-map-admin").setView([10.7769, 106.7009], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(assetMap);

  assetMap.on("click", (e) => {
    if (isCurrentLoaiDuongTuyen()) {
      selectedLineCoords.push([Number(e.latlng.lng.toFixed(6)), Number(e.latlng.lat.toFixed(6))]);
      renderLineGeometry();
      updateGeometryHint();
      return;
    }
    setPointGeometry(e.latlng.lat, e.latlng.lng);
  });
}

function clearGeometrySelection() {
  selectedLineCoords = [];
  if (assetMapMarker) {
    assetMapMarker.remove();
    assetMapMarker = null;
  }
  if (assetMapLine) {
    assetMapLine.remove();
    assetMapLine = null;
  }
}

function setPointGeometry(lat, lng) {
  const form = document.getElementById("asset-form");
  form.querySelector("input[name='vi_tri_lat']").value = Number(lat).toFixed(6);
  form.querySelector("input[name='vi_tri_lng']").value = Number(lng).toFixed(6);
  selectedLineCoords = [];
  if (assetMapLine) {
    assetMapLine.remove();
    assetMapLine = null;
  }
  if (assetMapMarker) assetMapMarker.remove();
  assetMapMarker = L.marker([lat, lng]).addTo(assetMap);
  updateGeometryHint();
}

function renderLineGeometry() {
  if (!assetMap) return;
  if (assetMapMarker) {
    assetMapMarker.remove();
    assetMapMarker = null;
  }
  if (assetMapLine) assetMapLine.remove();
  if (selectedLineCoords.length < 1) return;
  const latlngs = selectedLineCoords.map((coord) => [coord[1], coord[0]]);
  assetMapLine = L.polyline(latlngs, { color: "#0284c7", weight: 4 }).addTo(assetMap);
}

function setAssetMarkerFromForm() {
  if (!assetMap) return;
  const lat = Number(document.querySelector("#asset-form input[name='vi_tri_lat']").value);
  const lng = Number(document.querySelector("#asset-form input[name='vi_tri_lng']").value);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return;
  setPointGeometry(lat, lng);
  assetMap.setView([lat, lng], 15);
}

function isCurrentLoaiDuongTuyen() {
  const loaiId = Number(document.getElementById("asset-loai").value);
  return Boolean(loaiOptionsById[loaiId]?.la_duong_tuyen);
}

function updateGeometryHint() {
  const hintEl = document.getElementById("asset-geometry-hint");
  if (!hintEl) return;
  const latInput = document.querySelector("#asset-form input[name='vi_tri_lat']");
  const lngInput = document.querySelector("#asset-form input[name='vi_tri_lng']");
  if (isCurrentLoaiDuongTuyen()) {
    hintEl.textContent = `Chế độ đường tuyến: nhấp nhiều điểm trên bản đồ (đã chọn ${selectedLineCoords.length} điểm, cần tối thiểu 2).`;
    if (latInput) {
      latInput.required = false;
      latInput.disabled = true;
      latInput.value = "";
    }
    if (lngInput) {
      lngInput.required = false;
      lngInput.disabled = true;
      lngInput.value = "";
    }
    return;
  }
  hintEl.textContent = "Chế độ điểm: nhấp 1 lần để chọn vị trí.";
  if (latInput) {
    latInput.disabled = false;
    latInput.required = true;
  }
  if (lngInput) {
    lngInput.disabled = false;
    lngInput.required = true;
  }
}

function activateSection(sectionKey) {
  Object.entries(sectionMap).forEach(([key, sectionEl]) => {
    if (!sectionEl) return;
    sectionEl.classList.toggle("hidden", key !== sectionKey);
  });
  navButtons.forEach((btn) => {
    const isActive = btn.dataset.section === sectionKey;
    btn.classList.toggle("role-nav-active", isActive);
  });
  if (sectionKey === "assets") {
    ensureAssetMap();
    setTimeout(() => assetMap.invalidateSize(), 50);
  }
}

function renderAssetAdminList(list) {
  const container = document.getElementById("asset-list-admin");
  container.innerHTML = "";
  if (!list.length) {
    container.innerHTML = "<p class='section-note'>Chưa có dữ liệu hạ tầng.</p>";
    return;
  }
  list.forEach((asset) => {
    const row = document.createElement("div");
    row.className = "panel panel-padding";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <div>
          <p style="margin:0;font-weight:700;">${asset.ten}</p>
          <p class="section-note" style="margin:4px 0 0;">${asset.loai_ten || asset.loai} | ${asset.trang_thai_ten || asset.trang_thai || "N/A"}</p>
        </div>
        <div class="topbar-actions">
          <button data-edit="${asset.id}" class="btn btn-outline" type="button">Sửa</button>
          <button data-delete="${asset.id}" class="btn btn-danger" type="button">Xóa</button>
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderUserAdminList(list) {
  const container = document.getElementById("user-list-admin");
  container.innerHTML = "";
  if (!list.length) {
    container.innerHTML = "<p class='section-note'>Chưa có người dùng.</p>";
    return;
  }
  list.forEach((user) => {
    const row = document.createElement("div");
    row.className = "panel panel-padding";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <div>
          <p style="margin:0;font-weight:700;">${user.username}</p>
          <p class="section-note" style="margin:4px 0 0;">${user.ho_ten || "Chưa cập nhật họ tên"} | ${user.email || "no-email"} | role: ${user.vai_tro}</p>
        </div>
        <div class="topbar-actions">
          <button data-edit-user="${user.id}" class="btn btn-outline" type="button">Sửa</button>
          <button data-delete-user="${user.id}" class="btn btn-danger" type="button">Xóa</button>
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

function applyUserFiltersAndSort() {
  const keyword = (userSearchInput?.value || "").trim().toLowerCase();
  const sortBy = userSortSelect?.value || "name_asc";
  const filtered = usersCache.filter((user) => {
    const username = (user.username || "").toLowerCase();
    const fullName = (user.ho_ten || "").toLowerCase();
    return username.includes(keyword) || fullName.includes(keyword);
  });
  filtered.sort((a, b) => {
    const nameA = a.ho_ten || a.username || "";
    const nameB = b.ho_ten || b.username || "";
    if (sortBy === "name_desc") return nameB.localeCompare(nameA);
    if (sortBy === "role_asc") return (a.vai_tro || "").localeCompare(b.vai_tro || "");
    if (sortBy === "role_desc") return (b.vai_tro || "").localeCompare(a.vai_tro || "");
    return nameA.localeCompare(nameB);
  });
  renderUserAdminList(filtered);
}

function renderOverviewMetrics(users, incidents) {
  const byRole = users.reduce((acc, user) => {
    acc[user.vai_tro] = (acc[user.vai_tro] || 0) + 1;
    return acc;
  }, {});
  const incidentTotal = incidents.length;
  const incidentDone = incidents.filter((item) => item.trang_thai === "da_hoan_thanh").length;
  const incidentProcessing = incidents.filter((item) => item.trang_thai === "dang_xu_ly").length;

  document.getElementById("metric-tech-count").textContent = String(byRole.technical || 0);
  document.getElementById("metric-operator-count").textContent = String(byRole.operator || 0);
  document.getElementById("metric-citizen-count").textContent = String(byRole.citizen || 0);
  document.getElementById("metric-incident-total").textContent = String(incidentTotal);
  document.getElementById("metric-incident-done").textContent = String(incidentDone);
  document.getElementById("metric-incident-processing").textContent = String(incidentProcessing);
}

function renderAdminNotifications(notifications) {
  const container = document.getElementById("admin-notification-list");
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

async function loadAssetOptions() {
  const loaiRes = await apiFetch("/api/loaihatang/");
  const loaiData = normalizeListResponse(await loaiRes.json());
  loaiData.forEach((item) => {
    loaiOptionsById[item.id] = item;
  });
  const loaiSelect = document.getElementById("asset-loai");
  loaiSelect.innerHTML = loaiData.map((item) => `<option value="${item.id}">${item.ten}</option>`).join("");
  updateGeometryHint();

  const ttRes = await apiFetch("/api/trangthai-hatang/");
  const ttData = normalizeListResponse(await ttRes.json());
  const ttSelect = document.getElementById("asset-trang-thai");
  ttSelect.innerHTML = ttData.map((item) => `<option value="${item.id}">${item.ten_hien_thi}</option>`).join("");
}

async function loadAssetsAdmin() {
  const res = await apiFetch("/api/hatang/");
  if (!res.ok) return [];
  const data = normalizeListResponse(await res.json());
  renderAssetAdminList(data);
  return data;
}

async function loadUsersAdmin() {
  const res = await apiFetch("/api/nguoidung/");
  if (!res.ok) return [];
  const data = normalizeListResponse(await res.json());
  usersCache = data;
  applyUserFiltersAndSort();
  return data;
}

async function loadIncidentsAdmin() {
  const res = await apiFetch("/api/suco/");
  if (!res.ok) return [];
  incidentsCache = normalizeListResponse(await res.json());
  return incidentsCache;
}

async function loadAdminNotifications() {
  const res = await apiFetch("/api/suco/thongbao/");
  if (!res.ok) return [];
  const data = normalizeListResponse(await res.json());
  renderAdminNotifications(data);
  return data;
}

async function loadProfile() {
  if (!token) {
    logout();
    return;
  }

  const res = await apiFetch("/api/me/");
  if (!res.ok) {
    logout();
    return;
  }

  const user = await res.json();
  if (user.vai_tro !== expectedRole) {
    window.location.href = "/";
    return;
  }
  document.getElementById("welcome-text").textContent = `Xin chào ${user.username} (${user.vai_tro}).`;
}

document.getElementById("asset-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const id = formData.get("id");
  const payload = {
    ten: formData.get("ten"),
    loai: Number(formData.get("loai")),
    trang_thai: Number(formData.get("trang_thai")),
    ngay_lap_dat: formData.get("ngay_lap_dat") || null,
    nha_san_xuat: formData.get("nha_san_xuat"),
    ghi_chu: formData.get("ghi_chu"),
  };
  if (isCurrentLoaiDuongTuyen()) {
    if (selectedLineCoords.length < 2) {
      alert("Loại hạ tầng đường tuyến yêu cầu tối thiểu 2 điểm để tạo LineString.");
      return;
    }
    const lineStringWkt = `LINESTRING(${selectedLineCoords.map((coord) => `${coord[0]} ${coord[1]}`).join(", ")})`;
    payload.vi_tri_duong = lineStringWkt;
  } else {
    payload.vi_tri_lat = parseNumber(formData.get("vi_tri_lat"));
    payload.vi_tri_lng = parseNumber(formData.get("vi_tri_lng"));
  }
  const url = id ? `/api/hatang/${id}/` : "/api/hatang/";
  const method = id ? "PATCH" : "POST";
  const res = await apiFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let message = "Lưu hạ tầng thất bại.";
    try {
      const err = await res.json();
      if (typeof err === "object" && err) {
        const firstError = Object.values(err)[0];
        if (Array.isArray(firstError) && firstError.length) {
          message = firstError[0];
        } else if (typeof firstError === "string") {
          message = firstError;
        } else if (err.detail) {
          message = err.detail;
        }
      }
    } catch (_) {
      // Keep default error message when response is not JSON.
    }
    alert(message);
    return;
  }
  form.reset();
  form.querySelector("input[name='id']").value = "";
  clearGeometrySelection();
  updateGeometryHint();
  await loadAssetsAdmin();
});

document.getElementById("asset-reset-btn").addEventListener("click", () => {
  const form = document.getElementById("asset-form");
  form.reset();
  form.querySelector("input[name='id']").value = "";
  clearGeometrySelection();
  updateGeometryHint();
});

document.getElementById("asset-clear-geometry-btn").addEventListener("click", () => {
  clearGeometrySelection();
  const form = document.getElementById("asset-form");
  form.querySelector("input[name='vi_tri_lat']").value = "";
  form.querySelector("input[name='vi_tri_lng']").value = "";
  updateGeometryHint();
});

document.getElementById("asset-loai").addEventListener("change", () => {
  clearGeometrySelection();
  updateGeometryHint();
});

document.getElementById("asset-list-admin").addEventListener("click", async (event) => {
  const editId = event.target.getAttribute("data-edit");
  const deleteId = event.target.getAttribute("data-delete");
  if (editId) {
    const res = await apiFetch(`/api/hatang/${editId}/`);
    if (!res.ok) return;
    const item = await res.json();
    const form = document.getElementById("asset-form");
    form.querySelector("input[name='id']").value = item.id;
    form.querySelector("input[name='ten']").value = item.ten || "";
    form.querySelector("select[name='loai']").value = item.loai || "";
    form.querySelector("select[name='trang_thai']").value = item.trang_thai || "";
    form.querySelector("input[name='ngay_lap_dat']").value = item.ngay_lap_dat || "";
    form.querySelector("input[name='nha_san_xuat']").value = item.nha_san_xuat || "";
    form.querySelector("textarea[name='ghi_chu']").value = item.ghi_chu || "";
    const coords = item.vi_tri?.coordinates || [];
    clearGeometrySelection();
    if (item.vi_tri?.type === "LineString" && Array.isArray(coords) && coords.length) {
      selectedLineCoords = coords.map((coord) => [Number(coord[0]), Number(coord[1])]);
      renderLineGeometry();
      if (selectedLineCoords.length) {
        assetMap.setView([selectedLineCoords[0][1], selectedLineCoords[0][0]], 15);
      }
    } else {
      form.querySelector("input[name='vi_tri_lng']").value = coords[0] ?? "";
      form.querySelector("input[name='vi_tri_lat']").value = coords[1] ?? "";
      setAssetMarkerFromForm();
    }
    updateGeometryHint();
  }
  if (deleteId) {
    if (!confirm("Xóa hạ tầng này?")) return;
    const res = await apiFetch(`/api/hatang/${deleteId}/`, { method: "DELETE" });
    if (res.ok) await loadAssetsAdmin();
  }
});

document.getElementById("user-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const id = formData.get("id");
  const payload = {
    username: formData.get("username"),
    email: formData.get("email"),
    ho_ten: formData.get("ho_ten"),
    ngay_sinh: formData.get("ngay_sinh") || null,
    gioi_tinh: formData.get("gioi_tinh"),
    dia_chi: formData.get("dia_chi"),
    vai_tro: formData.get("vai_tro"),
    so_dien_thoai: formData.get("so_dien_thoai"),
  };
  if (formData.get("password")) payload.password = formData.get("password");
  const url = id ? `/api/nguoidung/${id}/` : "/api/nguoidung/";
  const method = id ? "PATCH" : "POST";
  const res = await apiFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    alert("Lưu người dùng thất bại.");
    return;
  }
  form.reset();
  form.querySelector("input[name='id']").value = "";
  await loadUsersAdmin();
  renderOverviewMetrics(usersCache, incidentsCache);
});

document.getElementById("user-reset-btn").addEventListener("click", () => {
  const form = document.getElementById("user-form");
  form.reset();
  form.querySelector("input[name='id']").value = "";
});

document.getElementById("user-list-admin").addEventListener("click", async (event) => {
  const editId = event.target.getAttribute("data-edit-user");
  const deleteId = event.target.getAttribute("data-delete-user");
  if (editId) {
    const res = await apiFetch(`/api/nguoidung/${editId}/`);
    if (!res.ok) return;
    const user = await res.json();
    const form = document.getElementById("user-form");
    form.querySelector("input[name='id']").value = user.id;
    form.querySelector("input[name='username']").value = user.username || "";
    form.querySelector("input[name='email']").value = user.email || "";
    form.querySelector("input[name='ho_ten']").value = user.ho_ten || "";
    form.querySelector("input[name='ngay_sinh']").value = user.ngay_sinh || "";
    form.querySelector("select[name='gioi_tinh']").value = user.gioi_tinh || "";
    form.querySelector("textarea[name='dia_chi']").value = user.dia_chi || "";
    form.querySelector("select[name='vai_tro']").value = user.vai_tro || "citizen";
    form.querySelector("input[name='so_dien_thoai']").value = user.so_dien_thoai || "";
    form.querySelector("input[name='password']").value = "";
  }
  if (deleteId) {
    if (!confirm("Xóa người dùng này?")) return;
    const res = await apiFetch(`/api/nguoidung/${deleteId}/`, { method: "DELETE" });
    if (res.ok) {
      await loadUsersAdmin();
      renderOverviewMetrics(usersCache, incidentsCache);
    }
  }
});

document.getElementById("logout-btn").addEventListener("click", logout);
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => activateSection(btn.dataset.section));
});
if (userSearchInput) {
  userSearchInput.addEventListener("input", applyUserFiltersAndSort);
}
if (userSortSelect) {
  userSortSelect.addEventListener("change", applyUserFiltersAndSort);
}

async function initAdminDashboard() {
  activateSection("overview");
  await loadProfile();
  const [users, incidents] = await Promise.all([
    loadUsersAdmin(),
    loadIncidentsAdmin(),
    loadAssetOptions(),
    loadAssetsAdmin(),
    loadAdminNotifications(),
  ]);
  renderOverviewMetrics(users || [], incidents || []);
}

initAdminDashboard();
