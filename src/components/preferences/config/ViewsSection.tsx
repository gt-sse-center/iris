import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import ViewListEditor from './ViewListEditor';

const ViewsSection = forwardRef<any, {}>((props, ref) => {
  const editorRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getData: () => editorRef.current?.getData() || {},
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
        Views
      </div>
      <div className="panel" style={{ display: 'none' }}>
        <div style={{ padding: '16px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '8px' }}>Views</h4>
          <small style={{ color: '#666', display: 'block', marginBottom: '12px', lineHeight: '1.5' }}>
            Since this app was developed for multi-spectral satellite data (i.e. images with more than just three
            channels), you can decide how to present the images to the user. This option must be a dictionary where each
            key is the name of the view and the value another dictionary containing properties for the view.
          </small>
          <h4 style={{ marginBottom: '16px' }}>Views</h4>
          <ViewListEditor ref={editorRef} />
        </div>
      </div>
    </>
  );
});

ViewsSection.displayName = 'ViewsSection';

export default ViewsSection;
