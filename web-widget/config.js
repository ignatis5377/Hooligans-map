/**
 * Ρυθμίσεις Σύνδεσης Supabase για το Web Map Widget
 */
window.SUPABASE_CONFIG = {
    SUPABASE_URL: "https://eeuflkxnetkqocxyelkr.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWZsa3huZXRrcW9jeHllbGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDYzMjIsImV4cCI6MjEwMzkyMjMyMn0.lUOxKE45C8eUXY1SMNstZPxrzZD9uhTY-0TM4hsizdU",
    
    // Προεπιλεγμένο κέντρο χάρτη (Μυτιλήνη / Λέσβος)
    DEFAULT_CENTER: [39.1100, 26.5550],
    DEFAULT_ZOOM: 11,
    
    // Fallback σε demo pins αν δεν υπάρχουν ακόμα αναρτημένες φωτογραφίες
    ENABLE_DEMO_DATA_FALLBACK: false
};
