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
  const breadcrumb = document.querySelector('[data-product-breadcrumb]');
  const imageUrlFor = (image) => typeof image === 'string' ? image : image?.url || image?.image;
  const availableFor = (product) => {
    if (Array.isArray(product.availableFor)) return product.availableFor;
    if (Array.isArray(product.listingType)) return product.listingType;
    if (Array.isArray(product.listingTypes)) return product.listingTypes;
    if (product.listingType) return [product.listingType];
    return product.isRentable ? ['rent'] : ['buy'];
  };
  const setCartCount = (items) => {
    const badge = document.querySelector('[data-cart-count]');
    if (!badge) return;
    const quantity = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
    badge.textContent = quantity > 99 ? '99+' : String(quantity);
    badge.hidden = quantity === 0;
  };
  const cartItemsFrom = (response) => response.cart?.items || response.items || [];

  try {
    const response = await window.TradspireAPI.request(`/api/products/${encodeURIComponent(productId)}`);
    const product = response.product;
    if (!product) {
      showUnavailable('We could not find that item.');
      return;
    }
    if (breadcrumb) breadcrumb.textContent = product.name;

    const assignedCategoryIds = Array.isArray(product.categoryIds)
      ? product.categoryIds.map((item) => typeof item === 'object' ? item?._id : item).filter(Boolean)
      : [];
    const mainCategoryId = typeof product.mainCategoryId === 'object'
      ? product.mainCategoryId?._id
      : product.mainCategoryId || product.categoryId;
    const subCategoryId = typeof product.subCategoryId === 'object'
      ? product.subCategoryId?._id
      : product.subCategoryId;
    let categoriesById = new Map();
    let categoryLookupError = null;
    if (assignedCategoryIds.length || (
      (mainCategoryId && !product.mainCategory?.name && typeof product.mainCategoryId !== 'object') ||
      (subCategoryId && !product.subCategory?.name && typeof product.subCategoryId !== 'object')
    )) {
      try {
        const categoryResponse = await window.TradspireAPI.request('/api/categories', { silent: true });
        categoriesById = new Map((categoryResponse.categories || []).map((category) => [category._id, category]));
      } catch (error) {
        categoryLookupError = error;
      }
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
    const assignedCategories = assignedCategoryIds
      .map((id) => categoriesById.get(id) || product.categoryIds.find((item) =>
        typeof item === 'object' && item?._id === id))
      .filter(Boolean);
    const assignedMainNames = [];
    const assignedSubNames = [];
    assignedCategories.forEach((category) => {
      const parent = typeof category.parentId === 'object' ? category.parentId : categoriesById.get(category.parentId);
      const parentName = parent?.name;
      const isSubcategory = Boolean(category.parentId);
      const mainName = isSubcategory ? parentName : category.name;
      if (mainName && !assignedMainNames.includes(mainName)) assignedMainNames.push(mainName);
      if (isSubcategory && category.name && !assignedSubNames.includes(category.name)) assignedSubNames.push(category.name);
    });
    const mainCategory = product.mainCategory?.name
      || (typeof product.mainCategoryId === 'object' ? product.mainCategoryId?.name : '')
      || categoriesById.get(mainCategoryId)?.name;
    const subCategory = product.subCategory?.name
      || (typeof product.subCategoryId === 'object' ? product.subCategoryId?.name : '')
      || categoriesById.get(subCategoryId)?.name;
    const displayedMainCategories = assignedMainNames.length ? assignedMainNames : mainCategory ? [mainCategory] : [];
    const displayedSubCategories = assignedSubNames.length ? assignedSubNames : subCategory ? [subCategory] : [];
    if (displayedMainCategories.length) {
      copy.append(makeText('p', 'product-category', `Main categor${displayedMainCategories.length === 1 ? 'y' : 'ies'}: ${displayedMainCategories.join(', ')}`));
    }
    else if (mainCategoryId && categoryLookupError) {
      copy.append(makeText('p', 'product-category', `Main category could not be loaded. ${categoryLookupError.message}`));
    }
    if (displayedSubCategories.length) {
      copy.append(makeText('p', 'product-category', `Subcategor${displayedSubCategories.length === 1 ? 'y' : 'ies'}: ${displayedSubCategories.join(', ')}`));
    }
    else if (subCategoryId && categoryLookupError) {
      copy.append(makeText('p', 'product-category', `Subcategory could not be loaded. ${categoryLookupError.message}`));
    }
    if (!displayedMainCategories.length && !displayedSubCategories.length && !mainCategoryId && !subCategoryId) {
      const legacyCategory = Array.isArray(product.categories)
        ? product.categories.join(' · ')
        : product.categories || product.category || '';
      if (legacyCategory) copy.append(makeText('p', 'product-category', legacyCategory));
    }
    copy.append(makeText('h1', '', product.name));
    if (product.origin) copy.append(makeText('p', 'product-origin', `Made in ${product.origin}`));
    copy.append(makeText('p', 'product-detail-price', ''));
    const displayedPrice = copy.querySelector('.product-detail-price');

    const descriptionWrap = document.createElement('div');
    descriptionWrap.className = 'product-detail-description-wrap';
    descriptionWrap.append(makeText('p', 'product-detail-description', product.description || ''));

    const types = availableFor(product);
    const purchasePanel = document.createElement('div');
    purchasePanel.className = 'product-price-panel';
    const modeLabel = makeText('label', 'product-price-caption', 'Purchase option');
    const mode = document.createElement('select');
    mode.className = 'product-mode';
    mode.id = 'productPurchaseType';
    mode.setAttribute('aria-label', 'Purchase type');
    modeLabel.htmlFor = mode.id;
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
      const isRental = mode.value === 'rent';
      const price = isRental ? product.rentPricePerDay : product.price;
      displayedPrice.textContent = price == null ? '' : `₦${Number(price).toFixed(2)}${isRental ? ' / day' : ''}`;
      daysWrap.hidden = mode.value !== 'rent';
      addButton.disabled = !mode.value;
    };
    mode.addEventListener('change', syncMode);
    addButton.addEventListener('click', async () => {
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
      const token = localStorage.getItem('token');
      if (!token) {
        message.textContent = 'Sign in to add items to your account cart.';
        return;
      }

      addButton.disabled = true;
      message.textContent = 'Adding to cart...';
      try {
        const response = await window.TradspireAPI.request('/api/cart/items', {
          method: 'POST',
          token,
          silent: true,
          body: {
            productId,
            quantity: selectedQuantity,
            purchaseType: mode.value,
            rentalDays: mode.value === 'rent' ? rentalDays : null
          }
        });
        setCartCount(cartItemsFrom(response));
        message.textContent = 'Added to cart.';
      } catch (error) {
        message.textContent = error.message || 'The item could not be added to your cart.';
      } finally {
        addButton.disabled = !mode.value;
      }
    });

    purchasePanel.append(
      modeLabel,
      mode,
      controls,
      makeText('p', 'product-purchase-note', 'Your selected option and quantity will be saved to your account cart.'),
      addButton,
      message
    );
    container.replaceChildren(imageWrap, copy, purchasePanel, descriptionWrap);
    syncMode();
    const token = localStorage.getItem('token');
    if (token) {
      window.TradspireAPI.request('/api/cart', { token, silent: true })
        .then((cartResponse) => setCartCount(cartItemsFrom(cartResponse)))
        .catch(() => {});
    }
  } catch (error) {
    showUnavailable(error.status === 404 ? 'We could not find that item.' : 'Product details could not be loaded.');
  }
});
