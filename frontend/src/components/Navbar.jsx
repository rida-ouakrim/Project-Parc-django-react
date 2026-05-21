import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/parking')}>
        <span className="navbar-logo">🚗</span>
        <span className="navbar-title">EcoMan Parking</span>
      </div>

      <div className="navbar-links">
        <button
          className={`nav-link ${location.pathname === '/parking' ? 'active' : ''}`}
          onClick={() => navigate('/parking')}
        >
          🗺️ Parking
        </button>

        {isAdmin() && (
          <button
            className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
            onClick={() => navigate('/history')}
          >
            📖 Historique
          </button>
        )}
      </div>

      <div className="navbar-user">
        <span className="user-badge">
          👤 {user?.username}
          <span className={`role-badge ${user?.role}`}>
            {user?.role === 'admin' ? 'Admin' : 'Sécurité'}
          </span>
        </span>
        <button className="logout-btn" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
