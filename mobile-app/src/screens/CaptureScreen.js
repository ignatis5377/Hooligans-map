import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { locationService } from '../services/locationService';
import { imageService } from '../services/imageService';
import { photoService } from '../services/photoService';
import { exifService } from '../services/exifService';

export default function CaptureScreen({ onPhotoUploaded }) {
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pickerCoords, setPickerCoords] = useState(null);
  const [isGalleryImage, setIsGalleryImage] = useState(false);

  // Αυτόματη λήψη GPS κατά το άνοιγμα της οθόνης
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const loc = await locationService.getCurrentLocation();
      setLocation({
        ...loc,
        source: 'device',
      });
    } catch (err) {
      console.warn('Location error:', err.message);
      Alert.alert('GPS Ειδοποίηση', err.message);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Ταυτόχρονα ανανεώνουμε το GPS για μέγιστη ακρίβεια τη στιγμή της λήψης
      fetchCurrentLocation();
      const photo = await imageService.takePhoto();
      if (photo) {
        setImage(photo);
        setIsGalleryImage(false);
      }
    } catch (err) {
      Alert.alert('Σφάλμα Κάμερας', err.message);
    }
  };

  const handlePickGallery = async () => {
    try {
      const photo = await imageService.pickFromGallery();
      if (photo) {
        setImage(photo);
        setIsGalleryImage(true);

        // 1. Έλεγχος αν η φωτογραφία περιέχει EXIF GPS στοιχεία (ή άμεσο location)
        const exifGps = exifService.extractGps(photo.exif, photo.location);
        if (exifGps) {
          setLocation({
            latitude: exifGps.latitude,
            longitude: exifGps.longitude,
            altitude: exifGps.altitude,
            accuracy: null,
            source: 'exif',
          });
          Alert.alert(
            '📍 Βρέθηκε Στίγμα Φωτογραφίας!',
            `Εντοπίστηκε αυτόματα η τοποθεσία όπου τραβήχτηκε η φωτογραφία:\n${exifGps.latitude.toFixed(5)}, ${exifGps.longitude.toFixed(5)}`
          );
        } else {
          Alert.alert(
            '⚠️ Χωρίς Στίγμα στη Φωτογραφία',
            'Η φωτογραφία από τη συλλογή δεν περιέχει ενσωματωμένο στίγμα GPS.\n\nΜπορείτε να ορίσετε το ακριβές σημείο στον χάρτη ή να χρησιμοποιήσετε την τρέχουσα τοποθεσία σας.',
            [
              { text: 'Χρήση Τρέχουσας Θέσης' },
              {
                text: '🗺️ Επιλογή στον Χάρτη',
                onPress: () => handleOpenMapPicker(),
              },
            ]
          );
        }
      }
    } catch (err) {
      Alert.alert('Σφάλμα Συλλογής', err.message);
    }
  };

  const handleOpenMapPicker = () => {
    setPickerCoords(location || { latitude: 39.1100, longitude: 26.5550 });
    setShowMapPicker(true);
  };

  const handleSavePickedLocation = () => {
    if (pickerCoords) {
      setLocation({
        latitude: pickerCoords.latitude,
        longitude: pickerCoords.longitude,
        accuracy: null,
        source: 'map',
      });
    }
    setShowMapPicker(false);
  };

  const generatePickerHtml = (lat, lng) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        html, body, #map { width:100%; height:100%; background:#0f172a; }
        .hint-box {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          background: rgba(15, 23, 42, 0.9);
          color: #f8fafc;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          text-align: center;
          z-index: 1000;
          border: 1px solid rgba(255,255,255,0.1);
          font-family: -apple-system, sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="hint-box">👆 Πατήστε οπουδήποτε στον χάρτη για να ορίσετε το σημείο!</div>
      <div id="map"></div>
      <script>
        var initialLat = ${parseFloat(lat) || 39.1100};
        var initialLng = ${parseFloat(lng) || 26.5550};
        var map = L.map('map', { zoomControl: false }).setView([initialLat, initialLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
          maxZoom: 20,
          attribution: '&copy; OpenStreetMap France | &copy; OpenStreetMap'
        }).addTo(map);

        var marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

        function sendCoords(newLat, newLng) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: newLat, longitude: newLng }));
          }
        }

        marker.on('dragend', function (e) {
          var position = marker.getLatLng();
          sendCoords(position.lat, position.lng);
        });

        map.on('click', function (e) {
          marker.setLatLng(e.latlng);
          sendCoords(e.latlng.lat, e.latlng.lng);
        });
      </script>
    </body>
    </html>
  `;

  const handleUpload = async () => {
    if (!image) {
      Alert.alert('Προσοχή', 'Παρακαλώ τραβήξτε ή επιλέξτε μια φωτογραφία.');
      return;
    }

    if (!location) {
      Alert.alert(
        'Χωρίς GPS',
        'Δεν έχει καταγραφεί στίγμα GPS. Πατήστε "Ανανέωση GPS" ή επιλέξτε σημείο στον χάρτη.'
      );
      return;
    }

    // Αν επιλέχθηκε από τη συλλογή αλλά δεν είχε EXIF GPS και έχει μείνει το GPS του σπιτιού:
    if (isGalleryImage && location.source === 'device') {
      Alert.alert(
        '📍 Επιβεβαίωση Τοποθεσίας',
        'Η φωτογραφία από τη συλλογή δεν διαθέτει ενσωματωμένο στίγμα GPS και πρόκειται να τοποθετηθεί στην τρέχουσα θέση του κινητού σας (σπίτι).\n\nΘέλετε να ορίσετε το σημείο όπου τραβήχτηκε στον χάρτη;',
        [
          { text: '🗺️ Επιλογή στον Χάρτη', onPress: handleOpenMapPicker },
          { text: 'Ανάρτηση Εδώ', onPress: () => performUpload() },
        ]
      );
      return;
    }

    await performUpload();
  };

  const performUpload = async () => {
    setUploading(true);
    try {
      await photoService.uploadPhoto({
        imageUri: image.uri,
        imageBase64: image.base64,
        title: title.trim(),
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude,
        accuracy: location.accuracy,
      });

      Alert.alert('🎉 Επιτυχία!', 'Η φωτογραφία αναρτήθηκε επιτυχώς στον χάρτη!');
      // Καθαρισμός φόρμας
      setImage(null);
      setIsGalleryImage(false);
      setTitle('');
      setDescription('');
      if (onPhotoUploaded) onPhotoUploaded();
    } catch (err) {
      Alert.alert('Σφάλμα Ανεβάσματος', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* GPS Status Card */}
      <View style={styles.gpsCard}>
        <View style={styles.gpsHeader}>
          <View style={styles.gpsTitleRow}>
            <Text style={styles.gpsIcon}>🛰️</Text>
            <Text style={styles.gpsTitle}>Στίγμα Σημείου</Text>
          </View>
          <View style={styles.gpsActionButtons}>
            <TouchableOpacity
              style={styles.gpsMapBtn}
              onPress={handleOpenMapPicker}
            >
              <Text style={styles.gpsMapBtnText}>🗺️ Χάρτης</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gpsRefreshBtn}
              onPress={fetchCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <Text style={styles.gpsRefreshText}>🔄 GPS</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {location ? (
          <View style={styles.gpsDetails}>
            <View>
              <Text style={styles.gpsCoords}>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
              {location.source === 'exif' && (
                <Text style={styles.sourceTextExif}>📷 Από στοιχεία φωτογραφίας</Text>
              )}
              {location.source === 'map' && (
                <Text style={styles.sourceTextMap}>🗺️ Χειροκίνητη επιλογή στον χάρτη</Text>
              )}
              {location.source === 'device' && (
                <Text style={styles.sourceTextDevice}>🛰️ Τρέχουσα θέση συσκευής</Text>
              )}
            </View>
            {location.accuracy && (
              <View style={styles.accuracyBadge}>
                <Text style={styles.accuracyText}>
                  ±{Math.round(location.accuracy)}m
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.gpsWaitingText}>
            {loadingLocation ? 'Αναζήτηση δορυφόρων GPS...' : '⚠️ Πατήστε GPS ή επιλέξτε στον Χάρτη'}
          </Text>
        )}
      </View>

      {/* Photo Capture / Preview Box */}
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.removeImageBtn}
            onPress={() => {
              setImage(null);
              setIsGalleryImage(false);
            }}
          >
            <Text style={styles.removeImageText}>✕ Αλλαγή</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.cameraBtn} onPress={handleTakePhoto}>
            <Text style={styles.btnIconBig}>📸</Text>
            <Text style={styles.cameraBtnText}>Λήψη Φωτογραφίας</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickGallery}>
            <Text style={styles.btnIconBig}>🖼️</Text>
            <Text style={styles.galleryBtnText}>Από Συλλογή</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Fields */}
      <View style={styles.formSection}>
        <Text style={styles.inputLabel}>Τίτλος Σημείου (Προαιρετικό)</Text>
        <TextInput
          style={styles.input}
          placeholder="π.χ. Μονοπάτι Αγιάσος, Θέα Κάστρο"
          placeholderTextColor="#64748b"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.inputLabel}>Περιγραφή (Προαιρετικό)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Σχόλια για τη διαδρομή, συνθήκες μονοπατιού..."
          placeholderTextColor="#64748b"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.uploadBtn,
          (!image || !location || uploading) && styles.uploadBtnDisabled,
        ]}
        onPress={handleUpload}
        disabled={!image || !location || uploading}
      >
        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color="#ffffff" style={{ marginRight: 10 }} />
            <Text style={styles.uploadBtnText}>Ανέβασμα στον Χάρτη...</Text>
          </View>
        ) : (
          <Text style={styles.uploadBtnText}>📍 Ανάρτηση στον Χάρτη</Text>
        )}
      </TouchableOpacity>

      {/* Visual Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMapPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🗺️ Επιλογή Σημείου στον Χάρτη</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowMapPicker(false)}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mapPickerContainer}>
              <WebView
                originWhitelist={['*']}
                source={{
                  html: generatePickerHtml(
                    pickerCoords?.latitude || location?.latitude || 39.1100,
                    pickerCoords?.longitude || location?.longitude || 26.5550
                  ),
                }}
                style={styles.pickerWebView}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.latitude && data.longitude) {
                      setPickerCoords(data);
                    }
                  } catch (e) {
                    console.warn(e);
                  }
                }}
              />
            </View>

            <View style={styles.pickerFooter}>
              <Text style={styles.pickerCoordsText}>
                📍 {pickerCoords?.latitude ? pickerCoords.latitude.toFixed(5) : '...'}, {pickerCoords?.longitude ? pickerCoords.longitude.toFixed(5) : '...'}
              </Text>
              <TouchableOpacity
                style={styles.pickerConfirmBtn}
                onPress={handleSavePickedLocation}
              >
                <Text style={styles.pickerConfirmText}>✓ Επιβεβαίωση Σημείου</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  gpsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gpsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gpsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsIcon: {
    fontSize: 18,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  gpsActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  gpsMapBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#0284c7',
    borderRadius: 8,
  },
  gpsMapBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  gpsRefreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  gpsRefreshText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  sourceTextExif: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sourceTextMap: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sourceTextDevice: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    height: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#334155',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPickerContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  pickerWebView: {
    flex: 1,
  },
  pickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
  },
  pickerCoordsText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pickerConfirmBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pickerConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  gpsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsCoords: {
    color: '#e2e8f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
  },
  accuracyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  accuracyText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  gpsWaitingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cameraBtn: {
    flex: 1,
    backgroundColor: '#e11d48',
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconBig: {
    fontSize: 32,
    marginBottom: 6,
  },
  cameraBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  galleryBtnText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    height: 240,
    backgroundColor: '#1e293b',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  removeImageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  formSection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  uploadBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  uploadBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
    shadowOpacity: 0,
  },
  uploadBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
