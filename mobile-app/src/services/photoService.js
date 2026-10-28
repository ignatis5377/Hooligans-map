import { supabase } from '../config/supabase';

// Base64 to ArrayBuffer decoder optimized for React Native Android/iOS
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

function decodeBase64ToArrayBuffer(base64) {
  let bufferLength = base64.length * 0.75,
    len = base64.length,
    i,
    p = 0,
    encoded1,
    encoded2,
    encoded3,
    encoded4;

  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arraybuffer;
}

/**
 * Υπηρεσία διαχείρισης φωτογραφιών και επικοινωνίας με το Supabase
 */
export const photoService = {
  /**
   * Ανέβασμα φωτογραφίας στο Storage και καταχώρηση στη βάση δεδομένων
   */
  async uploadPhoto({ imageUri, imageBase64, title, description, latitude, longitude, altitude, accuracy }) {
    if (!imageUri && !imageBase64) throw new Error('Δεν υπάρχει επιλεγμένη φωτογραφία.');
    if (!latitude || !longitude) throw new Error('Δεν βρέθηκαν συντεταγμένες GPS.');

    // 1. Δημιουργία μοναδικού ονόματος αρχείου (timestamp + random id)
    const fileExt = 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // 2. Μετατροπή της εικόνας σε binary ArrayBuffer
    let uploadData;
    if (imageBase64) {
      uploadData = decodeBase64ToArrayBuffer(imageBase64);
    } else {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      uploadData = blob;
    }

    // 3. Upload στο Supabase Storage Bucket ("photos")
    const { data: storageData, error: storageError } = await supabase.storage
      .from('photos')
      .upload(filePath, uploadData, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (storageError) {
      console.error('Storage Upload Error:', storageError);
      throw new Error(`Σφάλμα αποθήκευσης εικόνας: ${storageError.message}`);
    }

    // 4. Λήψη του Public URL της εικόνας
    const { data: publicUrlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    // 5. Εισαγωγή εγγραφής στον πίνακα `photos`
    const { data: dbData, error: dbError } = await supabase
      .from('photos')
      .insert([
        {
          title: title || 'Φωτογραφία Σημείου',
          description: description || '',
          image_url: imageUrl,
          storage_path: filePath,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          altitude: altitude ? parseFloat(altitude) : null,
          accuracy: accuracy ? parseFloat(accuracy) : null,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database Insert Error:', dbError);
      // Αν αποτύχει η βάση, διαγράφουμε το αρχείο από το storage για καθαριότητα
      await supabase.storage.from('photos').remove([filePath]);
      throw new Error(`Σφάλμα καταχώρησης στη βάση: ${dbError.message}`);
    }

    return dbData;
  },

  /**
   * Ανάκτηση όλων των φωτογραφιών/σημείων
   */
  async getPhotos() {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Ενημέρωση/διόρθωση στοιχείων σημείου (τίτλος, περιγραφή, συντεταγμένες GPS)
   */
  async updatePhoto(photoId, { title, description, latitude, longitude }) {
    const { data, error } = await supabase
      .from('photos')
      .update({
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      })
      .eq('id', photoId)
      .select();

    if (error) {
      console.error('Update Photo Error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Η βάση δεδομένων απέρριψε την ενημέρωση. Παρακαλώ εκτελέστε το SQL policy στο Supabase (Allow update photos).');
    }

    return data[0];
  },

  /**
   * Διαγραφή ενός σημείου και της αντίστοιχης εικόνας
   */
  async deletePhoto(photoId, storagePath) {
    // 1. Διαγραφή από τη βάση δεδομένων
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (dbError) throw dbError;

    // 2. Διαγραφή από το Storage
    if (storagePath) {
      await supabase.storage.from('photos').remove([storagePath]);
    }

    return true;
  },
};
