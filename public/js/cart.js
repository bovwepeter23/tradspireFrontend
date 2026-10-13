document.addEventListener('DOMContentLoaded', async () => {
  const itemsContainer = document.querySelector('[data-cart-items]');
  const totalElement = document.querySelector('[data-cart-total]');
  const message = document.querySelector('[data-cart-message]');
  const placeOrderButton = document.getElementById('placeOrderButton');
  if (!itemsContainer || !message || !placeOrderButton) return;

  const token = localStorage.getItem('token');
  const requiredAddressFields = ['fullName', 'phone', 'addressLine1', 'city', 'region', 'postalCode', 'country'];
  const makeText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  };
  const money = (amount) => `₦${Number(amount || 0).toFixed(2)}`;
  let cart = [];
  let deliveryAddress = null;

  const productIdFor = (item) => String(item.productId?._id || item.productId || '');
  const hasDeliveryAddress = () => requiredAddressFields.every((field) => String(deliveryAddress?.[field] || '').trim());

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
        quantity.dataset.cartQuantity = item._id;
        quantityLabel.append(quantity);
        const remove = makeText('button', 'cart-remove', 'Remove');
        remove.type = 'button';
        remove.dataset.removeCartItem = item._id;
        const duration = item.purchaseType === 'rent' ? Number(item.rentalDays || 1) : 1;
        row.append(image, details, quantityLabel, makeText('strong', 'cart-line-total', money(item.price * item.quantity * duration)), remove);
        return row;
      }));
    }
    if (totalElement) {
      totalElement.textContent = money(cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity) * (item.purchaseType === 'rent' ? Number(item.rentalDays || 1) : 1), 0));
    }
    updateCartCount();
    placeOrderButton.disabled = cart.length === 0 || !token || !hasDeliveryAddress();
  };

  const loadCart = async () => {
    const response = await window.TradspireAPI.request('/api/cart', { token, silent: true });
    cart = response.cart?.items || response.items || [];
    renderCart();
  };

  itemsContainer.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-cart-quantity]');
    if (!input) return;
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      input.value = String(cart.find((item) => item._id === input.dataset.cartQuantity)?.quantity || 1);
      message.textContent = 'Quantity must be between 1 and 99.';
      return;
    }
    const item = cart.find((entry) => entry._id === input.dataset.cartQuantity);
    if (!item) {
      message.textContent = 'This cart item could not be updated. Refresh and try again.';
      renderCart();
      return;
    }
    input.disabled = true;
    message.textContent = '';
    try {
      await window.TradspireAPI.request(`/api/cart/items/${encodeURIComponent(item._id)}`, {
        method: 'PATCH',
        token,
        silent: true,
        body: { quantity }
      });
      await loadCart();
    } catch (error) {
      message.textContent = error.message || 'The quantity could not be updated.';
      renderCart();
    }
  });

  itemsContainer.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-remove-cart-item]');
    if (!button) return;
    const item = cart.find((entry) => entry._id === button.dataset.removeCartItem);
    if (!item) {
      message.textContent = 'This cart item could not be removed. Refresh and try again.';
      return;
    }
    button.disabled = true;
    try {
      await window.TradspireAPI.request(`/api/cart/items/${encodeURIComponent(item._id)}`, {
        method: 'DELETE',
        token,
        silent: true
      });
      message.textContent = 'Item removed from your cart.';
      await loadCart();
    } catch (error) {
      message.textContent = error.message || 'The item could not be removed.';
      button.disabled = false;
    }
  });

  if (!token) {
    renderCart();
    placeOrderButton.hidden = true;
    document.querySelector('[data-cart-login]').hidden = false;
    message.textContent = 'Sign in to view your account cart and place an order.';
  } else {
    try {
      const [profileResponse] = await Promise.all([
        window.TradspireAPI.request('/api/users/profile', { token, silent: true }),
        loadCart()
      ]);
      deliveryAddress = profileResponse.user?.deliveryAddress || null;
      if (!hasDeliveryAddress()) {
        message.textContent = 'Add a complete delivery address in Settings before placing an order.';
      }
      renderCart();
    } catch (error) {
      itemsContainer.replaceChildren(makeText('p', 'empty-state', 'Your cart could not be loaded.'));
      message.textContent = error.message || 'Your cart or delivery address could not be loaded.';
    }
  }

  placeOrderButton.addEventListener('click', async () => {
    if (!cart.length || !token || !hasDeliveryAddress()) return;
    const submit = placeOrderButton;
    const orderAddress = Object.fromEntries(
      [...requiredAddressFields, 'addressLine2']
        .map((field) => [field, String(deliveryAddress[field] || '').trim()])
    );
    submit.disabled = true;
    submit.textContent = 'Placing order...';
    message.textContent = '';
    try {
      await window.TradspireAPI.request('/api/orders', {
        method: 'POST',
        token,
        silent: true,
        body: {
          items: cart.map((item) => ({ productId: productIdFor(item), quantity: item.quantity, purchaseType: item.purchaseType, rentalDays: item.rentalDays })),
          deliveryAddress: orderAddress
        }
      });
      window.location.assign('orders.html?placed=1');
    } catch (error) {
      message.textContent = error.message || 'Your order could not be placed.';
      submit.disabled = false;
      submit.textContent = 'Place order';
    }
  });
});
