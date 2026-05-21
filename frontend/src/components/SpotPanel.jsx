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

  // Place sélectionnée via la recherche rapide
  const [quickSpot, setQuickSpot] = useState(null);
  const [quickChassis, setQuickChassis] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickMsg, setQuickMsg] = useState('');

  const [newChassis, setNewChassis] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const [transferChassis, setTransferChassis] = useState('');
  const [transferPark, setTransferPark] = useState('');
  const [transferSpotId, setTransferSpotId] = useState('');
  const [freeSpots, setFreeSpots] = useState([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState('');

  // Assigner par liste
  const [assignPark, setAssignPark] = useState('');
  const [assignFreeSpots, setAssignFreeSpots] = useState([]);
  const [assignSpotId, setAssignSpotId] = useState('');
  const [assignNewChassis, setAssignNewChassis] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');

  // --- Recherche ---
  const handleSearch = async () => {
    if (!searchChassis.trim()) return;
    setSearchLoading(true);
    setSearchResult(null);
    setQuickSpot(null);
    setQuickMsg('');
    try {
      const res = await api.get(`search/?chassis=${searchChassis}`);
      setSearchResult(res.data);
      if (res.data.found) {
        onSearchResult(res.data.spot.code);
        // Charger la place complète pour l'édition rapide
        setQuickSpot(res.data.spot);
      } else {
        onSearchResult(null);
        setQuickSpot(null);
      }
    } catch {
      setSearchResult({ found: false, message: 'Erreur de recherche.' });
    } finally {
      setSearchLoading(false);
    }
  };

  // --- Assigner depuis la recherche rapide ---
  const handleQuickAssign = async () => {
    if (!quickSpot || !quickChassis.trim()) return;
    setQuickLoading(true);
    setQuickMsg('');
    try {
      await api.post(`spots/${quickSpot.id}/assign/`, { chassis: quickChassis });
      setQuickMsg('✅ Place assignée avec succès !');
      setQuickChassis('');
      setQuickSpot(prev => prev ? { ...prev, status: 'occupé', chassis: quickChassis } : null);
      onSpotUpdated();
    } catch (err) {
      setQuickMsg(`❌ ${err.response?.data?.error || 'Erreur'}`);
    } finally {
      setQuickLoading(false);
    }
  };

  // --- Libérer depuis la recherche rapide ---
  const handleQuickRelease = async () => {
    if (!quickSpot) return;
    setQuickLoading(true);
    setQuickMsg('');
    try {
      await api.post(`spots/${quickSpot.id}/release/`);
      setQuickMsg('✅ Place libérée !');
      setQuickSpot(prev => prev ? { ...prev, status: 'libre', chassis: null } : null);
      onSpotUpdated();
    } catch (err) {
      setQuickMsg(`❌ ${err.response?.data?.error || 'Erreur'}`);
    } finally {
      setQuickLoading(false);
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

  // --- Charger les places libres pour l'assignation par liste ---
  const handleAssignParkChange = async (parkName) => {
    setAssignPark(parkName);
    setAssignSpotId('');
    setAssignMsg('');
    if (!parkName) { setAssignFreeSpots([]); return; }
    try {
      const res = await api.get(`parks/${parkName}/free-spots/`);
      setAssignFreeSpots(res.data);
    } catch {
      setAssignFreeSpots([]);
    }
  };

  // --- Assigner par liste ---
  const handleAssignByList = async () => {
    if (!assignSpotId || !assignNewChassis.trim()) return;
    setAssignLoading(true);
    setAssignMsg('');
    try {
      await api.post(`spots/${assignSpotId}/assign/`, { chassis: assignNewChassis });
      setAssignMsg('✅ Place assignée avec succès !');
      setAssignNewChassis('');
      setAssignSpotId('');
      // Retirer la place assignée de la liste
      setAssignFreeSpots(prev => prev.filter(s => s.id !== parseInt(assignSpotId)));
      onSpotUpdated();
    } catch (err) {
      setAssignMsg(`❌ ${err.response?.data?.error || 'Erreur'}`);
    } finally {
      setAssignLoading(false);
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
        <h3>🔍 Recherche rapide</h3>
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

        {/* Édition rapide dès la recherche */}
        {quickSpot && (
          <div className="quick-edit-box">
            <div className="spot-info-header">
              <span className="spot-code">{quickSpot.code}</span>
              <span className={`spot-status ${quickSpot.status === 'libre' ? 'free' : 'occupied'}`}>
                {quickSpot.status === 'libre' ? '🟢 Libre' : '🔴 Occupé'}
              </span>
            </div>

            {quickSpot.status === 'libre' ? (
              <div className="assign-form">
                <input
                  type="text"
                  placeholder="Châssis à assigner..."
                  value={quickChassis}
                  onChange={(e) => setQuickChassis(e.target.value)}
                />
                <button className="btn-assign" onClick={handleQuickAssign} disabled={quickLoading}>
                  {quickLoading ? 'En cours...' : 'Assigner'}
                </button>
              </div>
            ) : (
              <div className="release-form">
                <p className="chassis-display">Châssis : <strong>{quickSpot.chassis}</strong></p>
                <button className="btn-release" onClick={handleQuickRelease} disabled={quickLoading}>
                  {quickLoading ? 'En cours...' : 'Libérer cette place'}
                </button>
              </div>
            )}

            {quickMsg && (
              <div className={`action-msg ${quickMsg.startsWith('✅') ? 'success' : 'error'}`}>
                {quickMsg}
              </div>
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

      {/* Assigner par liste */}
      <div className="panel-section">
        <h3>📋 Assigner par liste</h3>
        <select value={assignPark} onChange={(e) => handleAssignParkChange(e.target.value)}>
          <option value="">-- Choisir un parc --</option>
          {allParks.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>

        {assignFreeSpots.length > 0 && (
          <select value={assignSpotId} onChange={(e) => setAssignSpotId(e.target.value)}>
            <option value="">-- Choisir une place libre --</option>
            {assignFreeSpots.map((s) => (
              <option key={s.id} value={s.id}>{s.code}</option>
            ))}
          </select>
        )}

        {assignPark && assignFreeSpots.length === 0 && (
          <p className="no-spot-selected">Aucune place libre dans ce parc.</p>
        )}

        {assignSpotId && (
          <>
            <input
              type="text"
              placeholder="Numéro de châssis à assigner..."
              value={assignNewChassis}
              onChange={(e) => setAssignNewChassis(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAssignByList()}
            />
            <button className="btn-assign" onClick={handleAssignByList} disabled={assignLoading}>
              {assignLoading ? 'En cours...' : 'Assigner'}
            </button>
          </>
        )}

        {assignMsg && (
          <div className={`action-msg ${assignMsg.startsWith('✅') ? 'success' : 'error'}`}>
            {assignMsg}
          </div>
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
