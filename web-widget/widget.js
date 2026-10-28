/**
 * Web Map Widget Core Logic
 * Leaflet.js + Marker Clustering + Supabase Integration
 */

(function () {
    let map;
    let markersCluster;
    let allPhotos = [];

    // Fallback demo data
    const DEMO_PHOTOS = [
        {
            id: "demo-1",
            title: "Κάστρο Μυτιλήνης - Θέα",
            description: "Υπέροχη διαδρομή με το ποδήλατο γύρω από τα τείχη του κάστρου.",
            image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
            latitude: 39.1128,
            longitude: 26.5622,
            created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        }
    ];

    document.addEventListener("DOMContentLoaded", initMapWidget);

    function initMapWidget() {
        initLeafletMap();
        setupEventListeners();
        loadPhotos();
    }

    /**
     * Αρχικοποίηση του Leaflet Χάρτη με 100% Δωρεάν Layers (Χωρίς API Key)
     */
    function initLeafletMap() {
        const config = window.SUPABASE_CONFIG || {};
        const defaultCenter = config.DEFAULT_CENTER || [39.1100, 26.5550];
        const defaultZoom = config.DEFAULT_ZOOM || 11;

        // 1. Βασικός Χάρτης OpenStreetMap (μέσω OpenStreetMap France - 100% Δωρεάν, Χωρίς API Key & Χωρίς Περιορισμούς)
        const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
            maxZoom: 20,
            attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });

        // 2. CyclOSM - Ειδικός Χάρτης για Ποδήλατο & Μονοπάτια (MTB / Trails)
        const cyclOsmLayer = L.tileLayer("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.cyclosm.org">CyclOSM</a> | OpenStreetMap'
        });

        // 3. Esri Topographic (Ανάγλυφο / Βουνά / Υψόμετρα)
        const esriTopoLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Esri, USGS, FAO'
        });

        // 4. Esri Satellite (Δορυφορικός Χάρτης)
        const esriSatelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
        });

        map = L.map("map", {
            center: defaultCenter,
            zoom: defaultZoom,
            layers: [streetLayer],
            zoomControl: false
        });

        // Προσθήκη Zoom control κάτω δεξιά
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Layer Control (Επιλογή τύπου χάρτη)
        const baseMaps = {
            "🗺️ Βασικός Χάρτης": streetLayer,
            "🚵‍♂️ Ποδηλατικός (CyclOSM)": cyclOsmLayer,
            "⛰️ Τοπογραφικός (Esri Topo)": esriTopoLayer,
            "🛰️ Δορυφορικός (Satellite)": esriSatelliteLayer
        };
        L.control.layers(baseMaps, null, { position: "bottomleft" }).addTo(map);

        // Marker Cluster Group με custom styling
        markersCluster = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 45,
            iconCreateFunction: function (cluster) {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div><span>${count}</span></div>`,
                    className: "marker-cluster-custom",
                    iconSize: L.point(40, 40)
                });
            }
        });

        map.addLayer(markersCluster);
    }

    /**
     * Δημιουργία Custom Camera Pin Icon
     */
    function createCustomPinIcon() {
        const cameraSvg = `
            <svg viewBox="0 0 24 24">
                <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
            </svg>
        `;

        return L.divIcon({
            className: "custom-photo-pin",
            html: `<div class="custom-photo-pin-inner">${cameraSvg}</div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -36]
        });
    }

    /**
     * Φόρτωση φωτογραφιών από το Supabase REST API
     */
    async function loadPhotos() {
        showLoading(true);
        const config = window.SUPABASE_CONFIG || {};
        const isConfigured = config.SUPABASE_URL && 
                             config.SUPABASE_ANON_KEY && 
                             !config.SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT_ID");

        let photos = [];

        if (isConfigured) {
            try {
                const endpoint = `${config.SUPABASE_URL}/rest/v1/photos?select=*&order=created_at.desc`;
                const response = await fetch(endpoint, {
                    headers: {
                        "apikey": config.SUPABASE_ANON_KEY,
                        "Authorization": `Bearer ${config.SUPABASE_ANON_KEY}`
                    }
                });

                if (response.ok) {
                    photos = await response.json();
                    const countText = photos.length === 1 ? "1 Σημείο" : `${photos.length} Σημεία`;
                    document.getElementById("status-badge").innerHTML = `<span class="dot"></span> ${countText}`;
                } else {
                    console.warn("Supabase fetch returned error:", response.status, response.statusText);
                    photos = config.ENABLE_DEMO_DATA_FALLBACK ? DEMO_PHOTOS : [];
                }
            } catch (err) {
                console.warn("Error connecting to Supabase:", err);
                photos = config.ENABLE_DEMO_DATA_FALLBACK ? DEMO_PHOTOS : [];
            }
        } else {
            console.log("Supabase config not set.");
            photos = config.ENABLE_DEMO_DATA_FALLBACK ? DEMO_PHOTOS : [];
        }

        allPhotos = photos;
        renderMarkers(photos);
        showLoading(false);
    }

    /**
     * Εμφάνιση των markers στον χάρτη
     */
    function renderMarkers(photos) {
        markersCluster.clearLayers();

        if (!photos || photos.length === 0) {
            document.getElementById("status-badge").innerHTML = `<span class="dot" style="background:#f59e0b"></span> 0 Σημεία`;
            return;
        }

        const customIcon = createCustomPinIcon();
        const bounds = [];

        photos.forEach((photo) => {
            if (photo.latitude === undefined || photo.longitude === undefined) return;

            const lat = parseFloat(photo.latitude);
            const lng = parseFloat(photo.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            bounds.push([lat, lng]);

            const marker = L.marker([lat, lng], { icon: customIcon });

            // Popup HTML Content
            const formattedDate = photo.created_at ? new Date(photo.created_at).toLocaleDateString("el-GR", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }) : "";

            const popupContent = `
                <div class="photo-popup-card">
                    <div class="photo-popup-image-container" onclick="window.openLightbox('${escapeHtml(photo.image_url)}', '${escapeHtml(photo.title || "")}', '${escapeHtml(photo.description || "")}')">
                        <img src="${escapeHtml(photo.image_url)}" alt="${escapeHtml(photo.title || "Photo")}" loading="lazy" />
                        <div class="photo-popup-zoom-hint">
                            🔍 Μεγέθυνση
                        </div>
                    </div>
                    <div class="photo-popup-body">
                        <h4 class="photo-popup-title">${escapeHtml(photo.title || "Χωρίς Τίτλο")}</h4>
                        ${photo.description ? `<p class="photo-popup-desc">${escapeHtml(photo.description)}</p>` : ""}
                        <div class="photo-popup-meta">
                            <span>📅 ${formattedDate}</span>
                            <span class="photo-popup-coords">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
                        </div>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                maxWidth: 300,
                minWidth: 260,
                className: "custom-leaflet-popup"
            });

            markersCluster.addLayer(marker);
        });

        // Εστίαση του χάρτη στο σημείο / στα σημεία
        if (bounds.length === 1) {
            map.setView(bounds[0], 14);
        } else if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }

    /**
     * UI Event Listeners
     */
    function setupEventListeners() {
        // Fit All Pins Button
        const fitBtn = document.getElementById("btn-fit-all");
        if (fitBtn) {
            fitBtn.addEventListener("click", () => {
                if (allPhotos.length === 1) {
                    map.setView([allPhotos[0].latitude, allPhotos[0].longitude], 14);
                } else if (allPhotos.length > 1) {
                    const bounds = allPhotos.map(p => [p.latitude, p.longitude]);
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                }
            });
        }

        // Refresh Button
        const refreshBtn = document.getElementById("btn-refresh");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => {
                loadPhotos();
            });
        }

        // Lightbox Close
        const lightbox = document.getElementById("lightbox-modal");
        const closeBtn = document.getElementById("lightbox-close");
        if (lightbox && closeBtn) {
            closeBtn.addEventListener("click", closeLightbox);
            lightbox.addEventListener("click", (e) => {
                if (e.target === lightbox) closeLightbox();
            });
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") closeLightbox();
            });
        }
    }

    /**
     * Global Lightbox Handler
     */
    window.openLightbox = function (imageUrl, title, description) {
        const modal = document.getElementById("lightbox-modal");
        const img = document.getElementById("lightbox-image");
        const titleEl = document.getElementById("lightbox-title");
        const descEl = document.getElementById("lightbox-desc");

        if (!modal || !img) return;

        img.src = imageUrl;
        titleEl.textContent = title || "";
        descEl.textContent = description || "";

        modal.classList.add("active");
    };

    function closeLightbox() {
        const modal = document.getElementById("lightbox-modal");
        if (modal) {
            modal.classList.remove("active");
        }
    }

    function showLoading(show) {
        const overlay = document.getElementById("loading-overlay");
        if (overlay) {
            if (show) overlay.classList.remove("hidden");
            else overlay.classList.add("hidden");
        }
    }

    function escapeHtml(string) {
        if (!string) return "";
        return String(string)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

})();
