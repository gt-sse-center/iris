import { useState, useImperativeHandle, forwardRef } from 'react';

interface ClassEntry {
  id: number;
  name: string;
  description: string;
}

const ClassListEditor = forwardRef<any, {}>((_props, ref) => {
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  const getData = () => {
    return classes.map((cls) => ({
      name: cls.name,
      description: cls.description,
    }));
  };

  useImperativeHandle(ref, () => ({
    getData,
  }));

  const addClass = () => {
    setClasses([...classes, { id: nextId, name: '', description: '' }]);
    setNextId(nextId + 1);
  };

  const removeClass = (id: number) => {
    setClasses(classes.filter((c) => c.id !== id));
  };

  const updateClass = (id: number, field: 'name' | 'description', value: string) => {
    setClasses(classes.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleSubmit = () => {
    const classesData = getData();
    console.log('Classes Data:', JSON.stringify(classesData, null, 2));
  };

  return (
    <div>
      {classes.map((cls) => (
        <div
          key={cls.id}
          style={{
            marginBottom: '20px',
            padding: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <strong>IrisSegClass *</strong>
            <button
              onClick={() => removeClass(cls.id)}
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
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>IrisSegClass*</h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Name *</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '4px' }}>Name of the class.</small>
            <input
              type="text"
              value={cls.name}
              onChange={(e) => updateClass(cls.id, 'name', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Description</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '4px' }}>
              Further description which explains the user more about the class (e.g. why is it different from another
              class, etc.)
            </small>
            <input
              type="text"
              placeholder="Description option 2"
              value={cls.description}
              onChange={(e) => updateClass(cls.id, 'description', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
      ))}
      <button
        onClick={addClass}
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

ClassListEditor.displayName = 'ClassListEditor';

export default ClassListEditor;
