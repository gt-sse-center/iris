import { useState, useImperativeHandle, forwardRef } from 'react';

interface ViewGroupEntry {
  id: number;
  key: string;
  views: string[];
}

interface ViewGroupListEditorProps {
  getAvailableViews: () => string[];
}

const ViewGroupListEditor = forwardRef<any, ViewGroupListEditorProps>(({ getAvailableViews }, ref) => {
  const [groups, setGroups] = useState<ViewGroupEntry[]>([]);
  const [nextId, setNextId] = useState(1);
  const [selectedView, setSelectedView] = useState<Record<number, string>>({});

  const getData = () => {
    return groups.reduce((acc, group) => {
      acc[group.key] = group.views;
      return acc;
    }, {} as Record<string, string[]>);
  };

  useImperativeHandle(ref, () => ({
    getData,
  }));

  const addGroup = () => {
    setGroups([...groups, { id: nextId, key: '', views: [] }]);
    setNextId(nextId + 1);
  };

  const removeGroup = (id: number) => {
    setGroups(groups.filter((g) => g.id !== id));
  };

  const updateGroupKey = (id: number, key: string) => {
    setGroups(groups.map((g) => (g.id === id ? { ...g, key } : g)));
  };

  const addViewToGroup = (groupId: number, viewName: string) => {
    if (!viewName.trim()) return;
    setGroups(
      groups.map((g) => {
        if (g.id === groupId && !g.views.includes(viewName.trim())) {
          return { ...g, views: [...g.views, viewName.trim()] };
        }
        return g;
      })
    );
  };

  const removeViewFromGroup = (groupId: number, viewName: string) => {
    setGroups(
      groups.map((g) => {
        if (g.id === groupId) {
          return { ...g, views: g.views.filter((v) => v !== viewName) };
        }
        return g;
      })
    );
  };

  const handleSubmit = () => {
    const groupsData = getData();
    console.log('View Groups Data:', JSON.stringify(groupsData, null, 2));
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <strong>newKey</strong>
      </div>

      {groups.map((group, index) => (
        <div
          key={group.id}
          style={{
            marginBottom: '20px',
            padding: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <strong>Group {index + 1}</strong>
            <button
              onClick={() => removeGroup(group.id)}
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

          {/* Group Key Input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Group Name *</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
              Name for this view group (e.g., "default", "radar", "optical")
            </small>
            <input
              type="text"
              placeholder="e.g., default"
              value={group.key}
              onChange={(e) => updateGroupKey(group.id, e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          {/* Views in this Group */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Views in this Group</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '8px', fontSize: '12px' }}>
              Add view names from the Views section above (e.g., "RGB", "Snow", "Cirrus")
            </small>

            {/* Display current views as tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', minHeight: '32px' }}>
              {group.views.length === 0 && (
                <small style={{ color: '#999', fontStyle: 'italic' }}>No views added yet</small>
              )}
              {group.views.map((viewName) => (
                <div
                  key={viewName}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    background: '#007bff',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <span>{viewName}</span>
                  <button
                    onClick={() => removeViewFromGroup(group.id, viewName)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '14px',
                      lineHeight: '1',
                    }}
                    title="Remove view"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Dropdown to add new view */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedView[group.id] || ''}
                onChange={(e) => setSelectedView({ ...selectedView, [group.id]: e.target.value })}
                style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
              >
                <option value="">-- Select a view to add --</option>
                {getAvailableViews()
                  .filter((viewName) => !group.views.includes(viewName))
                  .map((viewName) => (
                    <option key={viewName} value={viewName}>
                      {viewName}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => {
                  const viewName = selectedView[group.id];
                  if (viewName) {
                    addViewToGroup(group.id, viewName);
                    setSelectedView({ ...selectedView, [group.id]: '' });
                  }
                }}
                disabled={!selectedView[group.id]}
                style={{
                  padding: '6px 12px',
                  background: selectedView[group.id] ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedView[group.id] ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                }}
              >
                Add
              </button>
            </div>
            {getAvailableViews().length === 0 && (
              <small style={{ display: 'block', marginTop: '8px', color: '#ff6b6b', fontStyle: 'italic' }}>
                ⚠️ No views available. Please add views in the Views section above first.
              </small>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addGroup}
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

      <small style={{ display: 'block', color: '#666', marginBottom: '12px' }}>
        The 'default' group is required and will be shown first
      </small>

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

ViewGroupListEditor.displayName = 'ViewGroupListEditor';

export default ViewGroupListEditor;
