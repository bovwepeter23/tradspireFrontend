document.addEventListener('DOMContentLoaded', async () => {
  const list = document.querySelector('[data-orders-list]');
  const message = document.querySelector('[data-order-message]');
  if (!list || !message) return;

  const token = localStorage.getItem('token');
  if (new URLSearchParams(window.location.search).get('placed') === '1') {
    message.textContent = 'Order placed successfully. You can track its status here.';
  }
  const makeText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  };
  const money = (amount) => `₦${Number(amount || 0).toFixed(2)}`;
  const statusLabel = (status) => status.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  const rentalStages = [
    ['pending', 'Booking requested'],
    ['processing', 'Confirmed and preparing'],
    ['shipped', 'Dispatched'],
    ['delivered', 'Rental in progress'],
    ['return_due', 'Return due'],
    ['returned', 'Returned'],
    ['inspection', 'Item inspection'],
    ['completed', 'Rental complete'],
    ['deposit_refunded', 'Deposit refunded']
  ];

  const renderOrders = (orders) => {
    if (!orders.length) {
      list.replaceChildren(makeText('p', 'empty-state', 'You do not have any orders yet.'));
      return;
    }

    list.replaceChildren(...orders.map((order) => {
      const card = document.createElement('article');
      card.className = 'order-card';
      card.dataset.orderId = order._id;

      const header = document.createElement('header');
      header.className = 'order-card-header';
      const details = document.createElement('div');
      details.append(
        makeText('p', 'order-label', `Order ${order._id}`),
        makeText('p', 'order-date', new Date(order.createdAt).toLocaleDateString())
      );
      const normalizedStatus = String(order.status || 'unknown').toLowerCase();
      const state = makeText('span', `order-status order-status-${normalizedStatus.replaceAll('_', '-')}`, statusLabel(normalizedStatus));
      header.append(details, state);

      const isRentalOrder = (order.items || []).some((item) => item.purchaseType === 'rent');
      const items = document.createElement('div');
      items.className = 'order-items';
      (order.items || []).forEach((item) => {
        const row = document.createElement('div');
        row.className = 'order-item';
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = item.name;
        const info = document.createElement('div');
        info.append(
          makeText('h3', '', item.name),
          makeText('p', 'order-item-meta', `${item.purchaseType === 'rent' ? `Rent · ${item.rentalDays || 1} day(s)` : 'Buy'} · Qty ${item.quantity} · ${money(item.unitPrice)} each`)
        );
        row.append(image, info, makeText('strong', '', money(item.lineTotal)));
        items.append(row);
      });

      if (isRentalOrder) {
        const lifecycle = document.createElement('section');
        lifecycle.className = 'rental-lifecycle';
        lifecycle.setAttribute('aria-label', 'Rental lifecycle');
        const lifecycleTitle = makeText('h3', '', 'Rental progress');
        lifecycle.append(lifecycleTitle);
        if (normalizedStatus === 'cancelled') {
          lifecycle.append(makeText('p', 'rental-lifecycle-cancelled', 'This rental was cancelled.'));
        } else {
          const currentStage = rentalStages.findIndex(([status]) => status === normalizedStatus);
          const stages = document.createElement('ol');
          rentalStages.forEach(([status, label], index) => {
            const stage = makeText('li', '', label);
            if (currentStage >= 0 && index < currentStage) stage.classList.add('is-complete');
            if (index === currentStage) stage.classList.add('is-current');
            stages.append(stage);
          });
          lifecycle.append(stages);
          const returnDate = order.returnDueAt || order.rentalReturnDate || order.returnDate;
          if (returnDate) {
            const date = new Date(returnDate);
            if (!Number.isNaN(date.getTime())) {
              lifecycle.append(makeText('p', 'rental-return-date', `Return by ${date.toLocaleDateString()}`));
            }
          }
        }
        card.append(lifecycle);
      }

      const footer = document.createElement('footer');
      footer.className = 'order-card-footer';
      const address = order.deliveryAddress || {};
      const addressText = [address.addressLine1, address.city, address.region, address.postalCode, address.country]
        .filter(Boolean).join(', ');
      footer.append(
        makeText('p', 'order-delivery-address', `Deliver to: ${address.fullName || ''}${addressText ? ` · ${addressText}` : ''}`),
        makeText('strong', 'order-total', `Total ${money(order.total)}`)
      );
      if (['pending', 'processing'].includes(order.status)) {
        const cancel = makeText('button', 'order-cancel', 'Cancel order');
        cancel.type = 'button';
        cancel.dataset.cancelOrder = order._id;
        footer.append(cancel);
      }

      card.append(header, items, footer);
      return card;
    }));
  };

  if (!token) {
    list.replaceChildren(makeText('p', 'empty-state', 'Sign in to view your orders.'));
    return;
  }

  const loadOrders = async () => {
    list.setAttribute('aria-busy', 'true');
    try {
      const response = await window.TradspireAPI.request('/api/orders', { token });
      renderOrders(response.orders || []);
    } catch (error) {
      list.replaceChildren(makeText('p', 'empty-state', error.message || 'Orders could not be loaded.'));
    } finally {
      list.removeAttribute('aria-busy');
    }
  };

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-cancel-order]');
    if (!button || !window.confirm('Cancel this order?')) return;
    button.disabled = true;
    message.textContent = 'Cancelling order...';
    try {
      await window.TradspireAPI.request(`/api/orders/${encodeURIComponent(button.dataset.cancelOrder)}/cancel`, {
        method: 'PUT',
        token,
        body: {}
      });
      message.textContent = 'Order cancelled.';
      await loadOrders();
    } catch (error) {
      message.textContent = error.message || 'The order could not be cancelled.';
      button.disabled = false;
    }
  });

  await loadOrders();
});