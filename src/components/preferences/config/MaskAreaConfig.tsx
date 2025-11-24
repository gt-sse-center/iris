import React from 'react';

interface MaskAreaConfigProps {
  maskAreaEnabled: boolean;
  setMaskAreaEnabled: (enabled: boolean) => void;
  maskAreaCoords: number[];
  setMaskAreaCoords: (coords: number[]) => void;
}

/**
 * MaskAreaConfig Component
 * 
 * Allows configuration of the segmentation mask area.
 * When enabled, requires exactly 4 coordinates: [x1, y1, x2, y2]
 * When disabled, mask_area will be null (full image segmentation)
 */
const MaskAreaConfig: React.FC<MaskAreaConfigProps> = ({
  maskAreaEnabled,
  setMaskAreaEnabled,
  maskAreaCoords,
  setMaskAreaCoords,
}) => {
  const updateMaskCoord = (index: number, value: number) => {
    const newCoords = [...maskAreaCoords];
    newCoords[index] = value;
    setMaskAreaCoords(newCoords);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '4px' }}>
        <strong>Mask Area</strong>
      </label>
      <small style={{ display: 'block', color: '#666', marginBottom: '12px', lineHeight: '1.5' }}>
        Limit the segmentation area to a specific region of the image. When disabled, users can label the entire image.
        When enabled, provide 4 coordinates: [x1, y1, x2, y2] defining the top-left and bottom-right corners.
        <br />
        Example: <code style={{ color: '#d63384' }}>[64, 64, 448, 448]</code>
      </small>

      {/* Enable/Disable Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={maskAreaEnabled}
            onChange={(e) => setMaskAreaEnabled(e.target.checked)}
            style={{ width: '40px', height: '20px', cursor: 'pointer' }}
          />
          <span style={{ marginLeft: '8px' }}>
            {maskAreaEnabled ? 'Enabled - Limit segmentation area' : 'Disabled - Allow full image segmentation'}
          </span>
        </label>
      </div>

      {/* Coordinate Inputs - Only show when enabled */}
      {maskAreaEnabled && (
        <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>Coordinates (must be exactly 4 values)</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                <strong>X1 (left) *</strong>
              </label>
              <input
                type="number"
                value={maskAreaCoords[0] || 0}
                onChange={(e) => updateMaskCoord(0, parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                <strong>Y1 (top) *</strong>
              </label>
              <input
                type="number"
                value={maskAreaCoords[1] || 0}
                onChange={(e) => updateMaskCoord(1, parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                <strong>X2 (right) *</strong>
              </label>
              <input
                type="number"
                value={maskAreaCoords[2] || 0}
                onChange={(e) => updateMaskCoord(2, parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                <strong>Y2 (bottom) *</strong>
              </label>
              <input
                type="number"
                value={maskAreaCoords[3] || 0}
                onChange={(e) => updateMaskCoord(3, parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="0"
              />
            </div>
          </div>
          <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
            Coordinates define a rectangle: top-left corner (X1, Y1) to bottom-right corner (X2, Y2)
          </small>
        </div>
      )}
    </div>
  );
};

export default MaskAreaConfig;
