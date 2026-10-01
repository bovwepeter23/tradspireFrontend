document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('productForm');
  const message = document.querySelector('[data-admin-message]');
  const inventory = document.querySelector('[data-admin-product-list]');
  const count = document.querySelector('[data-product-count]');
  if (!form || !message || !inventory || !count) return;

  const token = localStorage.getItem('token');
  const imageInput = form.elements.namedItem('image');
  const imagePreview = document.querySelector('[data-image-preview]');
  const heading = document.querySelector('[data-product-form-heading]');
  const submitButton = form.querySelector('[type="submit"]');
  const cancelButton = document.querySelector('[data-cancel-edit]');
  const listingTypeInputs = [...form.querySelectorAll('input[name="listingType"]')];
  const priceInput = form.elements.namedItem('price');
  const rentPriceInput = form.elements.namedItem('rentPricePerDay');
  const subImagesInput = form.elements.namedItem('subImages');
  const carouselForm = document.getElementById('carouselForm');
  const carouselList = document.querySelector('[data-carousel-list]');
  const carouselCount = document.querySelector('[data-carousel-count]');
  const carouselHeading = document.querySelector('[data-carousel-form-heading]');
  const carouselSubmit = carouselForm?.querySelector('[type="submit"]');
  const carouselCancel = document.querySelector('[data-carousel-cancel]');
  const carouselImageInput = carouselForm?.elements.namedItem('image');
  const carouselImagePreview = document.querySelector('[data-carousel-image-preview]');
  let products = [];
  let editingId = null;
  let previewUrl = null;
  let carouselItems = [];
  let editingCarouselId = null;
  let carouselPreviewUrl = null;

  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
  };

  const makeText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  };

  const selectedListingTypes = () => listingTypeInputs.filter((input) => input.checked).map((input) => input.value);

  const syncListingPrices = () => {
    const types = selectedListingTypes();
    priceInput.required = types.includes('buy');
    rentPriceInput.required = types.includes('rent');
    priceInput.disabled = !types.includes('buy');
    rentPriceInput.disabled = !types.includes('rent');
  };

  const categoriesFor = (product) => Array.isArray(product.categories)
    ? product.categories.join(', ')
    : product.categories || product.category || '';

  const listingTypesFor = (product) => {
    if (Array.isArray(product.listingType)) return product.listingType;
    if (Array.isArray(product.listingTypes)) return product.listingTypes;
    if (product.listingType) return [product.listingType];
    return product.isRentable ? ['rent'] : ['buy'];
  };

  const renderProducts = () => {
    count.textContent = String(products.length);
    if (!products.length) {
      inventory.replaceChildren(makeText('p', 'empty-state', 'No products yet. Add your first item using the form.'));
      return;
    }

    inventory.replaceChildren(...products.map((product) => {
      const row = document.createElement('article');
      row.className = 'admin-product-row';
      const image = document.createElement('img');
      image.className = 'admin-product-image';
      image.src = product.image;
      image.alt = product.imageAlt || product.name;

      const details = document.createElement('div');
      details.className = 'admin-product-info';
      details.append(
        makeText('h3', '', product.name),
        makeText('p', 'admin-product-meta', `${categoriesFor(product)} · ${product.origin}`),
        makeText('p', 'admin-product-price', [
          product.price != null ? `Buy $${Number(product.price).toFixed(2)}` : '',
          product.rentPricePerDay != null ? `Rent $${Number(product.rentPricePerDay).toFixed(2)}/day` : ''
        ].filter(Boolean).join(' · '))
      );

      const actions = document.createElement('div');
      actions.className = 'admin-product-actions';
      const edit = makeText('button', 'admin-action', 'Edit');
      edit.type = 'button';
      edit.dataset.editProduct = product._id;
      const remove = makeText('button', 'admin-action admin-delete', 'Delete');
      remove.type = 'button';
      remove.dataset.deleteProduct = product._id;
      actions.append(edit, remove);
      row.append(image, details, actions);
      return row;
    }));

    if (window.lucide) window.lucide.createIcons();
  };

  const loadProducts = async () => {
    inventory.setAttribute('aria-busy', 'true');
    try {
      const response = await window.TradspireAPI.request('/api/products?limit=100');
      products = response.products || [];
      renderProducts();
    } catch (error) {
      inventory.replaceChildren(makeText('p', 'empty-state', error.message));
    } finally {
      inventory.removeAttribute('aria-busy');
    }
  };

  const resetForm = () => {
    form.reset();
    editingId = null;
    imageInput.required = true;
    submitButton.textContent = 'Create product';
    heading.textContent = 'Add product';
    cancelButton.hidden = true;
    imagePreview.hidden = true;
    imagePreview.removeAttribute('src');
    subImagesInput.value = '';
    listingTypeInputs.forEach((input) => { input.checked = input.value === 'buy'; });
    syncListingPrices();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  };

  const renderCarousel = () => {
    carouselCount.textContent = String(carouselItems.length);
    if (!carouselItems.length) {
      carouselList.replaceChildren(makeText('p', 'empty-state', 'No carousel images yet.'));
      return;
    }

    carouselList.replaceChildren(...carouselItems.map((item) => {
      const row = document.createElement('article');
      row.className = 'admin-product-row';
      const image = document.createElement('img');
      image.className = 'admin-product-image';
      image.src = item.image;
      image.alt = item.imageAlt || item.title;
      const details = document.createElement('div');
      details.className = 'admin-product-info';
      details.append(makeText('h3', '', item.title), makeText('p', 'admin-product-meta', item.productId || 'Homepage carousel'));
      const actions = document.createElement('div');
      actions.className = 'admin-product-actions';
      const edit = makeText('button', 'admin-action', 'Edit');
      edit.type = 'button';
      edit.dataset.editCarousel = item._id;
      const remove = makeText('button', 'admin-action admin-delete', 'Delete');
      remove.type = 'button';
      remove.dataset.deleteCarousel = item._id;
      actions.append(edit, remove);
      row.append(image, details, actions);
      return row;
    }));
  };

  const loadCarousel = async () => {
    try {
      const response = await window.TradspireAPI.request('/api/carousel?limit=100');
      carouselItems = response.items || response.carouselImages || response.carousel || [];
      renderCarousel();
    } catch (error) {
      carouselList.replaceChildren(makeText('p', 'empty-state', error.message));
    }
  };

  const resetCarouselForm = () => {
    carouselForm.reset();
    editingCarouselId = null;
    carouselImageInput.required = true;
    carouselSubmit.textContent = 'Add carousel image';
    carouselHeading.textContent = 'Add carousel image';
    carouselCancel.hidden = true;
    carouselImagePreview.hidden = true;
    carouselImagePreview.removeAttribute('src');
    if (carouselPreviewUrl) URL.revokeObjectURL(carouselPreviewUrl);
    carouselPreviewUrl = null;
  };

  listingTypeInputs.forEach((input) => input.addEventListener('change', () => {
    if (!selectedListingTypes().length) input.checked = true;
    syncListingPrices();
  }));
  syncListingPrices();

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file && file.size > 4 * 1024 * 1024) {
      imageInput.value = '';
      previewUrl = null;
      imagePreview.hidden = true;
      setMessage('Choose an image smaller than 4 MB.', true);
      return;
    }
    previewUrl = file ? URL.createObjectURL(file) : null;
    imagePreview.hidden = !previewUrl;
    if (previewUrl) imagePreview.src = previewUrl;
  });

  cancelButton.addEventListener('click', () => {
    resetForm();
    setMessage('Edit cancelled.');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = new FormData(form);
    const categories = form.elements.namedItem('categories').value
      .split(',')
      .map((category) => category.trim())
      .filter(Boolean);
    body.delete('categories');
    categories.forEach((category) => body.append('categories', category));
    if (!imageInput.files.length) body.delete('image');
    if (!subImagesInput.files.length) body.delete('subImages');
    submitButton.disabled = true;
    setMessage(editingId ? 'Saving product changes...' : 'Creating product...');

    try {
      await window.TradspireAPI.request(
        editingId ? `/api/products/${encodeURIComponent(editingId)}` : '/api/products',
        { method: editingId ? 'PUT' : 'POST', token, body }
      );
      resetForm();
      setMessage('Product saved. The storefront has been updated.');
      await loadProducts();
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      submitButton.disabled = false;
    }
  });

  inventory.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-product]');
    if (editButton) {
      const product = products.find((item) => item._id === editButton.dataset.editProduct);
      if (!product) return;
      editingId = product._id;
      form.elements.namedItem('name').value = product.name;
      form.elements.namedItem('categories').value = categoriesFor(product);
      listingTypeInputs.forEach((input) => { input.checked = listingTypesFor(product).includes(input.value); });
      form.elements.namedItem('price').value = product.price ?? '';
      form.elements.namedItem('rentPricePerDay').value = product.rentPricePerDay ?? '';
      syncListingPrices();
      form.elements.namedItem('origin').value = product.origin;
      form.elements.namedItem('description').value = product.description;
      form.elements.namedItem('imageAlt').value = product.imageAlt || product.name;
      imageInput.value = '';
      imageInput.required = false;
      heading.textContent = 'Edit product';
      submitButton.textContent = 'Save changes';
      cancelButton.hidden = false;
      imagePreview.hidden = true;
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMessage(`Editing ${product.name}. Choose a new image only if you want to replace it.`);
      return;
    }

    const deleteButton = event.target.closest('[data-delete-product]');
    if (!deleteButton) return;
    const product = products.find((item) => item._id === deleteButton.dataset.deleteProduct);
    if (!product || !window.confirm(`Delete ${product.name}?`)) return;

    deleteButton.disabled = true;
    try {
      await window.TradspireAPI.request(`/api/products/${encodeURIComponent(product._id)}`, {
        method: 'DELETE',
        token
      });
      setMessage('Product deleted from the storefront.');
      await loadProducts();
    } catch (error) {
      setMessage(error.message, true);
      deleteButton.disabled = false;
    }
  });

  carouselImageInput?.addEventListener('change', () => {
    const file = carouselImageInput.files[0];
    if (carouselPreviewUrl) URL.revokeObjectURL(carouselPreviewUrl);
    carouselPreviewUrl = file ? URL.createObjectURL(file) : null;
    carouselImagePreview.hidden = !carouselPreviewUrl;
    if (carouselPreviewUrl) carouselImagePreview.src = carouselPreviewUrl;
  });

  carouselCancel?.addEventListener('click', () => {
    resetCarouselForm();
    setMessage('Carousel edit cancelled.');
  });

  carouselForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = new FormData(carouselForm);
    if (!carouselImageInput.files.length) body.delete('image');
    carouselSubmit.disabled = true;
    setMessage(editingCarouselId ? 'Saving carousel image...' : 'Adding carousel image...');
    try {
      await window.TradspireAPI.request(
        editingCarouselId ? `/api/carousel/${encodeURIComponent(editingCarouselId)}` : '/api/carousel',
        { method: editingCarouselId ? 'PUT' : 'POST', token, body }
      );
      resetCarouselForm();
      setMessage('Carousel image saved.');
      await loadCarousel();
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      carouselSubmit.disabled = false;
    }
  });

  carouselList?.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-carousel]');
    if (editButton) {
      const item = carouselItems.find((entry) => entry._id === editButton.dataset.editCarousel);
      if (!item) return;
      editingCarouselId = item._id;
      carouselForm.elements.namedItem('title').value = item.title || '';
      carouselForm.elements.namedItem('productId').value = item.productId || '';
      carouselForm.elements.namedItem('imageAlt').value = item.imageAlt || item.title || '';
      carouselImageInput.value = '';
      carouselImageInput.required = false;
      carouselHeading.textContent = 'Edit carousel image';
      carouselSubmit.textContent = 'Save carousel image';
      carouselCancel.hidden = false;
      carouselImagePreview.hidden = true;
      carouselForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const deleteButton = event.target.closest('[data-delete-carousel]');
    if (!deleteButton) return;
    const item = carouselItems.find((entry) => entry._id === deleteButton.dataset.deleteCarousel);
    if (!item || !window.confirm(`Delete ${item.title}?`)) return;
    deleteButton.disabled = true;
    try {
      await window.TradspireAPI.request(`/api/carousel/${encodeURIComponent(item._id)}`, { method: 'DELETE', token });
      setMessage('Carousel image deleted.');
      await loadCarousel();
    } catch (error) {
      setMessage(error.message, true);
      deleteButton.disabled = false;
    }
  });

  await loadProducts();
  await loadCarousel();
});