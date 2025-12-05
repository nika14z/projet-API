// frontend/src/components/MapLocator.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction des icônes Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Liste fictive de magasins (Points de retrait)
const STORES = [
    { id: 1, name: "Biblio Paris Centre", lat: 48.8566, lng: 2.3522, address: "10 Rue de Rivoli, Paris" },
    { id: 2, name: "Biblio Lyon Part-Dieu", lat: 45.7640, lng: 4.8357, address: "Centre Part-Dieu, Lyon" },
    { id: 3, name: "Biblio Marseille Vieux-Port", lat: 43.2965, lng: 5.3698, address: "Quai des Belges, Marseille" },
    { id: 4, name: "Biblio Bordeaux Lac", lat: 44.8378, lng: -0.5792, address: "Avenue du Lac, Bordeaux" }
];

// Composant pour déplacer la vue de la carte dynamiquement
function ChangeView({ center, zoom }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

function MapLocator({ onSelectStore }) {
    const [position, setPosition] = useState([46.603354, 1.888334]); // Centre de la France par défaut
    const [zoom, setZoom] = useState(5);
    const [userLocation, setUserLocation] = useState(null);

    // Fonction pour géolocaliser l'utilisateur (API Navigateur)
    const locateUser = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);
                setUserLocation([latitude, longitude]);
                setZoom(12); // Zoom plus proche
            },
            () => {
                alert("Impossible de récupérer votre position.");
            }
        );
    };

    return (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '10px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📍 Choisir un point de retrait</h3>
                <button 
                    onClick={locateUser} 
                    style={{ padding: '8px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    🎯 Me localiser
                </button>
            </div>
            
            <div style={{ height: '350px' }}>
                <MapContainer center={position} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                    <ChangeView center={position} zoom={zoom} />
                    
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Marqueur de l'utilisateur (si localisé) */}
                    {userLocation && (
                        <Marker position={userLocation}>
                            <Popup>👋 Vous êtes ici !</Popup>
                        </Marker>
                    )}

                    {/* Marqueurs des magasins */}
                    {STORES.map(store => (
                        <Marker key={store.id} position={[store.lat, store.lng]}>
                            <Popup>
                                <b>{store.name}</b><br/>
                                {store.address}<br/>
                                <button 
                                    style={{ marginTop: '5px', background: '#28a745', color: 'white', border: 'none', padding: '5px', borderRadius: '3px', cursor: 'pointer' }}
                                    onClick={() => onSelectStore(store)}
                                >
                                    ✅ Choisir ce point
                                </button>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

export default MapLocator;