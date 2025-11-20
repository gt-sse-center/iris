import React from 'react';

interface MaskAreaConfigProps {
  maskArea: string;
  setMaskArea: (value: string) => void;
  maskAreaCoords: number[];
  setMaskAreaCoords: (coords: number[]) => void;
}

const MaskAreaConfig: React.FC<MaskAreaConfigProps> = ({
  maskArea,
  setMaskArea,
  maskAreaCoords,
  setMaskAreaCoords,
}) => {
  const removeMaskCoord = (index: number) => {
    const newCoords = maskAreaCoords.filter((_, i) => i !== index);
    setMaskAreaCoords(newCoords);
  };

  const addMaskCoord = () => {
    setMaskAreaCoords([...maskAreaCoords, 0]);
  };

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
      <small style={{ display: 'block', color: '#666', marginBottom: '8px' }}>
        In case you don't want to allow the user to label the complete image, you can limit the segmentation area.
        Example: <code style={{ color: '#d63384' }}>"mask_area": [100, 100, 400, 400]</code>
      </small>
      <select
        value={maskArea}
        onChange={(e) => setMaskArea(e.target.value)}
        style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '12px' }}
      >
        <option value="Mask Area option 1">Mask Area option 1</option>
        <option value="Mask Area option 2">Mask Area option 2</option>
      </select>

      {maskArea === 'Mask Area option 1' && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>mask_area</strong>
          </div>
          <div style={{ marginBottom: '8px' }}>mask_area</div>
          {maskAreaCoords.map((coord, index) => (
            <div
              key={index}
              style={{
                marginBottom: '12px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <label style={{ minWidth: '100px' }}>
                <strong>mask_area-{index + 1} *</strong>
              </label>
              <input
                type="number"
                value={coord}
                onChange={(e) => updateMaskCoord(index, parseInt(e.target.value) || 0)}
                style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <button
                onClick={() => removeMaskCoord(index)}
                style={{
                  padding: '4px 12px',
                  border: '1px solid #dc3545',
                  background: 'white',
                  color: '#dc3545',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ))}
          {maskAreaCoords.length < 4 && (
            <button
              onClick={addMaskCoord}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px dashed #007bff',
                background: 'white',
                color: '#007bff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '8px',
              }}
            >
              + Add
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MaskAreaConfig;
