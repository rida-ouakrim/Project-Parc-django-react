import { useState } from 'react';
import api from '../api/axios';
import './SpotPanel.css';

export default function SpotPanel({
  selectedSpot,
  onSpotUpdated,
  allParks,
  currentPark,
  onSearchResult,
}) {
  const [searchChassis, setSearchChassis] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [newChassis, setNewChassis] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const [transferChassis, setTransferChassis] = useState('');
  const [transferPark, setTransferPark] = useState('');
  const [transferSpotId, setTransferSpotId] = useState('');
  const [freeSpots, setFreeSpots] = useState([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState('');

  // --- Recherche ---
  const handleSearch = async () => {
    if (!searchChassis.trim()) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await api.get(`search/?chassis=${searchChassis}`);
      setSearchResult(res.data);
      if (res.data.found) {
        onSearchResult(res.data.spot.code);
      } else {
        onSearchResult(null);
      }
    } catch {
      setSearchResult({ found: false, message: 'Erreur de recherche.' });
    } finally {
      setSearchLoading(false);
    }
  };

  // --- Assigner ---
  const handleAssign = async () => {
    if (!selectedSpot || !newChassis.trim()) return;
    setActionLoading(true);
    setActionMsg('');
    try {
      await api.post(`spots/${selectedSpot.id}/assign/`, { chassis: newChassis });
      setActionMsg('✅ Place assignée avec succès !');
      setNewChassis('');
      onSpotUpdated();
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.error || 'Erreur'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Libérer ---
  const handleRelease = async () => {
    if (!selectedSpot) return;
    setActionLoading(true);
    setActionMsg('');
    try {
      await api.post(`spots/${selectedSpot.id}/release/`);
      setActionMsg('✅ Place libérée !');
      onSpotUpdated();
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.error || 'Erreur'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Charger les places libres pour le transfert ---
  const handleTransferParkChange = async (parkName) => {
    setTransferPark(parkName);
    setTransferSpotId('');
    if (!parkName) {
      setFreeSpots([]);
      return;
    }
    try {
      const res = await api.get(`parks/${parkName}/free-spots/`);
      setFreeSpots(res.data);
    } catch {
      setFreeSpots([]);
    }
  };

  // --- Transférer ---
  const handleTransfer = async () => {
    if (!transferChassis.trim() || !transferSpotId) return;
    setTransferLoading(true);
    setTransferMsg('');
    try {
      const res = await api.post('transfer/', {
        chassis: transferChassis,
        dest_spot_id: transferSpotId,
      });
      setTransferMsg(`✅ ${res.data.message}`);
      setTransferChassis('');
      setTransferSpotId('');
      // Recharger les places libres du parc sélectionné pour éviter les doublons
      if (transferPark) {
        try {
          const updated = await api.get(`parks/${transferPark}/free-spots/`);
          setFreeSpots(updated.data);
        } catch {
          setFreeSpots([]);
        }
      }
      onSpotUpdated();
    } catch (err) {
      setTransferMsg(`❌ ${err.response?.data?.error || 'Erreur'}`);
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="spot-panel">
      {/* Recherche */}
      <div className="panel-section">
        <h3>🔍 Recherche</h3>
        <div className="search-row">
          <input
            type="text"
            placeholder="Numéro de châssis..."
            value={searchChassis}
            onChange={(e) => setSearchChassis(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={searchLoading}>
            {searchLoading ? '...' : 'Chercher'}
          </button>
        </div>
        {searchResult && (
          <div className={`search-result ${searchResult.found ? 'found' : 'not-found'}`}>
            {searchResult.found ? (
              <>📍 Place <strong>{searchResult.spot.code}</strong> — Parc <strong>{searchResult.park_name}</strong></>
            ) : (
              <>❌ {searchResult.message}</>
            )}
          </div>
        )}
      </div>

      {/* Édition de place */}
      <div className="panel-section">
        <h3>🛠️ Éditer une place</h3>
        {selectedSpot ? (
          <div className="spot-detail">
            <div className="spot-info-header">
              <span className="spot-code">{selectedSpot.code}</span>
              <span className={`spot-status ${selectedSpot.status === 'libre' ? 'free' : 'occupied'}`}>
                {selectedSpot.status === 'libre' ? '🟢 Libre' : '🔴 Occupé'}
              </span>
            </div>

            {selectedSpot.status === 'libre' ? (
              <div className="assign-form">
                <input
                  type="text"
                  placeholder="Numéro de châssis..."
                  value={newChassis}
                  onChange={(e) => setNewChassis(e.target.value)}
                />
                <button className="btn-assign" onClick={handleAssign} disabled={actionLoading}>
                  {actionLoading ? 'En cours...' : 'Assigner'}
                </button>
              </div>
            ) : (
              <div className="release-form">
                <p className="chassis-display">Châssis : <strong>{selectedSpot.chassis}</strong></p>
                <button className="btn-release" onClick={handleRelease} disabled={actionLoading}>
                  {actionLoading ? 'En cours...' : 'Libérer cette place'}
                </button>
              </div>
            )}

            {actionMsg && (
              <div className={`action-msg ${actionMsg.startsWith('✅') ? 'success' : 'error'}`}>
                {actionMsg}
              </div>
            )}
          </div>
        ) : (
          <p className="no-spot-selected">Cliquez sur une place de la carte pour la sélectionner.</p>
        )}
      </div>

      {/* Transfert */}
      <div className="panel-section">
        <h3>🔄 Transférer</h3>
        <input
          type="text"
          placeholder="Châssis à transférer..."
          value={transferChassis}
          onChange={(e) => setTransferChassis(e.target.value)}
        />
        <select value={transferPark} onChange={(e) => handleTransferParkChange(e.target.value)}>
          <option value="">-- Vers quel parc --</option>
          {allParks.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
        {freeSpots.length > 0 && (
          <select value={transferSpotId} onChange={(e) => setTransferSpotId(e.target.value)}>
            <option value="">-- Choisir une place --</option>
            {freeSpots.map((s) => (
              <option key={s.id} value={s.id}>{s.code}</option>
            ))}
          </select>
        )}
        <button className="btn-transfer" onClick={handleTransfer} disabled={transferLoading}>
          {transferLoading ? 'En cours...' : 'Effectuer le transfert'}
        </button>
        {transferMsg && (
          <div className={`action-msg ${transferMsg.startsWith('✅') ? 'success' : 'error'}`}>
            {transferMsg}
          </div>
        )}
      </div>
    </div>
  );
}
