const expectedRole = "technical";
const token = localStorage.getItem("access_token") || "";
const navButtons = document.querySelectorAll(".role-nav-btn");
const sectionMap = {
  overview: document.getElementById("overview-section"),
  incidents: document.getElementById("incidents-section"),
  logs: document.getElementById("logs-section"),
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

function renderIncidentList(incidents) {
  const container = document.getElementById("technical-incident-list");
  container.innerHTML = "";
  if (!incidents.length) {
    container.innerHTML = "<p class='section-note'>Bạn chưa được giao sự cố nào.</p>";
    return;
  }
  incidents.forEach((item) => {
    const row = document.createElement("div");
    row.className = "flat-stat";
    row.innerHTML = `
      <p style="margin:0;font-weight:700;">${item.tieu_de}</p>
      <p class="section-note" style="margin:4px 0 8px;">${item.mo_ta}</p>
      <div class="topbar-actions">
        <select data-incident-status="${item.id}">
          <option value="chua_xu_ly" ${item.trang_thai === "chua_xu_ly" ? "selected" : ""}>Chưa xử lý</option>
          <option value="dang_xu_ly" ${item.trang_thai === "dang_xu_ly" ? "selected" : ""}>Đang xử lý</option>
          <option value="da_hoan_thanh" ${item.trang_thai === "da_hoan_thanh" ? "selected" : ""}>Đã hoàn thành</option>
        </select>
        <button class="btn btn-primary" type="button" data-update-incident="${item.id}">Cập nhật</button>
      </div>
      <p class="section-note" style="margin:8px 0 0;">Hiện tại: ${getIncidentStatusLabel(item.trang_thai)}</p>
    `;
    container.appendChild(row);
  });
}

function renderMaintenanceList(logs) {
  const container = document.getElementById("maintenance-list");
  container.innerHTML = "";
  if (!logs.length) {
    container.innerHTML = "<p class='section-note'>Chưa có nhật ký bảo trì.</p>";
    return;
  }
  logs.forEach((log) => {
    const row = document.createElement("div");
    row.className = "flat-stat";
    row.innerHTML = `
      <p style="margin:0;font-weight:700;">Hạ tầng #${log.ha_tang} | Tiến độ: ${log.tien_do}</p>
      <p class="section-note" style="margin:4px 0 0;">${log.noi_dung}</p>
    `;
    container.appendChild(row);
  });
}

async function loadDashboardData() {
  const [incidentRes, assetRes, logRes] = await Promise.all([
    apiFetch("/api/suco/"),
    apiFetch("/api/hatang/"),
    apiFetch("/api/nhatky-baotri/"),
  ]);
  const incidents = incidentRes.ok ? normalizeListResponse(await incidentRes.json()) : [];
  const assets = assetRes.ok ? normalizeListResponse(await assetRes.json()) : [];
  const logs = logRes.ok ? normalizeListResponse(await logRes.json()) : [];

  renderIncidentList(incidents);
  renderMaintenanceList(logs);

  const haTangOptions = assets.map((item) => `<option value="${item.id}">${item.ten}</option>`).join("");
  document.getElementById("log-ha-tang").innerHTML = haTangOptions;
  const incidentOptions = incidents.map((item) => `<option value="${item.id}">${item.tieu_de}</option>`).join("");
  document.getElementById("log-su-co").innerHTML = `<option value="">Không gắn sự cố</option>${incidentOptions}`;

  document.getElementById("metric-assigned").textContent = String(incidents.length);
  document.getElementById("metric-processing").textContent = String(incidents.filter((i) => i.trang_thai === "dang_xu_ly").length);
  document.getElementById("metric-completed").textContent = String(incidents.filter((i) => i.trang_thai === "da_hoan_thanh").length);
}

document.getElementById("technical-incident-list").addEventListener("click", async (event) => {
  const incidentId = event.target.getAttribute("data-update-incident");
  if (!incidentId) return;
  const statusSelect = document.querySelector(`select[data-incident-status='${incidentId}']`);
  const res = await apiFetch(`/api/suco/${incidentId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trang_thai: statusSelect?.value || "dang_xu_ly" }),
  });
  if (!res.ok) {
    alert("Cập nhật trạng thái sự cố thất bại.");
    return;
  }
  await loadDashboardData();
});

document.getElementById("maintenance-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = {
    ha_tang: Number(formData.get("ha_tang")),
    tien_do: formData.get("tien_do"),
    noi_dung: formData.get("noi_dung"),
  };
  if (formData.get("su_co")) payload.su_co = Number(formData.get("su_co"));
  const res = await apiFetch("/api/nhatky-baotri/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    alert("Lưu nhật ký bảo trì thất bại.");
    return;
  }
  event.target.reset();
  await loadDashboardData();
});

document.getElementById("logout-btn").addEventListener("click", logout);
navButtons.forEach((btn) => btn.addEventListener("click", () => activateSection(btn.dataset.section)));
activateSection("overview");
loadProfile().then(loadDashboardData);
