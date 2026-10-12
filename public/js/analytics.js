document.addEventListener('DOMContentLoaded', () => {
  const page = document.querySelector('[data-analytics-page]');
  if (!page) return;

  const token = localStorage.getItem('token');
  const message = page.querySelector('[data-analytics-message]');
  const loginLink = page.querySelector('[data-analytics-login]');
  const refreshButton = page.querySelector('[data-analytics-refresh]');
  const rangeButtons = [...page.querySelectorAll('[data-analytics-range]')];
  const currency = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
  const rangeLabels = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', all: 'All time' };
  const knownStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  let orders = [];
  let selectedRange = '30d';

  const money = (value) => currency.format(Number.isFinite(value) ? value : 0);
  const titleCase = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';
  const orderDate = (order) => {
    const date = new Date(order.createdAt);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const isCancelled = (order) => String(order.status || '').toLowerCase() === 'cancelled';
  const orderValue = (order) => Number.isFinite(Number(order.total)) ? Number(order.total) : 0;
  const makeText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  };
  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
  };

  const startOfToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const selectedOrders = (range, now = startOfToday()) => {
    if (range === 'all') return orders;
    const days = Number.parseInt(range, 10);
    const start = new Date(now);
    start.setDate(start.getDate() - days + 1);
    return orders.filter((order) => {
      const date = orderDate(order);
      return date && date >= start && date <= new Date();
    });
  };

  const lineItemValue = (item) => {
    const lineTotal = Number(item.lineTotal);
    if (item.lineTotal !== undefined && item.lineTotal !== null && Number.isFinite(lineTotal)) return lineTotal;
    const quantity = Number(item.quantity) || 1;
    const duration = item.purchaseType === 'rent' ? Number(item.rentalDays) || 1 : 1;
    return (Number(item.unitPrice) || 0) * quantity * duration;
  };

  const aggregateItems = (periodOrders) => {
    const totals = { buy: 0, rent: 0, rentalUnits: 0, units: 0, products: new Map() };
    periodOrders.filter((order) => !isCancelled(order)).forEach((order) => {
      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        const type = item.purchaseType === 'rent' ? 'rent' : 'buy';
        const quantity = Math.max(0, Number(item.quantity) || 1);
        const value = lineItemValue(item);
        totals[type] += value;
        totals.units += quantity;
        if (type === 'rent') totals.rentalUnits += quantity;
        const name = item.name || 'Unnamed product';
        const product = totals.products.get(name) || { name, units: 0, value: 0 };
        product.units += quantity;
        product.value += value;
        totals.products.set(name, product);
      });
    });
    return totals;
  };

  const chartBuckets = (range, now = startOfToday()) => {
    if (range === '90d') {
      const start = new Date(now);
      start.setDate(start.getDate() - 84);
      return Array.from({ length: 13 }, (_, index) => {
        const date = new Date(start);
        date.setDate(date.getDate() + index * 7);
        return { start: date, end: new Date(date.getTime() + 7 * 86400000), label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
      });
    }

    if (range === 'all') {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      return Array.from({ length: 12 }, (_, index) => {
        const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
        return { start: date, end: new Date(date.getFullYear(), date.getMonth() + 1, 1), label: date.toLocaleDateString(undefined, { month: 'short' }) };
      });
    }

    const days = Number.parseInt(range, 10);
    const start = new Date(now);
    start.setDate(start.getDate() - days + 1);
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(date.getDate() + index);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      return { start: date, end, label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
    });
  };

  const renderTrend = (periodOrders, range) => {
    const buckets = chartBuckets(range);
    const values = buckets.map((bucket) => periodOrders.reduce((sum, order) => {
      const date = orderDate(order);
      return date && !isCancelled(order) && date >= bucket.start && date < bucket.end ? sum + orderValue(order) : sum;
    }, 0));
    const maximum = Math.max(...values, 1);
    const bars = page.querySelector('[data-trend-bars]');
    bars.replaceChildren(...values.map((value, index) => {
      const column = document.createElement('div');
      column.className = 'analytics-trend-column';
      column.title = `${buckets[index].label}: ${money(value)}`;
      const bar = document.createElement('span');
      bar.className = `analytics-trend-bar${index === values.length - 1 ? ' is-current' : ''}`;
      bar.style.setProperty('--bar-height', `${Math.max(3, value / maximum * 100)}%`);
      column.append(bar);
      return column;
    }));
    const labels = page.querySelector('[data-trend-labels]');
    const labelIndexes = [...new Set([0, Math.floor((buckets.length - 1) / 2), buckets.length - 1])];
    labels.replaceChildren(...labelIndexes.map((index) => makeText('span', '', buckets[index].label)));
    const total = values.reduce((sum, value) => sum + value, 0);
    page.querySelector('[data-trend-total]').textContent = money(total);
    page.querySelector('[data-trend-note]').textContent = range === 'all'
      ? 'Monthly trend · latest 12 months'
      : `${rangeLabels[range]} · ${range === '90d' ? 'weekly' : 'daily'} non-cancelled value`;
    page.querySelector('[data-trend-chart]').setAttribute('aria-label', `${rangeLabels[range]} booked value trend, total ${money(total)}`);
  };

  const renderMix = (totals) => {
    const totalValue = totals.buy + totals.rent;
    const entries = [
      { key: 'buy', label: 'Purchased', value: totals.buy, className: 'is-buy' },
      { key: 'rent', label: 'Rented', value: totals.rent, className: 'is-rent' }
    ];
    page.querySelector('[data-order-mix]').replaceChildren(...entries.map((entry) => {
      const row = document.createElement('div');
      row.className = 'analytics-mix-row';
      const top = document.createElement('div');
      top.className = 'analytics-mix-row-heading';
      top.append(makeText('span', '', entry.label), makeText('strong', '', money(entry.value)));
      const track = document.createElement('div');
      track.className = 'analytics-mix-track';
      const fill = document.createElement('span');
      fill.className = `analytics-mix-fill ${entry.className}`;
      fill.style.setProperty('--mix-width', `${totalValue ? entry.value / totalValue * 100 : 0}%`);
      track.append(fill);
      const share = totalValue ? Math.round(entry.value / totalValue * 100) : 0;
      row.append(top, track, makeText('p', 'analytics-mix-share', `${share}% of booked item value`));
      return row;
    }));
  };

  const renderStatuses = (periodOrders) => {
    const counts = new Map(knownStatuses.map((status) => [status, 0]));
    periodOrders.forEach((order) => {
      const status = String(order.status || 'unknown').toLowerCase();
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    const entries = [...counts.entries()];
    const maximum = Math.max(...entries.map(([, count]) => count), 1);
    page.querySelector('[data-status-list]').replaceChildren(...entries.map(([status, count]) => {
      const row = document.createElement('div');
      row.className = 'analytics-status-row';
      const name = makeText('span', 'analytics-status-name', titleCase(status));
      const track = document.createElement('span');
      track.className = 'analytics-status-track';
      const fill = document.createElement('span');
      fill.className = `analytics-status-fill status-${status}`;
      fill.style.setProperty('--status-width', `${count / maximum * 100}%`);
      track.append(fill);
      row.append(name, track, makeText('strong', 'analytics-status-count', String(count)));
      return row;
    }));
  };

  const renderProducts = (totals) => {
    const topProducts = [...totals.products.values()].sort((first, second) => second.units - first.units).slice(0, 5);
    const maximum = Math.max(...topProducts.map((product) => product.units), 1);
    const list = page.querySelector('[data-top-products]');
    if (!topProducts.length) {
      list.replaceChildren(makeText('p', 'analytics-empty', 'No product line items in this period.'));
      return;
    }
    list.replaceChildren(...topProducts.map((product, index) => {
      const row = document.createElement('div');
      row.className = 'analytics-product-row';
      const heading = document.createElement('div');
      heading.className = 'analytics-product-heading';
      heading.append(makeText('span', 'analytics-product-rank', String(index + 1).padStart(2, '0')),
        makeText('span', 'analytics-product-name', product.name),
        makeText('strong', 'analytics-product-units', `${product.units} ${product.units === 1 ? 'unit' : 'units'}`));
      const track = document.createElement('span');
      track.className = 'analytics-product-track';
      const fill = document.createElement('span');
      fill.style.setProperty('--product-width', `${product.units / maximum * 100}%`);
      track.append(fill);
      row.append(heading, track);
      return row;
    }));
  };

  const renderInsights = (periodOrders, totals, range, revenue) => {
    const insights = [];
    const trendComparison = page.querySelector('[data-trend-comparison]');
    trendComparison.textContent = range === 'all' ? 'Showing the latest 12 months' : '';
    if (range !== 'all') {
      const now = startOfToday();
      const days = Number.parseInt(range, 10);
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - days + 1);
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - days);
      const previousEnd = currentStart;
      const previousRevenue = orders.reduce((sum, order) => {
        const date = orderDate(order);
        return date && !isCancelled(order) && date >= previousStart && date < previousEnd ? sum + orderValue(order) : sum;
      }, 0);
      if (previousRevenue > 0) {
        const change = (revenue - previousRevenue) / previousRevenue * 100;
        trendComparison.textContent = `${Math.abs(change).toFixed(0)}% ${change >= 0 ? 'higher' : 'lower'} than the previous ${days} days`;
        insights.push({ tone: change >= 0 ? 'positive' : 'attention', title: `${Math.abs(change).toFixed(0)}% ${change >= 0 ? 'up' : 'down'} in booked value`, detail: `Compared with the previous ${days} days.` });
      } else if (revenue > 0) {
        trendComparison.textContent = 'No booked value in the previous comparison period';
        insights.push({ tone: 'positive', title: 'New sales activity', detail: 'There was no booked value in the previous comparison period.' });
      } else {
        trendComparison.textContent = 'No booked value in either comparison period';
      }
    }

    const rentShare = totals.units ? Math.round(totals.rentalUnits / totals.units * 100) : 0;
    if (totals.units) {
      insights.push({ tone: 'neutral', title: `${rentShare}% of units are rentals`, detail: `${totals.rentalUnits} rental units out of ${totals.units} ordered.` });
    }
    const openOrders = periodOrders.filter((order) => ['pending', 'processing'].includes(String(order.status || '').toLowerCase())).length;
    if (openOrders) {
      insights.push({ tone: 'attention', title: `${openOrders} orders need attention`, detail: 'Pending or processing orders may need a fulfilment update.' });
    }
    const bestSeller = [...totals.products.values()].sort((first, second) => second.units - first.units)[0];
    if (bestSeller) {
      insights.push({ tone: 'neutral', title: `${bestSeller.name} leads demand`, detail: `${bestSeller.units} units ordered in the selected period.` });
    }
    if (!insights.length) insights.push({ tone: 'neutral', title: 'Not enough activity for a trend yet', detail: 'Insights will appear as orders are placed.' });
    page.querySelector('[data-analytics-insights]').replaceChildren(...insights.slice(0, 3).map((insight) => {
      const item = document.createElement('article');
      item.className = `analytics-insight is-${insight.tone}`;
      item.append(makeText('h3', '', insight.title), makeText('p', '', insight.detail));
      return item;
    }));
  };

  const renderRecentOrders = (periodOrders) => {
    const recent = [...periodOrders].sort((first, second) => (orderDate(second)?.getTime() || 0) - (orderDate(first)?.getTime() || 0)).slice(0, 6);
    const list = page.querySelector('[data-recent-orders]');
    if (!recent.length) {
      list.replaceChildren(makeText('p', 'analytics-empty', 'No orders in this period.'));
      return;
    }
    list.replaceChildren(...recent.map((order) => {
      const row = document.createElement('article');
      row.className = 'analytics-recent-row';
      const date = orderDate(order);
      row.append(
        makeText('span', 'analytics-recent-date', date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable'),
        makeText('span', 'analytics-recent-id', `#${String(order._id || '').slice(-8) || '—'}`),
        makeText('span', 'analytics-recent-customer', order.user?.name || 'Customer'),
        makeText('span', `analytics-recent-status status-${String(order.status || 'unknown').toLowerCase()}`, titleCase(String(order.status || 'unknown').toLowerCase())),
        makeText('strong', 'analytics-recent-total', money(orderValue(order)))
      );
      return row;
    }));
  };

  const render = () => {
    const periodOrders = selectedOrders(selectedRange);
    const validOrders = periodOrders.filter((order) => !isCancelled(order));
    const revenue = validOrders.reduce((sum, order) => sum + orderValue(order), 0);
    const average = validOrders.length ? revenue / validOrders.length : 0;
    const totals = aggregateItems(periodOrders);
    page.querySelector('[data-analytics-period-label]').textContent = rangeLabels[selectedRange];
    page.querySelector('[data-kpi-value]').textContent = money(revenue);
    page.querySelector('[data-kpi-orders]').textContent = String(periodOrders.length);
    page.querySelector('[data-kpi-orders-note]').textContent = `${validOrders.length} non-cancelled`;
    page.querySelector('[data-kpi-average]').textContent = money(average);
    page.querySelector('[data-kpi-rentals]').textContent = String(totals.rentalUnits);
    page.querySelector('[data-kpi-rentals-note]').textContent = `${totals.rentalUnits} rental units ordered`;
    renderTrend(periodOrders, selectedRange);
    renderMix(totals);
    renderStatuses(periodOrders);
    renderProducts(totals);
    renderInsights(periodOrders, totals, selectedRange, revenue);
    renderRecentOrders(periodOrders);
  };

  const loadOrders = async () => {
    if (!token) {
      setMessage('Sign in with an administrator account to view store analytics.', true);
      loginLink.hidden = false;
      return;
    }
    refreshButton.disabled = true;
    refreshButton.classList.add('is-loading');
    setMessage('Loading the latest order data...');
    try {
      const response = await window.TradspireAPI.request('/api/orders/admin', { token });
      orders = Array.isArray(response.orders) ? response.orders : [];
      render();
      page.querySelector('[data-analytics-updated]').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      setMessage(orders.length ? `${orders.length} orders analyzed.` : 'No orders have been placed yet.');
    } catch (error) {
      setMessage(error.status === 401 || error.status === 403
        ? 'An authorized administrator account is required to view analytics.'
        : error.message || 'Order data could not be loaded. Try again.', true);
    } finally {
      refreshButton.disabled = false;
      refreshButton.classList.remove('is-loading');
    }
  };

  rangeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedRange = button.dataset.analyticsRange;
      rangeButtons.forEach((rangeButton) => rangeButton.setAttribute('aria-pressed', String(rangeButton === button)));
      if (orders.length || message.textContent === 'No orders have been placed yet.') render();
    });
  });
  refreshButton.addEventListener('click', loadOrders);
  loadOrders();
});