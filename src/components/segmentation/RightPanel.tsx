import React from 'react';
import { useSegmentationStore } from '../../stores/segmentationStore';
import ToolButton from './toolbar/ToolButton';
import FilterSlider from './toolbar/FilterSlider';

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
    changeBrightness,
    changeSaturation,
  } = useSegmentationStore();

  return (
    <>
      {/* Panel Content */}
      <div
        style={{
          position: 'fixed',
          right: isCollapsed ? '-280px' : '0',
          top: '50px',
          bottom: '60px',
          width: '280px',
          backgroundColor: '#ecf0f1',
          padding: '15px',
          paddingTop: '45px', // Extra padding for collapse button
          zIndex: 900,
          boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          transition: 'right 0.3s ease',
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
            right: '10px',
            top: '10px',
            width: '32px',
            height: '32px',
            backgroundColor: '#34495e',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            zIndex: 901,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2c3e50';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#34495e';
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
              width: '32px',
              height: '48px',
              backgroundColor: '#34495e',
              border: 'none',
              borderRadius: '4px 0 0 4px',
              color: 'white',
              cursor: 'pointer',
              zIndex: 901,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s ease',
              boxShadow: '-2px 0 4px rgba(0,0,0,0.2)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              padding: '8px 0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2c3e50';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#34495e';
            }}
            title="Show panel"
          >
            ◀
          </button>
        )}

      {/* Class Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
          Class Selection
        </h3>
        <button
          onClick={onSelectClass}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'white',
            border: '2px solid #bdc3c7',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
          }}
        >
          <img
            src="/segmentation/static/icons/class.png"
            style={{ width: '24px', height: '24px' }}
            alt="Class"
          />
          <span id="tb_current_class" style={{ flex: 1, textAlign: 'left' }}>No class</span>
        </button>
      </div>

      {/* Mask Visibility */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
          Mask Layers
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ listStyle: 'none' }}>
              <ToolButton
                id="tb_toggle_mask"
                icon="/segmentation/static/icons/show_mask.png"
                checked={showMask}
                onClick={toggleMask}
                title="Toggle mask visibility"
              />
            </div>
            <span style={{ fontSize: '13px' }}>Show Mask</span>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', marginLeft: '10px', listStyle: 'none' }}>
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
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
          Image Filters
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px', display: 'block' }}>
              Brightness: {brightness}%
            </label>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <button
                onClick={() => changeBrightness(false)}
                style={{
                  width: '24px',
                  height: '24px',
                  border: '1px solid #bdc3c7',
                  background: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                −
              </button>
              <input
                type="range"
                min="0"
                max="800"
                step="10"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => changeBrightness(true)}
                style={{
                  width: '24px',
                  height: '24px',
                  border: '1px solid #bdc3c7',
                  background: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px', display: 'block' }}>
              Saturation: {saturation}%
            </label>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <button
                onClick={() => changeSaturation(false)}
                style={{
                  width: '24px',
                  height: '24px',
                  border: '1px solid #bdc3c7',
                  background: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                −
              </button>
              <input
                type="range"
                min="0"
                max="800"
                step="20"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => changeSaturation(true)}
                style={{
                  width: '24px',
                  height: '24px',
                  border: '1px solid #bdc3c7',
                  background: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', listStyle: 'none' }}>
            <ToolButton
              id="tb_toggle_contrast"
              icon="/segmentation/static/icons/contrast.png"
              checked={contrast}
              onClick={() => setContrast(!contrast)}
              title="Toggle contrast"
            />
            <span style={{ fontSize: '13px' }}>Contrast</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', listStyle: 'none' }}>
            <ToolButton
              id="tb_toggle_invert"
              icon="/segmentation/static/icons/invert.png"
              checked={invert}
              onClick={() => setInvert(!invert)}
              title="Toggle invert"
            />
            <span style={{ fontSize: '13px' }}>Invert</span>
          </div>

          <button
            onClick={resetFilters}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default RightPanel;
