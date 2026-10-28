# 🚵‍♂️ Hooligans Geo-Photos — Τελικός Οδηγός Συστήματος & Εγκατάστασης (Walkthrough)

Ένα ολοκληρωμένο, σύγχρονο και **100% δωρεάν (Open Source / Zero-Cost)** σύστημα καταγραφής ποδηλατικών διαδρομών και σημείων ενδιαφέροντος (MTB Trails & Spots), αποτελούμενο από:
1. **Cloud Backend (Supabase / PostgreSQL / Cloud Storage)**
2. **Mobile App (React Native / Expo SDK 57)**
3. **Web Map Widget (Leaflet.js / OpenStreetMap / CyclOSM / Satellite)**

---

## 🏗️ 1. Αρχιτεκτονική & Τεχνολογίες (3 Μέρη)

```mermaid
graph TD
    A[📱 Mobile App - Expo SDK 57 / Standalone APK] -->|1. Base64 Upload & GPS Coords| B[(☁️ Supabase Cloud)]
    B -->|2. PostgreSQL Database: photos table| C[🗄️ Database Record]
    B -->|3. Storage Bucket: photos CDN| D[🖼️ Public Image URL]
    E[🌐 Web Map Widget - Leaflet.js] -->|4. REST API Fetch| B
    E -->|5. Marker Clustering & Popups| F[🖥️ Επισκέπτες Ιστοσελίδας]
```

### 1.1 Backend (Supabase Cloud Infrastructure)
* **Πλατφόρμα:** Supabase (BaaS).
* **Βάση Δεδομένων:** PostgreSQL με ευρετήρια B-Tree στις συντεταγμένες (`latitude`, `longitude`) και στην ημερομηνία (`created_at DESC`).
* **Αποθηκευτικός Χώρος:** Supabase Storage (Public Bucket `photos`) με άμεση διανομή εικόνων μέσω CDN.
* **Ασφάλεια (Row Level Security - RLS):** 
  * `SELECT`: Ελεύθερη ανάγνωση για όλους (χάρτης / ιστοσελίδα).
  * `INSERT / UPDATE / DELETE`: Πλήρης διαχείριση από την εφαρμογή.
* **Αυθεντικοποίηση:** Supabase Auth (JWT tokens) για ασφαλή είσοδο του διαχειριστή.

### 1.2 Mobile App (Εφαρμογή Κινητού)
* **Framework:** React Native 0.86.3 & React 19.2.3 στο Expo SDK 57.
* **Μορφές Εγκατάστασης:**
  1. **Αυτόνομο Android APK (`HooligansMap.apk`):** Μόνιμη εγκατάσταση στο κινητό με δικό της εικονίδιο, χωρίς καμία εξάρτηση από το Expo Go.
  2. **Expo Go (Android & iOS):** Για άμεση ασύρματη εκτέλεση μέσω σκαναρίσματος QR code.
* **Κάμερα & Άλμπουμ:** `expo-camera`, `expo-image-picker` με σύγχρονο `mediaTypes: ['images']`.
* **GPS & Αισθητήρες:** `expo-location` (High Accuracy εντοπισμός, υψόμετρο, ακρίβεια σε μέτρα).
* **Συμπίεση & Βελτιστοποίηση:** `expo-image-manipulator` (αυτόματο resize σε Max 1920px Full HD, 80% JPEG ποιότητα, μείωση μεγέθους από ~10MB σε ~300KB και εξαγωγή Base64).
* **Binary Upload Engine:** Pure JS Base64-to-ArrayBuffer Decoder για άμεσο και αλάνθαστο upload στο Android.
* **Διαδραστικός Χάρτης Κινητού:** `react-native-webview` με ενσωματωμένο Leaflet view και διαδραστικό επιλογέα σημείου (Visual Map Picker).

### 1.3 Web Map Widget (Χάρτης Ιστοσελίδας)
* **Μηχανή Χαρτών:** Leaflet.js (v1.9.4) & Leaflet.markercluster (v1.5.3).
* **4 Δωρεάν Επίπεδα Χάρτη (Χωρίς API Keys):**
  1. 🗺️ **OpenStreetMap Standard** (Βασικός χάρτης)
  2. 🚵‍♂️ **CyclOSM** (Εξειδικευμένος χάρτης για ποδήλατο, μονοπάτια, χωματόδρομους και ισοϋψείς καμπύλες)
  3. ⛰️ **Esri World Topographic** (Ανάγλυφο βουνών και υψόμετρα)
  4. 🛰️ **Esri World Imagery** (Δορυφορικός χάρτης υψηλής ανάλυσης)
