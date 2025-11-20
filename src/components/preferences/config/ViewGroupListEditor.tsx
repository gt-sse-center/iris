import { useState, useImperativeHandle, forwardRef } from 'react';

interface ViewGroupEntry {
  id: number;
  key: string;
  views: string[];
}

const ViewGroupListEditor = forwardRef<any, {}>((_props, ref) => {
  const [groups, setGroups] = useState<ViewGroupEntry[]>([]);
  const [nextId, setNextId] = useState(1);

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
          <label style={{ minWidth: '80px' }}>
            <strong>newKey-{index + 1} *</strong>
          </label>
          <input
            type="text"
            value={group.key}
            onChange={(e) => updateGroupKey(group.id, e.target.value)}
            style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            onClick={() => removeGroup(group.id)}
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
