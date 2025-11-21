import { useState, useImperativeHandle, forwardRef } from 'react';

interface ViewEntry {
  id: number;
  key: string;
  type: string; // 'Monochrome', 'RGB', or 'Bing Map'
  description: string;
  data: string; // For monochrome
  dataR: string; // For RGB - Red channel
  dataG: string; // For RGB - Green channel
  dataB: string; // For RGB - Blue channel
  cmap: string;
  clip: string;
  vmin: string;
  vmax: string;
}

const ViewListEditor = forwardRef<any, {}>((_props, ref) => {
  const [views, setViews] = useState<ViewEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  /**
   * Map UI display names to actual config type values
   */
  const mapViewType = (uiType: string): string => {
    switch (uiType) {
      case 'Monochrome':
      case 'RGB':
        return 'image';
      case 'Bing Map':
        return 'bingmap';
      default:
        return 'image';
    }
  };

  const getData = () => {
    return views.reduce((acc, view) => {
      const viewData: any = {
        type: mapViewType(view.type),
      };

      // Add description if not empty (Issue #9)
      if (view.description.trim()) {
        viewData.description = view.description;
      }

      // Handle data field based on view type (Issue #8)
      if (view.type === 'RGB') {
        // RGB views need array of 3 strings
        viewData.data = [view.dataR, view.dataG, view.dataB];
      } else if (view.type === 'Monochrome') {
        // Monochrome views use single string
        viewData.data = view.data;
      }
      // Bing Map views don't have data field (Issue #10)

      // Add optional fields only if they have values (Issue #9, #16)
      if (view.cmap.trim()) viewData.cmap = view.cmap;
      if (view.clip.trim()) viewData.clip = parseFloat(view.clip) || view.clip;
      if (view.vmin.trim()) viewData.vmin = parseFloat(view.vmin);
      if (view.vmax.trim()) viewData.vmax = parseFloat(view.vmax);

      acc[view.key] = viewData;
      return acc;
    }, {} as Record<string, any>);
  };

  useImperativeHandle(ref, () => ({
    getData,
  }));

  const addView = () => {
    setViews([
      ...views,
      {
        id: nextId,
        key: '',
        type: 'Monochrome',
        description: '',
        data: '',
        dataR: '',
        dataG: '',
        dataB: '',
        cmap: 'jet',
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
    const viewsData = getData();
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
              <strong>View Type *</strong>
            </label>
            <select
              value={view.type}
              onChange={(e) => updateView(view.id, 'type', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="Monochrome">Monochrome (single band)</option>
              <option value="RGB">RGB (3 bands)</option>
              <option value="Bing Map">Bing Map (aerial imagery)</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Description</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
              Further description which explains what the user can see in this view.
            </small>
            <input
              type="text"
              placeholder="e.g., Normal RGB image"
              value={view.description}
              onChange={(e) => updateView(view.id, 'description', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          {/* Data field - different UI based on view type */}
          {view.type === 'Monochrome' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>
                <strong>Data *</strong>
              </label>
              <small style={{ display: 'block', color: '#666', marginBottom: '4px', fontSize: '12px', lineHeight: '1.5' }}>
                Band expression for monochrome view. Examples: $B1, $Sentinel2.B11**0.8*5, edges($Sentinel2.B2+$Sentinel2.B3)
              </small>
              <input
                type="text"
                placeholder="e.g., $Sentinel2.B11**0.8*5"
                value={view.data}
                onChange={(e) => updateView(view.id, 'data', e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          )}

          {view.type === 'RGB' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>
                <strong>Data (RGB Channels) *</strong>
              </label>
              <small style={{ display: 'block', color: '#666', marginBottom: '8px', fontSize: '12px' }}>
                Three band expressions for Red, Green, and Blue channels. Each can be a complex expression.
              </small>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Red Channel</label>
                  <input
                    type="text"
                    placeholder="e.g., $Sentinel2.B5"
                    value={view.dataR}
                    onChange={(e) => {
                      setViews(views.map((v) => (v.id === view.id ? { ...v, dataR: e.target.value } : v)));
                    }}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Green Channel</label>
                  <input
                    type="text"
                    placeholder="e.g., $Sentinel2.B3"
                    value={view.dataG}
                    onChange={(e) => {
                      setViews(views.map((v) => (v.id === view.id ? { ...v, dataG: e.target.value } : v)));
                    }}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Blue Channel</label>
                  <input
                    type="text"
                    placeholder="e.g., $Sentinel2.B2"
                    value={view.dataB}
                    onChange={(e) => {
                      setViews(views.map((v) => (v.id === view.id ? { ...v, dataB: e.target.value } : v)));
                    }}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {view.type === 'Bing Map' && (
            <div style={{ marginBottom: '12px', padding: '12px', background: '#e7f3ff', borderRadius: '4px' }}>
              <small style={{ color: '#0066cc' }}>
                ℹ️ Bing Map views don't require a data field. They use metadata location coordinates.
              </small>
            </div>
          )}

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
});

ViewListEditor.displayName = 'ViewListEditor';

export default ViewListEditor;
