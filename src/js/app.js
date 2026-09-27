/**
 * Main Application Controller for WorkLunch
 * Orchestrates step wizard navigation, state management, map rendering, and events.
 */

import { Storage } from './storage.js';
import { MapService } from './mapService.js';
import { PlacesService } from './placesService.js';
import { UI } from './ui.js';

// Application State
const state = {
  currentStep: 1,
  dietaryPreferences: [],
  location: {
    lat: 51.5137,
    lng: -0.1362,
    name: 'Soho, London, UK (Default)'
  },
  isLocationDetected: false,
  maxWalkMinutes: 10, // 5 | 10 | 15 | 25 mins
  lunchStyle: 'casual', // 'desk' | 'casual' | 'sitdown'
  priceFilter: 'any', // 'any' | '1' | '2' | '3'
  cuisineFilter: 'All',
  activeView: 'map', // DEFAULT VIEW: 'map'
  results: [],
  googleApiKey: ''
};

let autocompleteDebounceTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Initialize Application
 */
function initApp() {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Load stored settings & dietary preferences
  state.dietaryPreferences = Storage.getDietaryPreferences();
  state.googleApiKey = Storage.getGoogleApiKey();
  const lastLoc = Storage.getLastLocation();
  if (lastLoc && lastLoc.lat && lastLoc.lng) {
    state.location = lastLoc;
    state.isLocationDetected = true;
  }

  // Render initial UI components
  UI.renderActiveDietaryBanner(state.dietaryPreferences, () => goToStep(1));
  UI.renderDietaryChips('dietary-chips-grid', state.dietaryPreferences, (id) => {
    if (state.dietaryPreferences.includes(id)) {
      state.dietaryPreferences = state.dietaryPreferences.filter(x => x !== id);
    } else {
      state.dietaryPreferences.push(id);
    }
  });

  updateLocationDisplay();
  setSelectedWalkTimeBtn(state.maxWalkMinutes);
  setSelectedStyleCard(state.lunchStyle);
  setSelectedPriceBtn(state.priceFilter);

  // Wire Navigation & Event Listeners
  wireEventListeners();

  // Try to automatically prompt / check location permissions silently if available
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        attemptAutoLocation();
      }
    }).catch(() => {});
  }

  // Initial Step Render
  goToStep(1);
}

/**
 * Auto-fetch location if already granted
 */
async function attemptAutoLocation() {
  try {
    const loc = await PlacesService.getCurrentLocation();
    state.location = loc;
    state.isLocationDetected = true;
    Storage.saveLastLocation(loc);
    updateLocationDisplay();
  } catch (e) {
    console.log('Auto location check skipped.');
  }
}

/**
 * Step Navigation Controller
 */
