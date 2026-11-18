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

const heroSearchForm = document.querySelector('.hero-search-form');
if (heroSearchForm) {
  heroSearchForm.addEventListener('submit', (event) => {
    const input = heroSearchForm.querySelector('input[name="search"]');
    const query = input ? input.value.trim() : '';

    if (!query) {
      event.preventDefault();
      return;
    }

    const targetUrl = new URL('products.html', window.location.href);
    targetUrl.searchParams.set('search', query);
    window.location.href = targetUrl.toString();
    event.preventDefault();
  });
}

const parseProductPrice = (priceText) => {
  const numericPrice = String(priceText || '').replace(/[^\d.]/g, '');
  const price = Number(numericPrice);
  return numericPrice && Number.isFinite(price) ? price : null;
};

const createAddToCartButton = (product, className = '') => {
  const button = document.createElement('button');
  button.className = `add-to-cart-button ${className}`.trim();
  button.type = 'button';
  button.textContent = 'Add to cart';
  button.dataset.productId = product.id;
  button.dataset.productName = product.name;
  button.dataset.productImage = product.image;
  button.dataset.productPrice = product.price ?? '';
  return button;
};

const homeProductsGrid = document.getElementById('homeProductsGrid');
const homeCategoryFilters = document.getElementById('homeCategoryFilters');

if (homeProductsGrid && homeCategoryFilters) {
  const shuffle = (items) => {
    const shuffledItems = [...items];
    for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledItems[index], shuffledItems[randomIndex]] = [shuffledItems[randomIndex], shuffledItems[index]];
    }
    return shuffledItems;
  };

  const getCatalogData = async () => {
    try {
      const response = await fetch('products.html');
      if (!response.ok) {
        return { categories: [] };
      }

      const catalogDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
      const categories = [...catalogDocument.querySelectorAll('.catalog-category')]
        .map((category) => ({
          id: category.id,
          title: category.querySelector('h2')?.textContent.trim() || 'Gift',
          products: [...category.querySelectorAll('.catalog-product-card')].map((card) => {
            const image = card.querySelector('.catalog-product-image');
            const serial = card.querySelector('.product-serial')?.textContent.trim() || '';
            const name = card.querySelector('.catalog-product-details h3')?.textContent.trim() || '';
            const priceText = card.querySelector('.product-price strong')?.textContent.trim() || '';

            return {
              id: serial,
              categoryId: category.id,
              name,
              price: parseProductPrice(priceText),
              image: image ? new URL(image.getAttribute('src'), response.url).href : '',
              alt: image?.getAttribute('alt') || name
            };
          })
        }))
        .filter((category) => category.products.length > 0);

      return { categories };
    } catch (error) {
      return { categories: [] };
    }
  };

  const renderHomeProducts = (products) => {
    homeProductsGrid.replaceChildren();
    homeProductsGrid.setAttribute('aria-busy', 'false');

    if (!products.length) {
      const emptyState = document.createElement('p');
      emptyState.textContent = 'Products will appear here as the catalogue grows.';
      homeProductsGrid.append(emptyState);
      return;
    }

    products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'home-product-card';

      const imageFrame = document.createElement('div');
      imageFrame.className = 'home-product-image';
      const image = document.createElement('img');
      image.src = product.image;
      image.alt = product.alt;
      image.loading = 'lazy';
      imageFrame.append(image);

      const info = document.createElement('div');
      info.className = 'home-product-info';
      const productId = document.createElement('span');
      productId.className = 'home-product-id';
      productId.textContent = product.id;
      const name = document.createElement('h3');
      name.textContent = product.name;

      info.append(productId, name, createAddToCartButton(product, 'home-product-add'));
      card.append(imageFrame, info);
      homeProductsGrid.append(card);
    });
  };

  const setActiveTab = (activeTab) => {
    document.querySelectorAll('.home-products-tab').forEach((tab) => {
      const isActive = tab === activeTab;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
  };

  const renderCollection = async () => {
    const { categories } = await getCatalogData();
    const featuredProducts = [];
    const remainingProducts = [];

    categories.forEach((category) => {
      const categoryProducts = shuffle(category.products);
      featuredProducts.push(...categoryProducts.slice(0, 2));
      remainingProducts.push(...categoryProducts.slice(2));
    });

    const featured = shuffle([
      ...featuredProducts.slice(0, 18),
      ...shuffle(remainingProducts).slice(0, Math.max(0, 18 - featuredProducts.length))
    ]);

    const filterButtons = [{ id: 'all', title: 'All gifts' }, ...categories.map(({ id, title }) => ({ id, title }))];
    filterButtons.forEach((filter, index) => {
      const button = document.createElement('button');
      button.className = `home-category-filter${index === 0 ? ' is-active' : ''}`;
      button.type = 'button';
      button.textContent = filter.title;
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        homeCategoryFilters.querySelectorAll('.home-category-filter').forEach((item) => {
          const isActive = item === button;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-pressed', String(isActive));
        });
        renderHomeProducts(filter.id === 'all' ? featured : categories.find((category) => category.id === filter.id)?.products || []);
      });
      homeCategoryFilters.append(button);
    });

    document.querySelectorAll('.home-products-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        setActiveTab(tab);
        const showCategories = tab.dataset.view === 'categories';
        homeCategoryFilters.hidden = !showCategories;
        renderHomeProducts(featured);
      });
    });

    renderHomeProducts(featured);
  };

  renderCollection();
}

