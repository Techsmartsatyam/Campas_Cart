/**
 * Utility for distance-based delivery fee calculations in NearCart
 */

/**
 * Calculates distance between two geographical points using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers rounded to 2 decimal places
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100;
}

/**
 * Validates delivery charge slabs configuration
 * @param {Array} slabs - Array of slab objects { minDistanceKm, maxDistanceKm, charge }
 * @returns {string|null} Null if valid, error message string if invalid
 */
export function validateDeliveryChargeSlabs(slabs) {
  if (!slabs) return null;
  if (!Array.isArray(slabs)) return 'Delivery charge slabs must be an array';
  if (slabs.length === 0) return null;

  const sorted = [...slabs].sort((a, b) => Number(a.minDistanceKm) - Number(b.minDistanceKm));

  for (let i = 0; i < sorted.length; i++) {
    const min = Number(sorted[i].minDistanceKm);
    const max = Number(sorted[i].maxDistanceKm);
    const charge = Number(sorted[i].charge);

    if (isNaN(min) || min < 0) {
      return `Invalid minimum distance: ${sorted[i].minDistanceKm}`;
    }
    if (isNaN(max) || max <= min) {
      return `Maximum distance (${max} km) must be greater than minimum distance (${min} km)`;
    }
    if (isNaN(charge) || charge < 0) {
      return `Delivery charge (${charge}) cannot be negative`;
    }

    if (i > 0) {
      const prevMax = Number(sorted[i - 1].maxDistanceKm);
      const prevMin = Number(sorted[i - 1].minDistanceKm);
      if (min < prevMax) {
        return `Overlapping distance slabs: range ${prevMin}–${prevMax} km overlaps with range ${min}–${max} km`;
      }
    }
  }

  return null;
}

/**
 * Determines the applicable delivery fee for a given distance using distance slabs or default fallback
 * @param {Array} slabs - Array of distance slabs
 * @param {number} distanceKm - Calculated distance in kilometers
 * @param {number} defaultFee - Legacy default delivery fee fallback
 * @returns {number} Delivery fee in INR
 */
export function getFeeForDistance(slabs, distanceKm, defaultFee = 0) {
  if (!slabs || !Array.isArray(slabs) || slabs.length === 0) {
    return Number(defaultFee) || 0;
  }

  const sorted = [...slabs].sort((a, b) => Number(a.minDistanceKm) - Number(b.minDistanceKm));

  // 1. Try exact range match (min <= distance <= max)
  const exactMatch = sorted.find(
    (s) => distanceKm >= Number(s.minDistanceKm) && distanceKm <= Number(s.maxDistanceKm)
  );
  if (exactMatch) {
    return Number(exactMatch.charge);
  }

  // 2. If distance is below the smallest min, use first slab charge
  if (distanceKm <= Number(sorted[0].minDistanceKm)) {
    return Number(sorted[0].charge);
  }

  // 3. For intermediate fractional/boundary values (e.g., 3.5 km between 3 and 4, or 5.01 km between 5 and 6)
  const upperMatch = sorted.find((s) => distanceKm <= Number(s.maxDistanceKm));
  if (upperMatch) {
    return Number(upperMatch.charge);
  }

  // 4. If distance exceeds the maximum slab, use highest slab charge
  return Number(sorted[sorted.length - 1].charge);
}

/**
 * Calculates delivery distance and fee between shop and customer delivery address
 * @param {Object} shop - Shop document/object containing location and deliveryChargeSlabs
 * @param {Object} address - Address document/object containing location coordinates
 * @returns {Object} Result { success, distanceKm, deliveryFee, error }
 */
export function calculateDeliveryFeeForShopAndAddress(shop, address) {
  if (!shop) {
    return { success: false, error: 'Shop is required to calculate delivery charge' };
  }

  // Extract shop coordinates [longitude, latitude]
  const shopCoords = shop.location?.coordinates;
  if (
    !shopCoords ||
    !Array.isArray(shopCoords) ||
    shopCoords.length < 2 ||
    (shopCoords[0] === 0 && shopCoords[1] === 0)
  ) {
    return {
      success: false,
      error: "Delivery charge cannot be calculated because this shop's location is not configured.",
    };
  }

  const shopLon = Number(shopCoords[0]);
  const shopLat = Number(shopCoords[1]);

  if (isNaN(shopLon) || isNaN(shopLat)) {
    return {
      success: false,
      error: "Delivery charge cannot be calculated because this shop's location is not configured.",
    };
  }

  // Extract address coordinates [longitude, latitude]
  const addressCoords = address?.location?.coordinates;
  if (
    !addressCoords ||
    !Array.isArray(addressCoords) ||
    addressCoords.length < 2 ||
    (addressCoords[0] === 0 && addressCoords[1] === 0)
  ) {
    return {
      success: false,
      error: 'Please select a delivery address with a valid location.',
    };
  }

  const addrLon = Number(addressCoords[0]);
  const addrLat = Number(addressCoords[1]);

  if (isNaN(addrLon) || isNaN(addrLat)) {
    return {
      success: false,
      error: 'Please select a delivery address with a valid location.',
    };
  }

  // Calculate distance in km
  const distanceKm = calculateHaversineDistanceKm(shopLat, shopLon, addrLat, addrLon);

  // Determine delivery fee
  const fallbackFee = shop.deliveryFee !== undefined ? Number(shop.deliveryFee) : 0;
  const deliveryFee = getFeeForDistance(shop.deliveryChargeSlabs, distanceKm, fallbackFee);

  return {
    success: true,
    distanceKm,
    deliveryFee,
  };
}