* **Διεπαφή (UI):** Custom Dark Slate Theme, Custom Camera SVG pins, αναδυόμενα παράθυρα (popups) με προεπισκόπηση, και πλήρες **Fullscreen Lightbox Modal** για μεγέθυνση εικόνων.

---

## ⚙️ 2. Τελικές Ρυθμίσεις & Αρχεία Παραμετροποίησης

### 2.1 Ρυθμίσεις Εφαρμογής Κινητού (`mobile-app/src/config/supabase.js`)
```javascript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://eeuflkxnetkqocxyelkr.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWZsa3huZXRrcW9jeHllbGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDYzMjIsImV4cCI6MjEwMzkyMjMyMn0.lUOxKE45C8eUXY1SMNstZPxrzZD9uhTY-0TM4hsizdU';

export const isSupabaseConfigured = () => {
  return (
    SUPABASE_URL &&
    !SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_ID') &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 2.2 Ρυθμίσεις Web Widget (`web-widget/config.js`)
```javascript
window.SUPABASE_CONFIG = {
    SUPABASE_URL: "https://eeuflkxnetkqocxyelkr.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWZsa3huZXRrcW9jeHllbGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDYzMjIsImV4cCI6MjEwMzkyMjMyMn0.lUOxKE45C8eUXY1SMNstZPxrzZD9uhTY-0TM4hsizdU",
    
    // Προεπιλεγμένο κέντρο χάρτη (Μυτιλήνη / Λέσβος)
    DEFAULT_CENTER: [39.1100, 26.5550],
    DEFAULT_ZOOM: 11,
    
    // Fallback σε demo pins αν δεν υπάρχουν αναρτήσεις
    ENABLE_DEMO_DATA_FALLBACK: false
};
```

---

## 🗄️ 3. Τελικό SQL Schema & Πολιτικές Supabase (`supabase/schema.sql`)

```sql
-- 1. Δημιουργία του πίνακα photos
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes για μέγιστη ταχύτητα
CREATE INDEX IF NOT EXISTS idx_photos_coordinates ON public.photos (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos (created_at DESC);

-- 3. Ενεργοποίηση RLS & Πολιτικές Πίνακα
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read photos" ON public.photos;
DROP POLICY IF EXISTS "Allow insert photos" ON public.photos;
DROP POLICY IF EXISTS "Allow update photos" ON public.photos;
DROP POLICY IF EXISTS "Allow delete photos" ON public.photos;

CREATE POLICY "Public can read photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Allow insert photos" ON public.photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update photos" ON public.photos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete photos" ON public.photos FOR DELETE USING (true);

-- 4. Δημιουργία Public Bucket & Storage Πολιτικές
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow All Reads from Photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads to Photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow Deletes from Photos" ON storage.objects;

CREATE POLICY "Allow All Reads from Photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Allow Uploads to Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Allow Deletes from Photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos');
```

---

## 📱 4. Οδηγός Εγκατάστασης & Χρήσης της Εφαρμογής Κινητού

### 4.1 Εγκατάσταση σε Νέο Κινητό Android (Μόνιμη Εγκατάσταση με Αυτόνομο APK)

Το αρχείο εγκατάστασης είναι ήδη έτοιμο στον φάκελο:  
`mobile-app/HooligansMap.apk`

1. **Μεταφορά του αρχείου στο κινητό:**
   * **Καλώδιο USB (Προτεινόμενο):** Συνδέστε το κινητό στον υπολογιστή, επιλέξτε «Μεταφορά αρχείων» και αντιγράψτε το αρχείο `HooligansMap.apk` στον φάκελο **Downloads (Λήψεις)** του κινητού.
   * **Google Drive / WeTransfer / Cloud:** Ανεβάστε το αρχείο από τον υπολογιστή και κατεβάστε το στο κινητό.
2. **Εγκατάσταση:**
   * Ανοίξτε την εφαρμογή **«Αρχεία» (Files)** στο κινητό, εντοπίστε το `HooligansMap.apk` και πατήστε το.
   * **Άγνωστες Πηγές:** Αν εμφανιστεί μήνυμα ασφαλείας, πατήστε «Ρυθμίσεις» και ενεργοποιήστε την επιλογή **«Να επιτρέπεται η εγκατάσταση από αυτή την πηγή»**.
   * **Google Play Protect:** Αν εμφανιστεί προειδοποίηση για άγνωστο δημιουργό, πατήστε **«Περισσότερες λεπτομέρειες»** και μετά **«Εγκατάσταση οπωσδήποτε»**.
   * Πατήστε **«Εγκατάσταση»**.
3. **Πρώτο Άνοιγμα & Δικαιώματα (Permissions):**
   * **Τοποθεσία (GPS):** Επιλέξτε «Κατά τη χρήση της εφαρμογής» και βεβαιωθείτε ότι είναι ενεργοποιημένη η «Ακριβής τοποθεσία».
   * **Κάμερα & Συλλογή:** Αποδεχτείτε τις άδειες για λήψη και επιλογή φωτογραφιών.
4. **Σύνδεση:** Εισάγετε το Email και τον Κωδικό διαχειριστή που έχετε ορίσει στο Supabase.

---

### 4.2 Εγκατάσταση σε iPhone (ή Εναλλακτικά μέσω Expo Go)

1. **Εγκατάσταση Expo Go:**
   * Σε iPhone: Κατεβάστε το **Expo Go** από το App Store.
   * Σε Android: Κατεβάστε το **Expo Go** από το Google Play.
2. **Εκκίνηση από τον υπολογιστή:**
   * Βεβαιωθείτε ότι ο υπολογιστής και το κινητό είναι στο ίδιο δίκτυο Wi-Fi.
   * Κάντε διπλό κλικ στο αρχείο **`mobile-app/start.bat`**.
   * Θα ανοίξει το τερματικό και θα εμφανιστεί ένα QR Code.
3. **Σύνδεση:**
   * **Σε iPhone:** Ανοίξτε την κανονική εφαρμογή **Κάμερα**, στοχεύστε το QR Code και πατήστε «Open in Expo Go».
   * **Σε Android:** Ανοίξτε την εφαρμογή **Expo Go** και επιλέξτε «Scan QR Code».

---

### 4.3 Παραγωγή Νέου Αυτόνομου APK στο Cloud (EAS Build)

Αν κάνετε αλλαγές στον κώδικα και επιθυμείτε να παραχθεί νέο ανανεωμένο αρχείο APK:
1. Κάντε διπλό κλικ στο αρχείο **`mobile-app/build-apk.bat`**.
2. Συνδεθείτε με τον δωρεάν λογαριασμό σας στο Expo (εγγραφή σε 1' στο [expo.dev/signup](https://expo.dev/signup)).
3. Το **EAS Build** θα παράξει το νέο αρχείο `.apk` στο Cloud.
4. Σκανάρετε το QR code που θα εμφανιστεί στην οθόνη σας ή ανοίξτε το download link από το κινητό για άμεση λήψη και εγκατάσταση.

---

### 4.4 Καρτέλες & Λειτουργίες της Εφαρμογής

* 📸 **Καρτέλα «Νέο Σημείο»:**
  * Πατήστε **«Λήψη Φωτογραφίας»** (ή επιλέξτε από τη συλλογή).
  * Το GPS καταγράφει αυτόματα το στίγμα, το υψόμετρο και την ακρίβεια (π.χ. `±3m`).
  * Συμπληρώστε προαιρετικά Τίτλο και Περιγραφή.
  * Πατήστε **«📍 Ανάρτηση στον Χάρτη»** — η φωτογραφία ανεβαίνει αυτόματα και μεταφέρεστε στον χάρτη.
* 🗺️ **Καρτέλα «Χάρτης»:**
  * Προβολή όλων των σημείων πάνω στον ενσωματωμένο διαδραστικό χάρτη.
  * Εναλλαγή επιπέδων (OpenStreetMap, CyclOSM για μονοπάτια, Δορυφορικός).
  * Πάτημα σε πινέζα για προβολή προεπισκόπησης και λεπτομερειών.
* 📋 **Καρτέλα «Σημεία» (Διαχείριση & Διόρθωση):**
  * Λίστα όλων των αναρτήσεων με ημερομηνίες, τίτλους και συντεταγμένες.
  * 🗑️ **Διαγραφή:** Αφαιρεί τη φωτογραφία από τη βάση και το storage.
  * ✏️ **Χειροκίνητη Διόρθωση Σημείου:**
    * Άμεση πληκτρολόγηση νέου Latitude / Longitude.
    * Πάτημα **«🛰️ Τρέχον GPS»** για χρήση της τρέχουσας φυσικής θέσης.
    * Πάτημα **«🗺️ Επιλογή με Πάτημα στον Χάρτη»** για οπτική μετακίνηση της πινέζας με ένα άγγιγμα ή σύρσιμο!
    * Αποθήκευση αλλαγών με το κουμπί **«💾 Αποθήκευση Αλλαγών»**.

---

## 🌐 5. Οδηγός Ενσωμάτωσης στην Ιστοσελίδα σας (Web Map Widget)

### 5.1 Τοπική Προβολή στον Υπολογιστή:
* Κάντε διπλό κλικ στο αρχείο **`web-widget/index.html`** ή στο **`web-widget/embed-example.html`** για να ανοίξει άμεσα στον browser σας (Chrome / Edge / Firefox).

### 5.2 Ενσωμάτωση σε Ιστοσελίδα / CMS (WordPress, Joomla, Custom HTML):
Ανεβάστε τον φάκελο `web-widget` στον server της ιστοσελίδας σας και προσθέστε τον παρακάτω κώδικα `<iframe>` σε όποιο σημείο θέλετε να εμφανίζεται ο χάρτης:

```html
<!-- Hooligans Geo-Photos Interactive Map Widget -->
<div style="width: 100%; max-width: 1200px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
    <iframe 
        src="https://yoursite.gr/path-to-widget/index.html" 
        width="100%" 
        height="650px" 
        style="border: none; display: block;"
        loading="lazy"
        allow="geolocation">
    </iframe>
</div>
```

---

## 📁 6. Δομή Φακέλων Έργου

```text
d:/Lesvos MTB/Hooligans/
├── mobile-app/                     # Εφαρμογή Κινητού (React Native / Expo SDK 57)
│   ├── assets/                     # Εικονίδια Εφαρμογής (icon.png, adaptive-icon.png)
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js         # Κλειδιά & Supabase Client
│   │   ├── screens/
│   │   │   ├── LoginScreen.js      # Σύνδεση διαχειριστή & Demo Mode
│   │   │   ├── CaptureScreen.js    # Λήψη φωτογραφίας & GPS
│   │   │   ├── MapScreen.js        # Ενσωματωμένος Χάρτης στο κινητό
│   │   │   └── PinsListScreen.js   # Λίστα, διαγραφή & χειροκίνητη διόρθωση
│   │   └── services/
│   │       ├── imageService.js     # Συμπίεση & Base64 εξαγωγή
│   │       ├── locationService.js  # High-accuracy GPS
│   │       └── photoService.js     # Upload, Update, Fetch, Delete
│   ├── App.js                      # Κύρια πλοήγηση (3 Tabs)
│   ├── app.json                    # Ρυθμίσεις Expo & Native Permissions
│   ├── eas.json                    # Ρυθμίσεις Cloud Build για Αυτόνομο APK
│   ├── package.json                # Dependencies (SDK 57, React 19.2.3)
│   ├── HooligansMap.apk            # Έτοιμο αρχείο αυτόνομης εγκατάστασης Android
│   ├── start.bat                   # Εκκίνηση για δοκιμή με Expo Go
│   └── build-apk.bat               # Αυτόματη παραγωγή αυτόνομου Android APK
│
├── web-widget/                     # Web Map Widget για την Ιστοσελίδα
│   ├── index.html                  # Κύριος διαδραστικός χάρτης
│   ├── embed-example.html          # Παράδειγμα ενσωμάτωσης σε site
│   ├── config.js                   # Ρυθμίσεις & Supabase Keys
│   ├── widget.js                   # Leaflet logic, Clustering, Layers, Lightbox
│   └── style.css                   # Dark Slate UI & Responsive Styling
│
├── supabase/                       # Backend SQL & Οδηγοί
│   ├── schema.sql                  # Πίνακας, Indexes, Storage & RLS Policies
│   └── README.md                   # Οδηγίες ρύθμισης Supabase
│
├── Εγγραφα-Οδηγιες/                # Φάκελος Εγγράφων & Τεκμηρίωσης
│   ├── Hooligans Geo - ΟΔΗΓΟΣ ΕΓΚΑΤΑΣΤΑΣΗΣ.docx
│   ├── Εφαρμογές.docx
│   ├── Σχέδιο Υλοποίησης.docx
│   └── walkthrough.md
│
└── WALKTHROUGH.md                  # Ο κεντρικός αναλυτικός οδηγός
```
