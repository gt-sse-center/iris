import React, { useEffect } from 'react';
import { useSegmentationStore } from '../../stores/segmentationStore';

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
      if (w.IRIS_DEBUG) console.log('[RightPanel] showMask changed to:', showMask);
      try {
        w.show_mask(showMask);
      } catch (error) {
        console.error('[RightPanel] Error toggling mask visibility:', error);
      }
    }
  }, [showMask]);

  // Watch for filter changes and apply to canvas
  useEffect(() => {
    const w = window as any;
    if (w.renderFromStore) {
      try {
        w.renderFromStore();
      } catch (error) {
        console.error('[RightPanel] Error applying filters:', error);
      }
    }
  }, [brightness, saturation, contrast, invert]);

  // Modern card section wrapper
  const SectionCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
    <div style={{
      paddingBottom: '20px',
      marginBottom: '20px',
      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      ...style
    }}>
      {children}
    </div>
  );

  // Modern section header
  const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 style={{
      margin: '0 0 12px 0',
      fontSize: '11px',
      fontWeight: '600',
      color: '#6b7280',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    }}>
      {children}
    </h3>
  );

  // Segmented control for mask types
  const SegmentedControl: React.FC<{
    options: Array<{ value: string; icon: string; title: string; label: string }>;
    value: string;
    onChange: (value: string) => void;
  }> = ({ options, value, onChange }) => {
    const [hoveredOption, setHoveredOption] = React.useState<string | null>(null);
    
    return (
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          padding: '2px',
          gap: '2px',
        }}>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
              title={option.title}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: value === option.value ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: value === option.value ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <img
                src={option.icon}
                style={{
                  width: '18px',
                  height: '18px',
                  opacity: value === option.value ? 1 : 0.6,
                }}
                alt={option.title}
              />
              
              {/* Modern Tooltip */}
              {hoveredOption === option.value && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  padding: '6px 10px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '500',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  pointerEvents: 'none',
                  animation: 'fadeIn 0.15s ease',
                }}>
                  {option.title}
                  {/* Tooltip arrow */}
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '4px solid #1f2937',
                  }} />
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Labels below buttons */}
        <div style={{
          display: 'flex',
          marginTop: '6px',
          gap: '2px',
        }}>
          {options.map((option) => (
            <div
              key={option.value}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '10px',
                color: value === option.value ? '#374151' : '#9ca3af',
                fontWeight: value === option.value ? '600' : '500',
                transition: 'color 0.15s ease',
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Panel Content */}
      <div
        style={{
          position: 'fixed',
          right: isCollapsed ? '-256px' : '0',
          top: '50px',
          bottom: '60px',
          width: '256px',
          backgroundColor: '#f7f9fb',
          padding: '16px',
          paddingTop: '52px',
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
      <SectionCard style={{ borderBottom: 'none', paddingBottom: '16px', marginBottom: '16px' }}>
        <SectionHeader>Class</SectionHeader>
        <button
          onClick={onSelectClass}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: '#374151',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          <img
            src="/segmentation/static/icons/class.png"
            style={{ width: '18px', height: '18px', opacity: 0.7 }}
            alt="Class"
          />
          <span id="tb_current_class" style={{ flex: 1, textAlign: 'left', fontWeight: '500' }}>No class</span>
        </button>
      </SectionCard>

      {/* Mask Layers */}
      <SectionCard>
        <SectionHeader>Layers</SectionHeader>
        
        {/* Show/Hide Toggle */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px',
          padding: '8px 0',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Show Mask</span>
          <button
            onClick={toggleMask}
            style={{
              width: '44px',
              height: '24px',
              backgroundColor: showMask ? '#3b82f6' : '#e5e7eb',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s ease',
            }}
            title="Toggle mask visibility"
          >
            <div style={{
              position: 'absolute',
              top: '2px',
              left: showMask ? '22px' : '2px',
              width: '20px',
              height: '20px',
              backgroundColor: 'white',
              borderRadius: '50%',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            }} />
          </button>
        </div>
        
        {/* Mask Type Selector */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Type</div>
          <SegmentedControl
            options={[
              { value: 'final', icon: '/segmentation/static/icons/mask_final.png', title: 'Final mask', label: 'Final' },
              { value: 'user', icon: '/segmentation/static/icons/mask_user.png', title: 'User mask', label: 'User' },
              { value: 'errors', icon: '/segmentation/static/icons/mask_errors.png', title: 'Error mask', label: 'Errors' },
            ]}
            value={maskType}
            onChange={(type) => setMaskType(type as 'final' | 'user' | 'errors')}
          />
        </div>
      </SectionCard>

      {/* Filters */}
      <SectionCard style={{ borderBottom: 'none' }}>
        <SectionHeader>Adjustments</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Brightness Slider */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '6px' 
            }}>
              <label style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                fontWeight: '500',
              }}>
                Brightness
              </label>
              <span style={{
                fontSize: '11px',
                color: '#9ca3af',
                fontWeight: '600',
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
                height: '4px',
                borderRadius: '2px',
                outline: 'none',
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(brightness / 800) * 100}%, #e5e7eb ${(brightness / 800) * 100}%, #e5e7eb 100%)`,
                WebkitAppearance: 'none',
                appearance: 'none',
                cursor: 'pointer',
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                const value = Number(target.value);
                const percentage = (value / 800) * 100;
                target.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
              }}
            />
          </div>

          {/* Saturation Slider */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '6px' 
            }}>
              <label style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                fontWeight: '500',
              }}>
                Saturation
              </label>
              <span style={{
                fontSize: '11px',
                color: '#9ca3af',
                fontWeight: '600',
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
                height: '4px',
                borderRadius: '2px',
                outline: 'none',
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(saturation / 800) * 100}%, #e5e7eb ${(saturation / 800) * 100}%, #e5e7eb 100%)`,
                WebkitAppearance: 'none',
                appearance: 'none',
                cursor: 'pointer',
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                const value = Number(target.value);
                const percentage = (value / 800) * 100;
                target.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
              }}
            />
          </div>

          {/* Toggle Buttons Row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setContrast(!contrast)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: contrast ? '#3b82f6' : 'white',
                color: contrast ? 'white' : '#374151',
                border: contrast ? 'none' : '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!contrast) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!contrast) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
              title="Toggle contrast"
            >
              Contrast
            </button>

            <button
              onClick={() => setInvert(!invert)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: invert ? '#3b82f6' : 'white',
                color: invert ? 'white' : '#374151',
                border: invert ? 'none' : '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!invert) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!invert) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
              title="Toggle invert"
            >
              Invert
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            Reset
          </button>
        </div>
      </SectionCard>
    </div>
    </>
  );
};

export default RightPanel;
