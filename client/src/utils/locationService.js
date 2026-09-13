/**
 * Locality-Based Geolocation & Reverse Geocoding Utility
 * Strictly respects User Privacy: No continuous tracking, no silent GPS requests.
 * Uses free OpenStreetMap Nominatim reverse geocoding API.
 */

/**
 * Extract prioritized locality name from Nominatim address breakdown according to rule:
 * 1. neighbourhood
 * 2. locality
 * 3. suburb
 * 4. village / town
 * 5. city
 * 6. state
 * 7. postal code
 */
export function extractLocalityName(addressObj = {}) {
  if (!addressObj) return '';

  const localityCandidate =
    addressObj.neighbourhood ||
    addressObj.locality ||
    addressObj.suburb ||
    addressObj.village ||
    addressObj.town ||
    addressObj.city ||
    addressObj.county ||
    addressObj.state_district ||
    addressObj.state ||
    '';

  return localityCandidate.trim();
}

/**
 * Request user location once on explicit trigger and reverse geocode to locality address.
 * Returns { success: true, locality, fullAddress, city, state, postalCode, lat, lng } or throws Error.
 */
export async function detectUserLocality() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Location access wasn't available. You can enter your address manually."));
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Call free OpenStreetMap Nominatim reverse geocoding API with 8s timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            {
              headers: {
                'Accept-Language': 'en-US,en;q=0.9',
              },
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error('Geocoding service unavailable');
          }

          const data = await response.json();
          const address = data.address || {};

          const locality = extractLocalityName(address);
          const city = address.city || address.town || address.village || address.county || 'Campus Town';
          const state = address.state || '';
          const postalCode = address.postcode || '';

          // Format clean full address string
          const addressParts = [];
          if (locality) addressParts.push(locality);
          if (city && city !== locality) addressParts.push(city);
          if (state) addressParts.push(state);
          if (postalCode) addressParts.push(postalCode);

          const fullAddress = addressParts.join(', ') || data.display_name || 'Detected Campus Locality';

          resolve({
            success: true,
            locality: locality || city || 'Current Locality',
            fullAddress,
            city,
            state,
            postalCode,
            lat,
            lng,
            rawAddress: address,
          });
        } catch (err) {
          console.warn('Reverse geocoding warning:', err);
          reject(new Error("Location access wasn't available. You can enter your address manually."));
        }
      },
      (error) => {
        console.warn('Geolocation position error:', error);
        reject(new Error("Location access wasn't available. You can enter your address manually."));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
