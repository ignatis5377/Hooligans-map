import * as Location from 'expo-location';

/**
 * Υπηρεσία ανάκτησης GPS τοποθεσίας με υψηλή ακρίβεια
 */
export const locationService = {
  /**
   * Έλεγχος και αίτηση δικαιωμάτων τοποθεσίας
   */
  async requestPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  },

  /**
   * Λήψη του τρέχοντος ακριβούς στίγματος GPS
   */
  async getCurrentLocation() {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Δεν δόθηκε άδεια πρόσβασης στην τοποθεσία.');
    }

    try {
      // Προσπάθεια λήψης θέσης με High Accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy, // σε μέτρα (π.χ. 4.5m)
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.warn('High accuracy location failed, trying last known position:', error);
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          altitude: lastKnown.coords.altitude,
          accuracy: lastKnown.coords.accuracy,
          timestamp: lastKnown.timestamp,
        };
      }
      throw new Error('Αδυναμία εύρεσης GPS στίγματος. Βεβαιωθείτε ότι το GPS είναι ενεργό.');
    }
  },
};
