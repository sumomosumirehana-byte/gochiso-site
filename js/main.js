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

async function loadArticles() {
  const res = await fetch('./data/articles.json');
  if (!res.ok) return [];
  return res.json();
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${y}.${m}.${day}`;
}

function renderArticleCard(a, compact = false) {
  const catLabel = { recommend: 'おすすめ', news: 'お知らせ', event: '催事情報' };
  const catClass = { recommend: 'tag-sweets', news: 'tag-meal', event: 'tag-sweets' };
  const detailUrl = `./article.html?id=${a.id}`;

  const thumbInner = (a.thumbnail && a.thumbnail !== '')
    ? `<img src="${a.thumbnail}" alt="${a.title}" loading="lazy">`
    : `<span class="product-emoji">${a.emoji || '📝'}</span>`;

  return `
    <a href="${detailUrl}" class="article-card">
      <div class="article-thumb">${thumbInner}</div>
      <div class="article-body">
        <div class="article-meta">
          <span class="article-date">${formatDate(a.date)}</span>
          <span class="tag ${catClass[a.category] || 'tag-sweets'}">${catLabel[a.category] || a.category}</span>
        </div>
        <h3>${a.title}</h3>
        ${compact ? '' : `<p class="article-excerpt">${a.excerpt || ''}</p>`}
      </div>
    </a>`;
}

function formatPrice(p) {
  if (!p.price || p.price === 0) return p.priceNote || '価格・購入リンクを更新してください';
  return `¥${p.price.toLocaleString()}（税込・送料込）`;
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

  // サムネイル: images[0] → emoji（商品画像が追加されたら自動切替）
  const imgSrc = (p.images && p.images.length > 0) ? p.images[0] : '';
  const thumbInner = imgSrc
    ? `<img src="${imgSrc}" alt="${p.title}" loading="lazy">`
    : `<span class="product-emoji">${p.emoji}</span>`;

  if (compact) {
    const pickupBadge = p.featured ? '<span class="pickup-badge">PICKUP</span>' : '';
    return `
      <a href="${detailUrl}" class="product-card" data-category="${p.category}">
        <div class="product-thumb ${thumbClass}" style="position:relative;">${thumbInner}${pickupBadge}</div>
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
    const featured = products.filter(p => p.published !== false && p.featured).slice(0, 9);
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
    const visible = allProducts.filter(p => p.published !== false);
    const items = filter === 'all'
      ? visible
      : visible.filter(p => p.category === filter);
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
    if (!p || p.published === false) { detail.innerHTML = '<p style="text-align:center;color:var(--text-muted);">商品が見つかりませんでした。</p>'; return; }

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
              <span class="product-detail-meta-label">価格</span>
              <span class="product-detail-price-value">${formatPrice(p)}</span>
            </div>
            <div class="product-detail-meta-row">
              <span class="product-detail-meta-label">販売主</span>
              <span>${p.manufacturer}</span>
            </div>
          </div>
          <div class="product-detail-actions">
            ${purchaseBtn}
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

// Top page: featured articles
(function () {
  const container = document.getElementById('featured-articles');
  if (!container) return;
  const section  = document.getElementById('articles-section');

  loadArticles().then(articles => {
    const featured = articles.filter(a => a.featured).slice(0, 3);
    if (!featured.length) {
      if (section) section.style.display = 'none';
      return;
    }
    container.innerHTML = featured.map(a => renderArticleCard(a, true)).join('');
  }).catch(() => {
    if (section) section.style.display = 'none';
  });
})();

// Articles page: all articles
(function () {
  const container = document.getElementById('all-articles');
  const tabs      = document.querySelectorAll('.article-filter-tab');
  if (!container) return;

  let allArticles = [];

  function renderList(filter) {
    const items = filter === 'all' ? allArticles : allArticles.filter(a => a.category === filter);
    container.innerHTML = items.length
      ? items.map(a => renderArticleCard(a, false)).join('')
      : '<p style="color:var(--text-muted);text-align:center;">該当する記事がありません</p>';
  }

  loadArticles().then(articles => {
    allArticles = articles;
    renderList('all');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderList(tab.dataset.filter);
      });
    });
  }).catch(() => {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">記事データを読み込めませんでした</p>';
  });
})();

// Article detail page
(function () {
  const detail = document.getElementById('article-detail');
  if (!detail) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { detail.innerHTML = '<p style="text-align:center;color:var(--text-muted);">記事が見つかりませんでした。</p>'; return; }

  loadArticles().then(articles => {
    const a = articles.find(x => x.id === id);
    if (!a) { detail.innerHTML = '<p style="text-align:center;color:var(--text-muted);">記事が見つかりませんでした。</p>'; return; }

    document.title = `${a.title}｜ごちそうスタイル`;
    const heroTitle = document.getElementById('article-hero-title');
    const heroH1    = document.getElementById('article-hero-h1');
    if (heroTitle) heroTitle.textContent = a.title;
    if (heroH1)    heroH1.textContent    = a.title;

    const catLabel = { recommend: 'おすすめ', news: 'お知らせ', event: '催事情報' };
    const catClass = { recommend: 'tag-sweets', news: 'tag-meal', event: 'tag-sweets' };
    const thumbHtml = (a.thumbnail && a.thumbnail !== '')
      ? `<img src="${a.thumbnail}" alt="${a.title}" class="article-detail-thumb">`
      : '';

    detail.innerHTML = `
      <div class="article-detail-header">
        <div class="article-meta" style="margin-bottom:1rem;">
          <span class="article-date">${formatDate(a.date)}</span>
          <span class="tag ${catClass[a.category] || 'tag-sweets'}">${catLabel[a.category] || a.category}</span>
        </div>
        ${thumbHtml}
        ${a.excerpt ? `<p class="article-lead">${a.excerpt}</p>` : ''}
      </div>
      <div class="article-content">${a.content || ''}</div>
      ${Array.isArray(a.tags) && a.tags.length ? `<div class="article-tags">${a.tags.map(t => `<span class="article-tag">#${t}</span>`).join('')}</div>` : ''}`;
  }).catch(() => {
    detail.innerHTML = '<p style="text-align:center;color:var(--text-muted);">記事データを読み込めませんでした。</p>';
  });
})();

// Form: sending state
(function () {
  document.querySelectorAll('form.contact-form').forEach(form => {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.textContent = '送信中...'; btn.disabled = true; }
    });
  });
})();
