import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase, isSupabaseConfigured } from '../config/supabase';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  const handleLogin = async () => {
    if (!configured) {
      Alert.alert(
        'Ρύθμιση Supabase',
        'Δεν έχουν εισαχθεί ακόμα τα κλειδιά του Supabase στο αρχείο mobile-app/src/config/supabase.js.\n\nΜπορείτε να πατήσετε "Δοκιμή σε Demo Mode" παρακάτω για να δοκιμάσετε την κάμερα και το GPS αμέσως!'
      );
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert('Προσοχή', 'Παρακαλώ συμπληρώστε Email και Κωδικό.');
      return;
    }

    setLoading(true);
    try {
      // 10 second timeout for network calls
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Το δίκτυο καθυστερεί ή το URL είναι λάθος.')), 10000)
      );

      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]);

      if (error) {
        Alert.alert('Σφάλμα Σύνδεσης', error.message || 'Ελέγξτε τα στοιχεία σας.');
      } else if (data && data.session) {
        if (onLoginSuccess) onLoginSuccess(data.session);
      }
    } catch (err) {
      Alert.alert('Σφάλμα Σύνδεσης', err.message || 'Αδυναμία επικοινωνίας με τον server.');
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    // Fake mock session for instant testing
    const demoSession = {
      user: { email: 'admin@demo.local', id: 'demo-admin-id' },
      access_token: 'demo-token',
    };
    if (onLoginSuccess) onLoginSuccess(demoSession);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🚵‍♂️</Text>
          <Text style={styles.title}>Hooligans Geo Map</Text>
          <Text style={styles.subtitle}>Σύνδεση Διαχειριστή</Text>
        </View>

        {!configured && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚙️ Εκκρεμεί ρύθμιση Supabase</Text>
            <Text style={styles.warningText}>
              Δεν έχετε βάλει ακόμα το δικό σας Supabase URL στο αρχείο{' '}
              <Text style={{ fontWeight: '700' }}>supabase.js</Text>.
            </Text>
            <TouchableOpacity style={styles.demoBtn} onPress={handleDemoMode}>
              <Text style={styles.demoBtnText}>⚡ Δοκιμή σε Demo Mode (Άμεση είσοδος)</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.label}>Email Διαχειριστή</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@hooligans.gr"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Κωδικός Πρόσβασης</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Σύνδεση</Text>
            )}
          </TouchableOpacity>
        </View>

        {configured && (
          <TouchableOpacity style={styles.secondaryDemoBtn} onPress={handleDemoMode}>
            <Text style={styles.secondaryDemoText}>Ή μπείτε ως Δοκιμαστικός Χρήστης (Demo)</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footerText}>
          🔒 Μόνο ο διαχειριστής έχει δικαίωμα ανάρτησης νέων σημείων στον χάρτη.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  warningBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eab308',
    padding: 16,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fde047',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#fef08a',
    lineHeight: 18,
    marginBottom: 12,
  },
  demoBtn: {
    backgroundColor: '#eab308',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryDemoBtn: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryDemoText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    marginTop: 20,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});
