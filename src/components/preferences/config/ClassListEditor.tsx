import { useState, useImperativeHandle, forwardRef } from 'react';

interface ClassEntry {
  id: number;
  name: string;
  description: string;
  colour: [number, number, number, number]; // RGBA array [R, G, B, A]
  hasUserColour: boolean;
  userColour: [number, number, number, number]; // Optional RGBA array
}

/**
 * ClassListEditor Component
 * 
 * Manages the list of segmentation classes.
 * Each class requires:
 * - name: Class name
 * - description: Optional description
 * - colour: Required RGBA color array [R, G, B, A] (0-255)
 * - user_colour: Optional RGBA color array for user display
 */
const ClassListEditor = forwardRef<any, {}>((_props, ref) => {
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  const getData = () => {
    return classes.map((cls) => {
      const classData: any = {
        name: cls.name,
        colour: cls.colour,
      };
      
      // Only include description if it's not empty (Issue #17)
      if (cls.description.trim()) {
        classData.description = cls.description;
      }
      
      // Only include user_colour if enabled
      if (cls.hasUserColour) {
        classData.user_colour = cls.userColour;
      }
      
      return classData;
    });
  };

  useImperativeHandle(ref, () => ({
    getData,
  }));

  const addClass = () => {
    setClasses([
      ...classes,
      {
        id: nextId,
        name: '',
        description: '',
        colour: [255, 255, 255, 0], // Default: white, transparent
        hasUserColour: false,
        userColour: [0, 255, 255, 70], // Default: cyan, semi-transparent
      },
    ]);
    setNextId(nextId + 1);
  };

  const removeClass = (id: number) => {
    setClasses(classes.filter((c) => c.id !== id));
  };

  const updateClass = (id: number, field: 'name' | 'description', value: string) => {
    setClasses(classes.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const updateColour = (id: number, index: number, value: number) => {
    setClasses(
      classes.map((c) => {
        if (c.id === id) {
          const newColour: [number, number, number, number] = [...c.colour] as [number, number, number, number];
          newColour[index] = Math.max(0, Math.min(255, value)); // Clamp to 0-255
          return { ...c, colour: newColour };
        }
        return c;
      })
    );
  };

  const updateUserColour = (id: number, index: number, value: number) => {
    setClasses(
      classes.map((c) => {
        if (c.id === id) {
          const newUserColour: [number, number, number, number] = [...c.userColour] as [
            number,
            number,
            number,
            number
          ];
          newUserColour[index] = Math.max(0, Math.min(255, value)); // Clamp to 0-255
          return { ...c, userColour: newUserColour };
        }
        return c;
      })
    );
  };

  const toggleUserColour = (id: number) => {
    setClasses(classes.map((c) => (c.id === id ? { ...c, hasUserColour: !c.hasUserColour } : c)));
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
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Description</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '4px' }}>
              Optional description explaining the class (e.g. why is it different from another class, etc.)
            </small>
            <input
              type="text"
              placeholder="Optional description"
              value={cls.description}
              onChange={(e) => updateClass(cls.id, 'description', e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          {/* Colour Field - Required */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <strong>Colour (RGBA) *</strong>
            </label>
            <small style={{ display: 'block', color: '#666', marginBottom: '8px' }}>
              Required color for this class. RGBA values (0-255). Example: [255, 255, 0, 70] = yellow with transparency
            </small>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Red</label>
                <input
                  type="number"
                  value={cls.colour[0]}
                  onChange={(e) => updateColour(cls.id, 0, parseInt(e.target.value) || 0)}
                  min="0"
                  max="255"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Green</label>
                <input
                  type="number"
                  value={cls.colour[1]}
                  onChange={(e) => updateColour(cls.id, 1, parseInt(e.target.value) || 0)}
                  min="0"
                  max="255"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Blue</label>
                <input
                  type="number"
                  value={cls.colour[2]}
                  onChange={(e) => updateColour(cls.id, 2, parseInt(e.target.value) || 0)}
                  min="0"
                  max="255"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Alpha</label>
                <input
                  type="number"
                  value={cls.colour[3]}
                  onChange={(e) => updateColour(cls.id, 3, parseInt(e.target.value) || 0)}
                  min="0"
                  max="255"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
            </div>
            {/* Color Preview */}
            <div
              style={{
                marginTop: '8px',
                height: '30px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                background: `rgba(${cls.colour[0]}, ${cls.colour[1]}, ${cls.colour[2]}, ${cls.colour[3] / 255})`,
              }}
            />
          </div>

          {/* User Colour Field - Optional */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={cls.hasUserColour}
                onChange={() => toggleUserColour(cls.id)}
                style={{ cursor: 'pointer' }}
              />
              <label style={{ cursor: 'pointer' }} onClick={() => toggleUserColour(cls.id)}>
                <strong>User Colour (Optional)</strong>
              </label>
            </div>
            <small style={{ display: 'block', color: '#666', marginBottom: '8px' }}>
              Optional alternative color for user display. If not set, the main colour will be used.
            </small>

            {cls.hasUserColour && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Red</label>
                    <input
                      type="number"
                      value={cls.userColour[0]}
                      onChange={(e) => updateUserColour(cls.id, 0, parseInt(e.target.value) || 0)}
                      min="0"
                      max="255"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Green</label>
                    <input
                      type="number"
                      value={cls.userColour[1]}
                      onChange={(e) => updateUserColour(cls.id, 1, parseInt(e.target.value) || 0)}
                      min="0"
                      max="255"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Blue</label>
                    <input
                      type="number"
                      value={cls.userColour[2]}
                      onChange={(e) => updateUserColour(cls.id, 2, parseInt(e.target.value) || 0)}
                      min="0"
                      max="255"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Alpha</label>
                    <input
                      type="number"
                      value={cls.userColour[3]}
                      onChange={(e) => updateUserColour(cls.id, 3, parseInt(e.target.value) || 0)}
                      min="0"
                      max="255"
                      style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                </div>
                {/* Color Preview */}
                <div
                  style={{
                    marginTop: '8px',
                    height: '30px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: `rgba(${cls.userColour[0]}, ${cls.userColour[1]}, ${cls.userColour[2]}, ${cls.userColour[3] / 255})`,
                  }}
                />
              </>
            )}
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
