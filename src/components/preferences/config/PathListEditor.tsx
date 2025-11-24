import React, { useState } from 'react';

interface PathEntry {
  id: number;
  key: string;
  value: string;
}

const PathListEditor: React.FC = () => {
  const [paths, setPaths] = useState<PathEntry[]>([
    { id: 1, key: '', value: 'images/{id}.tif' },
  ]);
  const [nextId, setNextId] = useState(2);

  const addPath = () => {
    setPaths([...paths, { id: nextId, key: '', value: '' }]);
    setNextId(nextId + 1);
  };

  const removePath = (id: number) => {
    if (paths.length > 1) {
      setPaths(paths.filter((p) => p.id !== id));
    }
  };

  const updatePath = (id: number, field: 'key' | 'value', value: string) => {
    setPaths(paths.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <div>
      {paths.map((path, index) => (
        <div key={path.id} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <strong>Path-{index + 1} *</strong>
            {paths.length > 1 && (
              <button
                onClick={() => removePath(path.id)}
                style={{
                  marginLeft: 'auto',
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
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            <input
              type="text"
              placeholder="optional key (e.g. Sentinel2)"
              value={path.key}
              onChange={(e) => updatePath(path.id, 'key', e.target.value)}
              style={{ flex: '0 0 300px', padding: '6px' }}
            />
            <input
              type="text"
              placeholder="images/{id}.tif"
              value={path.value}
              onChange={(e) => updatePath(path.id, 'value', e.target.value)}
              style={{ flex: 1, padding: '6px' }}
            />
          </div>
          <small style={{ display: 'block', color: '#666', marginLeft: '308px' }}>
            Full or relative path to set of image files. Must use "{'{id}'}" placeholder.
          </small>
        </div>
      ))}
      <button
        onClick={addPath}
        style={{
          width: '100%',
          padding: '10px',
          border: '2px dashed #007bff',
          background: 'white',
          color: '#007bff',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        + Add path
      </button>
      <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
        Use {'{id}'} as placeholder for image identifiers
      </small>
    </div>
  );
};

export default PathListEditor;
