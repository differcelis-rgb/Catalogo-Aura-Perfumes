/**
 * AURA PARFUM INSPIRE - Official Interactive Web Application
 * Modular Step-by-Step Portal: Dama, Caballero & Unisex
 * Strict Subcategory Separation & Unified Typography
 */

// Global App State
const state = {
  perfumes: typeof PERFUMES_DATA !== 'undefined' ? PERFUMES_DATA : [],
  currentView: 'portal', // 'portal' | 'category'
  selectedCategory: 'dama', // 'dama' | 'caballero' | 'unisex'
  activeSubcategory: 'all', // 'all' | string
  searchQuery: '',
  selectedSizes: {}, // { [perfumeId]: '30ml' | '10ml' | '50ml' }
  cart: JSON.parse(localStorage.getItem('aura_cart') || '[]'),
  theme: localStorage.getItem('aura_theme') || 'dark'
};

// WhatsApp Config (From PDF official channel)
const WHATSAPP_NUMBER = '573132960576'; // Colombia (+57 313 296 0576)

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDefaultSizes();
  setupEventListeners();
  updateCartBadge();
  renderCartItems();
  
  // Check URL hash for direct category link (e.g. #dama, #caballero)
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (['dama', 'caballero'].includes(hash)) {
    navigateToCategory(hash);
  } else {
    navigateToPortal();
  }
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('aura_theme', state.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const moonIcon = document.getElementById('iconMoon');
  const sunIcon = document.getElementById('iconSun');
  if (moonIcon && sunIcon) {
    if (state.theme === 'dark') {
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
    } else {
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
    }
  }
}

// Default size to 50ml (Presentación más vendida)
function initDefaultSizes() {
  state.perfumes.forEach(p => {
    state.selectedSizes[p.id] = '50ml';
  });
}

