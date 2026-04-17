/* =====================================================
   ごちそうスタイル — Main JS
   ===================================================== */

// --- Mobile Navigation ---
(function () {
  const toggle = document.getElementById('navToggle');
  const nav    = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

// --- FAQ Accordion ---
(function () {
  document.querySelectorAll('.faq-q').forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.toggle('open');
      // 他のアイテムを閉じる（1つだけ開く仕様にする場合は以下を有効に）
      // item.closest('.faq-list').querySelectorAll('.faq-item').forEach(el => {
      //   if (el !== item) el.classList.remove('open');
      // });
    });
  });
})();

// --- Products CMS ---

async function loadProducts() {
  const res = await fetch('./data/products.json');
  if (!res.ok) throw new Error('products.json の読み込みに失敗しました');
  return res.json();
}

function formatPrice(p) {
  if (!p.price || p.price === 0) return p.priceNote || '価格未設定';
  return `¥${p.price.toLocaleString()}（税込）`;
}

// YouTube URL から動画IDを抽出してサムネイルURLを生成
function getYtThumb(url) {
  if (!url) return '';
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '';
}

function renderCard(p, compact = false) {
  const thumbClass = p.category === 'sweets' ? 'thumb-sweets' : 'thumb-meal';
  const tagClass   = p.category === 'sweets' ? 'tag-sweets' : 'tag-meal';
  const tagLabel   = p.category === 'sweets' ? 'スイーツ' : 'お食事';
  const detailUrl  = `./product.html?id=${p.id}`;

  // サムネイル: images[0] → YouTubeサムネイル → emoji の優先順
  const imgSrc = (p.images && p.images.length > 0) ? p.images[0] : getYtThumb(p.youtube);
  const thumbInner = imgSrc
    ? `<img src="${imgSrc}" alt="${p.title}" loading="lazy">`
    : p.emoji;

  if (compact) {
    return `
      <a href="${detailUrl}" class="product-card" data-category="${p.category}">
        <div class="product-thumb ${thumbClass}">${thumbInner}</div>
        <div class="product-body">
          <span class="tag ${tagClass}">${tagLabel}</span>
          <h3>${p.title}</h3>
          <p class="product-meta">詳しく見る →</p>
        </div>
      </a>`;
  }

  const ytBtn = p.youtube
    ? `<a href="${p.youtube}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">▶ 動画を見る</a>`
    : '';

  let purchaseBtn = '';
  if (p.purchaseUrl) {
    const label = p.purchaseType === 'store' ? '店舗情報を見る →' : '購入する →';
    purchaseBtn = `<a href="${p.purchaseUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">${label}</a>`;
  }

  return `
    <div class="product-card" id="${p.id}" data-category="${p.category}">
      <a href="${detailUrl}" style="display:block;color:inherit;">
        <div class="product-thumb ${thumbClass}">${thumbInner}</div>
      </a>
      <div class="product-body">
        <span class="tag ${tagClass}">${tagLabel}</span>
        <h3><a href="${detailUrl}" style="color:inherit;">${p.title}</a></h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-comment">${p.comment}</div>
        <div class="product-info">
          <span class="product-price">${formatPrice(p)}</span>
          <span class="product-manufacturer">${p.manufacturer}</span>
        </div>
        <div class="product-actions">
          <a href="${detailUrl}" class="btn btn-outline btn-sm">詳しく見る</a>
          ${ytBtn}
          ${purchaseBtn}
        </div>
      </div>
    </div>`;
}

// Top page: featured products
(function () {
  const container = document.getElementById('featured-products');
  if (!container) return;

  loadProducts().then(products => {
    const featured = products.filter(p => p.featured).slice(0, 3);
    container.innerHTML = featured.map(p => renderCard(p, true)).join('');
  }).catch(() => {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">商品データを読み込めませんでした</p>';
  });
})();

// Products page: all products with filter
(function () {
  const container = document.getElementById('all-products');
  const tabs      = document.querySelectorAll('.filter-tab');
  if (!container) return;

  let allProducts = [];

  function render(filter) {
    const items = filter === 'all'
      ? allProducts
      : allProducts.filter(p => p.category === filter);
    container.innerHTML = items.length
      ? items.map(p => renderCard(p, false)).join('')
      : '<p style="color:var(--text-muted);text-align:center;">該当する商品がありません</p>';
  }

  loadProducts().then(products => {
    allProducts = products;
    render('all');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        render(tab.dataset.filter);
      });
    });
  }).catch(() => {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">商品データを読み込めませんでした</p>';
  });
})();

