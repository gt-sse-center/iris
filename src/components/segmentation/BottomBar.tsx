import React from 'react';
import AIScore from './statusbar/AIScore';
import AIRecommendation from './statusbar/AIRecommendation';

interface BottomBarProps {
  onOpenImageInfo: () => void;
  onOpenConfusionMatrix: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({ 
  onOpenImageInfo, 
  onOpenConfusionMatrix 
}) => {
  const w = window as any;
  const isAdmin = w.vars?.is_admin || false;
  const currentImageId = w.vars?.image_id || 'No image';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#34495e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 1000,
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Left: Image Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'white', fontSize: '13px' }}>
        <button
          onClick={onOpenImageInfo}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '13px',
          }}
          title="Image information"
        >
          📷 {currentImageId}
        </button>
        
        <button
          onClick={onOpenConfusionMatrix}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '13px',
          }}
          title="View confusion matrix"
        >
          📊 Stats
        </button>
      </div>

      {/* Center: AI Score and Recommendation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <AIScore onOpenConfusionMatrix={onOpenConfusionMatrix} />
        <AIRecommendation />
      </div>

      {/* Right: Admin Button */}
      {isAdmin && (
        <div>
          <button
            onClick={() => {
              window.location.href = '/admin/';
            }}
            style={{
              background: '#e74c3c',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '8px 15px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
            title="Admin panel"
          >
            🔧 Admin
          </button>
        </div>
      )}
    </div>
  );
};

export default BottomBar;
