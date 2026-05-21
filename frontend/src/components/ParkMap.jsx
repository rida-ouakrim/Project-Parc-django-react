import { useRef, useEffect, useState, useCallback } from 'react';
import './ParkMap.css';

export default function ParkMap({ spots, parkName, onSpotClick, highlightedSpot, showChassis }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [viewBox, setViewBox] = useState({ x: -45, y: -45, w: 1495, h: 1470 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'libre', 'occupé'

  // Zoom avec la molette SEULEMENT
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();

    const mouseX = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
    const mouseY = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;

    const newW = viewBox.w * scale;
    const newH = viewBox.h * scale;
    const newX = mouseX - (mouseX - viewBox.x) * scale;
    const newY = mouseY - (mouseY - viewBox.y) * scale;

    setViewBox({ x: newX, y: newY, w: newW, h: newH });
  }, [viewBox]);

  // Empêcher le scroll de la page quand on est sur la carte
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const preventScroll = (e) => e.preventDefault();
    container.addEventListener('wheel', preventScroll, { passive: false });
    return () => container.removeEventListener('wheel', preventScroll);
  }, []);

  // Pan (glissement) avec clic gauche + drag
  const handleMouseDown = (e) => {
    // Bouton gauche uniquement
    if (e.button !== 0) return;
    setIsPanning(true);
    setHasMoved(false);
    setStartPoint({ x: e.clientX, y: e.clientY });
    e.preventDefault(); // Empêcher la sélection de texte
  };

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();

    const dx = ((e.clientX - startPoint.x) / rect.width) * viewBox.w;
    const dy = ((e.clientY - startPoint.y) / rect.height) * viewBox.h;

    // Détection de mouvement (pour distinguer clic d'un drag)
    if (Math.abs(e.clientX - startPoint.x) > 3 || Math.abs(e.clientY - startPoint.y) > 3) {
      setHasMoved(true);
    }

    setViewBox((prev) => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    setStartPoint({ x: e.clientX, y: e.clientY });
  }, [isPanning, startPoint, viewBox]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Écouter les événements globaux pour le drag (même hors du SVG)
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Clic sur un spot (seulement si on n'a pas fait de drag)
  const handleSpotClick = (spot) => {
    if (!hasMoved) {
      onSpotClick(spot);
    }
  };

  // Boutons zoom +/-
  const zoomIn = () => {
    setViewBox((prev) => {
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      const newW = prev.w * 0.75;
      const newH = prev.h * 0.75;
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
    });
  };

  const zoomOut = () => {
    setViewBox((prev) => {
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      const newW = prev.w * 1.35;
      const newH = prev.h * 1.35;
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
    });
  };

  // Reset zoom
  const resetZoom = () => {
    if (parkName === 'ECOMAIL') {
      setViewBox({ x: -45, y: -45, w: 1495, h: 1470 });
    } else {
      setViewBox({ x: 0, y: 0, w: 980, h: 1150 });
    }
  };

  useEffect(() => {
    resetZoom();
  }, [parkName]);

  // SVG static elements pour ECOMAIL
  const renderEcomailStatic = () => {
    if (parkName !== 'ECOMAIL') return null;
    return (
      <>
        {/* Cadre extérieur */}
        <rect x="-45" y="-45" width="1435" height="1463" fill="none" stroke="var(--text-muted)" strokeWidth="4" />

        {/* Routes bleues */}
        <rect x="-45" y="-45" width="1435" height="65" fill="var(--primary-bg)" stroke="var(--primary-border)" strokeWidth="1" />
        <rect x="-45" y="-45" width="65" height="1463" fill="var(--primary-bg)" stroke="var(--primary-border)" strokeWidth="1" />
        <rect x="20" y="1255" width="630" height="63" fill="var(--primary-bg)" />
        <rect x="650" y="1180" width="740" height="138" fill="var(--primary-bg)" stroke="var(--text-muted)" strokeWidth="2" />

        {/* Entrées */}
        <rect x="665" y="1160" width="160" height="40" fill="rgba(251,146,60,0.2)" stroke="rgba(251,146,60,0.5)" strokeWidth="2" rx="4" />
        <text x="745" y="1185" fill="var(--warning-color)" fontSize="16" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">Entrée 2</text>

        <rect x="1390" y="-45" width="40" height="65" fill="rgba(251,146,60,0.2)" stroke="rgba(251,146,60,0.5)" strokeWidth="2" rx="4" />
        <text x="1415" y="-12" fill="var(--warning-color)" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle" transform="rotate(90 1415 -12)">Entrée 1</text>

        <rect x="1390" y="1180" width="40" height="240" fill="rgba(251,146,60,0.2)" stroke="rgba(251,146,60,0.5)" strokeWidth="2" rx="4" />
        <text x="1415" y="1300" fill="var(--warning-color)" fontSize="16" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle" transform="rotate(90 1415 1300)">Entrée 3</text>

        {/* Zone Camions Militaire */}
        <rect x="20" y="120" width="192" height="1060" fill="rgba(161,140,90,0.15)" stroke="rgba(161,140,90,0.4)" strokeWidth="2" rx="4" />
        <text x="116" y="310" fill="rgba(161,140,90,0.8)" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">CAMIONS</text>
        <text x="116" y="325" fill="rgba(161,140,90,0.8)" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">MILITAIRE</text>
        <text x="116" y="880" fill="rgba(161,140,90,0.8)" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">CAMIONS</text>
        <text x="116" y="895" fill="rgba(161,140,90,0.8)" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">MILITAIRE</text>

        <rect x="20" y="1180" width="330" height="75" fill="rgba(161,140,90,0.15)" stroke="rgba(161,140,90,0.4)" strokeWidth="2" rx="4" />
        <text x="185" y="1225" fill="rgba(161,140,90,0.8)" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">CAMIONS MILITAIRE</text>

        {/* Mur séparation */}
        <line x1="980" y1="20" x2="980" y2="1180" stroke="var(--text-muted)" strokeWidth="4" />
        <line x1="1130" y1="20" x2="1250" y2="20" stroke="var(--text-muted)" strokeWidth="4" />
      </>
    );
  };

  const getSpotColor = (spot) => {
    const isHighlighted = highlightedSpot === spot.code;
    if (isHighlighted) return 'var(--warning-color)';

    if (spot.status === 'libre') {
      if (spot.code.startsWith('Auto')) return 'rgba(100,116,139,0.5)';
      if (spot.code.startsWith('Prv')) return 'rgba(245,158,11,0.5)';
      return 'var(--success-bg)';
    }
    return 'var(--danger-bg)';
  };

  const getSpotStroke = (spot) => {
    if (highlightedSpot === spot.code) return 'var(--warning-color)';
    if (spot.status === 'libre') return 'var(--success-color)';
    return 'var(--danger-color)';
  };

  return (
    <div className="parkmap-wrapper">
      <div className="parkmap-toolbar">
        <h2>🗺️ Vue 2D — {parkName}</h2>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={zoomIn} title="Zoom +">➕</button>
          <button className="toolbar-btn" onClick={zoomOut} title="Zoom -">➖</button>
          <button className="toolbar-btn" onClick={resetZoom} title="Réinitialiser">🔄</button>
          <div className="legend">
            <button
              className={`legend-btn libre ${filter === 'libre' ? 'active' : ''}`}
              onClick={() => setFilter(filter === 'libre' ? 'all' : 'libre')}
            >
              <span className="dot free"></span> Libre
            </button>
            <button
              className={`legend-btn occupe ${filter === 'occupé' ? 'active' : ''}`}
              onClick={() => setFilter(filter === 'occupé' ? 'all' : 'occupé')}
            >
              <span className="dot occupied"></span> Occupé
            </button>
            {filter !== 'all' && (
              <button className="legend-btn reset-filter" onClick={() => setFilter('all')}>
                ✕ Tout
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`parkmap-container ${isPanning ? 'is-panning' : ''}`}
        ref={containerRef}
      >
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="parkmap-svg"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
        >
          {/* Background */}
          <rect x="-200" y="-200" width="2000" height="2000" fill="var(--bg-color)" />

          {/* Static elements (ECOMAIL) */}
          {renderEcomailStatic()}

          {/* Cadre générique pour les autres parcs */}
          {parkName !== 'ECOMAIL' && (
            <rect x="20" y="20" width="940" height="1120" fill="none" stroke="var(--text-muted)" strokeWidth="4" rx="8" />
          )}

          {/* Spots */}
          {spots.map((spot) => {
            // Filtrer selon le bouton sélectionné
            const isFiltered = filter !== 'all' && spot.status !== filter;
            const isHighlighted = highlightedSpot === spot.code;
            const fillColor = isFiltered ? 'rgba(30,41,59,0.3)' : getSpotColor(spot);
            const strokeColor = isFiltered ? 'rgba(51,65,85,0.2)' : getSpotStroke(spot);

            return (
              <g
                key={spot.code}
                onClick={() => handleSpotClick(spot)}
                style={{ cursor: isPanning ? 'grabbing' : 'pointer' }}
                className="spot-group"
              >
                <rect
                  x={spot.x}
                  y={spot.y}
                  width={spot.w}
                  height={spot.h}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  rx="3"
                  className="spot-rect"
                  opacity={isFiltered ? 0.2 : 1}
                />
                <text
                  x={spot.x + spot.w / 2}
                  y={spot.y + spot.h / 2 + 4}
                  fill={isFiltered ? 'var(--border-light)' : 'var(--text-primary)'}
                  fontSize={showChassis && spot.chassis ? '8' : '11'}
                  fontFamily="Inter, sans-serif"
                  fontWeight="600"
                  textAnchor="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {showChassis && spot.chassis ? spot.chassis : spot.code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
