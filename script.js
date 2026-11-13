const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const yearNode = document.getElementById('year');

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const shopWhatsAppNumber = '919994751488';

document.querySelectorAll('.catalog-product-card').forEach((product) => {
  const serial = product.querySelector('.product-serial')?.textContent.trim();
  const productName = product.querySelector('.catalog-product-details h3')?.textContent.trim();
  const details = product.querySelector('.catalog-product-details');

  if (!serial || !productName || !details) {
    return;
  }

  const orderLink = document.createElement('a');
  const message = `Hi, I would like to place an order for ${serial} - ${productName}.`;
  orderLink.className = 'btn btn-primary whatsapp-order-button';
  orderLink.href = `https://wa.me/${shopWhatsAppNumber}?text=${encodeURIComponent(message)}`;
  orderLink.target = '_blank';
  orderLink.rel = 'noopener noreferrer';
  orderLink.textContent = 'Order on WhatsApp';
  details.append(orderLink);
});
