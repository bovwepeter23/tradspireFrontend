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

  const categoriesFor = (product) => Array.isArray(product.categories)
    ? product.categories.join(' · ')
    : product.categories || product.category || '';

  const imageUrlFor = (image) => typeof image === 'string' ? image : image?.url || image?.image;

  const pricesFor = (product) => [
    product.price != null ? `Buy $${Number(product.price).toFixed(2)}` : '',
    product.rentPricePerDay != null ? `Rent $${Number(product.rentPricePerDay).toFixed(2)}/day` : ''
  ].filter(Boolean).join(' · ');

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
    const subImages = Array.isArray(product.subImages) ? product.subImages : [];
    if (subImages.length) {
      const gallery = document.createElement('div');
      gallery.className = 'product-detail-gallery';
      subImages.forEach((subImage) => {
        const url = imageUrlFor(subImage);
        if (!url) return;
        const thumbnail = document.createElement('img');
        thumbnail.className = 'product-detail-thumbnail';
        thumbnail.src = url;
        thumbnail.alt = product.imageAlt || product.name;
        gallery.append(thumbnail);
      });
      imageWrap.append(gallery);
    }

    const copy = document.createElement('div');
    copy.className = 'product-detail-copy';
    const category = document.createElement('p');
    category.className = 'product-category';
      const makeText = (tagName, className, text) => {
        const element = document.createElement(tagName);
        element.className = className;
        element.textContent = text;
        return element;
      };

      const categoriesFor = (product) => Array.isArray(product.categories)
        ? product.categories.join(' · ')
        : product.categories || product.category || '';

      const imageUrlFor = (image) => typeof image === 'string' ? image : image?.url || image?.image;

      const availableFor = (product) => {
        if (Array.isArray(product.availableFor)) return product.availableFor;
        if (Array.isArray(product.listingType)) return product.listingType;
        if (Array.isArray(product.listingTypes)) return product.listingTypes;
        if (product.listingType) return [product.listingType];
        return product.isRentable ? ['rent'] : ['buy'];
      };

      const setCartCount = () => {
        const badge = document.querySelector('[data-cart-count]');
        if (!badge) return;
        let items;
        try {
          items = JSON.parse(localStorage.getItem('tradspire-cart') || '[]');
          if (!Array.isArray(items)) items = [];
        } catch (error) {
          items = [];
        }
        const quantity = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
        badge.textContent = quantity > 99 ? '99+' : String(quantity);
        badge.hidden = quantity === 0;
      };
    origin.className = 'product-origin';
    origin.textContent = `Made in ${product.origin}`;
    const description = document.createElement('p');
    description.className = 'product-detail-description';
    description.textContent = product.description;
    const price = document.createElement('p');
    price.className = 'product-detail-price';
    price.textContent = pricesFor(product);
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