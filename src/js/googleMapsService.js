/**
 * Native Google Maps & Places JS SDK Integration Module
 * Dynamically loads Google Maps API script and provides Google Map rendering, 
 * Google Places Nearby Search, and Google Autocomplete.
 */

let googleMapInstance = null;
let googleMarkers = [];
let isScriptLoading = false;
let isScriptLoaded = false;

// Sleek Dark Theme JSON styling for Google Maps
const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f8fafc" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] }
];

export const GoogleMapsService = {
  /**
   * Dynamically load Google Maps JS SDK with API Key
   */
  loadSdk(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        isScriptLoaded = true;
        resolve(window.google.maps);
        return;
      }

      if (isScriptLoading) {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            resolve(window.google.maps);
          }
        }, 100);
        return;
      }

      isScriptLoading = true;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isScriptLoaded = true;
        isScriptLoading = false;
        resolve(window.google.maps);
      };

      script.onerror = (err) => {
        isScriptLoading = false;
        reject(new Error('Failed to load Google Maps SDK. Please check your API Key.'));
      };

      document.head.appendChild(script);
    });
  },

  /**
   * Check if Google SDK is loaded
   */
  isLoaded() {
    return isScriptLoaded || (window.google && window.google.maps);
  },

  /**
   * Render native Google Map
   */
  async renderMap(containerId, lat, lng, apiKey) {
    await this.loadSdk(apiKey);

    const container = document.getElementById(containerId);
    if (!container) return;

    const center = { lat, lng };

    if (!googleMapInstance) {
      googleMapInstance = new google.maps.Map(container, {
        center,
        zoom: 15,
        styles: GOOGLE_MAPS_DARK_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false
      });
    } else {
      googleMapInstance.setCenter(center);
      googleMapInstance.setZoom(15);
    }

    // Add user marker
    new google.maps.Marker({
      position: center,
      map: googleMapInstance,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#22c55e",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3
      }
    });

    return googleMapInstance;
  },

  /**
   * Query Google Places Nearby Search using PlacesService JS SDK
   */
  nearbySearch(lat, lng, radiusMeters, apiKey) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.loadSdk(apiKey);

        // Dummy map element for PlacesService if mapInstance not initialized yet
        const dummyDiv = document.createElement('div');
        const service = new google.maps.places.PlacesService(googleMapInstance || new google.maps.Map(dummyDiv));

        const request = {
          location: new google.maps.LatLng(lat, lng),
          radius: radiusMeters,
          type: ['restaurant', 'cafe', 'meal_takeaway', 'bakery']
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            resolve([]);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Render Google Markers & InfoWindows for places
   */
  renderMarkers(places, onPlaceSelect) {
    if (!googleMapInstance) return;

    // Clear existing markers
    googleMarkers.forEach(m => m.setMap(null));
    googleMarkers = [];

    const bounds = new google.maps.LatLngBounds();

    places.forEach(place => {
      const pos = { lat: place.lat, lng: place.lng };
      bounds.extend(pos);

      const marker = new google.maps.Marker({
        position: pos,
        map: googleMapInstance,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#f59e0b",
          fillOpacity: 1,
          strokeColor: "#0f172a",
          strokeWeight: 2
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="background:#0f172a; color:#fff; padding:8px; border-radius:8px; max-width:200px;">
            <div style="font-weight:bold; font-size:13px;">${place.name}</div>
            <div style="color:#fbbf24; font-size:11px; margin-top:2px;">⭐ ${place.rating} (${place.userRatingsTotal}+ reviews)</div>
            <div style="color:#94a3b8; font-size:10px; margin-top:2px;">${place.walkTime} min walk • ${place.priceSymbol}</div>
            <a href="${place.mapLink}" target="_blank" style="display:block; text-align:center; margin-top:6px; background:#22c55e; color:#020617; font-weight:bold; padding:4px; border-radius:6px; text-decoration:none; font-size:11px;">Directions ↗</a>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapInstance, marker);
        if (onPlaceSelect) onPlaceSelect(place);
      });

      googleMarkers.push(marker);
    });

    if (places.length > 0) {
      googleMapInstance.fitBounds(bounds);
    }
  }
};
