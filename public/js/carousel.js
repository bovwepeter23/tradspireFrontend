document.addEventListener('DOMContentLoaded', async () => {
  const slide = document.querySelector('[data-carousel-slide]');
  const dots = document.querySelector('[data-carousel-dots]');
  const count = document.querySelector('[data-carousel-count]');
  const previous = document.querySelector('[data-carousel-previous]');
  const next = document.querySelector('[data-carousel-next]');
  if (!slide || !dots || !count) return;

  const showMessage = (message) => {
    const content = document.createElement('p');
    content.className = 'carousel-empty';
    content.textContent = message;
    slide.replaceChildren(content);
    dots.replaceChildren();
    count.textContent = '';
    if (previous) previous.disabled = true;
    if (next) next.disabled = true;
  };

  let products;
  try {
    const carouselResponse = await window.TradspireAPI.request('/api/carousel?limit=12');
    const carouselItems = carouselResponse.items || carouselResponse.carouselImages || carouselResponse.carousel || [];
    if (carouselItems.length) {
      products = carouselItems.map((item) => ({
        ...item,
        _id: item.productId || item._id,
        name: item.title || item.name,
        imageAlt: item.imageAlt || item.title || item.name,
        categories: item.categories || item.category || '',
        origin: item.origin || '',
        description: item.description || ''
      }));
    } else {
      const response = await window.TradspireAPI.request('/api/products?limit=12');
      products = response.products || [];
    }
  } catch (error) {
    try {
      const response = await window.TradspireAPI.request('/api/products?limit=12');
      products = response.products || [];
    } catch (fallbackError) {
      showMessage(`Products are unavailable right now. ${fallbackError.message}`);
      return;
    }
  }

  if (!products.length) {
    showMessage('No products have been added yet. Check back soon.');
    return;
  }

  let activeIndex = 0;

  const makeText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  };

  const categoriesFor = (product) => Array.isArray(product.categories)
    ? product.categories.join(' · ')
    : product.categories || product.category || '';

  const pricesFor = (product) => [
    product.price != null ? `Buy $${Number(product.price).toFixed(2)}` : '',
    product.rentPricePerDay != null ? `Rent $${Number(product.rentPricePerDay).toFixed(2)}/day` : ''
  ].filter(Boolean).join(' · ');

  const render = () => {
    const product = products[activeIndex];
    const productUrl = `product.html?id=${encodeURIComponent(product._id)}`;
    const imageLink = document.createElement('a');
    imageLink.className = 'carousel-image-link';
    imageLink.href = productUrl;
    imageLink.setAttribute('aria-label', `View ${product.name}`);

    const image = document.createElement('img');
    image.className = 'carousel-image';
    image.src = product.image;
    image.alt = product.imageAlt || product.name;
    imageLink.append(image);

    const copy = document.createElement('div');
    copy.className = 'carousel-copy';
    copy.append(
      makeText('p', 'product-category', categoriesFor(product)),
      makeText('h3', '', product.name),
      makeText('p', 'carousel-origin', product.origin),
      makeText('p', 'carousel-description', product.description)
    );

    const purchase = document.createElement('div');
    purchase.className = 'carousel-purchase';
    purchase.append(makeText('span', 'product-price', pricesFor(product)));
    const productLink = document.createElement('a');
    productLink.className = 'product-link';
    productLink.href = productUrl;
    productLink.append(document.createTextNode('View product '));
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'arrow-up-right');
    icon.setAttribute('aria-hidden', 'true');
    productLink.append(icon);
    purchase.append(productLink);
    copy.append(purchase);
    slide.replaceChildren(imageLink, copy);

    count.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(products.length).padStart(2, '0')}`;
    dots.replaceChildren(...products.map((item, index) => {
      const button = document.createElement('button');
      button.className = `carousel-dot${index === activeIndex ? ' active' : ''}`;
      button.type = 'button';
      button.dataset.carouselIndex = String(index);
      button.setAttribute('aria-label', `Show ${item.name}`);
      if (index === activeIndex) button.setAttribute('aria-current', 'true');
      return button;
    }));
    if (window.lucide) window.lucide.createIcons();
  };

  previous?.addEventListener('click', () => {
    activeIndex = (activeIndex - 1 + products.length) % products.length;
    render();
  });

  next?.addEventListener('click', () => {
    activeIndex = (activeIndex + 1) % products.length;
    render();
  });

  dots.addEventListener('click', (event) => {
    const button = event.target.closest('[data-carousel-index]');
    if (!button) return;
    activeIndex = Number(button.dataset.carouselIndex);
    render();
  });

  render();
});