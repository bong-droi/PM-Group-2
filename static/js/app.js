let accessToken = localStorage.getItem("access_token") || "";
let currentUser = null;
let selectedIncidentLatLng = null;
let selectedIncidentMarker = null;
let map;
const layerGroups = {};
const allFeatures = [];

const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authMessage = document.getElementById("auth-message");
const currentRoleText = document.getElementById("current-role");
const incidentList = document.getElementById("incident-list");
const adminPanels = document.getElementById("admin-panels");

function normalizeListResponse(data) {
  return data?.results || data || [];
}

function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return fetch(url, { ...options, headers });
}

async function fetchCurrentUser() {
  const res = await apiFetch("/api/me/");
  if (res.status === 401 || res.status === 403) {
    return null;
  }
  return res.json();
}

function renderAuthState(isLoggedIn) {
  authSection.classList.toggle("hidden", isLoggedIn);
  appSection.classList.toggle("hidden", !isLoggedIn);
}

function getColorByType(typeName) {
  const name = (typeName || "").toLowerCase();
  if (name.includes("đường dây điện")) return "#f59e0b";
  if (name.includes("đường ống nước")) return "#0ea5e9";
  if (name.includes("máy bơm")) return "#3b82f6";
  if (name.includes("biến áp")) return "#ef4444";
  if (name.includes("trụ điện")) return "#6b7280";
  return "#10b981";
}

