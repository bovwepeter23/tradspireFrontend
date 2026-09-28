document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('[data-product-detail]');
  if (!container) return;

  const productId = new URLSearchParams(window.location.search).get('id');
  const showUnavailable = (message) => {
    const content = document.createElement('div');
    content.className = 'product-not-found';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Product unavailable';
    const title = document.createElement('h1');
    title.textContent = message;
    const link = document.createElement('a');
    link.className = 'product-link';
    link.href = 'homepage.html';
    link.textContent = 'Back to featured products';
    content.append(eyebrow, title, link);
    container.replaceChildren(content);
  };

  if (!productId) {
    showUnavailable('We could not find that item.');
    return;
  }

  try {
    const response = await window.TradspireAPI.request(`/api/products/${encodeURIComponent(productId)}`);
    const product = response.product;
    if (!product) {
      showUnavailable('We could not find that item.');
      return;
    }

    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-detail-image-wrap';
    const image = document.createElement('img');
    image.className = 'product-detail-image';
    image.src = product.image;
    image.alt = product.imageAlt || product.name;
    imageWrap.append(image);

    const copy = document.createElement('div');
    copy.className = 'product-detail-copy';
    const category = document.createElement('p');
    category.className = 'product-category';
    category.textContent = product.category;
    const title = document.createElement('h1');
    title.textContent = product.name;
    const origin = document.createElement('p');
    origin.className = 'product-origin';
    origin.textContent = `Made in ${product.origin}`;
    const description = document.createElement('p');
    description.className = 'product-detail-description';
    description.textContent = product.description;
    const price = document.createElement('p');
    price.className = 'product-detail-price';
    price.textContent = `$${Number(product.price).toFixed(2)}`;
    const purchase = document.createElement('button');
    purchase.className = 'text-button';
    purchase.type = 'button';
    purchase.disabled = true;
    purchase.setAttribute('aria-disabled', 'true');
    purchase.textContent = 'Coming soon';
    copy.append(category, title, origin, description, price, purchase);
    container.replaceChildren(imageWrap, copy);
  } catch (error) {
    showUnavailable(error.status === 404 ? 'We could not find that item.' : 'Product details could not be loaded.');
  }
});