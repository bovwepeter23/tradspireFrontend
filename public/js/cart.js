document.addEventListener('DOMContentLoaded', async () => {
  const itemsContainer = document.querySelector('[data-cart-items]');
  const totalElement = document.querySelector('[data-cart-total]');
  const message = document.querySelector('[data-cart-message]');
  const checkoutForm = document.getElementById('checkoutForm');
  if (!itemsContainer || !totalElement || !message || !checkoutForm) return;

  const token = localStorage.getItem('token');
  const makeText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  };
  const money = (amount) => `$${Number(amount || 0).toFixed(2)}`;
  const readCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('tradspire-cart') || '[]');
      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      return [];
    }
  };
  const writeCart = (cart) => localStorage.setItem('tradspire-cart', JSON.stringify(cart));
  let cart = readCart();

  const updateCartCount = () => {
    const badge = document.querySelector('[data-cart-count]');
    if (!badge) return;
    const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.hidden = count === 0;
  };

  const renderCart = () => {
    if (!cart.length) {
      itemsContainer.replaceChildren(makeText('p', 'empty-state', 'Your cart is empty.'));
    } else {
      itemsContainer.replaceChildren(...cart.map((item) => {
        const row = document.createElement('article');
        row.className = 'cart-item';
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = item.name;
        const details = document.createElement('div');
        details.className = 'cart-item-details';
        const rentalText = item.purchaseType === 'rent' ? `Rent · ${item.rentalDays || 1} day(s)` : 'Buy';
        details.append(makeText('h2', '', item.name), makeText('p', 'cart-item-price', `${rentalText} · ${money(item.price)}${item.purchaseType === 'rent' ? '/day' : ''}`));
        const quantityLabel = document.createElement('label');
        quantityLabel.textContent = 'Qty';
        const quantity = document.createElement('input');
        quantity.className = 'cart-quantity';
        quantity.type = 'number';
        quantity.min = '1';
        quantity.max = '99';
        quantity.value = String(item.quantity);
        quantity.dataset.cartQuantity = item.productId;
        quantityLabel.append(quantity);
        const remove = makeText('button', 'cart-remove', 'Remove');
        remove.type = 'button';
        remove.dataset.removeCartItem = item.productId;
        const duration = item.purchaseType === 'rent' ? Number(item.rentalDays || 1) : 1;
        row.append(image, details, quantityLabel, makeText('strong', 'cart-line-total', money(item.price * item.quantity * duration)), remove);
        return row;
      }));
    }
    totalElement.textContent = money(cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity) * (item.purchaseType === 'rent' ? Number(item.rentalDays || 1) : 1), 0));
    writeCart(cart);
    updateCartCount();
    const submit = checkoutForm.querySelector('[type="submit"]');
    submit.disabled = cart.length === 0 || !token;
  };

  const fillAddress = (address) => {
    Object.entries(address || {}).forEach(([field, value]) => {
      const input = checkoutForm.elements.namedItem(field);
      if (input) input.value = value || '';
    });
  };

  itemsContainer.addEventListener('change', (event) => {
    const input = event.target.closest('[data-cart-quantity]');
    if (!input) return;
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      input.value = String(cart.find((item) => item.productId === input.dataset.cartQuantity)?.quantity || 1);
      message.textContent = 'Quantity must be between 1 and 99.';
      return;
    }
    const item = cart.find((entry) => entry.productId === input.dataset.cartQuantity);
    if (item) item.quantity = quantity;
    message.textContent = '';
    renderCart();
  });

  itemsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-cart-item]');
    if (!button) return;
    cart = cart.filter((item) => item.productId !== button.dataset.removeCartItem);
    message.textContent = 'Item removed from your cart.';
    renderCart();
  });

  if (!token) {
    checkoutForm.hidden = true;
    document.querySelector('[data-cart-login]').hidden = false;
    message.textContent = 'Sign in to place an order.';
  } else {
    try {
      const response = await window.TradspireAPI.request('/api/users/profile', { token });
      fillAddress(response.user?.deliveryAddress);
      if (!response.user?.deliveryAddress?.addressLine1) {
        message.textContent = 'Add a delivery address to your profile or enter it here.';
      }
    } catch (error) {
      message.textContent = error.message || 'Your saved delivery address could not be loaded.';
    }
  }

  checkoutForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!cart.length || !token) return;
    const submit = checkoutForm.querySelector('[type="submit"]');
    const formData = new FormData(checkoutForm);
    const deliveryAddress = Object.fromEntries(
      ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'region', 'postalCode', 'country']
        .map((field) => [field, formData.get(field).trim()])
    );
    submit.disabled = true;
    submit.textContent = 'Placing order...';
    message.textContent = '';
    try {
      await window.TradspireAPI.request('/api/orders', {
        method: 'POST',
        token,
        body: {
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, purchaseType: item.purchaseType, rentalDays: item.rentalDays })),
          deliveryAddress
        }
      });
      cart = [];
      writeCart(cart);
      window.location.assign('orders.html?placed=1');
    } catch (error) {
      message.textContent = error.message || 'Your order could not be placed.';
      submit.disabled = false;
      submit.textContent = 'Place order';
    }
  });

  renderCart();
});