function goToStep(stepNumber) {
  state.currentStep = stepNumber;

  const wizardSection = document.getElementById('wizard-section');
  const resultsSection = document.getElementById('results-section');
  const viewToggle = document.getElementById('view-toggle-container');

  if (stepNumber <= 4) {
    if (wizardSection) wizardSection.classList.remove('hidden');
    if (resultsSection) resultsSection.classList.add('hidden');
    if (viewToggle) viewToggle.classList.add('hidden');
    UI.updateWizardProgress(stepNumber);
  } else if (stepNumber === 5) {
    if (wizardSection) wizardSection.classList.add('hidden');
    if (resultsSection) resultsSection.classList.remove('hidden');
    if (viewToggle) viewToggle.classList.remove('hidden');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Update Location Info Displays & Replace Button with Detected Badge when allowed
 */
function updateLocationDisplay() {
  const buttonWrapper = document.getElementById('location-button-wrapper');
  const badge = document.getElementById('active-location-badge');
  const textEl = document.getElementById('active-location-text');
  const addressInput = document.getElementById('address-input');

  if (state.isLocationDetected && state.location && state.location.name) {
    // Hide 'Use My Location' button and show detected location badge
    if (buttonWrapper) buttonWrapper.classList.add('hidden');
    if (badge) badge.classList.remove('hidden');
    if (textEl) textEl.textContent = state.location.name;
    if (addressInput) addressInput.value = state.location.name;
  } else {
    if (buttonWrapper) buttonWrapper.classList.remove('hidden');
    if (badge) badge.classList.add('hidden');
  }
}

/**
 * Set active Walk Time button state
 */
function setSelectedWalkTimeBtn(walkMins) {
  state.maxWalkMinutes = parseInt(walkMins, 10);
  document.querySelectorAll('.walk-time-btn').forEach(btn => {
    if (parseInt(btn.getAttribute('data-walk'), 10) === state.maxWalkMinutes) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Set active Lunch Style Card state
 */
function setSelectedStyleCard(styleKey) {
  state.lunchStyle = styleKey;
  document.querySelectorAll('.style-card').forEach(card => {
    if (card.getAttribute('data-style') === styleKey) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

/**
 * Set active Price Tier button state
 */
function setSelectedPriceBtn(priceKey) {
  state.priceFilter = priceKey;
  document.querySelectorAll('.price-btn').forEach(btn => {
    if (btn.getAttribute('data-price') === priceKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Wire All Event Listeners
 */
function wireEventListeners() {
  // Brand Logo Click -> Reset to Step 1
  const brandLogo = document.getElementById('brand-logo');
  if (brandLogo) {
    brandLogo.addEventListener('click', () => goToStep(1));
  }

  // Header Dietary Button -> Go to Step 1
  const headerDietaryBtn = document.getElementById('header-dietary-btn');
  if (headerDietaryBtn) {
    headerDietaryBtn.addEventListener('click', () => goToStep(1));
  }

  // LARGE CTA: "No Dietary Requirements (Eat Everything)"
  const noDietaryBtn = document.getElementById('no-dietary-btn');
  if (noDietaryBtn) {
    noDietaryBtn.addEventListener('click', () => {
      state.dietaryPreferences = [];
      Storage.saveDietaryPreferences([]);
      UI.renderActiveDietaryBanner([], () => goToStep(1));
      UI.renderDietaryChips('dietary-chips-grid', [], (id) => {});
      goToStep(2);
    });
  }

  // Step 1: Save & Continue
  const step1Next = document.getElementById('step1-next-btn');
  if (step1Next) {
    step1Next.addEventListener('click', () => {
      Storage.saveDietaryPreferences(state.dietaryPreferences);
      UI.renderActiveDietaryBanner(state.dietaryPreferences, () => goToStep(1));
      goToStep(2);
    });
  }

  // Step 1: Skip
  const step1Skip = document.getElementById('step1-skip-btn');
  if (step1Skip) {
    step1Skip.addEventListener('click', () => {
      goToStep(2);
    });
  }

  // Step 2: "Use My Location" Button
  const useLocationBtn = document.getElementById('use-location-btn');
  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', async () => {
      const originalText = useLocationBtn.innerHTML;
      useLocationBtn.disabled = true;
      useLocationBtn.innerHTML = `
        <div class="inline-block w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs font-bold text-brand-400">Detecting your location...</span>
      `;

      try {
        const loc = await PlacesService.getCurrentLocation();
        state.location = loc;
        state.isLocationDetected = true;
        Storage.saveLastLocation(loc);
        updateLocationDisplay();
      } catch (err) {
        alert(err.message || 'Location access failed. Please type an address.');
      } finally {
        useLocationBtn.disabled = false;
        useLocationBtn.innerHTML = originalText;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Step 2: Change Location Button (Reset to allow new location input)
  const changeLocBtn = document.getElementById('change-location-btn');
  if (changeLocBtn) {
    changeLocBtn.addEventListener('click', () => {
      state.isLocationDetected = false;
      updateLocationDisplay();
    });
  }

  // Step 2: Address Autocomplete Input
  const addressInput = document.getElementById('address-input');
  const clearAddressBtn = document.getElementById('clear-address-btn');

  if (addressInput) {
    addressInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (clearAddressBtn) {
        if (val.length > 0) clearAddressBtn.classList.remove('hidden');
        else clearAddressBtn.classList.add('hidden');
      }

      clearTimeout(autocompleteDebounceTimer);
      autocompleteDebounceTimer = setTimeout(async () => {
        const suggestions = await PlacesService.searchAddressAutocomplete(val);
        UI.renderAutocompleteSuggestions('autocomplete-list', suggestions, (selectedItem) => {
          state.location = {
            lat: selectedItem.lat,
            lng: selectedItem.lng,
            name: selectedItem.name.split(',')[0] + ', ' + (selectedItem.name.split(',')[1] || '')
          };
          state.isLocationDetected = true;
          Storage.saveLastLocation(state.location);
          addressInput.value = state.location.name;
          updateLocationDisplay();
        });
      }, 300);
    });
  }

  if (clearAddressBtn) {
    clearAddressBtn.addEventListener('click', () => {
      if (addressInput) addressInput.value = '';
      clearAddressBtn.classList.add('hidden');
      UI.renderAutocompleteSuggestions('autocomplete-list', []);
    });
  }

  // Step 2 Back & Next
  const step2Back = document.getElementById('step2-back-btn');
  if (step2Back) step2Back.addEventListener('click', () => goToStep(1));

  const step2Next = document.getElementById('step2-next-btn');
  if (step2Next) step2Next.addEventListener('click', () => goToStep(3));

  // Step 3: Walk Time Pills Click
  document.querySelectorAll('.walk-time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const walkMins = btn.getAttribute('data-walk');
      setSelectedWalkTimeBtn(walkMins);
    });
  });

  // Step 3: Lunch Style Cards Click
  document.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      const style = card.getAttribute('data-style');
      setSelectedStyleCard(style);
    });
  });

  // Step 3 Back & Next
  const step3Back = document.getElementById('step3-back-btn');
  if (step3Back) step3Back.addEventListener('click', () => goToStep(2));

  const step3Next = document.getElementById('step3-next-btn');
  if (step3Next) step3Next.addEventListener('click', () => goToStep(4));

  // Step 4: Price Buttons
  document.querySelectorAll('.price-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const price = btn.getAttribute('data-price');
      setSelectedPriceBtn(price);
    });
  });

  // Step 4 Back & Search Trigger
  const step4Back = document.getElementById('step4-back-btn');
  if (step4Back) step4Back.addEventListener('click', () => goToStep(3));

  const searchTriggerBtn = document.getElementById('search-trigger-btn');
  if (searchTriggerBtn) {
    searchTriggerBtn.addEventListener('click', () => {
      executeSearch();
    });
  }

  // Step 5: Edit Search Button
  const editFiltersBtn = document.getElementById('edit-filters-btn');
  if (editFiltersBtn) {
    editFiltersBtn.addEventListener('click', () => goToStep(1));
  }

  // View Switcher (Map View Default)
  const viewGridBtn = document.getElementById('view-btn-grid');
  const viewMapBtn = document.getElementById('view-btn-map');
  const cardsViewEl = document.getElementById('results-grid-view');
  const mapViewEl = document.getElementById('results-map-view');

  if (viewGridBtn && viewMapBtn) {
    viewMapBtn.addEventListener('click', () => {
      state.activeView = 'map';
      viewMapBtn.className = 'px-3 py-1 text-xs font-semibold rounded-md bg-slate-800 text-emerald-400 shadow-sm transition flex items-center space-x-1';
      viewGridBtn.className = 'px-3 py-1 text-xs font-semibold rounded-md text-slate-400 hover:text-white transition flex items-center space-x-1';
      if (mapViewEl) mapViewEl.classList.remove('hidden');
      if (cardsViewEl) cardsViewEl.classList.add('hidden');

      MapService.init('map-element', state.location.lat, state.location.lng, 15);
      MapService.renderPlaces(state.results, (place) => {
        UI.openSurpriseModal(place);
      });
    });

    viewGridBtn.addEventListener('click', () => {
      state.activeView = 'grid';
      viewGridBtn.className = 'px-3 py-1 text-xs font-semibold rounded-md bg-slate-800 text-emerald-400 shadow-sm transition flex items-center space-x-1';
      viewMapBtn.className = 'px-3 py-1 text-xs font-semibold rounded-md text-slate-400 hover:text-white transition flex items-center space-x-1';
      if (cardsViewEl) cardsViewEl.classList.remove('hidden');
      if (mapViewEl) mapViewEl.classList.add('hidden');

      UI.renderRestaurantCards('results-grid-view', state.results, (placeId) => {
        viewMapBtn.click();
        setTimeout(() => MapService.focusPlace(placeId), 300);
      });
    });
  }

  // "Surprise Me!" Feature Button
  const surpriseBtn = document.getElementById('surprise-me-btn');
  if (surpriseBtn) {
    surpriseBtn.addEventListener('click', () => {
      triggerSurpriseMe();
    });
  }

  // Reset Filters on Empty State
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', () => {
      state.cuisineFilter = 'All';
      state.priceFilter = 'any';
      state.maxWalkMinutes = 15;
      setSelectedPriceBtn('any');
      setSelectedWalkTimeBtn(15);
      executeSearch();
    });
  }

  // Settings Modal Handlers
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsCloseBtn = document.getElementById('settings-close-btn');
  const settingsSaveBtn = document.getElementById('settings-save-btn');
  const googleKeyInput = document.getElementById('google-api-key-input');

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      if (googleKeyInput) googleKeyInput.value = state.googleApiKey;
      settingsModal.classList.remove('hidden');
    });
  }

  if (settingsCloseBtn && settingsModal) {
    settingsCloseBtn.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });
  }

  if (settingsSaveBtn && settingsModal) {
    settingsSaveBtn.addEventListener('click', () => {
      if (googleKeyInput) {
        state.googleApiKey = googleKeyInput.value.trim();
        Storage.saveGoogleApiKey(state.googleApiKey);
      }
      settingsModal.classList.add('hidden');
      alert('Google Maps API settings saved successfully!');
    });
  }
}

