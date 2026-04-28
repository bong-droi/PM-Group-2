const roleDashboardUrls = {
  admin: "/dashboard/admin/",
  operator: "/dashboard/operator/",
  technical: "/dashboard/technical/",
  citizen: "/dashboard/citizen/",
};

const authModal = document.getElementById("auth-modal");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authModalTitle = document.getElementById("auth-modal-title");

function getToken() {
  return localStorage.getItem("access_token") || "";
}

function setMessage(text, isSuccess = false) {
  const messageEl = document.getElementById("auth-message");
  messageEl.textContent = text;
  messageEl.style.color = isSuccess ? "#0f766e" : "#c81e1e";
}

function openAuthModal(mode) {
  authModal.classList.remove("hidden");
  loginForm.classList.toggle("hidden", mode !== "login");
  registerForm.classList.toggle("hidden", mode !== "register");
  authModalTitle.textContent = mode === "register" ? "Đăng ký tài khoản người dân" : "Đăng nhập hệ thống";
  setMessage("");
}

function closeAuthModal() {
  authModal.classList.add("hidden");
}

async function fetchCurrentUser(token) {
  const res = await fetch("/api/me/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function redirectByRole(token) {
  const user = await fetchCurrentUser(token);
  if (!user) return;
  const roleUrl = roleDashboardUrls[user.vai_tro];
  if (!roleUrl) {
    setMessage("Vai trò người dùng không hợp lệ.");
    return;
  }
  window.location.href = roleUrl;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");
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
    setMessage("Sai thông tin đăng nhập hoặc tài khoản chưa được kích hoạt.");
    return;
  }

  const data = await res.json();
  localStorage.setItem("access_token", data.access);
  await redirectByRole(data.access);
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");
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
    setMessage("Đăng ký thất bại, có thể username đã tồn tại.");
    return;
  }

  setMessage("Đăng ký thành công. Hãy đăng nhập.", true);
  event.target.reset();
  openAuthModal("login");
});

document.getElementById("open-login-btn").addEventListener("click", () => openAuthModal("login"));
document.getElementById("open-register-btn").addEventListener("click", () => openAuthModal("register"));
document.getElementById("auth-close-btn").addEventListener("click", closeAuthModal);
document.getElementById("auth-close-backdrop").addEventListener("click", closeAuthModal);

const token = getToken();
if (token) {
  redirectByRole(token);
}
