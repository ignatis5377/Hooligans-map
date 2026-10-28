import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Υπηρεσία λήψης, επιλογής και συμπίεσης φωτογραφιών
 */
export const imageService = {
  /**
   * Λήψη φωτογραφίας με την κάμερα του κινητού
   */
  async takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Δεν δόθηκε άδεια πρόσβασης στην κάμερα.');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1, // Λήψη σε πλήρη ποιότητα και συμπίεση μετά
      exif: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const originalAsset = result.assets[0];
    const compressedAsset = await this.compressImage(originalAsset.uri);

    return {
      uri: compressedAsset.uri,
      base64: compressedAsset.base64,
      width: compressedAsset.width,
      height: compressedAsset.height,
      exif: originalAsset.exif,
    };
  },

  /**
   * Επιλογή υπάρχουσας φωτογραφίας από το άλμπουμ
   */
  async pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Δεν δόθηκε άδεια πρόσβασης στη συλλογή φωτογραφιών.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      exif: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const originalAsset = result.assets[0];
    const compressedAsset = await this.compressImage(originalAsset.uri);

    return {
      uri: compressedAsset.uri,
      base64: compressedAsset.base64,
      width: compressedAsset.width,
      height: compressedAsset.height,
      exif: originalAsset.exif,
      location: originalAsset.location,
    };
  },

  /**
   * Συμπίεση και βελτιστοποίηση εικόνας
   * Μειώνει το μέγεθος (π.χ. από 10MB σε ~300KB) για ταχύτατο upload
   */
  async compressImage(uri) {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }], // Max πλάτος 1920px (Full HD)
        {
          compress: 0.8, // 80% ποιότητα
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true, // Επιστρέφει base64 για 100% ασφαλές native upload
        }
      );
      return manipResult;
    } catch (error) {
      console.warn('Image compression fallback to original:', error);
      return { uri };
    }
  },
};
