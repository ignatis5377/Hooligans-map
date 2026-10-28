/**
 * Υπηρεσία εξαγωγής γεωγραφικών συντεταγμένων GPS από τα EXIF metadata φωτογραφιών
 */

function parseCoord(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val;

  // Array format [degrees, minutes, seconds]
  if (Array.isArray(val)) {
    if (val.length === 3) {
      const d = parseFloat(val[0]) || 0;
      const m = parseFloat(val[1]) || 0;
      const s = parseFloat(val[2]) || 0;
      return d + m / 60 + s / 3600;
    }
    if (val.length === 1) {
      return parseFloat(val[0]);
    }
  }

  // String format (e.g. "39/1, 6/1, 162/10" or "39.1234")
  if (typeof val === 'string') {
    if (val.includes(',')) {
      const parts = val.split(',').map((p) => {
        const t = p.trim();
        if (t.includes('/')) {
          const [n, d] = t.split('/');
          return parseFloat(n) / (parseFloat(d) || 1);
        }
        return parseFloat(t) || 0;
      });
      return parseCoord(parts);
    }
    if (val.includes('/')) {
      const [n, d] = val.split('/');
      return parseFloat(n) / (parseFloat(d) || 1);
    }
    const num = parseFloat(val);
    if (!isNaN(num)) return num;
  }

  return null;
}

export const exifService = {
  extractGps(exif, directLocation) {
    // 1. Άμεση ανάγνωση από asset.location αν παρέχεται από το Expo ImagePicker
    if (directLocation && typeof directLocation === 'object') {
      const dLat = parseFloat(directLocation.latitude);
      const dLng = parseFloat(directLocation.longitude);
      if (!isNaN(dLat) && !isNaN(dLng) && (dLat !== 0 || dLng !== 0)) {
        return {
          latitude: dLat,
          longitude: dLng,
          altitude: directLocation.altitude ? parseFloat(directLocation.altitude) : null,
        };
      }
    }

    if (!exif || typeof exif !== 'object') return null;

    let lat = null;
    let lng = null;
    let alt = null;

    // 2. iOS nested dictionary format: exif['{GPS}'] ή exif.GPS
    const nestedGps = exif['{GPS}'] || exif['{gps}'] || exif.GPS || exif.gps;
    if (nestedGps && typeof nestedGps === 'object') {
      lat = nestedGps.Latitude ?? nestedGps.GPSLatitude ?? nestedGps.latitude;
      lng = nestedGps.Longitude ?? nestedGps.GPSLongitude ?? nestedGps.longitude;
      alt = nestedGps.Altitude ?? nestedGps.GPSAltitude ?? nestedGps.altitude;

      lat = parseCoord(lat);
      lng = parseCoord(lng);
      alt = parseCoord(alt);

      const latRef = nestedGps.LatitudeRef || nestedGps.GPSLatitudeRef || nestedGps.latitudeRef;
      const lngRef = nestedGps.LongitudeRef || nestedGps.GPSLongitudeRef || nestedGps.longitudeRef;

      if (latRef === 'S' && lat != null && lat > 0) lat = -lat;
      if (lngRef === 'W' && lng != null && lng > 0) lng = -lng;
    }

    // 3. Android / Flat EXIF keys
    if (lat == null) {
      lat = exif.GPSLatitude ?? exif.Latitude ?? exif.latitude ?? exif.gpsLatitude;
      lng = exif.GPSLongitude ?? exif.Longitude ?? exif.longitude ?? exif.gpsLongitude;
      alt = exif.GPSAltitude ?? exif.Altitude ?? exif.altitude ?? exif.gpsAltitude;

      lat = parseCoord(lat);
      lng = parseCoord(lng);
      alt = parseCoord(alt);

      const latRef = exif.GPSLatitudeRef || exif.LatitudeRef || exif.latitudeRef;
      const lngRef = exif.GPSLongitudeRef || exif.LongitudeRef || exif.longitudeRef;

      if (latRef === 'S' && lat != null && lat > 0) lat = -lat;
      if (lngRef === 'W' && lng != null && lng > 0) lng = -lng;
    }

    if (
      lat != null &&
      lng != null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      (lat !== 0 || lng !== 0)
    ) {
      return {
        latitude: lat,
        longitude: lng,
        altitude: alt != null && !isNaN(alt) ? alt : null,
      };
    }

    return null;
  },
};
