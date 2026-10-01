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
    link.href = '../index.html';
    link.textContent = 'Back to products';
    content.append(eyebrow, title, link);
    container.replaceChildren(content);
  };

  if (!productId) {
    showUnavailable('We could not find that item.');
    return;
  }

  const makeText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  };
  const imageUrlFor = (image) => typeof image === 'string' ? image : image?.url || image?.image;
  const availableFor = (product) => {
    if (Array.isArray(product.availableFor)) return product.availableFor;
    if (Array.isArray(product.listingType)) return product.listingType;
    if (Array.isArray(product.listingTypes)) return product.listingTypes;
    if (product.listingType) return [product.listingType];
    return product.isRentable ? ['rent'] : ['buy'];
  };
  const readCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('tradspire-cart') || '[]');
      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      return [];
    }
  };
  const setCartCount = (cart) => {
    const badge = document.querySelector('[data-cart-count]');
    if (!badge) return;
    const quantity = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
    badge.textContent = quantity > 99 ? '99+' : String(quantity);
    badge.hidden = quantity === 0;
  };

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
        thumbnail.addEventListener('click', () => {
          image.src = url;
          gallery.querySelectorAll('.product-detail-thumbnail').forEach((item) => item.classList.remove('is-selected'));
          thumbnail.classList.add('is-selected');
        });
        gallery.append(thumbnail);
      });
      imageWrap.append(gallery);
    }

    const copy = document.createElement('div');
    copy.className = 'product-detail-copy';
    copy.append(
      makeText('p', 'product-category', Array.isArray(product.categories) ? product.categories.join(' · ') : product.categories || product.category || ''),
      makeText('h1', '', product.name),
      makeText('p', 'product-origin', `Made in ${product.origin}`),
      makeText('p', 'product-detail-description', product.description || '')
    );

    const types = availableFor(product);
    const purchasePanel = document.createElement('div');
    purchasePanel.className = 'product-price-panel';
    const modeLabel = makeText('p', 'product-price-caption', 'Choose how you want this item');
    const mode = document.createElement('select');
    mode.className = 'product-mode';
    mode.setAttribute('aria-label', 'Purchase type');
    if (types.includes('buy') && product.price != null) mode.append(new Option(`Buy for ₦${Number(product.price).toFixed(2)}`, 'buy'));
    if (types.includes('rent') && product.rentPricePerDay != null) mode.append(new Option(`Rent for ₦${Number(product.rentPricePerDay).toFixed(2)} per day`, 'rent'));

    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Quantity';
    quantityLabel.htmlFor = 'productQuantity';
    const quantity = document.createElement('input');
    quantity.id = 'productQuantity';
    quantity.className = 'product-quantity';
    quantity.type = 'number';
    quantity.min = '1';
    quantity.max = '99';
    quantity.value = '1';
    const daysLabel = document.createElement('label');
    daysLabel.textContent = 'Rental days';
    daysLabel.htmlFor = 'rentalDays';
    const days = document.createElement('input');
    days.id = 'rentalDays';
    days.className = 'product-quantity';
    days.type = 'number';
    days.min = '1';
    days.max = '365';
    days.value = '1';
    const daysWrap = document.createElement('div');
    daysWrap.className = 'product-rental-days';
    daysWrap.append(daysLabel, days);
    const controls = document.createElement('div');
    controls.className = 'product-purchase-controls';
    controls.append(quantityLabel, quantity, daysWrap);

    const addButton = document.createElement('button');
    addButton.className = 'product-detail-add';
    addButton.type = 'button';
    addButton.textContent = 'Add to cart';
    const message = makeText('p', 'product-cart-message', '');
    const syncMode = () => {
      daysWrap.hidden = mode.value !== 'rent';
      addButton.disabled = !mode.value;
    };
    mode.addEventListener('change', syncMode);
    addButton.addEventListener('click', () => {
      const selectedQuantity = Number(quantity.value);
      const rentalDays = Number(days.value);
      if (!Number.isInteger(selectedQuantity) || selectedQuantity < 1 || selectedQuantity > 99) {
        message.textContent = 'Choose a quantity from 1 to 99.';
        return;
      }
      if (mode.value === 'rent' && (!Number.isInteger(rentalDays) || rentalDays < 1 || rentalDays > 365)) {
        message.textContent = 'Choose rental days from 1 to 365.';
        return;
      }
      const cart = readCart();
      const unitPrice = mode.value === 'rent' ? Number(product.rentPricePerDay) : Number(product.price);
      const cartKey = `${productId}:${mode.value}:${mode.value === 'rent' ? rentalDays : 0}`;
      const existing = cart.find((item) => item.cartKey === cartKey);
      if (existing) existing.quantity = Math.min(99, Number(existing.quantity) + selectedQuantity);
      else cart.push({ cartKey, productId, name: product.name, image: product.image, price: unitPrice, quantity: selectedQuantity, purchaseType: mode.value, rentalDays: mode.value === 'rent' ? rentalDays : null });
      localStorage.setItem('tradspire-cart', JSON.stringify(cart));
      setCartCount(cart);
      message.textContent = 'Added to cart.';
    });

    purchasePanel.append(modeLabel, mode, controls, addButton, message);
    copy.append(purchasePanel);
    container.replaceChildren(imageWrap, copy);
    syncMode();
    setCartCount(readCart());
  } catch (error) {
    showUnavailable(error.status === 404 ? 'We could not find that item.' : 'Product details could not be loaded.');
  }
});
