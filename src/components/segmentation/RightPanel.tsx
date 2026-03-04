import React, { useEffect } from 'react';
import { useSegmentationStore } from '../../stores/segmentationStore';
import ToolButton from './toolbar/ToolButton';

interface RightPanelProps {
  onSelectClass: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ onSelectClass, isCollapsed, onToggleCollapse }) => {
  
  const {
    showMask,
    toggleMask,
    maskType,
    setMaskType,
    brightness,
    saturation,
    contrast,
    invert,
    setBrightness,
    setSaturation,
    setContrast,
    setInvert,
    resetFilters,
  } = useSegmentationStore();

  // Watch for showMask changes and trigger canvas update
  // Note: maskType changes are handled in the store's setMaskType function
  useEffect(() => {
    const w = window as any;
    // Only call if function exists and vars is initialized
    if (w.vars && w.show_mask) {
      console.log('[RightPanel] showMask changed to:', showMask);
      try {
        w.show_mask(showMask);
      } catch (error) {
        console.error('[RightPanel] Error toggling mask visibility:', error);
      }
    }
  }, [showMask]);

  // Modern card section wrapper
  const SectionCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      ...style
    }}>
      {children}
    </div>
  );

  // Modern section header
  const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 style={{
      margin: '0 0 12px 0',
      fontSize: '13px',
      fontWeight: '600',
      color: '#1a202c',
      letterSpacing: '0.3px',
      textTransform: 'uppercase',
    }}>
      {children}
    </h3>
  );

  return (
    <>
      {/* Panel Content */}
      <div
        style={{
          position: 'fixed',
          right: isCollapsed ? '-320px' : '0',
          top: '50px',
          bottom: '60px',
          width: '320px',
          backgroundColor: '#f7f9fb',
          padding: '20px',
          paddingTop: '56px',
          zIndex: 900,
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.06)',
          overflowY: 'auto',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onWheel={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Collapse/Expand Button - Top Right Corner */}
        <button
          onClick={onToggleCollapse}
          onWheel={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: '16px',
            top: '16px',
            width: '36px',
            height: '36px',
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '8px',
            color: '#4a5568',
            cursor: 'pointer',
            zIndex: 901,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f7fafc';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={isCollapsed ? 'Show panel' : 'Hide panel'}
        >
          {isCollapsed ? '◀' : '▶'}
        </button>

        {/* Collapsed state indicator */}
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            onWheel={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              right: '0',
              top: '50px',
              width: '36px',
              height: '56px',
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRight: 'none',
              borderRadius: '8px 0 0 8px',
              color: '#4a5568',
              cursor: 'pointer',
              zIndex: 901,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.06)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              padding: '8px 0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f7fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
            title="Show panel"
          >
            ◀
          </button>
        )}

      {/* Class Selection */}
      <SectionCard style={{ marginBottom: '16px' }}>
        <SectionHeader>Class Selection</SectionHeader>
        <button
          onClick={onSelectClass}
          style={{
            width: '100%',
            padding: '12px 14px',
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            color: '#2d3748',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f7fafc';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
          }}
        >
          <img
            src="/segmentation/static/icons/class.png"
            style={{ width: '20px', height: '20px', opacity: 0.8 }}
            alt="Class"
          />
          <span id="tb_current_class" style={{ flex: 1, textAlign: 'left', fontWeight: '500' }}>No class</span>
        </button>
      </SectionCard>

      {/* Mask Visibility */}
      <SectionCard style={{ marginBottom: '16px' }}>
        <SectionHeader>Mask Layers</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ listStyle: 'none' }}>
              <ToolButton
                id="tb_toggle_mask"
                icon="/segmentation/static/icons/show_mask.png"
                checked={showMask}
                onClick={toggleMask}
                title="Toggle mask visibility"
              />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#2d3748' }}>Show Mask</span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', listStyle: 'none' }}>
            <ToolButton
              id="tb_mask_final"
              icon="/segmentation/static/icons/mask_final.png"
              checked={maskType === 'final'}
              onClick={() => setMaskType('final')}
              title="Final mask"
            />
            <ToolButton
              id="tb_mask_user"
              icon="/segmentation/static/icons/mask_user.png"
              checked={maskType === 'user'}
              onClick={() => setMaskType('user')}
              title="User mask"
            />
            <ToolButton
              id="tb_mask_errors"
              icon="/segmentation/static/icons/mask_errors.png"
              checked={maskType === 'errors'}
              onClick={() => setMaskType('errors')}
              title="Error mask"
            />
          </div>
        </div>
      </SectionCard>

      {/* Filters */}
      <SectionCard>
        <SectionHeader>Image Filters</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Brightness Slider */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px' 
            }}>
              <label style={{ 
                fontSize: '13px', 
                color: '#4a5568',
                fontWeight: '500',
              }}>
                Brightness
              </label>
              <span style={{
                fontSize: '12px',
                color: '#718096',
                fontWeight: '600',
                backgroundColor: '#edf2f7',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {brightness}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="800"
              step="10"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              style={{ 
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                outline: 'none',
                background: `linear-gradient(to right, #3182ce 0%, #3182ce ${(brightness / 800) * 100}%, #e2e8f0 ${(brightness / 800) * 100}%, #e2e8f0 100%)`,
                WebkitAppearance: 'none',
                appearance: 'none',
                cursor: 'pointer',
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                const value = Number(target.value);
                const percentage = (value / 800) * 100;
                target.style.background = `linear-gradient(to right, #3182ce 0%, #3182ce ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
              }}
            />
          </div>

          {/* Saturation Slider */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px' 
            }}>
              <label style={{ 
                fontSize: '13px', 
                color: '#4a5568',
                fontWeight: '500',
              }}>
                Saturation
              </label>
              <span style={{
                fontSize: '12px',
                color: '#718096',
                fontWeight: '600',
                backgroundColor: '#edf2f7',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {saturation}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="800"
              step="20"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              style={{ 
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                outline: 'none',
                background: `linear-gradient(to right, #3182ce 0%, #3182ce ${(saturation / 800) * 100}%, #e2e8f0 ${(saturation / 800) * 100}%, #e2e8f0 100%)`,
                WebkitAppearance: 'none',
                appearance: 'none',
                cursor: 'pointer',
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                const value = Number(target.value);
                const percentage = (value / 800) * 100;
                target.style.background = `linear-gradient(to right, #3182ce 0%, #3182ce ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
              }}
            />
          </div>

          {/* Toggle Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', listStyle: 'none' }}>
              <ToolButton
                id="tb_toggle_contrast"
                icon="/segmentation/static/icons/contrast.png"
                checked={contrast}
                onClick={() => setContrast(!contrast)}
                title="Toggle contrast"
              />
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#2d3748' }}>Contrast</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', listStyle: 'none' }}>
              <ToolButton
                id="tb_toggle_invert"
                icon="/segmentation/static/icons/invert.png"
                checked={invert}
                onClick={() => setInvert(!invert)}
                title="Toggle invert"
              />
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#2d3748' }}>Invert</span>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#4a5568',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              marginTop: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f7fafc';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
            }}
          >
            Reset Filters
          </button>
        </div>
      </SectionCard>
    </div>
    </>
  );
};

export default RightPanel;
