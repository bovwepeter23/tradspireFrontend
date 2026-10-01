document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;

  const categoriesFor = (product) => Array.isArray(product.categories)
    ? product.categories.join(' · ')
    : product.categories || product.category || '';

  const pricesFor = (product) => [
    product.price != null ? `Buy $${Number(product.price).toFixed(2)}` : '',
    product.rentPricePerDay != null ? `Rent $${Number(product.rentPricePerDay).toFixed(2)}/day` : ''
  ].filter(Boolean).join(' · ');

  try {
    const response = await window.TradspireAPI.request('/api/products');
    const products = response.products || [];
    if (!products.length) {
      grid.textContent = 'No products are available yet. Please check back soon.';
      grid.classList.add('product-grid-empty');
      return;
    }

    const cards = products.map((product) => {
      const card = document.createElement('a');
      card.className = 'product-card';
      card.href = `product.html?id=${encodeURIComponent(product._id)}`;

      const image = document.createElement('img');
      image.className = 'product-card-image';
      image.src = product.image;
      image.alt = product.imageAlt || product.name;

      const content = document.createElement('div');
      content.className = 'product-card-content';
      const category = document.createElement('p');
      category.className = 'product-category';
      category.textContent = categoriesFor(product);
      const name = document.createElement('h2');
      name.textContent = product.name;
      const origin = document.createElement('p');
      origin.className = 'product-origin';
      origin.textContent = product.origin;
      const price = document.createElement('p');
      price.className = 'product-price';
      price.textContent = pricesFor(product);
      content.append(category, name, origin, price);
      card.append(image, content);
      return card;
    });

    grid.replaceChildren(...cards);
  } catch (error) {
    grid.textContent = `Products could not be loaded. ${error.message}`;
    grid.classList.add('product-grid-empty');
  }
});