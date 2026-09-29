document.addEventListener('DOMContentLoaded', async () => {
  if ((localStorage.getItem('role') || '').trim().toLowerCase() !== 'admin') return;

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
  let products = [];
  let editingId = null;
  let previewUrl = null;

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
        makeText('p', 'admin-product-meta', `${product.category} · ${product.origin}`),
        makeText('p', 'admin-product-price', `$${Number(product.price).toFixed(2)}`)
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  };

  if (!token) {
    setMessage('Sign in with an admin account to manage products.', true);
    form.hidden = true;
    await loadProducts();
    return;
  }

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
    if (!imageInput.files.length) body.delete('image');
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
      form.elements.namedItem('category').value = product.category;
      form.elements.namedItem('price').value = product.price;
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

  await loadProducts();
});