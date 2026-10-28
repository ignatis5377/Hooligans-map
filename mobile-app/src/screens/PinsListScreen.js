import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { photoService } from '../services/photoService';
import { locationService } from '../services/locationService';

export default function PinsListScreen() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State για το Modal Επεξεργασίας
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const data = await photoService.getPhotos();
      setPhotos(data || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
      Alert.alert('Σφάλμα', 'Αδυναμία φόρτωσης σημείων.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPhotos();
  };

  // Άνοιγμα του Modal Επεξεργασίας
  const handleStartEdit = (photo) => {
    setEditingPhoto(photo);
    setEditTitle(photo.title || '');
    setEditDesc(photo.description || '');
    setEditLat(photo.latitude ? photo.latitude.toString() : '');
    setEditLng(photo.longitude ? photo.longitude.toString() : '');
    setShowMapPicker(false);
  };

  // Ανάκτηση τρέχοντος στίγματος GPS για τη διόρθωση
  const handleFetchCurrentGps = async () => {
    setLoadingGps(true);
    try {
      const loc = await locationService.getCurrentLocation();
      setEditLat(loc.latitude.toString());
      setEditLng(loc.longitude.toString());
      Alert.alert('🛰️ GPS Ενημέρωση', `Νέο στίγμα:\n${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`);
    } catch (err) {
      Alert.alert('Σφάλμα GPS', err.message);
    } finally {
      setLoadingGps(false);
    }
  };

  // Αποθήκευση αλλαγών στη βάση δεδομένων
  const handleSaveEdit = async () => {
    if (!editingPhoto) return;

    const latNum = parseFloat(editLat);
    const lngNum = parseFloat(editLng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      Alert.alert('Μη έγκυρες συντεταγμένες', 'Παρακαλώ εισάγετε έγκυρους αριθμούς για το Γεωγραφικό Πλάτος και Μήκος.');
      return;
    }

    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      Alert.alert('Όρια συντεταγμένων', 'Το Πλάτος πρέπει να είναι μεταξύ -90 και 90, και το Μήκος μεταξύ -180 και 180.');
      return;
    }

    setSaving(true);
    try {
      const updated = await photoService.updatePhoto(editingPhoto.id, {
        title: editTitle,
        description: editDesc,
        latitude: latNum,
        longitude: lngNum,
      });

      // Ενημέρωση τοπικού state
      setPhotos((prev) =>
        prev.map((p) => (p.id === editingPhoto.id ? { ...p, ...updated } : p))
      );

      Alert.alert('🎉 Επιτυχία', 'Το σημείο και το στίγμα στον χάρτη ενημερώθηκαν επιτυχώς!');
      setEditingPhoto(null);
    } catch (err) {
      Alert.alert('Σφάλμα Ενημέρωσης', err.message || 'Αδυναμία αποθήκευσης αλλαγών.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (photo) => {
    Alert.alert(
      'Διαγραφή Σημείου',
      `Είστε σίγουροι ότι θέλετε να διαγράψετε το σημείο "${photo.title || 'Χωρίς Τίτλο'}";`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await photoService.deletePhoto(photo.id, photo.storage_path);
              setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
              Alert.alert('Επιτυχία', 'Το σημείο διαγράφηκε.');
            } catch (err) {
              Alert.alert('Σφάλμα', `Αδυναμία διαγραφής: ${err.message}`);
            }
          },
        },
      ]
    );
  };

  // HTML για τον διαδραστικό επιλογέα σημείου στον χάρτη (Map Picker)
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
          background: rgba(15, 23, 42, 0.85);
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
      <div class="hint-box">👆 Πατήστε οπουδήποτε στον χάρτη για να μετακινήσετε την πινέζα!</div>
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

  const renderPhotoItem = ({ item }) => {
    const formattedDate = item.created_at
      ? new Date(item.created_at).toLocaleDateString('el-GR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title || 'Χωρίς Τίτλο'}
          </Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.cardMeta}>
            <Text style={styles.cardCoords}>
              📍 {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
            </Text>
            <Text style={styles.cardDate}>📅 {formattedDate}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleStartEdit(item)}
            title="Επεξεργασία"
          >
            <Text style={styles.actionBtnText}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            title="Διαγραφή"
          >
            <Text style={styles.actionBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Φόρτωση σημείων...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Αναρτημένα Σημεία</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{photos.length}</Text>
        </View>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPhotoItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#e11d48"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>Δεν υπάρχουν ακόμα σημεία</Text>
            <Text style={styles.emptySubtitle}>
              Χρησιμοποιήστε την καρτέλα "Νέο Σημείο" για να τραβήξετε την πρώτη φωτογραφία!
            </Text>
          </View>
        }
      />

      {/* MODAL ΕΠΕΞΕΡΓΑΣΙΑΣ ΣΗΜΕΙΟΥ & ΣΤΙΓΜΑΤΟΣ */}
      <Modal
        visible={!!editingPhoto}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingPhoto(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Διόρθωση Σημείου</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditingPhoto(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Photo Preview */}
              {editingPhoto?.image_url ? (
                <View style={styles.modalImageWrapper}>
                  <Image source={{ uri: editingPhoto.image_url }} style={styles.modalImage} />
                </View>
              ) : null}

              {/* Title & Description Inputs */}
              <Text style={styles.modalLabel}>Τίτλος</Text>
              <TextInput
                style={styles.modalInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Τίτλος σημείου"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.modalLabel}>Περιγραφή</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Περιγραφή σημείου..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={2}
              />

              {/* Coordinates Section */}
              <View style={styles.coordsHeaderRow}>
                <Text style={styles.modalLabel}>📍 Συντεταγμένες GPS</Text>
                <TouchableOpacity
                  style={styles.gpsFetchBtn}
                  onPress={handleFetchCurrentGps}
                  disabled={loadingGps}
                >
                  {loadingGps ? (
                    <ActivityIndicator size="small" color="#38bdf8" />
                  ) : (
                    <Text style={styles.gpsFetchText}>🛰️ Τρέχον GPS</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.coordsInputsRow}>
                <View style={styles.coordCol}>
                  <Text style={styles.coordSubLabel}>Γεωγρ. Πλάτος (Lat)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editLat}
                    onChangeText={setEditLat}
                    keyboardType="numeric"
                    placeholder="39.1100"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={styles.coordCol}>
                  <Text style={styles.coordSubLabel}>Γεωγρ. Μήκος (Lng)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editLng}
                    onChangeText={setEditLng}
                    keyboardType="numeric"
                    placeholder="26.5550"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              {/* Interactive Visual Map Picker Toggle */}
              <TouchableOpacity
                style={styles.mapPickerToggleBtn}
                onPress={() => setShowMapPicker(!showMapPicker)}
              >
                <Text style={styles.mapPickerToggleText}>
                  {showMapPicker ? '🔼 Απόκρυψη Χάρτη Επιλογής' : '🗺️ Επιλογή με Πάτημα στον Χάρτη'}
                </Text>
              </TouchableOpacity>

              {showMapPicker && (
                <View style={styles.miniMapContainer}>
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: generatePickerHtml(editLat, editLng) }}
                    style={styles.miniMap}
                    onMessage={(event) => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.latitude && data.longitude) {
                          setEditLat(data.latitude.toFixed(6));
                          setEditLng(data.longitude.toFixed(6));
                        }
                      } catch (e) {
                        console.warn(e);
                      }
                    }}
                  />
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>💾 Αποθήκευση Αλλαγών</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  countBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'column',
    gap: 2,
  },
  cardCoords: {
    fontSize: 11,
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  cardDate: {
    fontSize: 10,
    color: '#64748b',
  },
  cardActions: {
    flexDirection: 'column',
    gap: 6,
  },
  editBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
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
  modalCloseText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
  modalScroll: {
    paddingBottom: 24,
  },
  modalImageWrapper: {
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#0f172a',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  modalTextArea: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  coordsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gpsFetchBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gpsFetchText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  coordsInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordCol: {
    flex: 1,
  },
  coordSubLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  mapPickerToggleBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  mapPickerToggleText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  miniMapContainer: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  miniMap: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
