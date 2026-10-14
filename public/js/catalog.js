document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;

  const homeCategoryList = document.querySelector('[data-home-category-list]');
  const homeTitle = document.querySelector('[data-home-products-title]');
  const catalogForm = document.querySelector('[data-catalog-form]');
  const catalogCount = document.querySelector('[data-catalog-result-count]');
  const mainFilter = catalogForm?.elements.namedItem('categoryId');
  const subFilter = catalogForm?.elements.namedItem('subCategoryId');
  const searchInput = catalogForm?.elements.namedItem('search');
  const categoriesById = new Map();
  let categories = [];
  let selectedHomeCategory = '';

  const parentIdOf = (category) => {
    const parent = category.parentId;
    return typeof parent === 'object' && parent ? parent._id : parent || '';
  };

  const mainCategories = () => categories.filter((category) => !parentIdOf(category));
  const subCategoriesFor = (mainId) => mainId
    ? categories.filter((category) => parentIdOf(category) === mainId)
    : [];
  const categoryName = (id) => categoriesById.get(id)?.name || '';

  const productCategoryLabel = (product) => {
    const mainId = typeof product.mainCategoryId === 'object'
      ? product.mainCategoryId?._id
      : product.mainCategoryId || product.categoryId;
    const subId = typeof product.subCategoryId === 'object'
      ? product.subCategoryId?._id
      : product.subCategoryId;
    const names = [
      product.mainCategory?.name || categoryName(mainId),
      product.subCategory?.name || categoryName(subId)
    ].filter(Boolean);
    return names.join(' · ') || (Array.isArray(product.categories)
      ? product.categories.join(' · ')
      : product.categories || product.category || '');
  };

  const syncSubcategoryFilter = (selectedId = subFilter?.value || '') => {
    if (!subFilter) return;
    const subcategories = subCategoriesFor(mainFilter.value);
    subFilter.replaceChildren(new Option('All subcategories', ''));
    subcategories.forEach((category) => subFilter.add(new Option(category.name, category._id)));
    subFilter.disabled = !mainFilter.value || !subcategories.length;
    subFilter.value = subcategories.some((category) => category._id === selectedId) ? selectedId : '';
  };

  const loadCategories = async () => {
    const response = await window.TradspireAPI.request('/api/categories', { silent: true });
    categories = response.categories || [];
    categoriesById.clear();
    categories.forEach((category) => categoriesById.set(category._id, category));
    return categories;
  };

  const renderHomeCategories = () => {
    if (!homeCategoryList) return;
    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.className = 'category-chip';
    allButton.textContent = 'All products';
    allButton.dataset.homeCategory = '';
    allButton.setAttribute('aria-pressed', String(!selectedHomeCategory));
    homeCategoryList.replaceChildren(allButton);
    mainCategories().forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-chip';
      button.textContent = category.name;
      button.dataset.homeCategory = category._id;
      button.setAttribute('aria-pressed', String(selectedHomeCategory === category._id));
      homeCategoryList.append(button);
    });
  };

  const renderFilters = () => {
    if (!mainFilter) return;
    const currentMain = new URLSearchParams(window.location.search).get('mainCategoryId') || '';
    const currentSub = new URLSearchParams(window.location.search).get('subCategoryId') || '';
    const currentSearch = new URLSearchParams(window.location.search).get('search') || '';
    mainFilter.replaceChildren(new Option('All main categories', ''));
    mainCategories().forEach((category) => mainFilter.add(new Option(category.name, category._id)));
    mainFilter.value = mainCategories().some((category) => category._id === currentMain) ? currentMain : '';
    syncSubcategoryFilter(currentSub);
    searchInput.value = currentSearch;
  };

  const pricesFor = (product) => [
    product.price != null ? `Buy ₦${Number(product.price).toFixed(2)}` : '',
    product.rentPricePerDay != null ? `Rent ₦${Number(product.rentPricePerDay).toFixed(2)}/day` : ''
  ].filter(Boolean).join(' · ');

  const renderProducts = (products) => {
    if (!products.length) {
      grid.textContent = 'No products match these filters. Try another search or category.';
      grid.classList.add('product-grid-empty');
      return;
    }

    const productPage = window.location.pathname.includes('/html/') ? 'product.html' : 'html/product.html';
    const cards = products.map((product) => {
      const card = document.createElement('a');
      card.className = 'product-card';
      card.href = `${productPage}?id=${encodeURIComponent(product._id)}`;

      const image = document.createElement('img');
      image.className = 'product-card-image';
      image.src = product.image;
      image.alt = product.imageAlt || product.name;

      const content = document.createElement('div');
      content.className = 'product-card-content';
      const category = document.createElement('p');
      category.className = 'product-category';
      category.textContent = productCategoryLabel(product);
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

    grid.classList.remove('product-grid-empty');
    grid.replaceChildren(...cards);
  };

  const loadProducts = async ({ mainCategoryId = '', subCategoryId = '', search = '' } = {}) => {
    grid.setAttribute('aria-busy', 'true');
    grid.replaceChildren(Object.assign(document.createElement('p'), {
      className: 'empty-state',
      textContent: 'Loading products...'
    }));
    const params = new URLSearchParams({ limit: '100' });
    if (mainCategoryId) params.set('mainCategoryId', mainCategoryId);
    if (subCategoryId) params.set('subCategoryId', subCategoryId);
    if (search) params.set('search', search);

    try {
      const response = await window.TradspireAPI.request(`/api/products?${params.toString()}`, { silent: true });
      let products = response.products || [];
      if (mainCategoryId) {
        products = products.filter((product) => {
          const value = typeof product.mainCategoryId === 'object'
            ? product.mainCategoryId?._id
            : product.mainCategoryId || product.categoryId;
          return value === mainCategoryId;
        });
      }
      if (subCategoryId) {
        products = products.filter((product) => {
          const value = typeof product.subCategoryId === 'object' ? product.subCategoryId?._id : product.subCategoryId;
          return value === subCategoryId;
        });
      }
      if (search) {
        const query = search.toLocaleLowerCase();
        products = products.filter((product) =>
          `${product.name || ''} ${productCategoryLabel(product)}`.toLocaleLowerCase().includes(query));
      }
      renderProducts(products);
      if (catalogCount) catalogCount.textContent = `${products.length} ${products.length === 1 ? 'product' : 'products'} found`;
    } catch (error) {
      grid.textContent = `Products could not be loaded. ${error.message}`;
      grid.classList.add('product-grid-empty');
      if (catalogCount) catalogCount.textContent = '';
    } finally {
      grid.removeAttribute('aria-busy');
    }
  };

  if (homeCategoryList) {
    homeCategoryList.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-home-category]');
      if (!button) return;
      selectedHomeCategory = button.dataset.homeCategory;
      homeCategoryList.querySelectorAll('[data-home-category]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      const title = selectedHomeCategory ? categoryName(selectedHomeCategory) : 'All products';
      if (homeTitle) homeTitle.textContent = title;
      await loadProducts({ mainCategoryId: selectedHomeCategory });
    });
  }

  try {
    await loadCategories();
    renderHomeCategories();
    renderFilters();
  } catch (error) {
    if (homeCategoryList) homeCategoryList.textContent = `Categories could not be loaded. ${error.message}`;
    if (catalogCount) catalogCount.textContent = `Categories could not be loaded. ${error.message}`;
  }

  if (mainFilter) {
    mainFilter.addEventListener('change', () => syncSubcategoryFilter(''));
    catalogForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const search = searchInput.value.trim();
      const mainCategoryId = mainFilter.value;
      const subCategoryId = subFilter.value;
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (mainCategoryId) params.set('mainCategoryId', mainCategoryId);
      if (subCategoryId) params.set('subCategoryId', subCategoryId);
      window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
      await loadProducts({ mainCategoryId, subCategoryId, search });
    });
  }

  if (homeCategoryList) {
    await loadProducts();
  } else {
    const params = new URLSearchParams(window.location.search);
    await loadProducts({
      mainCategoryId: params.get('mainCategoryId') || '',
      subCategoryId: params.get('subCategoryId') || '',
      search: params.get('search') || ''
    });
  }
});