// Product detail page
(function () {
  const detail = document.getElementById('product-detail');
  if (!detail) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { detail.innerHTML = '<p style="text-align:center;color:var(--text-muted);">商品が見つかりませんでした。</p>'; return; }

  loadProducts().then(products => {
    const p = products.find(x => x.id === id);
    if (!p) { detail.innerHTML = '<p style="text-align:center;color:var(--text-muted);">商品が見つかりませんでした。</p>'; return; }

    // Update page title and hero
    document.title = `${p.title}｜ごちそうスタイル`;
    const heroTitle = document.getElementById('hero-title');
    const heroH1    = document.getElementById('hero-h1');
    if (heroTitle) heroTitle.textContent = p.title;
    if (heroH1)    heroH1.textContent    = p.title;

    const thumbClass = p.category === 'sweets' ? 'thumb-sweets' : 'thumb-meal';
    const tagClass   = p.category === 'sweets' ? 'tag-sweets'   : 'tag-meal';
    const tagLabel   = p.category === 'sweets' ? 'スイーツ'      : 'お食事';

    // Image gallery
    const images = Array.isArray(p.images) ? p.images : [];
    let galleryHtml = '';
    if (images.length > 0) {
      const thumbsHtml = images.map((src, i) =>
        `<img src="${src}" alt="${p.title} 画像${i + 1}" class="product-gallery-thumb${i === 0 ? ' active' : ''}" onclick="setMainImage(this,'${src}')">`
      ).join('');
      galleryHtml = `
        <div class="product-gallery-wrap">
          <div class="product-gallery-main" id="gallery-main">
            <img src="${images[0]}" alt="${p.title}">
          </div>
          ${images.length > 1 ? `<div class="product-gallery-thumbs">${thumbsHtml}</div>` : ''}
        </div>`;
    } else {
      galleryHtml = `<div class="product-gallery-wrap"><div class="product-gallery-main ${thumbClass}">${p.emoji}</div></div>`;
    }

    // YouTube embed below gallery
    let youtubeEmbedHtml = '';
    if (p.youtube) {
      const videoMatch = p.youtube.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (videoMatch) {
        youtubeEmbedHtml = `
          <div class="product-youtube-embed">
            <iframe src="https://www.youtube.com/embed/${videoMatch[1]}" allowfullscreen title="${p.title}"></iframe>
          </div>`;
      }
    }

    const purchaseBtn = p.purchaseUrl
      ? `<a href="${p.purchaseUrl}" target="_blank" rel="noopener" class="btn btn-primary">${p.purchaseType === 'store' ? '店舗情報を見る →' : '購入する →'}</a>`
      : '';
    const officialBtn = p.officialUrl
      ? `<a href="${p.officialUrl}" target="_blank" rel="noopener" class="btn btn-outline">公式サイトを見る →</a>`
      : '';

    detail.innerHTML = `
      <div class="product-detail-grid">
        <div>
          ${galleryHtml}
          ${youtubeEmbedHtml}
        </div>
        <div class="product-detail-info">
          <div class="product-detail-tag"><span class="tag ${tagClass}">${tagLabel}</span></div>
          <h2>${p.title}</h2>
          <p class="product-detail-desc">${p.description}</p>
          <div class="product-detail-comment">${p.comment}</div>
          <div class="product-detail-meta">
            <div class="product-detail-meta-row">
              <span class="product-detail-meta-label">金額</span>
              <span class="product-detail-price-value">${formatPrice(p)}</span>
            </div>
            <p class="product-price-note">※送料等を含む正確な金額は各購入ページでご確認ください</p>
            <div class="product-detail-meta-row">
              <span class="product-detail-meta-label">販売主</span>
              <span>${p.manufacturer}</span>
            </div>
          </div>
          <div class="product-detail-actions">
            ${purchaseBtn}
            ${officialBtn}
          </div>
        </div>
      </div>`;
  }).catch(() => {
    detail.innerHTML = '<p style="text-align:center;color:var(--text-muted);">商品データを読み込めませんでした。</p>';
  });
})();

// Thumbnail switcher (global, called inline from gallery)
window.setMainImage = function (thumb, src) {
  const main = document.getElementById('gallery-main');
  if (main) {
    const img = main.querySelector('img');
    if (img) img.src = src;
  }
  document.querySelectorAll('.product-gallery-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
};

// Form: sending state
(function () {
  document.querySelectorAll('form.contact-form').forEach(form => {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.textContent = '送信中...'; btn.disabled = true; }
    });
  });
})();
