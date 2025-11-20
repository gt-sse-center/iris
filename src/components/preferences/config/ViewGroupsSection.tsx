import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import ViewGroupListEditor from './ViewGroupListEditor';

const ViewGroupsSection = forwardRef<any, {}>((props, ref) => {
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
        View Groups
      </div>
      <div className="panel" style={{ display: 'none' }}>
        <div style={{ padding: '16px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '8px' }}>View Groups</h4>
          <small style={{ color: '#666', display: 'block', marginBottom: '12px', lineHeight: '1.5' }}>
            Views are displayed in groups. In the GUI of IRIS, you will be able to switch between different groups
            quickly. The group <code style={{ color: '#d63384' }}>default</code> must always be set, further groups are
            optional. Examples:
          </small>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            {`"view_groups": {
  "default": ["Cirrus", "RGB", "Bing"],
  "clouds": ["Cirrus"],
  "radar": ["Sentinel1"]
}`}
          </pre>
          <small style={{ color: '#666', display: 'block', marginBottom: '16px' }}>
            The 'default' group is required and will be shown first
          </small>
          <ViewGroupListEditor ref={editorRef} />
        </div>
      </div>
    </>
  );
});

ViewGroupsSection.displayName = 'ViewGroupsSection';

export default ViewGroupsSection;
