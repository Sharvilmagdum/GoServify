const fetch = require('node-fetch');

/**
 * Geocode an address to lat/lng using OpenStreetMap Nominatim (free, no API key)
 */
async function geocodeAddress(address, city) {
  try {
    const query = encodeURIComponent(`${address}, ${city}, India`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Servify-LocalServices-App/1.0 (contact@servify.com)'
      }
    });

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
    
    // Fallback: geocode just the city
    const cityQuery = encodeURIComponent(`${city}, India`);
    const cityUrl = `https://nominatim.openstreetmap.org/search?q=${cityQuery}&format=json&limit=1&countrycodes=in`;
    
    const cityResponse = await fetch(cityUrl, {
      headers: { 'User-Agent': 'Servify-LocalServices-App/1.0' }
    });
    const cityData = await cityResponse.json();
    
    if (cityData && cityData.length > 0) {
      return {
        lat: parseFloat(cityData[0].lat),
        lng: parseFloat(cityData[0].lon),
        display_name: cityData[0].display_name
      };
    }

    return null;
  } catch (err) {
    console.error('Geocoding error:', err.message);
    return null;
  }
}

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Get nearby providers within radius (km)
 */
function filterByDistance(providers, userLat, userLng, radiusKm = 5) {
  return providers
    .map(p => ({
      ...p,
      distance: haversineDistance(userLat, userLng, p.lat, p.lng)
    }))
    .filter(p => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

module.exports = { geocodeAddress, haversineDistance, filterByDistance };