function ensureMap() {
  if (map) return;
  map = L.map("map").setView([10.7769, 106.7009], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    referrerPolicy: "strict-origin-when-cross-origin",
  }).addTo(map);

  map.on("click", (e) => {
    selectedIncidentLatLng = e.latlng;
    if (selectedIncidentMarker) {
      selectedIncidentMarker.remove();
    }
    selectedIncidentMarker = L.marker(e.latlng).addTo(map);
    const locationText = document.getElementById("incident-location-display");
    locationText.textContent = `Đã chọn: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
    L.popup()
      .setLatLng(e.latlng)
      .setContent(`Đã chọn vị trí sự cố: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`)
      .openOn(map);
  });
}

function renderLayerFilters() {
  const container = document.getElementById("layer-filters");
  container.innerHTML = "";
  Object.keys(layerGroups).forEach((name) => {
    const id = `layer-${name.replaceAll(" ", "-")}`;
    const row = document.createElement("label");
    row.className = "flex items-center gap-2";
    row.innerHTML = `<input id="${id}" type="checkbox" checked /> ${name}`;
    container.appendChild(row);
    row.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) {
        map.addLayer(layerGroups[name]);
      } else {
        map.removeLayer(layerGroups[name]);
      }
    });
  });
}

function renderMapFeatures(featureCollection) {
  allFeatures.length = 0;
  Object.keys(layerGroups).forEach((name) => {
    map.removeLayer(layerGroups[name]);
    delete layerGroups[name];
  });

  featureCollection.features.forEach((feature) => {
    let geometry = feature.geometry;
    if (typeof geometry === "string") {
      geometry = JSON.parse(geometry);
    }
    const typeName = feature.properties.loai;
    if (!layerGroups[typeName]) {
      layerGroups[typeName] = L.layerGroup().addTo(map);
    }
    let layer;
    if (geometry.type === "Point") {
      layer = L.circleMarker([geometry.coordinates[1], geometry.coordinates[0]], {
        radius: 8,
        color: getColorByType(typeName),
      });
    } else if (geometry.type === "LineString") {
      const latlngs = geometry.coordinates.map((coord) => [coord[1], coord[0]]);
      layer = L.polyline(latlngs, {
        color: getColorByType(typeName),
        weight: 5,
      });
    }

    if (!layer) return;
    const statusClass = (feature.properties.trang_thai || "").toLowerCase().replaceAll(" ", "_");
    layer.bindPopup(`
      <div class="space-y-1">
        <h4 class="font-semibold">${feature.properties.ten}</h4>
        <p>Loại: ${feature.properties.loai}</p>
        <span class="status-badge status-${statusClass}">${feature.properties.trang_thai}</span>
      </div>
    `);
    layer.addTo(layerGroups[typeName]);
    allFeatures.push(layer);
  });
  renderLayerFilters();
}

async function loadMapData() {
  const res = await fetch("/api/dulieubando/");
  const data = await res.json();
  renderMapFeatures(data);
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function renderIncidents(list) {
  incidentList.innerHTML = "";
  if (!list.length) {
    incidentList.innerHTML = `<p class="text-slate-500">Chưa có sự cố.</p>`;
    return;
  }
  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "border rounded p-2";
    div.innerHTML = `
      <h4 class="font-medium">${item.tieu_de}</h4>
      <p class="text-xs text-slate-500">${item.mo_ta}</p>
      <p class="text-xs mt-1">Trạng thái: <b>${item.trang_thai}</b> | Mức độ: <b>${item.muc_do}</b></p>
    `;
    incidentList.appendChild(div);
  });
}

async function loadIncidents() {
  const res = await apiFetch("/api/suco/");
  if (!res.ok) return;
  const data = await res.json();
  renderIncidents(data.results || data);
}

async function loadTechRanking() {
  const card = document.getElementById("tech-ranking-card");
  if (!["admin", "operator"].includes(currentUser.vai_tro)) {
    card.classList.add("hidden");
    return;
  }

  const res = await apiFetch("/api/kythuatvien-xephang/");
  if (!res.ok) return;
  const data = await res.json();
  card.classList.remove("hidden");
  const container = document.getElementById("tech-ranking");
  container.innerHTML = "";
  data.forEach((tech) => {
    const row = document.createElement("p");
    row.textContent = `${tech.username} - ${tech.so_su_co_duoc_giao} sự cố`;
    container.appendChild(row);
  });
}

function renderAssetAdminList(list) {
  const container = document.getElementById("asset-list-admin");
  container.innerHTML = "";
  list.forEach((asset) => {
    const row = document.createElement("div");
    row.className = "border rounded p-2 flex items-center justify-between gap-2";
    row.innerHTML = `
      <div>
        <p class="font-medium">${asset.ten}</p>
        <p class="text-xs text-slate-500">${asset.loai_ten || asset.loai} | ${asset.trang_thai_ten || asset.trang_thai || "N/A"}</p>
      </div>
      <div class="flex gap-1">
        <button data-edit="${asset.id}" class="px-2 py-1 text-xs rounded bg-amber-500 text-white">Sửa</button>
        <button data-delete="${asset.id}" class="px-2 py-1 text-xs rounded bg-red-600 text-white">Xóa</button>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderUserAdminList(list) {
  const container = document.getElementById("user-list-admin");
  container.innerHTML = "";
  list.forEach((user) => {
    const row = document.createElement("div");
    row.className = "border rounded p-2 flex items-center justify-between gap-2";
    row.innerHTML = `
      <div>
        <p class="font-medium">${user.username}</p>
        <p class="text-xs text-slate-500">${user.email || "no-email"} | role: ${user.vai_tro}</p>
      </div>
      <div class="flex gap-1">
        <button data-edit-user="${user.id}" class="px-2 py-1 text-xs rounded bg-amber-500 text-white">Sửa</button>
        <button data-delete-user="${user.id}" class="px-2 py-1 text-xs rounded bg-red-600 text-white">Xóa</button>
      </div>
    `;
    container.appendChild(row);
  });
}

async function loadAssetOptions() {
  const loaiRes = await apiFetch("/api/loaihatang/");
  const loaiData = normalizeListResponse(await loaiRes.json());
  const loaiSelect = document.getElementById("asset-loai");
  loaiSelect.innerHTML = loaiData.map((item) => `<option value="${item.id}">${item.ten}</option>`).join("");

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
  renderUserAdminList(data);
  return data;
}

function setupAdminPanels() {
  if (currentUser.vai_tro !== "admin") {
    adminPanels.classList.add("hidden");
    return;
  }
  adminPanels.classList.remove("hidden");
}

async function bootstrapApp() {
  ensureMap();
  currentUser = await fetchCurrentUser();
  if (!currentUser) {
    accessToken = "";
    localStorage.removeItem("access_token");
    renderAuthState(false);
    return;
  }

  currentRoleText.textContent = `Tài khoản: ${currentUser.username} | Vai trò: ${currentUser.vai_tro}`;
  renderAuthState(true);
  setupAdminPanels();
  await Promise.all([loadMapData(), loadIncidents(), loadTechRanking()]);
  if (currentUser.vai_tro === "admin") {
    await Promise.all([loadAssetOptions(), loadAssetsAdmin(), loadUsersAdmin()]);
  }
}

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.classList.remove("text-emerald-600");
  authMessage.classList.add("text-red-600");
  authMessage.textContent = "";
  const formData = new FormData(event.target);
  const payload = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  const res = await fetch("/api/auth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    authMessage.textContent = "Sai thông tin đăng nhập hoặc tài khoản chưa được kích hoạt.";
    return;
  }
  const data = await res.json();
  accessToken = data.access;
  localStorage.setItem("access_token", accessToken);
  await bootstrapApp();
});

