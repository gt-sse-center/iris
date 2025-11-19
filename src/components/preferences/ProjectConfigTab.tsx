import React from 'react';
import GeneralSection from './config/GeneralSection';
import ClassesSection from './config/ClassesSection';
import ViewsSection from './config/ViewsSection';
import ViewGroupsSection from './config/ViewGroupsSection';
import SegmentationSection from './config/SegmentationSection';

/**
 * Project Configuration Tab Component
 * 
 * Contains five accordion sections for editing the project configuration file.
 * Only visible to admin users.
 */
const ProjectConfigTab: React.FC = () => {
  return (
    <div id="config-project" className="iris-tabs-config tabcontent" style={{ display: 'block' }}>
      <GeneralSection />
      <ClassesSection />
      <ViewsSection />
      <ViewGroupsSection />
      <SegmentationSection />
    </div>
  );
};

export default ProjectConfigTab;
