document.addEventListener('DOMContentLoaded', async () => {
  const itemsContainer = document.querySelector('[data-cart-items]');
  const totalElement = document.querySelector('[data-cart-total]');
  const message = document.querySelector('[data-cart-message]');
  const placeOrderButton = document.getElementById('placeOrderButton');
  const orderDialog = document.querySelector('[data-order-dialog]');
  const orderEstimate = document.querySelector('[data-order-estimate]');
  const orderDialogMessage = document.querySelector('[data-order-dialog-message]');
  const confirmOrderButton = document.querySelector('[data-confirm-order]');
  if (!itemsContainer || !message || !placeOrderButton || !orderDialog || !orderEstimate || !confirmOrderButton) return;

  const token = localStorage.getItem('token');
  const requiredAddressFields = ['phone', 'addressLine1', 'city'];
  const orderAddressFields = ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'region', 'postalCode', 'country', 'instructions'];
  const makeText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  };
  const money = (amount) => `₦${Number(amount || 0).toFixed(2)}`;
  let cart = [];
  let deliveryAddress = null;

  const cartTotal = () => cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity) * (item.purchaseType === 'rent' ? Number(item.rentalDays || 1) : 1), 0);
  const productIdFor = (item) => String(item.productId?._id || item.productId || '');
  const normalizeAddress = (address = {}, fallbackName = '') => {
    const fullName = address.fullName || address.recipientName || fallbackName || '';
    const addressLine1 = address.addressLine1 || address.street || '';
    return {
      fullName,
      phone: address.phone || '',
      addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      region: address.region || '',
      postalCode: address.postalCode || '',
      country: address.country || 'Nigeria',
      instructions: address.instructions || ''
    };
  };
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
        const quantity = makeText('p', 'cart-item-quantity', `Qty: ${item.quantity}`);
        const remove = makeText('button', 'cart-remove', 'Remove');
        remove.type = 'button';
        remove.dataset.removeCartItem = item._id;
        const duration = item.purchaseType === 'rent' ? Number(item.rentalDays || 1) : 1;
        row.append(image, details, quantity, makeText('strong', 'cart-line-total', money(item.price * item.quantity * duration)), remove);
        return row;
      }));
    }
    if (totalElement) {
      totalElement.textContent = money(cartTotal());
    }
    updateCartCount();
    placeOrderButton.disabled = cart.length === 0 || !token;
  };

  const loadCart = async () => {
    const response = await window.TradspireAPI.request('/api/cart', { token, silent: true });
    cart = response.cart?.items || response.items || [];
    renderCart();
  };

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
      const profileUser = profileResponse.data?.user || profileResponse.user || {};
      const address = profileUser.deliveryAddress || null;
      deliveryAddress = address && normalizeAddress(address, profileUser.name);
      if (!hasDeliveryAddress()) {
        message.textContent = 'No delivery address is saved yet. You can still place your order and add the address later in Settings.';
      }
      renderCart();
    } catch (error) {
      itemsContainer.replaceChildren(makeText('p', 'empty-state', 'Your cart could not be loaded.'));
      message.textContent = error.message || 'Your cart or delivery address could not be loaded.';
    }
  }

  placeOrderButton.addEventListener('click', () => {
    if (!cart.length || !token) return;
    orderEstimate.textContent = money(cartTotal());
    orderDialogMessage.textContent = '';
    orderDialog.showModal();
  });

  document.querySelectorAll('[data-close-order-dialog]').forEach((button) => {
    button.addEventListener('click', () => orderDialog.close());
  });
  orderDialog.addEventListener('click', (event) => {
    if (event.target === orderDialog) orderDialog.close();
  });

  confirmOrderButton.addEventListener('click', async () => {
    if (!cart.length || !token) return;
    const submit = placeOrderButton;
    const orderAddress = Object.fromEntries(
      orderAddressFields.map((field) => [field, String(deliveryAddress?.[field] || '').trim()])
    );
    const normalizedOrderAddress = {
      ...orderAddress,
      recipientName: orderAddress.fullName || '',
      street: orderAddress.addressLine1 || ''
    };
    const hasRentalItems = cart.some((item) => item.purchaseType === 'rent');
    const orderEndpoint = hasRentalItems ? '/api/orders/rent' : '/api/orders';
    if (!hasDeliveryAddress()) {
      orderDialogMessage.textContent = 'No delivery address is saved yet, but your order can still be placed. You can add the address later in Settings.';
    }
    submit.disabled = true;
    confirmOrderButton.disabled = true;
    confirmOrderButton.textContent = 'Placing order...';
    orderDialogMessage.textContent = '';
    try {
      await window.TradspireAPI.request(orderEndpoint, {
        method: 'POST',
        token,
        silent: true,
        body: {
          items: cart.map((item) => ({ productId: productIdFor(item), quantity: item.quantity, purchaseType: item.purchaseType, rentalDays: item.rentalDays })),
          deliveryAddress: normalizedOrderAddress
        }
      });
      window.location.assign('orders.html?placed=1');
    } catch (error) {
      orderDialogMessage.textContent = error.message || 'Your order could not be placed.';
      renderCart();
      confirmOrderButton.disabled = false;
      confirmOrderButton.textContent = 'Confirm order';
    }
  });
});
