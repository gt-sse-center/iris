import React, { useRef } from 'react';
import GeneralSection from './config/GeneralSection';
import ClassesSection from './config/ClassesSection';
import ViewsSection from './config/ViewsSection';
import ViewGroupsSection from './config/ViewGroupsSection';
import SegmentationSection from './config/SegmentationSection';

export interface SectionRef {
  getData: () => any;
}

/**
 * Project Configuration Tab Component
 * 
 * Contains five accordion sections for editing the project configuration file.
 * Only visible to admin users.
 */
const ProjectConfigTab: React.FC = () => {
  const generalRef = useRef<SectionRef>(null);
  const classesRef = useRef<SectionRef>(null);
  const viewsRef = useRef<SectionRef>(null);
  const viewGroupsRef = useRef<SectionRef>(null);
  const segmentationRef = useRef<SectionRef>(null);

  const handleSaveAll = () => {
    const config = {
      ...generalRef.current?.getData(),
      classes: classesRef.current?.getData(),
      views: viewsRef.current?.getData(),
      view_groups: viewGroupsRef.current?.getData(),
      segmentation: segmentationRef.current?.getData(),
    };

    console.log('Complete Configuration:', JSON.stringify(config, null, 2));
  };

  return (
    <div id="config-project" className="iris-tabs-config tabcontent" style={{ display: 'block' }}>
      <GeneralSection ref={generalRef} />
      <ClassesSection ref={classesRef} />
      <ViewsSection ref={viewsRef} />
      <ViewGroupsSection ref={viewGroupsRef} />
      <SegmentationSection ref={segmentationRef} />
      
      <div style={{ padding: '20px', borderTop: '2px solid #ddd', marginTop: '20px', background: '#f8f9fa' }}>
        <button
          onClick={handleSaveAll}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          Save Complete Configuration
        </button>
        <small style={{ display: 'block', marginTop: '8px', color: '#666', textAlign: 'center' }}>
          This will log the complete configuration JSON to the console
        </small>
      </div>
    </div>
  );
};

export default ProjectConfigTab;
