import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import ClassListEditor from './ClassListEditor';

const ClassesSection = forwardRef<any, {}>((props, ref) => {
  const editorRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getData: () => editorRef.current?.getData() || [],
  }));

  return (
    <>
      <div
        className="accordion"
        onClick={(e) => {
          const panel = e.currentTarget.nextElementSibling as HTMLElement;
          const isVisible = panel.style.display === 'block';
          panel.style.display = isVisible ? 'none' : 'block';
          e.currentTarget.classList.toggle('checked');
        }}
      >
        Classes
      </div>
      <div className="panel" style={{ display: 'none' }}>
        <div style={{ padding: '16px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '8px' }}>Classes</h4>
          <small style={{ color: '#666', display: 'block', marginBottom: '12px', lineHeight: '1.5' }}>
            This is a list of classes that you want to allow the user to label. Examples:{' '}
            <code style={{ color: '#d63384' }}>
              {`{ "name": "Clear", "description": "All clear pixels.", "colour": [255,255,255,0], "user_colour": [0,255,255,70] }`}
            </code>
            ,{' '}
            <code style={{ color: '#d63384' }}>
              {`{ "name": "Cloud", "description": "All cloudy pixels.", "colour": [255,255,0,70] }`}
            </code>
          </small>
          <h4 style={{ marginBottom: '16px' }}>Classes</h4>
          <ClassListEditor ref={editorRef} />
        </div>
      </div>
    </>
  );
});

ClassesSection.displayName = 'ClassesSection';

export default ClassesSection;
