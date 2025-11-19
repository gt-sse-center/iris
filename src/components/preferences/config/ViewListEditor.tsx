import React, { useState } from 'react';

interface ViewEntry {
  id: number;
  key: string;
  type: string;
  description: string;
  data: string;
  cmap: string;
  clip: string;
  vmin: string;
  vmax: string;
}

const ViewListEditor: React.FC = () => {
  const [views, setViews] = useState<ViewEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  const addView = () => {
    setViews([
      ...views,
      {
        id: nextId,
        key: '',
        type: 'IrisMonochromeView',
        description: '',
        data: '',
        cmap: '',
        clip: '',
        vmin: '',
        vmax: '',
      },
    ]);
    setNextId(nextId + 1);
  };

  const removeView = (id: number) => {
    setViews(views.filter((v) => v.id !== id));
  };

  const updateView = (id: number, field: keyof ViewEntry, value: string) => {
    setViews(views.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const handleSubmit = () => {
    const viewsData = views.reduce((acc, view) => {
      acc[view.key] = {
        type: view.type,
        description: view.description,
        data: view.data,
        cmap: view.cmap || undefined,
        clip: view.clip || undefined,
        vmin: view.vmin || undefined,
        vmax: view.vmax || undefined,
      };
      return acc;
    }, {} as Record<string, any>);
    console.log('Views Data:', JSON.stringify(viewsData, null, 2));
  };

  return (
    <div>
      {views.map((view) => (
        <div
          key={view.id}
          style={{
            marginBottom: '20px',
            padding: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <strong>newKey</strong>
            <button
              onClick={() => removeView(view.id)}
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
          </div>

          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="newKey"
              value={view.key}
              onChange={(e) => updateView(view.id, 'key', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>IrisMonochromeView</strong>
            </label>
            <select
              value={view.type}
              onChange={(e) => updateView(view.id, 'type', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="IrisMonochromeView">IrisMonochromeView</option>
              <option value="IrisRGBView">IrisRGBView</option>
              <option value="IrisBingView">IrisBingView</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Description</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
              Further description which explains what the user can see in this view.
            </small>
            <select
              value={view.description}
              onChange={(e) => updateView(view.id, 'description', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">Select description</option>
              <option value="Description option 1">Description option 1</option>
              <option value="Description option 2">Description option 2</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Type</strong>
            </label>
            <input
              type="text"
              value={view.type}
              onChange={(e) => updateView(view.id, 'type', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Data *</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '4px', fontSize: '12px', lineHeight: '1.5' }}>
              Expression for a monochrome image built from one or more valid band arrays. Use band expressions like $B1,
              $B2 or $Sentinel2.B1
            </small>
            <input
              type="text"
              placeholder="Use band expressions like $B1, $B2 or $Sentinel2.B1"
              value={view.data}
              onChange={(e) => updateView(view.id, 'data', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Cmap</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
              Matplotlib colormap name to render monochrome image.
            </small>
            <input
              type="text"
              value={view.cmap}
              onChange={(e) => updateView(view.id, 'cmap', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Clip</strong>
            </label>
            <input
              type="text"
              placeholder="Clip option 2"
              value={view.clip}
              onChange={(e) => updateView(view.id, 'clip', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Vmin</strong>
            </label>
            <input
              type="text"
              placeholder="Vmin option 2"
              value={view.vmin}
              onChange={(e) => updateView(view.id, 'vmin', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Vmax</strong>
            </label>
            <input
              type="text"
              placeholder="Vmax option 2"
              value={view.vmax}
              onChange={(e) => updateView(view.id, 'vmax', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addView}
        style={{
          width: '100%',
          padding: '10px',
          border: '2px dashed #007bff',
          background: 'white',
          color: '#007bff',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '16px',
        }}
      >
        + Add
      </button>

      <button
        onClick={handleSubmit}
        style={{
          padding: '10px 24px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        Submit
      </button>
    </div>
  );
};

export default ViewListEditor;