/**
 * Execute Search & Fetch Nearby Places
 */
async function executeSearch() {
  goToStep(5);

  const loadingEl = document.getElementById('results-loading');
  const gridViewEl = document.getElementById('results-grid-view');
  const mapViewEl = document.getElementById('results-map-view');
  const emptyEl = document.getElementById('results-empty');
  const countBadge = document.getElementById('results-count-badge');
  const locSubHeader = document.getElementById('results-location-sub');

  if (loadingEl) loadingEl.classList.remove('hidden');
  if (gridViewEl) gridViewEl.classList.add('hidden');
  if (mapViewEl) mapViewEl.classList.add('hidden');
  if (emptyEl) emptyEl.classList.add('hidden');

  if (locSubHeader) {
    locSubHeader.textContent = `Near ${state.location.name} • Max ${state.maxWalkMinutes} min walk • Price $${state.priceFilter === 'any' ? 'Any' : state.priceFilter}`;
  }

  try {
    const places = await PlacesService.fetchNearbyPlaces({
      location: state.location,
      style: state.lunchStyle,
      dietary: state.dietaryPreferences,
      price: state.priceFilter,
      cuisine: state.cuisineFilter,
      maxWalkMinutes: state.maxWalkMinutes,
      googleApiKey: state.googleApiKey
    });

    state.results = places;

    if (loadingEl) loadingEl.classList.add('hidden');

    if (places.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (countBadge) countBadge.textContent = '0 found';
    } else {
      if (countBadge) countBadge.textContent = `${places.length} found`;

      UI.renderCuisinePills('cuisine-pills-bar', state.cuisineFilter, (selectedCuisine) => {
        state.cuisineFilter = selectedCuisine;
        executeSearch();
      });

      // Default to MAP VIEW
      if (state.activeView === 'map') {
        if (mapViewEl) mapViewEl.classList.remove('hidden');
        if (gridViewEl) gridViewEl.classList.add('hidden');

        MapService.init('map-element', state.location.lat, state.location.lng, 15);
        MapService.renderPlaces(places, (selectedPlace) => {
          UI.openSurpriseModal(selectedPlace);
        });
        MapService.refresh();
      } else {
        if (gridViewEl) gridViewEl.classList.remove('hidden');
        if (mapViewEl) mapViewEl.classList.add('hidden');
        UI.renderRestaurantCards('results-grid-view', places, (placeId) => {
          const viewMapBtn = document.getElementById('view-btn-map');
          if (viewMapBtn) viewMapBtn.click();
          setTimeout(() => MapService.focusPlace(placeId), 300);
        });
      }
    }
  } catch (err) {
    console.error('Search error:', err);
    if (loadingEl) loadingEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
  }
}

/**
 * Trigger "Surprise Me!" Feature
 */
function triggerSurpriseMe() {
  if (!state.results || state.results.length === 0) {
    alert('No lunch places found to pick from. Try adjusting your filters.');
    return;
  }

  const randomIndex = Math.floor(Math.random() * Math.min(5, state.results.length));
  const pickedPlace = state.results[randomIndex];

  UI.openSurpriseModal(pickedPlace, () => {
    triggerSurpriseMe();
  });
}
