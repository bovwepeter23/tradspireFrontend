document.addEventListener("DOMContentLoaded", () => {
  const products = window.tradspireProducts || [];
  const slide = document.querySelector("[data-carousel-slide]");
  const dots = document.querySelector("[data-carousel-dots]");
  const count = document.querySelector("[data-carousel-count]");

  if (!slide || !dots || !count || !products.length) return;

  let activeIndex = 0;

  const render = () => {
    const product = products[activeIndex];
    const productUrl = `/html/product.html?id=${encodeURIComponent(product.id)}`;
    slide.innerHTML = `<a class="carousel-image-link" href="${productUrl}" aria-label="View ${product.name}"><img class="carousel-image" src="${product.image}" alt="${product.imageAlt}"></a><div class="carousel-copy"><p class="product-category">${product.category}</p><h3>${product.name}</h3><p class="carousel-origin">${product.origin}</p><p class="carousel-description">${product.description}</p><div class="carousel-purchase"><span class="product-price">$${product.price}</span><a class="product-link" href="${productUrl}">View product <i data-lucide="arrow-up-right" aria-hidden="true"></i></a></div></div>`;
    count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(products.length).padStart(2, "0")}`;
    dots.innerHTML = products.map((item, index) => `<button class="carousel-dot${index === activeIndex ? " active" : ""}" type="button" data-carousel-index="${index}" aria-label="Show ${item.name}"${index === activeIndex ? ' aria-current="true"' : ""}></button>`).join("");

    if (window.lucide) window.lucide.createIcons();
  };

  document.querySelector("[data-carousel-previous]")?.addEventListener("click", () => {
    activeIndex = (activeIndex - 1 + products.length) % products.length;
    render();
  });

  document.querySelector("[data-carousel-next]")?.addEventListener("click", () => {
    activeIndex = (activeIndex + 1) % products.length;
    render();
  });

  dots.addEventListener("click", (event) => {
    const button = event.target.closest("[data-carousel-index]");
    if (!button) return;
    activeIndex = Number(button.dataset.carouselIndex);
    render();
  });

  render();
});