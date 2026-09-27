/**
 * Map Service powered by Leaflet.js
 * Renders interactive map, user location pin, restaurant markers, and popups.
 */

let mapInstance = null;
let userMarker = null;
let restaurantMarkers = [];

export const MapService = {
  /**
   * Initialize or update Leaflet map container
   * @param {string} containerId - Element ID for the map
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Zoom level
   */
  init(containerId, lat, lng, zoom = 15) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!mapInstance) {
      // Create map instance
      mapInstance = L.map(containerId, {
        zoomControl: false
      }).setView([lat, lng], zoom);

      // Add zoom control top right
      L.control.zoom({ position: 'topright' }).addTo(mapInstance);

      // Add CartoDB Dark Matter tile layer for sleek dark aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstance);
    } else {
      mapInstance.setView([lat, lng], zoom);
    }

    // Force map container size recalculation after display change
    setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }, 200);

    this.setUserLocation(lat, lng);
  },

  /**
   * Set user position marker with pulsating glow ring
   */
  setUserLocation(lat, lng) {
    if (!mapInstance) return;

    if (userMarker) {
      mapInstance.removeLayer(userMarker);
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div class="user-pin-pulse"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    userMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(mapInstance)
      .bindPopup(`
        <div class="text-xs font-extrabold text-brand-400 p-1 flex items-center space-x-1">
          <span>📍 Your Location</span>
        </div>
      `);
  },

  /**
   * Render restaurant markers on map
   * @param {Array} places - Array of place objects
   * @param {Function} onSelectPlace - Callback when marker is clicked
   */
  renderPlaces(places, onSelectPlace) {
    if (!mapInstance) return;

    // Clear existing restaurant markers
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

      // Custom marker icon
      const markerIcon = L.divIcon({
        className: 'custom-place-marker',
        html: `
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg border-2 border-slate-900 cursor-pointer transform hover:scale-125 transition-transform">
            ${place.price || '🍱'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const popupHtml = `
        <div class="p-1 space-y-1.5 max-w-[200px]">
          <div class="font-extrabold text-sm text-white">${place.name}</div>
          <div class="text-[11px] text-slate-300 flex items-center justify-between">
            <span class="text-amber-400 font-bold">⭐ ${place.rating || '4.5'}</span>
            <span class="text-emerald-400 font-semibold">${place.priceSymbol || '$$'}</span>
            <span class="text-slate-400">${place.walkTime} min walk</span>
          </div>
          <div class="text-[10px] text-slate-400 truncate">${place.cuisine || 'Restaurant'}</div>
          <a href="${place.mapLink}" target="_blank" rel="noopener noreferrer" class="block text-center mt-2 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition">
            Directions ↗
          </a>
        </div>
      `;

      const marker = L.marker(placeLatLng, { icon: markerIcon })
        .addTo(mapInstance)
        .bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectPlace) onSelectPlace(place);
      });

      // Save marker reference with place ID
      marker.placeId = place.id;
      restaurantMarkers.push(marker);
    });

    // Auto fit map view bounds to include user + places
    if (restaurantMarkers.length > 0) {
      mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  },

  /**
   * Pan map to specific place coordinates and open popup
   */
  focusPlace(placeId) {
    const marker = restaurantMarkers.find(m => m.placeId === placeId);
    if (marker && mapInstance) {
      mapInstance.panTo(marker.getLatLng(), { animate: true, duration: 0.8 });
      marker.openPopup();
    }
  },

  /**
   * Invalidate map size (useful when unhiding container)
   */
  refresh() {
    if (mapInstance) {
      mapInstance.invalidateSize();
    }
  }
};