const productSearchTerm = (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get('search') || '';
})();

const catalogProducts = document.querySelectorAll('.catalog-product-card');
if (productSearchTerm && catalogProducts.length) {
  const term = productSearchTerm.toLowerCase();
  let visibleCount = 0;

  catalogProducts.forEach((product) => {
    const text = product.textContent.toLowerCase();
    const match = text.includes(term);
    product.style.display = match ? '' : 'none';
    if (match) {
      visibleCount += 1;
    }
  });

  const catalog = document.querySelector('.catalog');
  if (catalog && visibleCount === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'catalog-empty';
    emptyState.innerHTML = `
      <span class="empty-code">No</span>
      <div>
        <h3>No products match your search</h3>
        <p>Try a different keyword like frame, acrylic, clock, name board, or gift.</p>
      </div>
    `;
    catalog.appendChild(emptyState);
  }
}

const cartToggle = document.getElementById('cartToggle');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsNode = document.getElementById('cartItems');
const cartCountNode = document.getElementById('cartCount');
const cartTotalNode = document.getElementById('cartTotal');
const orderForm = document.getElementById('orderForm');

if (cartToggle && cartOverlay && cartItemsNode && cartCountNode && cartTotalNode && orderForm) {
  const cartStorageKey = 'thangam-order-cart';
  let cart = [];

  try {
    const storedCart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
    cart = Array.isArray(storedCart) ? storedCart : [];
  } catch (error) {
    cart = [];
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);

  const persistCart = () => {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  };

  const renderCart = () => {
    cartItemsNode.replaceChildren();
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountNode.textContent = String(itemCount);
    cartToggle.setAttribute('aria-label', `${itemCount} items in cart. Open cart.`);

    if (!cart.length) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'cart-empty';
      emptyMessage.textContent = 'Your cart is empty. Add products from the collection.';
      cartItemsNode.append(emptyMessage);
    }

    cart.forEach((item) => {
      const row = document.createElement('article');
      row.className = 'cart-item';

      const image = document.createElement('img');
      image.className = 'cart-item-image';
      image.src = item.image;
      image.alt = '';

      const details = document.createElement('div');
      const productId = document.createElement('span');
      productId.className = 'cart-item-id';
      productId.textContent = item.id;
      const name = document.createElement('h3');
      name.textContent = item.name;
      const price = document.createElement('p');
      price.textContent = item.price === null ? 'Price to be confirmed' : formatCurrency(item.price);
      details.append(productId, name, price);

      const actions = document.createElement('div');
      actions.className = 'cart-item-actions';
      actions.append(
        createCartActionButton('decrease', item.id, 'Decrease quantity'),
        Object.assign(document.createElement('span'), { className: 'cart-item-quantity', textContent: String(item.quantity) }),
        createCartActionButton('increase', item.id, 'Increase quantity'),
        createCartActionButton('remove', item.id, 'Remove product')
      );

      row.append(image, details, actions);
      cartItemsNode.append(row);
    });

    const knownTotal = cart.length && cart.every((item) => Number.isFinite(item.price));
    const total = knownTotal ? cart.reduce((sum, item) => sum + item.price * item.quantity, 0) : null;
    cartTotalNode.textContent = total === null ? 'Price on request' : formatCurrency(total);
    orderForm.querySelector('.order-submit').disabled = cart.length === 0;
  };

  const createCartActionButton = (action, productId, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cartAction = action;
    button.dataset.productId = productId;
    button.setAttribute('aria-label', label);
    button.textContent = action === 'increase' ? '+' : action === 'decrease' ? '-' : '×';
    return button;
  };

  const openCart = () => {
    cartOverlay.hidden = false;
    cartToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('cart-open');
    document.getElementById('orderCart').focus();
  };

  const closeCart = () => {
    cartOverlay.hidden = true;
    cartToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('cart-open');
    cartToggle.focus();
  };

  document.querySelectorAll('.catalog-product-card').forEach((productCard) => {
    const details = productCard.querySelector('.catalog-product-details');
    const image = productCard.querySelector('.catalog-product-image');
    const serial = productCard.querySelector('.product-serial')?.textContent.trim();
    const name = details?.querySelector('h3')?.textContent.trim();
    const priceText = details?.querySelector('.product-price strong')?.textContent.trim();
    const categoryId = productCard.closest('.catalog-category')?.id;

    if (!details || !image || !serial || !name || !categoryId) {
      return;
    }

    details.append(createAddToCartButton({
      id: serial,
      name,
      image: new URL(image.getAttribute('src'), window.location.href).href,
      price: parseProductPrice(priceText)
    }));
  });

  document.addEventListener('click', (event) => {
    const addButton = event.target.closest('.add-to-cart-button');
    if (addButton) {
      const item = {
        id: addButton.dataset.productId,
        name: addButton.dataset.productName,
        image: addButton.dataset.productImage,
        price: parseProductPrice(addButton.dataset.productPrice),
        quantity: 1
      };
      const existingItem = cart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push(item);
      }
      persistCart();
      renderCart();
      const originalLabel = addButton.textContent;
      addButton.textContent = 'Added';
      window.setTimeout(() => {
        addButton.textContent = originalLabel;
      }, 1200);
      return;
    }

    const cartAction = event.target.closest('[data-cart-action]');
    if (!cartAction) {
      return;
    }

    const cartItem = cart.find((item) => item.id === cartAction.dataset.productId);
    if (!cartItem) {
      return;
    }

    if (cartAction.dataset.cartAction === 'increase') {
      cartItem.quantity += 1;
    } else if (cartAction.dataset.cartAction === 'decrease') {
      cartItem.quantity -= 1;
      if (cartItem.quantity <= 0) {
        cart = cart.filter((item) => item.id !== cartItem.id);
      }
    } else {
      cart = cart.filter((item) => item.id !== cartItem.id);
    }

    persistCart();
    renderCart();
  });

  cartToggle.addEventListener('click', openCart);
  cartOverlay.querySelectorAll('[data-close-cart]').forEach((button) => button.addEventListener('click', closeCart));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !cartOverlay.hidden) {
      closeCart();
    }
  });

  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!cart.length || !orderForm.reportValidity()) {
      return;
    }

    const formData = new FormData(orderForm);
    const orderDate = new Date();
    const dateStamp = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStamp = (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).slice(0, 6).toUpperCase();
    const orderId = `THG-${dateStamp}-${randomStamp}`;
    const knownTotal = cart.every((item) => Number.isFinite(item.price));
    const total = knownTotal ? cart.reduce((sum, item) => sum + item.price * item.quantity, 0) : null;
    const advance = Number(formData.get('advancePaid')) || 0;
    const formatDateTime = (value) => value ? new Date(value).toLocaleString('en-IN') : 'Not specified';
    const itemLines = cart.map((item, index) => {
      const rate = item.price === null ? 'To be confirmed' : formatCurrency(item.price);
      const amount = item.price === null ? 'To be confirmed' : formatCurrency(item.price * item.quantity);
      return `${index + 1}. ${item.id} - ${item.name} | Qty: ${item.quantity} | Rate: ${rate} | Amount: ${amount}\nImage: ${item.image}`;
    });
    const message = [
      `THANGAM PHOTO FRAMES & GIFTS - ORDER REQUEST`,
      `Order ID: ${orderId}`,
      `Customer name: ${formData.get('customerName')}`,
      `Mobile: ${formData.get('customerMobile')}`,
      `Address: ${formData.get('customerAddress')}`,
      `Booking time: ${formatDateTime(formData.get('bookingTime'))}`,
      `Requested delivery time: ${formatDateTime(formData.get('deliveryTime'))}`,
      `Delivery method: ${formData.get('deliveryMethod')}`,
      `Payment method: ${formData.get('paymentMethod')}`,
      `Advance paid: ${formatCurrency(advance)}`,
      `Balance: ${total === null ? 'To be confirmed' : formatCurrency(total - advance)}`,
      '',
      'PRODUCTS',
      ...itemLines,
      '',
      `Total: ${total === null ? 'To be confirmed (prices pending)' : formatCurrency(total)}`
    ].join('\n');
    const whatsappUrl = `https://wa.me/919789707615?text=${encodeURIComponent(message)}`;
    window.location.assign(whatsappUrl);
  });

  renderCart();
}
