document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector("[data-product-detail]");
  const productId = new URLSearchParams(window.location.search).get("id");
  const product = (window.tradspireProducts || []).find((item) => item.id === productId);

  if (!container) return;

  if (!product) {
    container.innerHTML = '<div class="product-not-found"><p class="eyebrow">Product unavailable</p><h1>We could not find that item.</h1><p class="page-description">It may have moved or the link may be out of date.</p><a class="product-link" href="/html/homepage.html">Back to featured products</a></div>';
    return;
  }

  container.innerHTML = `<div class="product-detail-image-wrap"><img class="product-detail-image" src="${product.image}" alt="${product.imageAlt}"></div><div class="product-detail-copy"><p class="product-category">${product.category}</p><h1>${product.name}</h1><p class="product-origin">Made in ${product.origin}</p><p class="product-detail-description">${product.description}</p><p class="product-detail-price">$${product.price}</p><button class="text-button" type="button" disabled aria-disabled="true">Coming soon</button></div>`;
});