document.getElementById("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.classList.remove("text-emerald-600");
  authMessage.classList.add("text-red-600");
  authMessage.textContent = "";
  const formData = new FormData(event.target);
  const payload = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const res = await fetch("/api/dangky/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    authMessage.textContent = "Đăng ký thất bại, có thể username đã tồn tại.";
    return;
  }
  authMessage.classList.remove("text-red-600");
  authMessage.classList.add("text-emerald-600");
  authMessage.textContent = "Đăng ký thành công. Hãy đăng nhập.";
  event.target.reset();
});

document.getElementById("logout-btn").addEventListener("click", () => {
  accessToken = "";
  localStorage.removeItem("access_token");
  renderAuthState(false);
});

document.getElementById("incident-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedIncidentLatLng) {
    alert("Bạn cần chọn vị trí sự cố trên bản đồ.");
    return;
  }
  const formData = new FormData(event.target);
  formData.append("vi_tri_lat", selectedIncidentLatLng.lat);
  formData.append("vi_tri_lng", selectedIncidentLatLng.lng);

  const res = await apiFetch("/api/suco/", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let message = "Không thể gửi sự cố. Hãy kiểm tra lại dữ liệu.";
    try {
      const errorData = await res.json();
      if (errorData && typeof errorData === "object") {
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError) && firstError.length) {
          message = firstError[0];
        } else if (typeof firstError === "string") {
          message = firstError;
        }
      }
    } catch (_) {
      // Keep fallback message when response body is not JSON.
    }
    alert(message);
    return;
  }
  event.target.reset();
  selectedIncidentLatLng = null;
  if (selectedIncidentMarker) {
    selectedIncidentMarker.remove();
    selectedIncidentMarker = null;
  }
  const locationText = document.getElementById("incident-location-display");
  locationText.textContent = "";
  await loadIncidents();
});

if (document.getElementById("incident-location-display")) {
  document.getElementById("incident-location-display").textContent = "";
}

document.getElementById("asset-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentUser?.vai_tro !== "admin") return;
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
    vi_tri_lat: parseNumber(formData.get("vi_tri_lat")),
    vi_tri_lng: parseNumber(formData.get("vi_tri_lng")),
  };
  const url = id ? `/api/hatang/${id}/` : "/api/hatang/";
  const method = id ? "PATCH" : "POST";
  const res = await apiFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    alert("Lưu hạ tầng thất bại.");
    return;
  }
  form.reset();
  form.querySelector("input[name='id']").value = "";
  await Promise.all([loadAssetsAdmin(), loadMapData()]);
});

document.getElementById("asset-reset-btn").addEventListener("click", () => {
  const form = document.getElementById("asset-form");
  form.reset();
  form.querySelector("input[name='id']").value = "";
});

document.getElementById("asset-list-admin").addEventListener("click", async (event) => {
  if (currentUser?.vai_tro !== "admin") return;
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
    form.querySelector("input[name='vi_tri_lng']").value = coords[0] ?? "";
    form.querySelector("input[name='vi_tri_lat']").value = coords[1] ?? "";
  }
  if (deleteId) {
    if (!confirm("Xóa hạ tầng này?")) return;
    const res = await apiFetch(`/api/hatang/${deleteId}/`, { method: "DELETE" });
    if (res.ok) {
      await Promise.all([loadAssetsAdmin(), loadMapData()]);
    }
  }
});

document.getElementById("user-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentUser?.vai_tro !== "admin") return;
  const form = event.target;
  const formData = new FormData(form);
  const id = formData.get("id");
  const payload = {
    username: formData.get("username"),
    email: formData.get("email"),
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
});

document.getElementById("user-reset-btn").addEventListener("click", () => {
  const form = document.getElementById("user-form");
  form.reset();
  form.querySelector("input[name='id']").value = "";
});

document.getElementById("user-list-admin").addEventListener("click", async (event) => {
  if (currentUser?.vai_tro !== "admin") return;
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
    form.querySelector("select[name='vai_tro']").value = user.vai_tro || "citizen";
    form.querySelector("input[name='so_dien_thoai']").value = user.so_dien_thoai || "";
    form.querySelector("input[name='password']").value = "";
  }
  if (deleteId) {
    if (!confirm("Xóa người dùng này?")) return;
    const res = await apiFetch(`/api/nguoidung/${deleteId}/`, { method: "DELETE" });
    if (res.ok) {
      await loadUsersAdmin();
    }
  }
});

if (accessToken) {
  bootstrapApp();
}
