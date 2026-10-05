/**
 * Open-Source Map Service powered by Leaflet.js & OpenStreetMap
 * Renders interactive open-source map tiles, user location pin, restaurant markers, and popups.
 * 100% free & open-source — no API keys required for any user.
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

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/')) {
    return escapeHtml(trimmed);
  }
  return '#';
}

let mapInstance = null;
let userMarker = null;
let restaurantMarkers = [];

export const MapService = {
  /**
   * Initialize or update open-source Leaflet map container
   */
  init(containerId, lat, lng, zoom = 15) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!mapInstance) {
      mapInstance = L.map(containerId, {
        zoomControl: false,
        attributionControl: true
      }).setView([lat, lng], zoom);

      L.control.zoom({ position: 'topright' }).addTo(mapInstance);

      const osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      });

      osmTileLayer.addTo(mapInstance);
    } else {
      mapInstance.setView([lat, lng], zoom);
    }

    this.refresh();
    this.setUserLocation(lat, lng);
  },

  /**
   * Set user position marker
   */
  setUserLocation(lat, lng) {
    if (!mapInstance) return;

    if (userMarker) {
      mapInstance.removeLayer(userMarker);
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div class="user-pin-pulse" title="Your Location"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    userMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(mapInstance)
      .bindPopup(`
        <div class="text-xs font-extrabold text-brand-400 p-1 flex items-center space-x-1">
          <span>📍 Your Current Location</span>
        </div>
      `);
  },

  /**
   * Render restaurant markers on map
   */
  renderPlaces(places, onSelectPlace) {
    if (!mapInstance) return;

    restaurantMarkers.forEach(m => mapInstance.removeLayer(m));
    restaurantMarkers = [];

    if (!places || places.length === 0) return;

    const bounds = L.latLngBounds();

    if (userMarker) {
      bounds.extend(userMarker.getLatLng());
    }

    places.forEach(place => {
      if (!place.lat || !place.lng) return;

      const placeLatLng = [place.lat, place.lng];
      bounds.extend(placeLatLng);

      const markerIcon = L.divIcon({
        className: 'custom-place-marker',
        html: `
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-xs shadow-xl border-2 border-slate-900 cursor-pointer transform hover:scale-125 transition-transform" title="${escapeHtml(place.name)}">
            ${escapeHtml(place.priceSymbol || '🍱')}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const popupHtml = `
        <div class="p-1 space-y-2 max-w-[210px]">
          <div class="font-extrabold text-sm text-white leading-tight">${escapeHtml(place.name)}</div>
          <div class="text-[11px] text-amber-400 font-bold flex items-center justify-between">
            <span>⭐ ${escapeHtml(String(place.rating || '4.5'))}</span>
            <span class="text-emerald-400 font-extrabold">${escapeHtml(place.priceSymbol || '$$')}</span>
            <span class="text-slate-300 font-normal">${escapeHtml(String(place.walkTime))}m walk</span>
          </div>
          <div class="text-[10px] text-slate-400 truncate">${escapeHtml(place.cuisine || 'Restaurant')}</div>
          <p class="text-[10px] text-slate-300 italic line-clamp-2">${escapeHtml(place.reviewSnippet || '')}</p>
          <a href="${sanitizeUrl(place.mapLink)}" target="_blank" rel="noopener noreferrer" class="block text-center mt-2 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow">
            Get Directions ↗
          </a>
        </div>
      `;

      const marker = L.marker(placeLatLng, { icon: markerIcon })
        .addTo(mapInstance)
        .bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectPlace) onSelectPlace(place);
      });

      marker.placeId = place.id;
      restaurantMarkers.push(marker);
    });

    if (restaurantMarkers.length > 0) {
      mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }

    this.refresh();
  },

  focusPlace(placeId) {
    const marker = restaurantMarkers.find(m => m.placeId === placeId);
    if (marker && mapInstance) {
      mapInstance.panTo(marker.getLatLng(), { animate: true, duration: 0.8 });
      marker.openPopup();
    }
  },

  refresh() {
    setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }, 150);
  }
};
