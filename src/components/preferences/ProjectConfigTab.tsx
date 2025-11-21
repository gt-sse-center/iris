import React, { useRef } from 'react';
import GeneralSection from './config/GeneralSection';
import ClassesSection from './config/ClassesSection';
import ViewsSection from './config/ViewsSection';
import ViewGroupsSection from './config/ViewGroupsSection';
import SegmentationSection from './config/SegmentationSection';

/**
 * SectionRef Interface
 * 
 * Defines the shape of the ref object that each section component exposes.
 * Each section must implement a getData() method that returns its configuration data.
 */
export interface SectionRef {
  getData: () => any;
}

/**
 * Project Configuration Tab Component
 * 
 * This component orchestrates the entire IRIS project configuration form.
 * It contains five accordion sections for editing different parts of the config:
 * 1. General - Project name, host, port, images settings
 * 2. Classes - Segmentation class definitions
 * 3. Views - Image view configurations (RGB, monochrome, Bing maps)
 * 4. View Groups - Groupings of views for the UI
 * 5. Segmentation - Mask settings and AI model configuration
 * 
 * HOW THE REF PATTERN WORKS:
 * -------------------------
 * Each section component manages its own state internally (name, port, classes, etc.).
 * To get data OUT of these child components, we use React's "ref" pattern:
 * 
 * 1. Parent creates a ref: `const generalRef = useRef<SectionRef>(null)`
 * 2. Parent passes ref to child: `<GeneralSection ref={generalRef} />`
 * 3. Child exposes getData() via useImperativeHandle
 * 4. Parent calls child's method: `generalRef.current?.getData()`
 * 
 * This is like giving each section a "phone number" (the ref) that the parent
 * can call to ask "what's your current data?"
 * 
 * WHY USE REFS INSTEAD OF PROPS?
 * ------------------------------
 * - Avoids "prop drilling" (passing callbacks through many levels)
 * - Each section manages its own state independently
 * - Parent only needs data when user clicks "Save"
 * - Cleaner than lifting all state up to parent
 * 
 * Only visible to admin users.
 */
const ProjectConfigTab: React.FC = () => {
  // Create refs for each section component
  // These are like "handles" we can use to call methods on the child components
  const generalRef = useRef<SectionRef>(null);
  const classesRef = useRef<SectionRef>(null);
  const viewsRef = useRef<SectionRef>(null);
  const viewGroupsRef = useRef<SectionRef>(null);
  const segmentationRef = useRef<SectionRef>(null);

  /**
   * handleSaveAll - Aggregates data from all sections
   * 
   * When user clicks "Save Complete Configuration":
   * 1. Calls getData() on each section ref to get current form values
   * 2. Combines all section data into a single config object
   * 3. Logs the complete JSON to console (will eventually save to backend)
   * 
   * The "?." is optional chaining - it safely handles if ref is null
   */
  /**
   * Get available view keys from the Views section
   * This is used to populate the dropdown in View Groups
   */
  const getAvailableViews = (): string[] => {
    const viewsData = viewsRef.current?.getData();
    return viewsData ? Object.keys(viewsData) : [];
  };

  const handleSaveAll = () => {
    // Get data from each section by calling their getData() methods
    const generalData = generalRef.current?.getData();
    const classesData = classesRef.current?.getData();
    const viewsData = viewsRef.current?.getData();
    const viewGroupsData = viewGroupsRef.current?.getData();
    const segmentationData = segmentationRef.current?.getData();

    // Combine into final config structure
    // GeneralSection returns { name, port, host, images }, so we spread it at root level
    const config = {
      ...generalData,              // Spreads: name, port, host, images
      classes: classesData,         // Array of class definitions
      views: viewsData,             // Object of view configurations
      view_groups: viewGroupsData,  // Object of view group arrays
      segmentation: segmentationData, // Segmentation configuration
    };

    // For now, just log to console. Eventually this will POST to backend API
    console.log('Complete Configuration:', JSON.stringify(config, null, 2));
  };

  return (
    <div id="config-project" className="iris-tabs-config tabcontent" style={{ display: 'block' }}>
      {/* Each section component receives a ref so we can call its getData() method */}
      <GeneralSection ref={generalRef} />
      <ClassesSection ref={classesRef} />
      <ViewsSection ref={viewsRef} />
      <ViewGroupsSection ref={viewGroupsRef} getAvailableViews={getAvailableViews} />
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
