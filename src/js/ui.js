/**
 * UI Renderer Module for WorkLunch
 * Handles rendering step wizard UI, restaurant cards with Google ratings & reviews, 
 * cuisine pills, autocomplete, and modal popups.
 */

/**
 * HTML Escaper helper for XSS defense
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * URL sanitizer helper
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/')) {
    return escapeHtml(trimmed);
  }
  return '#';
}

export const DIETARY_OPTIONS = [
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'halal', label: 'Halal', icon: '🕌' },
  { id: 'kosher', label: 'Kosher', icon: '✡️' },
  { id: 'nut-free', label: 'Nut-Free', icon: '🥜' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
];

export const CUISINE_PILLS = [
  'All',
  'Sandwiches',
  'Asian',
  'Mexican',
  'Italian',
  'Healthy',
  'Burgers',
  'Pizza',
  'Cafe',
  'Japanese',
  'Indian'
];

export const UI = {
  /**
   * Render Step 1 Dietary Chips
   */
  renderDietaryChips(containerId, selectedIds = [], onToggle) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    grid.innerHTML = DIETARY_OPTIONS.map(option => {
      const isActive = selectedIds.includes(option.id);
      return `
        <button type="button" 
                class="dietary-chip p-3.5 rounded-xl bg-slate-950 border-2 border-slate-800 hover:border-brand-500 flex items-center space-x-2.5 transition text-left ${isActive ? 'active' : ''}" 
                data-id="${escapeHtml(option.id)}">
          <span class="text-lg">${escapeHtml(option.icon)}</span>
          <span class="text-xs font-bold text-slate-200">${escapeHtml(option.label)}</span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.dietary-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        btn.classList.toggle('active');
        if (onToggle) onToggle(id);
      });
    });
  },

  /**
   * Update Progress Bar & Step Indicator Header
   */
  updateWizardProgress(stepNumber) {
    const percentages = { 1: '25%', 2: '50%', 3: '75%', 4: '100%' };
    const stepTitles = {
      1: 'Step 1 of 4: Dietary Preferences',
      2: 'Step 2 of 4: Location Input',
      3: 'Step 3 of 4: Walking Time & Lunch Style',
      4: 'Step 4 of 4: Price & Confirmation'
    };

    const textEl = document.getElementById('step-indicator-text');
    const pctEl = document.getElementById('step-percentage');
    const barEl = document.getElementById('step-progress-bar');

    if (textEl) textEl.textContent = stepTitles[stepNumber] || '';
    if (pctEl) pctEl.textContent = percentages[stepNumber] || '100%';
    if (barEl) barEl.style.width = percentages[stepNumber] || '100%';

    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      if (stepEl) {
        if (i === stepNumber) {
          stepEl.classList.remove('hidden');
        } else {
          stepEl.classList.add('hidden');
        }
      }
    }
  },

  /**
   * Render Autocomplete Suggestions Dropdown
   */
  renderAutocompleteSuggestions(containerId, suggestions = [], onSelect) {
    const list = document.getElementById(containerId);
    if (!list) return;

    if (suggestions.length === 0) {
      list.classList.add('hidden');
      list.innerHTML = '';
      return;
    }

    list.innerHTML = suggestions.map((item, index) => `
      <div class="autocomplete-item px-4 py-3 hover:bg-slate-800 cursor-pointer transition flex items-center space-x-3 text-xs text-slate-200 border-b border-slate-800/60 last:border-0" data-index="${index}">
        <i data-lucide="map-pin" class="w-4 h-4 text-brand-400 flex-shrink-0"></i>
        <span class="truncate font-medium">${escapeHtml(item.name)}</span>
      </div>
    `).join('');

    list.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();

    list.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        if (onSelect && suggestions[idx]) {
          onSelect(suggestions[idx]);
        }
        list.classList.add('hidden');
      });
    });
  },

  /**
   * Render Restaurant Cards Grid with Google Ratings & Review Summaries
   */
  renderRestaurantCards(containerId, places = [], onCardMapClick) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    if (places.length === 0) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = places.map(place => `
      <div class="restaurant-card bg-slate-900/90 border border-slate-800/90 hover:border-brand-500/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col group">
        
        <!-- Image Banner -->
        <div class="relative h-48 bg-slate-950 overflow-hidden">
          <img src="${sanitizeUrl(place.image)}" alt="${escapeHtml(place.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent"></div>
          
          <!-- Google Rating & Reviews Badge -->
          <div class="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 text-amber-400 font-extrabold text-xs flex items-center space-x-1.5 shadow-lg">
            <span>⭐</span>
            <span>${escapeHtml(String(place.rating))}</span>
            <span class="text-slate-400 font-normal text-[10px]">(${escapeHtml(String(place.userRatingsTotal || 120))}+ reviews)</span>
          </div>

          <!-- Price & Walk Duration Badge -->
          <div class="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 text-slate-200 font-extrabold text-xs flex items-center space-x-2 shadow-lg">
            <span class="text-emerald-400 font-extrabold">${escapeHtml(place.priceSymbol)}</span>
            <span class="text-slate-600">•</span>
            <span class="text-slate-300 font-semibold flex items-center space-x-1">
              <i data-lucide="footprints" class="w-3 h-3 text-brand-400 inline"></i>
              <span>${escapeHtml(String(place.walkTime))} min walk</span>
            </span>
          </div>

          <!-- Title Overlay -->
          <div class="absolute bottom-3 left-4 right-4">
            <h3 class="font-black text-white text-lg leading-tight truncate drop-shadow-md">${escapeHtml(place.name)}</h3>
            <p class="text-xs text-brand-400 font-bold">${escapeHtml(place.cuisine)}</p>
          </div>
        </div>

        <!-- Card Details & Review Summary -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-3.5">
          
          <!-- Review Snippet Summary -->
          <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <span>Google Review Summary</span>
            </div>
            <p class="text-xs text-slate-300 italic line-clamp-2">${escapeHtml(place.reviewSnippet || '“Consistently great lunch options and super fast service!”')}</p>
          </div>

          <p class="text-[11px] text-slate-400 truncate flex items-center space-x-1">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-brand-400 flex-shrink-0"></i>
            <span class="truncate">${escapeHtml(place.address)}</span>
          </p>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1.5">
            ${place.tags.slice(0, 3).map(tag => `
              <span class="px-2 py-0.5 rounded-md bg-slate-800/80 text-emerald-400 text-[10px] font-semibold border border-slate-700/60">
                ${escapeHtml(tag)}
              </span>
            `).join('')}
          </div>

          <!-- Card Actions -->
          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between space-x-2">
            <button class="card-map-btn flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1" data-id="${escapeHtml(place.id)}">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-brand-400"></i>
              <span>View on Map</span>
            </button>
            <a href="${sanitizeUrl(place.mapLink)}" target="_blank" rel="noopener noreferrer" class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center space-x-1">
              <span>Directions</span>
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </a>
          </div>
        </div>

      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    grid.querySelectorAll('.card-map-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (onCardMapClick) onCardMapClick(id);
      });
    });
  },

  /**
   * Render Quick Cuisine Filter Pills
   */
  renderCuisinePills(containerId, activeCuisine = 'All', onSelectCuisine) {
    const bar = document.getElementById(containerId);
    if (!bar) return;

    bar.innerHTML = CUISINE_PILLS.map(c => {
      const isActive = c.toLowerCase() === activeCuisine.toLowerCase();
      return `
        <button class="cuisine-pill px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${isActive ? 'active' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'}" data-cuisine="${escapeHtml(c)}">
          ${escapeHtml(c)}
        </button>
      `;
    }).join('');

    bar.querySelectorAll('.cuisine-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const cuisine = btn.getAttribute('data-cuisine');
        if (onSelectCuisine) onSelectCuisine(cuisine);
      });
    });
  },

  /**
   * Render Banner for Active Saved Dietary Filters
   */
  renderActiveDietaryBanner(savedDietaryIds = [], onEditClick) {
    const banner = document.getElementById('active-dietary-banner');
    const tagsEl = document.getElementById('active-dietary-tags');
    const headerLabel = document.getElementById('header-dietary-label');
    const headerBadge = document.getElementById('header-dietary-badge');

    if (!banner || !tagsEl) return;

    if (savedDietaryIds.length > 0) {
      const activeLabels = savedDietaryIds.map(id => {
        const match = DIETARY_OPTIONS.find(opt => opt.id === id);
        return match ? match.label : id;
      });

      tagsEl.textContent = activeLabels.join(', ');
      banner.classList.remove('hidden');

      if (headerLabel) headerLabel.textContent = `Dietary (${savedDietaryIds.length})`;
      if (headerBadge) {
        headerBadge.textContent = savedDietaryIds.length;
        headerBadge.classList.remove('hidden');
        headerBadge.classList.add('flex');
      }
    } else {
      banner.classList.add('hidden');
      if (headerLabel) headerLabel.textContent = 'Dietary Filters';
      if (headerBadge) {
        headerBadge.classList.add('hidden');
        headerBadge.classList.remove('flex');
      }
    }

    const editBtn = document.getElementById('banner-edit-btn');
    if (editBtn) {
      editBtn.onclick = onEditClick;
    }
  },

  /**
   * Open & Render "Surprise Me!" Modal Popup
   */
  openSurpriseModal(place, onPickAnother) {
    const modal = document.getElementById('surprise-modal');
    if (!modal || !place) return;

    document.getElementById('surprise-img').src = sanitizeUrl(place.image);
    document.getElementById('surprise-title').textContent = place.name;
    document.getElementById('surprise-rating').textContent = place.rating;
    document.getElementById('surprise-reviews-count').textContent = `(${place.userRatingsTotal || 140}+ reviews)`;
    document.getElementById('surprise-price').textContent = place.priceSymbol;
    document.getElementById('surprise-walk').textContent = `${place.walkTime} min walk`;
    document.getElementById('surprise-address-text').textContent = place.address;
    document.getElementById('surprise-review-snippet').textContent = place.reviewSnippet || '“Consistently delicious lunch options and quick service.”';
    document.getElementById('surprise-maps-link').href = sanitizeUrl(place.mapLink);

    const tagsContainer = document.getElementById('surprise-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = place.tags.map(t => `
        <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
          ${escapeHtml(t)}
        </span>
      `).join('');
    }

    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('surprise-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.add('hidden');
    }

    const anotherBtn = document.getElementById('surprise-another-btn');
    if (anotherBtn) {
      anotherBtn.onclick = () => {
        if (onPickAnother) onPickAnother();
      };
    }
  }
};
