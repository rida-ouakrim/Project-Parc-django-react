import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import ParkMap from '../components/ParkMap';
import SpotPanel from '../components/SpotPanel';
import './ParkingPage.css';

export default function ParkingPage() {
  const [parks, setParks] = useState([]);
  const [currentPark, setCurrentPark] = useState('ECOMAIL');
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [highlightedSpot, setHighlightedSpot] = useState(null);
  const [showChassis, setShowChassis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, occupied: 0, free: 0 });

  // Charger la liste des parcs
  useEffect(() => {
    api.get('parks/').then((res) => setParks(res.data)).catch(() => {});
  }, []);

  // Charger les places du parc sélectionné
  const loadSpots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`parks/${currentPark}/`);
      setSpots(res.data.spots);
      setStats({
        total: res.data.total_spots,
        occupied: res.data.occupied_spots,
        free: res.data.free_spots,
      });
    } catch (err) {
      console.error('Erreur chargement places:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPark]);

  useEffect(() => {
    loadSpots();
    setSelectedSpot(null);
    setHighlightedSpot(null);
  }, [loadSpots]);

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
  };

  const handleSpotUpdated = () => {
    loadSpots();
    setSelectedSpot(null);
  };

  const handleSearchResult = (spotCode) => {
    setHighlightedSpot(spotCode);
  };

  return (
    <div className="parking-page">
      {/* Sidebar Parcs */}
      <aside className="park-sidebar">
        <h3>🏢 Parcs</h3>
        <div className="park-list">
          {parks.map((p) => (
            <button
              key={p.id}
              className={`park-btn ${currentPark === p.name ? 'active' : ''}`}
              onClick={() => setCurrentPark(p.name)}
            >
              <span className="park-name">{p.name}</span>
              <span className="park-stats-mini">
                <span className="mini-free">{p.free_spots}</span>/
                <span className="mini-total">{p.total_spots}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Stats du parc actuel */}
        <div className="sidebar-stats">
          <h4>📊 {currentPark}</h4>
          <div className="stat-cards">
            <div className="stat-card free">
              <span className="stat-value">{stats.free}</span>
              <span className="stat-label">Libres</span>
            </div>
            <div className="stat-card occupied">
              <span className="stat-value">{stats.occupied}</span>
              <span className="stat-label">Occupées</span>
            </div>
          </div>
          <div className="stat-progress">
            <div
              className="progress-bar"
              style={{ width: `${stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0}%` }}
            />
          </div>
          <p className="stat-percent">
            {stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0}% occupé
          </p>
        </div>

        {/* Toggle châssis */}
        <div className="sidebar-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showChassis}
              onChange={(e) => setShowChassis(e.target.checked)}
            />
            <span>Afficher les châssis</span>
          </label>
        </div>

        {currentPark !== 'ECOMAIL' && (
          <div className="park-notice">
            ℹ️ Design provisoire en attente d'architecture.
          </div>
        )}
      </aside>

      {/* Carte SVG */}
      <main className="map-area">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement du parc...</p>
          </div>
        ) : (
          <ParkMap
            spots={spots}
            parkName={currentPark}
            onSpotClick={handleSpotClick}
            highlightedSpot={highlightedSpot}
            showChassis={showChassis}
          />
        )}
      </main>

      {/* Panel droit */}
      <aside className="panel-area">
        <SpotPanel
          selectedSpot={selectedSpot}
          onSpotUpdated={handleSpotUpdated}
          allParks={parks}
          currentPark={currentPark}
          onSearchResult={handleSearchResult}
        />
      </aside>
    </div>
  );
}
