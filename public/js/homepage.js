document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector("[data-app-sidebar]");
  const topbar = document.querySelector("[data-app-topbar]");
  const currentPage = window.location.pathname.split("/").pop() || "homepage.html";

  if (sidebar) sidebar.id = "appSidebar";

  document.querySelector("[data-admin-content]")?.removeAttribute("hidden");

  const navigation = [
    { label: "Home", icon: "home", page: "homepage.html" },
    { label: "Products", icon: "package", page: "products.html" },
    { label: "Orders", icon: "shopping-bag", page: "orders.html" },
    { label: "Settings", icon: "settings", page: "settings.html" },
    { label: "Account", icon: "user-round", page: "profile.html" }
  ];

  navigation.push({ label: "Admin", icon: "shield-check", page: "admin.html" });

  if (sidebar) {
    sidebar.innerHTML = `<nav class="sidebar-nav" aria-label="Main navigation">${navigation.map((item) => {
      const active = currentPage === item.page || (item.page === "products.html" && currentPage === "product.html");
      return `<a href="${item.page}" class="nav-item${active ? " active" : ""}"${active ? ' aria-current="page"' : ""}><i data-lucide="${item.icon}" aria-hidden="true"></i><span>${item.label}</span></a>`;
    }).join("")}<button class="nav-item nav-logout-button" type="button" data-logout><i data-lucide="log-out" aria-hidden="true"></i><span>Log out</span></button></nav>`;
  }

  if (topbar) {
    topbar.innerHTML = '<div class="topbar-leading"><button class="menu-toggle" type="button" data-menu-toggle aria-controls="appSidebar" aria-expanded="false" aria-label="Open navigation"><i data-lucide="menu" aria-hidden="true"></i></button><a class="company-name" href="homepage.html">Tradspire</a></div><nav class="topbar-actions" aria-label="Account navigation"><a class="icon-btn" href="cart.html" aria-label="Cart" title="Cart"><i data-lucide="shopping-cart" aria-hidden="true"></i></a><a class="icon-btn" href="profile.html" aria-label="Profile" title="Profile"><i data-lucide="user" aria-hidden="true"></i></a></nav>';
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }

  const menuToggle = document.querySelector("[data-menu-toggle]");
  if (sidebar && menuToggle) {
    const isMobile = () => window.matchMedia("(max-width: 640px)").matches;
    const backdrop = document.createElement("button");
    backdrop.className = "sidebar-backdrop";
    backdrop.type = "button";
    backdrop.setAttribute("aria-label", "Close navigation");
    backdrop.hidden = true;
    document.body.append(backdrop);

    const setMenuOpen = (open, restoreToggleFocus = false) => {
      const hidden = isMobile() && !open;
      sidebar.classList.toggle("is-open", open);
      sidebar.inert = hidden;
      sidebar.setAttribute("aria-hidden", String(hidden));
      backdrop.hidden = !open;
      document.body.classList.toggle("sidebar-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      menuToggle.innerHTML = `<i data-lucide="${open ? "x" : "menu"}" aria-hidden="true"></i>`;
      if (window.lucide) window.lucide.createIcons();
      if (open) sidebar.querySelector("a")?.focus();
      else if (restoreToggleFocus) menuToggle.focus();
    };

    menuToggle.addEventListener("click", () => {
      const open = !sidebar.classList.contains("is-open");
      setMenuOpen(open, !open);
    });
    backdrop.addEventListener("click", () => setMenuOpen(false, true));
    sidebar.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
        setMenuOpen(false, true);
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 640) setMenuOpen(false);
    });
    setMenuOpen(false);
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.replace("../index.html");
  };

  document.querySelectorAll("[data-logout], #logoutButton").forEach((button) => {
    button.addEventListener("click", logout);
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const name = document.getElementById("profileName");
  const email = document.getElementById("profileEmail");
  if (name) name.textContent = user.name || "Not provided";
  if (email) email.textContent = user.email || "Not provided";
});