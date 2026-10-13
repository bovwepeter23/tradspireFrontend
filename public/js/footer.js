document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('[data-site-footer]')) return;

  const isHtmlPage = window.location.pathname.includes('/html/');
  const pageHref = (page) => isHtmlPage ? page : `html/${page}`;
  const homeHref = isHtmlPage ? '../index.html' : 'index.html';
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.dataset.siteFooter = '';
  footer.innerHTML = `
    <div class="site-footer-main">
      <div class="site-footer-brand">
        <a class="site-footer-logo" href="${homeHref}">Tradspire</a>
        <p>A marketplace celebrating heritage, craftsmanship, and culture.</p>
      </div>
      <nav class="site-footer-links" aria-label="Footer navigation">
        <div class="site-footer-column">
          <h2>Explore</h2>
          <a href="${pageHref('products.html')}">Shop all products</a>
          <a href="${pageHref('cart.html')}">Your cart</a>
          <button class="site-footer-policy-link" type="button" data-open-about-dialog>About Tradspire</button>
        </div>
        <div class="site-footer-column">
          <h2>Your account</h2>
          <a href="${pageHref('orders.html')}">Orders</a>
          <a href="${pageHref('profile.html')}">Account details</a>
          <button class="site-footer-policy-link" type="button" data-open-customer-policy>Customer Support Policy</button>
          <button class="site-footer-policy-link" type="button" data-open-delivery-policy>Delivery Policy</button>
          <button class="site-footer-policy-link" type="button" data-open-report-policy>Report a Product or Make a Complaint</button>
        </div>
        <div class="site-footer-column">
          <h2>Contact Us</h2>
          <p>For customer support, order enquiries, or complaints, contact Tradspire via WhatsApp at <a href="https://wa.me/2349052727339" target="_blank" rel="noopener noreferrer">09052727339</a>.</p>
        </div>
      </nav>
    </div>
    <div class="site-footer-bottom">
      <span>&copy; ${new Date().getFullYear()} Tradspire</span>
      <span>Preserving cultural values</span>
    </div>
    <dialog class="customer-policy-dialog" data-customer-policy-dialog aria-labelledby="customerPolicyTitle">
      <div class="customer-policy-content">
        <div class="customer-policy-heading">
          <div>
            <p class="customer-policy-eyebrow">Tradspire policies</p>
            <h2 id="customerPolicyTitle">Customer Support Policy</h2>
          </div>
          <button class="customer-policy-close" type="button" data-close-customer-policy aria-label="Close customer support policy">&times;</button>
        </div>
        <p>Tradspire is committed to providing helpful, respectful, and timely customer service for purchases, rentals, payments, and deliveries.</p>
        <section>
          <h3>Support channels</h3>
          <p>Website — <a href="https://www.tradspire.com" target="_blank" rel="noopener noreferrer">www.tradspire.com</a>; WhatsApp — <a href="https://wa.me/2349052727339" target="_blank" rel="noopener noreferrer">09052727339</a>; social media — @tradspire.</p>
        </section>
        <section>
          <h3>Support hours</h3>
          <p>Monday–Saturday, 9:00 AM–6:00 PM WAT, excluding public holidays unless announced otherwise.</p>
        </section>
        <section>
          <h3>Response time</h3>
          <p>We aim to respond within 24 business hours.</p>
        </section>
        <section>
          <h3>Complaints</h3>
          <p>Provide your order number, a clear explanation, and relevant evidence to help us investigate.</p>
        </section>
        <section>
          <h3>Privacy</h3>
          <p>Never share your bank PIN, password, or OTP with anyone claiming to represent Tradspire.</p>
        </section>
        <section>
          <h3>Resolution</h3>
          <p>We review complaints fairly and communicate the outcome and available next steps.</p>
        </section>
        <section>
          <h3>Urgent event or rental enquiries</h3>
          <p>For urgent event or rental enquiries, please state your event date when contacting us.</p>
        </section>
      </div>
    </dialog>
    <dialog class="customer-policy-dialog" data-delivery-policy-dialog aria-labelledby="deliveryPolicyTitle">
      <div class="customer-policy-content">
        <div class="customer-policy-heading">
          <div>
            <p class="customer-policy-eyebrow">Tradspire policies</p>
            <h2 id="deliveryPolicyTitle">Delivery Policy</h2>
          </div>
          <button class="customer-policy-close" type="button" data-close-delivery-policy aria-label="Close delivery policy">&times;</button>
        </div>
        <section>
          <h3>Delivery locations</h3>
          <p>Tradspire currently focuses on deliveries within Warri, Delta State, Nigeria. Deliveries to other locations are subject to availability and confirmation.</p>
        </section>
        <section>
          <h3>Delivery fees</h3>
          <p>Delivery fees are calculated according to your location and delivery method and confirmed before payment.</p>
        </section>
        <section>
          <h3>Processing</h3>
          <p>Orders are processed after payment and product availability are confirmed.</p>
        </section>
        <section>
          <h3>Delivery time</h3>
          <p>Estimated delivery times are communicated during order confirmation and may vary due to logistics delays.</p>
        </section>
        <section>
          <h3>Customer responsibility</h3>
          <p>Provide accurate contact details and delivery addresses.</p>
        </section>
        <section>
          <h3>Issues with an order</h3>
          <p>Report incorrect, damaged, or missing items promptly with your order details and supporting photos.</p>
        </section>
        <section>
          <h3>Rental items</h3>
          <p>Delivery and return arrangements must follow the agreed rental terms.</p>
        </section>
      </div>
    </dialog>
    <dialog class="customer-policy-dialog" data-report-policy-dialog aria-labelledby="reportPolicyTitle">
      <div class="customer-policy-content">
        <div class="customer-policy-heading">
          <div>
            <p class="customer-policy-eyebrow">Tradspire policies</p>
            <h2 id="reportPolicyTitle">Report a Product or Make a Complaint</h2>
          </div>
          <button class="customer-policy-close" type="button" data-close-report-policy aria-label="Close report a product policy">&times;</button>
        </div>
        <p>Tradspire is committed to maintaining accurate product listings and a safe, trustworthy shopping experience. Customers can report any product they believe contains incorrect information, misleading images, inappropriate content, suspected fraud, or other issues.</p>
        <section>
          <h3>What you can report</h3>
          <p>Incorrect prices or descriptions, misleading photos, unavailable products listed as available, suspected counterfeit items, or inappropriate content.</p>
        </section>
        <section>
          <h3>How to report</h3>
          <p>Contact us on WhatsApp at <a href="https://wa.me/2349052727339" target="_blank" rel="noopener noreferrer">09052727339</a> or through our <a href="https://www.tradspire.com" target="_blank" rel="noopener noreferrer">website</a>.</p>
        </section>
        <section>
          <h3>Information required</h3>
          <p>Provide the product name or link, a description of the issue, and supporting screenshots or photos where possible.</p>
        </section>
        <section>
          <h3>Review process</h3>
          <p>Our team will investigate the report and may correct, restrict, or remove a listing where necessary.</p>
        </section>
        <section>
          <h3>Confidentiality</h3>
          <p>Reports will be handled discreetly, and additional information may be requested to investigate the issue.</p>
        </section>
        <p>Help us keep Tradspire trustworthy. Every genuine report helps us improve the experience for our customers.</p>
      </div>
    </dialog>
    <dialog class="customer-policy-dialog" data-about-dialog aria-labelledby="aboutTradspireTitle">
      <div class="customer-policy-content">
        <div class="customer-policy-heading">
          <div>
            <p class="customer-policy-eyebrow">Our mission</p>
            <h2 id="aboutTradspireTitle">About Tradspire</h2>
          </div>
          <button class="customer-policy-close" type="button" data-close-about-dialog aria-label="Close About Tradspire">&times;</button>
        </div>
        <p>Tradspire is a marketplace celebrating heritage, craftsmanship, and culture. Our mission is to connect people with culturally meaningful products and creations, helping preserve cultural values while supporting the makers and communities behind them.</p>
      </div>
    </dialog>
  `;

  const main = document.querySelector('main.main-content');
  if (main) {
    main.append(footer);
  } else {
    document.body.append(footer);
  }

  const policyDialog = footer.querySelector('[data-customer-policy-dialog]');
  footer.querySelector('[data-open-customer-policy]').addEventListener('click', () => policyDialog.showModal());
  footer.querySelector('[data-close-customer-policy]').addEventListener('click', () => policyDialog.close());
  policyDialog.addEventListener('click', (event) => {
    if (event.target === policyDialog) policyDialog.close();
  });

  const deliveryPolicyDialog = footer.querySelector('[data-delivery-policy-dialog]');
  footer.querySelector('[data-open-delivery-policy]').addEventListener('click', () => deliveryPolicyDialog.showModal());
  footer.querySelector('[data-close-delivery-policy]').addEventListener('click', () => deliveryPolicyDialog.close());
  deliveryPolicyDialog.addEventListener('click', (event) => {
    if (event.target === deliveryPolicyDialog) deliveryPolicyDialog.close();
  });

  const reportPolicyDialog = footer.querySelector('[data-report-policy-dialog]');
  footer.querySelector('[data-open-report-policy]').addEventListener('click', () => reportPolicyDialog.showModal());
  footer.querySelector('[data-close-report-policy]').addEventListener('click', () => reportPolicyDialog.close());
  reportPolicyDialog.addEventListener('click', (event) => {
    if (event.target === reportPolicyDialog) reportPolicyDialog.close();
  });

  const aboutDialog = footer.querySelector('[data-about-dialog]');
  footer.querySelector('[data-open-about-dialog]').addEventListener('click', () => aboutDialog.showModal());
  footer.querySelector('[data-close-about-dialog]').addEventListener('click', () => aboutDialog.close());
  aboutDialog.addEventListener('click', (event) => {
    if (event.target === aboutDialog) aboutDialog.close();
  });
});
