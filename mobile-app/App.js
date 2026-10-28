import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './src/config/supabase';
import LoginScreen from './src/screens/LoginScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import MapScreen from './src/screens/MapScreen';
import PinsListScreen from './src/screens/PinsListScreen';

function MainApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('capture'); // 'capture' | 'map' | 'list'

  useEffect(() => {
    // 1. Έλεγχος υπάρχοντος session με ασφαλές fallback
    const checkSession = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        );
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise,
        ]);
        setSession(session);
      } catch (err) {
        console.warn('Session check warning:', err.message);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Listener για αλλαγές κατάστασης login/logout
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      return () => subscription.unsubscribe();
    } catch (e) {
      console.warn('Auth state listener warning:', e);
    }
  }, []);

  const handleLogout = async () => {
    Alert.alert('Αποσύνδεση', 'Θέλετε να αποσυνδεθείτε από τον λογαριασμό σας;', [
      { text: 'Ακύρωση', style: 'cancel' },
      {
        text: 'Αποσύνδεση',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.warn(e);
          }
          setSession(null);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  // Αν δεν είναι συνδεδεμένος ο χρήστης, εμφανίζεται η οθόνη Login
  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <LoginScreen onLoginSuccess={(sess) => setSession(sess)} />
      </SafeAreaView>
    );
  }

  // Κύρια Εφαρμογή (Μετά τη Σύνδεση)
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top App Header */}
      <View style={styles.appHeader}>
        <View style={styles.brandGroup}>
          <Text style={styles.headerLogo}>🚵‍♂️</Text>
          <View>
            <Text style={styles.headerTitle}>Hooligans Map</Text>
            <Text style={styles.headerSubtitle}>Admin Mode</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Έξοδος</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {activeTab === 'capture' && (
          <CaptureScreen onPhotoUploaded={() => setActiveTab('map')} />
        )}
        {activeTab === 'map' && <MapScreen />}
        {activeTab === 'list' && <PinsListScreen />}
      </View>

      {/* Bottom Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'capture' && styles.tabItemActive]}
          onPress={() => setActiveTab('capture')}
        >
          <Text style={styles.tabIcon}>📸</Text>
          <Text style={[styles.tabLabel, activeTab === 'capture' && styles.tabLabelActive]}>
            Νέο Σημείο
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'map' && styles.tabItemActive]}
          onPress={() => setActiveTab('map')}
        >
          <Text style={styles.tabIcon}>🗺️</Text>
          <Text style={[styles.tabLabel, activeTab === 'map' && styles.tabLabelActive]}>
            Χάρτης
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'list' && styles.tabItemActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={[styles.tabLabel, activeTab === 'list' && styles.tabLabelActive]}>
            Σημεία
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  logoutText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#e11d48',
    fontWeight: '700',
  },
});