// Navigation Functions
function navigateToPortal() {
  state.currentView = 'portal';
  state.searchQuery = '';
  state.activeSubcategory = 'all';
  window.location.hash = '';

  const portalView = document.getElementById('viewPortal');
  const categoryView = document.getElementById('viewCategory');
  if (portalView && categoryView) {
    portalView.classList.add('active');
    categoryView.classList.remove('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToCategory(categoryKey) {
  state.currentView = 'category';
  state.selectedCategory = categoryKey;
  state.activeSubcategory = 'all';
  state.searchQuery = '';
  window.location.hash = categoryKey;

  const searchInput = document.getElementById('categorySearchInput');
  if (searchInput) searchInput.value = '';

  const portalView = document.getElementById('viewPortal');
  const categoryView = document.getElementById('viewCategory');
  if (portalView && categoryView) {
    portalView.classList.remove('active');
    categoryView.classList.add('active');
  }

  updateCategoryHeader();
  renderSubcategoryTabs();
  renderCategorySections();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update Category Header Info
function updateCategoryHeader() {
  const titleEl = document.getElementById('categoryActiveTitle');
  const countEl = document.getElementById('categoryActiveCount');
  
  const categoryMeta = {
    dama: { title: '🌸 Colección Dama', icon: '🌸' },
    caballero: { title: '🎩 Colección Caballero', icon: '🎩' }
  };

  const currentMeta = categoryMeta[state.selectedCategory] || categoryMeta.dama;
  const filteredPerfumes = getPerfumesForActiveCategory();

  if (titleEl) {
    titleEl.textContent = currentMeta.title;
  }
  if (countEl) {
    countEl.textContent = `${filteredPerfumes.length} Fragancias Disponibles`;
  }
}

// Get Fragrances for currently selected gender category
function getPerfumesForActiveCategory() {
  return state.perfumes.filter(p => p.gender === state.selectedCategory);
}

// Render Subcategory Tabs for active category
function renderSubcategoryTabs() {
  const container = document.getElementById('subcategoriesTabsContainer');
  if (!container) return;

  const perfumes = getPerfumesForActiveCategory();
  // Get unique subcategories in order of appearance
  const subcats = [];
  perfumes.forEach(p => {
    if (!subcats.includes(p.subcategory)) {
      subcats.push(p.subcategory);
    }
  });

  let html = `
    <button type="button" class="subcat-tab-btn ${state.activeSubcategory === 'all' ? 'active' : ''}" onclick="selectSubcategory('all')">
      Ver Todas (${perfumes.length})
    </button>
  `;

  subcats.forEach(subcat => {
    const count = perfumes.filter(p => p.subcategory === subcat).length;
    const isActive = state.activeSubcategory === subcat;
    html += `
      <button type="button" class="subcat-tab-btn ${isActive ? 'active' : ''}" onclick="selectSubcategory('${escapeHtml(subcat)}')">
        ${escapeHtml(subcat)} (${count})
      </button>
    `;
  });

  container.innerHTML = html;
}

function selectSubcategory(subcatName) {
  state.activeSubcategory = subcatName;
  renderSubcategoryTabs();
  renderCategorySections();
}

// Render Distinct, Separated Subcategory Sections (Never Mixed!)
function renderCategorySections() {
  const container = document.getElementById('categorySectionsContainer');
  if (!container) return;

  let perfumes = getPerfumesForActiveCategory();

  // Apply search query filter
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase().trim();
    perfumes = perfumes.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.inspiration.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.notes.some(n => n.toLowerCase().includes(q))
    );
  }

  // Filter by active subcategory if one is selected
  if (state.activeSubcategory !== 'all') {
    perfumes = perfumes.filter(p => p.subcategory === state.activeSubcategory);
  }

  if (perfumes.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:4rem 1rem; background:var(--bg-card); border:1px dashed var(--border-subtle); border-radius:var(--radius-lg);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="var(--text-muted)" style="margin-bottom:1rem;"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <h3 style="font-size:1.3rem; margin-bottom:0.5rem;">No se encontraron fragancias</h3>
        <p style="color:var(--text-secondary); margin-bottom:1.5rem;">Prueba con otra palabra clave o restablece los filtros.</p>
        <button class="btn-portal-action" style="max-width:240px; margin:0 auto;" onclick="resetCategoryFilters()">Ver Todas las Subcategorías</button>
      </div>
    `;
    return;
  }

  // Group perfumes strictly by subcategory
  const grouped = {};
  perfumes.forEach(p => {
    if (!grouped[p.subcategory]) {
      grouped[p.subcategory] = [];
    }
    grouped[p.subcategory].push(p);
  });

  let sectionsHtml = '';

  for (const [subcatName, subcatPerfumes] of Object.entries(grouped)) {
    const cardsHtml = subcatPerfumes.map(p => renderPerfumeCard(p)).join('');

    sectionsHtml += `
      <section class="subcategory-section-block" id="subcat-${slugify(subcatName)}">
        <div class="subcategory-section-header">
          <div class="subcategory-section-title-wrap">
            <h3 class="subcategory-title">${escapeHtml(subcatName)}</h3>
            <span class="subcategory-badge-count">${subcatPerfumes.length} ${subcatPerfumes.length === 1 ? 'Fragancia' : 'Fragancias'}</span>
          </div>
          <span style="font-size:0.8rem; color:var(--text-muted);">Aura Parfum Inspire</span>
        </div>

        <div class="perfumes-grid">
          ${cardsHtml}
        </div>
      </section>
    `;
  }

  container.innerHTML = sectionsHtml;
}

// Render Individual Perfume Card
function renderPerfumeCard(p) {
  const activeSize = state.selectedSizes[p.id] || '50ml';
  const activePrice = p.prices[activeSize] || 35000;
  const formattedPrice = formatPriceCOP(activePrice);

  const accordPills = p.notes.slice(0, 5).map(note => 
    `<span class="accord-pill" data-accord="${note.toLowerCase()}">${note}</span>`
  ).join('');

  return `
    <article class="perfume-card" id="card-${p.id}">
      <div class="card-image-box" onclick="openImageModal('${p.image}', '${escapeHtml(p.name)} - ${escapeHtml(p.inspiration)}')">
        <img src="${p.image}" alt="${escapeHtml(p.name)} - Aura Perfumes" loading="lazy">
        <div class="card-zoom-overlay">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <span>Click para Ampliar</span>
        </div>
      </div>

      <div class="card-content">
        <div class="card-title-row">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; margin-bottom:0.25rem;">
            <h4 class="card-perfume-name">${escapeHtml(p.name)}</h4>
            ${p.popular ? '<span class="card-badge-popular" style="position:static; margin:0; box-shadow:none;">★ Destacado</span>' : ''}
          </div>
          <div class="card-inspiration-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
            <span>${escapeHtml(p.inspiration)}</span>
          </div>
        </div>

        <p class="card-tagline">${escapeHtml(p.tagline)}</p>

        <div class="accords-tags-wrapper">
          ${accordPills}
        </div>

        <div class="card-bottom-actions">
          <div class="size-selector-row">
            <div class="size-pills">
              <button type="button" class="size-btn ${activeSize === '10ml' ? 'active' : ''}" onclick="selectCardSize('${p.id}', '10ml')">10 ml</button>
              <button type="button" class="size-btn ${activeSize === '30ml' ? 'active' : ''}" onclick="selectCardSize('${p.id}', '30ml')">30 ml</button>
              <button type="button" class="size-btn ${activeSize === '50ml' ? 'active' : ''}" onclick="selectCardSize('${p.id}', '50ml')">50 ml</button>
              <button type="button" class="size-btn ${activeSize === '100ml' ? 'active' : ''}" onclick="selectCardSize('${p.id}', '100ml')">100 ml</button>
            </div>
            <div class="card-dynamic-price" id="price-${p.id}">${formattedPrice}</div>
          </div>

          <div class="card-buttons-row">
            <button type="button" class="btn-add-cart" onclick="addToCart('${p.id}')" title="Agregar al carrito para llevar más de un perfume">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4l-3.87 7H8.53L4.27 2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2z"/></svg>
              <span>Agregar al Carrito</span>
            </button>

            <a href="${getDirectWhatsAppLink(p, activeSize)}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-order" title="Pedir directamente por WhatsApp">
              <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19-.09-1.12-.55-1.3-.61-.17-.07-.3-.1-.43.1-.12.19-.49.61-.6.73-.11.13-.23.14-.42.05-.19-.09-.8-.29-1.53-.94-.57-.51-.95-1.14-1.06-1.33-.11-.19-.01-.3.08-.39.09-.09.19-.23.29-.34.1-.12.13-.2.19-.34.07-.13.03-.25-.02-.34-.05-.1-.43-1.04-.59-1.42-.16-.38-.32-.33-.44-.33h-.37c-.13 0-.34.05-.52.24-.18.19-.68.66-.68 1.62 0 .95.7 1.88.8 2.01.09.13 1.37 2.09 3.32 2.93.46.2.82.32 1.11.41.47.15.89.13 1.23.08.38-.06 1.12-.46 1.28-.9.16-.45.16-.83.11-.9-.04-.07-.17-.11-.36-.2z"/></svg>
              <span>Pedir por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  `;
}

// Update Size Selection on a Card
function selectCardSize(perfumeId, size) {
  state.selectedSizes[perfumeId] = size;
  const card = document.getElementById(`card-${perfumeId}`);
  if (!card) return;

  const buttons = card.querySelectorAll('.size-btn');
  buttons.forEach(btn => {
    const btnNormalized = btn.textContent.trim().replace(/\s+/g, '');
    btn.classList.toggle('active', btnNormalized === size);
  });

  const perfume = state.perfumes.find(p => p.id === perfumeId);
  if (perfume) {
    const priceEl = document.getElementById(`price-${perfumeId}`);
    if (priceEl) {
      priceEl.textContent = formatPriceCOP(perfume.prices[size]);
    }
    const waLinkEl = card.querySelector('.btn-whatsapp-order');
    if (waLinkEl) {
      waLinkEl.href = getDirectWhatsAppLink(perfume, size);
    }
  }
}

function resetCategoryFilters() {
  state.activeSubcategory = 'all';
  state.searchQuery = '';
  const searchInput = document.getElementById('categorySearchInput');
  if (searchInput) searchInput.value = '';
  renderSubcategoryTabs();
  renderCategorySections();
}

// Helpers
function formatPriceCOP(amount) {
  return '$ ' + amount.toLocaleString('es-CO');
}

function getDirectWhatsAppLink(perfume, size) {
  const price = formatPriceCOP(perfume.prices[size]);
  const text = `¡Hola Aura Perfumería! ✨\nQuiero ordenar la siguiente fragancia de su catálogo:\n\n` +
               `🔹 *${perfume.name}*\n` +
               `🔹 Inspiración: ${perfume.inspiration}\n` +
               `🔹 Presentación: *${size}* (${price})\n\n` +
               `¿Tienen disponibilidad para envío?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// ========================================================
// SHOPPING CART SYSTEM
// ========================================================
function addToCart(perfumeId) {
  const perfume = state.perfumes.find(p => p.id === perfumeId);
  if (!perfume) return;

  const size = state.selectedSizes[perfumeId] || '50ml';
  const price = perfume.prices[size];

  const existingIndex = state.cart.findIndex(item => item.id === perfumeId && item.size === size);
  if (existingIndex > -1) {
    state.cart[existingIndex].qty += 1;
  } else {
    state.cart.push({
      id: perfumeId,
      name: perfume.name,
      inspiration: perfume.inspiration,
      size: size,
      price: price,
      image: perfume.image,
      qty: 1
    });
  }

  saveCart();
  updateCartBadge();
  renderCartItems();
  openCartDrawer();
}

function updateCartQty(index, delta) {
  if (state.cart[index]) {
    state.cart[index].qty += delta;
    if (state.cart[index].qty <= 0) {
      state.cart.splice(index, 1);
    }
    saveCart();
    updateCartBadge();
    renderCartItems();
  }
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  saveCart();
  updateCartBadge();
  renderCartItems();
}

function saveCart() {
  localStorage.setItem('aura_cart', JSON.stringify(state.cart));
}

function updateCartBadge() {
  const count = state.cart.reduce((total, item) => total + item.qty, 0);
  const badgeEl = document.getElementById('cartBadgeCount');
  const mobileBadgeEl = document.getElementById('mobileCartBadgeCount');

  if (badgeEl) {
    badgeEl.textContent = count;
    badgeEl.style.display = count > 0 ? 'flex' : 'none';
  }
  if (mobileBadgeEl) {
    mobileBadgeEl.textContent = count;
    mobileBadgeEl.style.display = count > 0 ? 'flex' : 'none';
  }
}

function renderCartItems() {
  const container = document.getElementById('cartItemsContainer');
  const totalAmountEl = document.getElementById('cartTotalAmount');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z"/></svg>
        <p>Tu carrito de perfumes está vacío</p>
        <button class="btn-portal-action" style="margin-top:1rem; font-size:0.85rem;" onclick="closeCartDrawer()">Explorar Fragancias</button>
      </div>
    `;
    if (totalAmountEl) totalAmountEl.textContent = '$ 0';
    return;
  }

  let total = 0;
  container.innerHTML = state.cart.map((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    return `
      <div class="cart-item-card">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${escapeHtml(item.name)}</div>
          <div class="cart-item-meta">${item.size} · ${item.inspiration}</div>
          <div class="cart-item-price">${formatPriceCOP(itemTotal)}</div>
        </div>
        <div class="cart-qty-controls">
          <button type="button" class="btn-qty" onclick="updateCartQty(${index}, -1)">−</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button type="button" class="btn-qty" onclick="updateCartQty(${index}, 1)">+</button>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeCartItem(${index})" title="Eliminar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    `;
  }).join('');

  if (totalAmountEl) {
    totalAmountEl.textContent = formatPriceCOP(total);
  }
}

function openCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (overlay && drawer) {
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (overlay && drawer) {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function checkoutViaWhatsApp() {
  if (state.cart.length === 0) {
    alert('Tu carrito está vacío. Agrega una fragancia primero.');
    return;
  }

  const nameInput = document.getElementById('cartCustomerName');
  const cityInput = document.getElementById('cartCustomerCity');
  const customerName = nameInput ? nameInput.value.trim() : '';
  const customerCity = cityInput ? cityInput.value.trim() : '';

  let message = `¡Hola Aura Perfumería! ✨ Deseo realizar el siguiente pedido de su catálogo oficial:\n\n`;

  let total = 0;
  state.cart.forEach((item, i) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    message += `${i + 1}. *${item.name}* (${item.size})\n`;
    message += `   • Inspiración: ${item.inspiration}\n`;
    message += `   • Cantidad: ${item.qty} x ${formatPriceCOP(item.price)} = *${formatPriceCOP(itemTotal)}*\n\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *TOTAL PEDIDO: ${formatPriceCOP(total)} COP*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (customerName) {
    message += `👤 *Cliente:* ${customerName}\n`;
  }
  if (customerCity) {
    message += `📍 *Ciudad de Envío:* ${customerCity}\n\n`;
  }

  message += `¿Me confirman los medios de pago para despachar mi pedido? ¡Muchas gracias!`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// Image Zoom Modal
function openImageModal(imgSrc, title) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalImg');
  const modalTitle = document.getElementById('imageModalTitle');

  if (modal && modalImg) {
    modalImg.src = imgSrc;
    if (modalTitle) modalTitle.textContent = title || 'Detalle de Fragancia Aura';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Event Listeners
function setupEventListeners() {
  // Brand logo click returns to portal
  const brandLink = document.getElementById('brandLink');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToPortal();
    });
  }

  // Back button from category view
  const backBtn = document.getElementById('btnBackToPortal');
  if (backBtn) {
    backBtn.addEventListener('click', navigateToPortal);
  }

  // Category Search input
  const searchInput = document.getElementById('categorySearchInput');
  const searchClearBtn = document.getElementById('categorySearchClearBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
      }
      renderCategorySections();
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      state.searchQuery = '';
      searchClearBtn.style.display = 'none';
      renderCategorySections();
    });
  }

  // Theme Toggle Button
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Cart Buttons
  const openCartBtn = document.getElementById('openCartBtn');
  const mobileCartBtn = document.getElementById('mobileCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartDrawerOverlay');

  if (openCartBtn) openCartBtn.addEventListener('click', openCartDrawer);
  if (mobileCartBtn) mobileCartBtn.addEventListener('click', openCartDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  const sendCartBtn = document.getElementById('btnSendCartOrder');
  if (sendCartBtn) sendCartBtn.addEventListener('click', checkoutViaWhatsApp);

  // Image Modal Close
  const closeImageModalBtn = document.getElementById('closeImageModalBtn');
  const imageModalOverlay = document.getElementById('imageModal');
  if (closeImageModalBtn) closeImageModalBtn.addEventListener('click', closeImageModal);
  if (imageModalOverlay) {
    imageModalOverlay.addEventListener('click', (e) => {
      if (e.target === imageModalOverlay) closeImageModal();
    });
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      closeImageModal();
    }
  });
}
