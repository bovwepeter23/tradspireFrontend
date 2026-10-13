document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector("[data-app-sidebar]");
  const topbar = document.querySelector("[data-app-topbar]");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const isHtmlPage = window.location.pathname.includes("/html/");
  let isLoggedIn = Boolean(localStorage.getItem("token"));
  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    isLoggedIn = false;
  };
  const tokenIsExpired = (token) => {
    try {
      const payload = token.split(".")[1];
      if (!payload) return false;
      const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decodedPayload = atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "="));
      const { exp } = JSON.parse(decodedPayload);
      return Number.isFinite(exp) && exp * 1000 <= Date.now();
    } catch (error) {
      return false;
    }
  };
  if (isLoggedIn && tokenIsExpired(localStorage.getItem("token"))) clearAuth();
  const homePageHref = isHtmlPage ? "../index.html" : "index.html";
  const pageHref = (page) => page === "index.html"
    ? homePageHref
    : isHtmlPage ? page : `html/${page}`;

  if (sidebar) sidebar.id = "appSidebar";

  document.querySelector("[data-admin-content]")?.removeAttribute("hidden");

  const navigation = [
    { label: "Home", icon: "home", page: "index.html" },
    { label: "Cart", icon: "shopping-cart", page: "cart.html" },
    { label: "Orders", icon: "shopping-bag", page: "orders.html" },
    { label: "Settings", icon: "settings", page: "settings.html" },
    { label: "Account", icon: "user-round", page: "profile.html" },
    { label: "Analytics", icon: "chart-no-axes-combined", page: "analytics.html" }
  ];

  navigation.push({ label: "Admin", icon: "shield-check", page: "admin.html" });

  if (sidebar) {
    sidebar.innerHTML = `<nav class="sidebar-nav" aria-label="Main navigation">${navigation.map((item) => {
      const active = currentPage === item.page || (item.page === "products.html" && currentPage === "product.html");
      return `<a href="${pageHref(item.page)}" class="nav-item${active ? " active" : ""}"${active ? ' aria-current="page"' : ""}><i data-lucide="${item.icon}" aria-hidden="true"></i><span>${item.label}</span></a>`;
    }).join("")}${isLoggedIn
      ? '<button class="nav-item nav-logout-button" type="button" data-logout data-auth-action><i data-lucide="log-out" aria-hidden="true"></i><span>Log out</span></button>'
      : `<a class="nav-item nav-logout-button" data-auth-action href="${pageHref("login.html")}"><i data-lucide="log-in" aria-hidden="true"></i><span>Log in</span></a>`}</nav>`;
  }

  if (topbar) {
    topbar.innerHTML = `<div class="topbar-leading"><button class="menu-toggle" type="button" data-menu-toggle aria-controls="appSidebar" aria-expanded="false" aria-label="Open navigation"><i data-lucide="menu" aria-hidden="true"></i></button><a class="company-name" href="${homePageHref}">Tradspire</a></div><nav class="topbar-actions" aria-label="Account navigation"><a class="icon-btn cart-icon" href="${pageHref("cart.html")}" aria-label="Cart" title="Cart"><i data-lucide="shopping-cart" aria-hidden="true"></i><span class="cart-count" data-cart-count hidden></span></a><a class="icon-btn" href="${pageHref("profile.html")}" aria-label="Account" title="Account"><i data-lucide="user" aria-hidden="true"></i></a></nav>`;
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }

  const cartCount = document.querySelector("[data-cart-count]");
  const token = localStorage.getItem("token");
  if (cartCount && token) {
    window.TradspireAPI.request("/api/cart", { token, silent: true })
      .then((response) => {
        const items = response.cart?.items || response.items || [];
        const count = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
      cartCount.textContent = count > 99 ? "99+" : String(count);
      cartCount.hidden = count === 0;
      })
      .catch(() => {
        cartCount.hidden = true;
      });
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
    if (!isLoggedIn) {
      window.location.replace(pageHref("login.html"));
      return;
    }
    clearAuth();
    window.location.replace(isHtmlPage ? "login.html" : "html/login.html");
  };

  window.addEventListener("tradspire:auth-expired", () => {
    clearAuth();
    const authAction = document.querySelector("[data-auth-action]");
    if (!authAction) return;
    const loginLink = document.createElement("a");
    loginLink.className = "nav-item nav-logout-button";
    loginLink.href = pageHref("login.html");
    loginLink.dataset.authAction = "";
    loginLink.innerHTML = '<i data-lucide="log-in" aria-hidden="true"></i><span>Log in</span>';
    authAction.replaceWith(loginLink);
    if (window.lucide) window.lucide.createIcons();
  });

  document.querySelectorAll("[data-logout], #logoutButton").forEach((button) => {
    if (button.id === "logoutButton" && !isLoggedIn) button.textContent = "Log in";
    button.addEventListener("click", logout);
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const name = document.getElementById("profileName");
  const email = document.getElementById("profileEmail");
  if (name) name.textContent = user.name || "Not provided";
  if (email) email.textContent = user.email || "Not provided";
});