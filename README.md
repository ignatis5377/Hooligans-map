# Οδηγίες Χρήσης & Φιλοξενίας: Web Map Widget

Το Web Map Widget είναι μια αυτόνομη, ελαφριά εφαρμογή χάρτη σε **HTML/CSS/JavaScript** με **Leaflet.js**. Δεν απαιτεί build tools (Webpack/Vite) και λειτουργεί παντού.

---

## 🚀 Τοπική Δοκιμή (Local Preview)

Μπορείτε να ανοίξετε άμεσα τον χάρτη στον υπολογιστή σας:

1. Ανοίξτε το τερματικό στον φάκελο `web-widget/`.
2. Εκτελέστε την εντολή:
   ```bash
   python -m http.server 8000
   ```
3. Ανοίξτε στον browser σας τη διεύθυνση: [http://localhost:8000/embed-example.html](http://localhost:8000/embed-example.html)

> *Σημείωση: Ακόμα και αν δεν έχετε βάλει ακόμα τα κλειδιά Supabase στο `config.js`, ο χάρτης θα λειτουργήσει αμέσως σε **Demo Mode** με 4 ενδεικτικά σημεία στη Λέσβο!*

---

## 🌐 Πού και πώς να το ανεβάσετε (Hosting)

Έχετε τις εξής απλές επιλογές:

### Επιλογή 1: Ανέβασμα στον υπάρχοντα web server / hosting σας (π.χ. cPanel / FTP)
* Φτιάξτε έναν φάκελο `map/` στο `public_html/` της ιστοσελίδας σας.
* Ανεβάστε τα αρχεία: `index.html`, `style.css`, `widget.js`, `config.js`.
* Το widget θα είναι διαθέσιμο στο: `https://yoursite.com/map/`

### Επιλογή 2: Δωρεάν Hosting (Vercel, Netlify, GitHub Pages, Cloudflare Pages)
* Ανεβάστε τον φάκελο `web-widget/` δωρεάν σε **Cloudflare Pages** ή **Netlify** / **Vercel**.
* Θα πάρετε ένα δωρεάν HTTPS link (π.χ. `https://hooligans-map.pages.dev`).

---

## 📌 Πώς να το ενσωματώσετε στην ιστοσελίδα σας (Embed)

Όπου θέλετε να εμφανίζεται ο χάρτης (π.χ. σε σελίδα WordPress, Elementor, Squarespace, Webflow κ.λπ.), προσθέστε ένα **Custom HTML block** με τον παρακάτω κώδικα:

```html
<iframe 
    src="https://yoursite.com/map/index.html" 
    width="100%" 
    height="600px" 
    style="border:none; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.12);" 
    allow="geolocation"
    loading="lazy">
</iframe>
```
