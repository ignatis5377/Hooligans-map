import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { photoService } from '../services/photoService';

export default function MapScreen() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);
  const photosRef = useRef([]);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const data = await photoService.getPhotos();
      photosRef.current = data || [];
      setPhotos(data || []);
      if (webViewRef.current && data) {
        // Send updated pins data to WebView
        const script = `window.updateMapPins && window.updateMapPins(${JSON.stringify(data)}); true;`;
        webViewRef.current.injectJavaScript(script);
      }
    } catch (err) {
      console.warn('Error loading photos for map:', err);
      Alert.alert('Σφάλμα', 'Αδυναμία φόρτωσης σημείων στον χάρτη.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Leaflet HTML content
  const generateMapHtml = (pins) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        
        .custom-photo-pin {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .custom-photo-pin-inner {
          width: 36px;
          height: 36px;
          background: #e11d48;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .custom-photo-pin-inner svg {
          width: 20px;
          height: 20px;
          fill: white;
        }

        .marker-cluster-custom {
          background: rgba(225, 29, 72, 0.4);
          border-radius: 50%;
        }
        .marker-cluster-custom div {
          width: 32px;
          height: 32px;
          margin: 4px;
          background: #e11d48;
          color: white;
          font-weight: bold;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }

        .leaflet-popup-content-wrapper {
          background: #1e293b;
          color: #f8fafc;
          border-radius: 14px;
          padding: 4px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.6);
        }
        .leaflet-popup-tip {
          background: #1e293b;
        }
        .popup-img {
          width: 100%;
          height: 140px;
          object-fit: cover;
          border-radius: 10px;
          margin-bottom: 8px;
        }
        .popup-title {
          font-size: 15px;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 4px;
        }
        .popup-desc {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 6px;
        }
        .popup-meta {
          font-size: 11px;
          color: #38bdf8;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([39.1100, 26.5550], 11);

        var streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
          maxZoom: 20,
          attribution: '&copy; OpenStreetMap France | &copy; OpenStreetMap'
        });
        var cyclOsmLayer = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', { maxZoom: 18 });
        var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });

        streetLayer.addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        L.control.layers({
          "🗺️ Βασικός Χάρτης": streetLayer,
          "🚵‍♂️ Ποδηλατικός": cyclOsmLayer,
          "🛰️ Δορυφορικός": satelliteLayer
        }, null, { position: 'bottomleft' }).addTo(map);

        var markersCluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 40,
          iconCreateFunction: function (cluster) {
            return L.divIcon({
              html: '<div><span>' + cluster.getChildCount() + '</span></div>',
              className: 'marker-cluster-custom',
              iconSize: L.point(40, 40)
            });
          }
        });
        map.addLayer(markersCluster);

        var pinIcon = L.divIcon({
          className: 'custom-photo-pin',
          html: '<div class="custom-photo-pin-inner"><svg viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -34]
        });

        window.updateMapPins = function(photosList) {
          markersCluster.clearLayers();
          if (!photosList || photosList.length === 0) return;

          var bounds = [];
          photosList.forEach(function(photo) {
            if (!photo.latitude || !photo.longitude) return;
            var lat = parseFloat(photo.latitude);
            var lng = parseFloat(photo.longitude);
            bounds.push([lat, lng]);

            var popupHtml = '<div style="max-width:240px;">';
            if (photo.image_url) {
              popupHtml += '<img class="popup-img" src="' + photo.image_url + '" />';
            }
            popupHtml += '<div class="popup-title">' + (photo.title || 'Χωρίς Τίτλο') + '</div>';
            if (photo.description) {
              popupHtml += '<div class="popup-desc">' + photo.description + '</div>';
            }
            popupHtml += '<div class="popup-meta">📍 ' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '</div>';
            popupHtml += '</div>';

            var marker = L.marker([lat, lng], { icon: pinIcon }).bindPopup(popupHtml);
            markersCluster.addLayer(marker);
          });

          if (bounds.length === 1) {
            map.setView(bounds[0], 14);
          } else if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
          }
        };

        // Initial render
        window.updateMapPins(${JSON.stringify(pins)});

        // Ειδοποίηση ότι ο χάρτης είναι έτοιμος
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Map Bar Header */}
      <View style={styles.mapHeader}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>
            {photos.length === 1 ? '1 Σημείο' : `${photos.length} Σημεία`}
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPhotos} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.refreshText}>🔄 Ανανέωση</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Embedded Leaflet Map */}
      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: generateMapHtml(photos) }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onLoadEnd={() => {
            if (photosRef.current && photosRef.current.length > 0) {
              const script = `window.updateMapPins && window.updateMapPins(${JSON.stringify(photosRef.current)}); true;`;
              webViewRef.current?.injectJavaScript(script);
            }
          }}
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === 'MAP_READY') {
                if (photosRef.current && photosRef.current.length > 0) {
                  const script = `window.updateMapPins && window.updateMapPins(${JSON.stringify(photosRef.current)}); true;`;
                  webViewRef.current?.injectJavaScript(script);
                }
              }
            } catch (e) {}
          }}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e11d48" />
              <Text style={styles.loadingText}>Φόρτωση χάρτη...</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  refreshBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 13,
  },
});
