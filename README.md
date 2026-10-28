# 🚵‍♂️ Hooligans Geo-Photos Project

Ένα πλήρες σύστημα καταγραφής σημείων/φωτογραφιών με GPS στίγμα από το κινητό και αυτόματης προβολής τους σε διαδραστικό χάρτη στην ιστοσελίδα σας.

---

## 📁 Δομή Έργου

```
Hooligans/
├── 🌐 web-widget/              # Διαδραστικός Χάρτης για την Ιστοσελίδα σας (Leaflet.js)
│   ├── index.html              # Η κύρια σελίδα του widget
│   ├── style.css               # Μοντέρνα styles, markers & lightbox
│   ├── widget.js               # Λογική Leaflet, clustering & Supabase API
│   ├── config.js               # Ρυθμίσεις Supabase URL / Anon Key
│   ├── embed-example.html      # Παράδειγμα ενσωμάτωσης (iframe code)
│   └── README.md               # Οδηγίες δοκιμής & φιλοξενίας
│
├── 📱 mobile-app/              # Εφαρμογή Κινητού (React Native / Expo)
│   ├── src/
│   │   ├── config/supabase.js  # Supabase client & persistent auth
│   │   ├── services/           # Camera, GPS & Upload logic
│   │   └── screens/            # Login, Capture & Pins Management
│   ├── App.js                  # Root application & navigation
│   ├── package.json
│   └── README.md               # Οδηγίες εκτέλεσης στο κινητό (Expo Go)
│
├── ⚡ supabase/                 # Cloud Backend & Storage
│   ├── schema.sql              # Database schema & RLS ασφάλεια
│   └── README.md               # Βήμα-βήμα οδηγός ρύθμισης Supabase
│
└── 🤖 .github/workflows/        # Αυτοματισμοί (GitHub Actions)
    └── keep-alive.yml          # Αυτόματο ping στη Supabase κάθε 3 ημέρες
```

---

## 🚀 Γρήγορη Έναρξη σε 3 Βήματα

### 1. Ρύθμιση Backend (Supabase)
* Ακολουθήστε τον οδηγό στο [supabase/README.md](supabase/README.md).
* Εκτελέστε το [schema.sql](supabase/schema.sql) στον SQL Editor.
* Δημιουργήστε το storage bucket `photos` και αντιγράψτε το Project URL & Anon Key.

### 2. Δοκιμή του Web Map Widget
* Ανοίξτε το [web-widget/config.js](web-widget/config.js) και βάλτε τα κλειδιά σας.
* Δοκιμάστε το άμεσα τοπικά εκτελώντας `python -m http.server 8000` στον φάκελο `web-widget` και ανοίγοντας το [http://localhost:8000/embed-example.html](http://localhost:8000/embed-example.html).
* Ενσωματώστε το στο site σας με ένα απλό `<iframe>`!

### 3. Εκτέλεση του Mobile App
* Ανοίξτε το [mobile-app/src/config/supabase.js](mobile-app/src/config/supabase.js) και βάλτε τα κλειδιά σας.
* Ακολουθήστε τον οδηγό στο [mobile-app/README.md](mobile-app/README.md) για να σκανάρετε το QR code με το **Expo Go** στο κινητό σας.

---

## ⏰ Supabase Auto Keep-Alive
Το project περιλαμβάνει αυτοματισμό στο [.github/workflows/keep-alive.yml](.github/workflows/keep-alive.yml) που στέλνει περιοδικό αίτημα στη Supabase κάθε 3 ημέρες, αποτρέποντας την αυτόματη παύση (auto-pause) του δωρεάν πακέτου.
