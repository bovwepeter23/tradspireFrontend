document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector("[data-app-sidebar]");
  const topbar = document.querySelector("[data-app-topbar]");
  const currentPage = window.location.pathname.split("/").pop() || "homepage.html";
  const navigation = [
    { label: "Home", icon: "home", page: "homepage.html" },
    { label: "Products", icon: "package", page: "products.html" },
    { label: "Orders", icon: "shopping-bag", page: "orders.html" },
    { label: "Settings", icon: "settings", page: "settings.html" }
  ];

  if (sidebar) {
    sidebar.innerHTML = `<nav class="sidebar-nav" aria-label="Main navigation">${navigation.map((item) => {
      const active = currentPage === item.page;
      return `<a href="/html/${item.page}" class="nav-item${active ? " active" : ""}"${active ? ' aria-current="page"' : ""}><i data-lucide="${item.icon}" aria-hidden="true"></i><span>${item.label}</span></a>`;
    }).join("")}</nav>`;
  }

  if (topbar) {
    topbar.innerHTML = '<a class="company-name" href="/html/homepage.html">Tradspire</a><nav class="topbar-actions" aria-label="Account navigation"><a class="icon-btn" href="/html/cart.html" aria-label="Cart" title="Cart"><i data-lucide="shopping-cart" aria-hidden="true"></i></a><a class="icon-btn" href="/html/profile.html" aria-label="Profile" title="Profile"><i data-lucide="user" aria-hidden="true"></i></a></nav>';
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }

  const logoutButton = document.getElementById("logoutButton");
  logoutButton?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.replace("/index.html");
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const name = document.getElementById("profileName");
  const email = document.getElementById("profileEmail");
  if (name) name.textContent = user.name || "Not provided";
  if (email) email.textContent = user.email || "Not provided";
});