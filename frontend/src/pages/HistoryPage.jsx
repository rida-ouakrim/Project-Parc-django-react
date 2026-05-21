import { useState, useEffect } from 'react';
import api from '../api/axios';
import './HistoryPage.css';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('history/');
        setHistory(res.data);
      } catch (err) {
        console.error('Erreur chargement historique:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleExportExcel = async () => {
    try {
      const res = await api.get('export/excel/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ecoman_parking_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur lors de l\'export Excel.');
    }
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>📖 Historique des Modifications</h1>
        <div className="history-actions">
          <button className="export-btn" onClick={handleExportExcel}>
            📊 Exporter Excel
          </button>
        </div>
      </div>

      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Parc</th>
              <th>Action</th>
              <th>Place</th>
              <th>Ancien Châssis</th>
              <th>Nouveau Châssis</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">Aucun historique disponible.</td>
              </tr>
            ) : (
              history.map((h) => (
                <tr key={h.id}>
                  <td className="date-cell">
                    {new Date(h.timestamp).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td>{h.user}</td>
                  <td><span className="park-tag">{h.park}</span></td>
                  <td>
                    <span className={`action-tag ${h.action.includes('Assignation') ? 'assign' : h.action.includes('Libération') ? 'release' : 'transfer'}`}>
                      {h.action}
                    </span>
                  </td>
                  <td className="code-cell">{h.spot_code}</td>
                  <td className="chassis-cell">{h.old_chassis || '—'}</td>
                  <td className="chassis-cell">{h.new_chassis || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="history-footer">
        <p>{history.length} entrée{history.length > 1 ? 's' : ''} dans l'historique</p>
      </div>
    </div>
  );
}
