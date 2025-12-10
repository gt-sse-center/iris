import React, { useRef, useState, useEffect } from 'react';
import GeneralSection from './config/GeneralSection';
import ClassesSection from './config/ClassesSection';
import ViewsSection from './config/ViewsSection';
import ViewGroupsSection from './config/ViewGroupsSection';
import SegmentationSection from './config/SegmentationSection';
import { getProjectConfig, updateProjectConfig, validateProjectConfig } from '../../services/config';
import type { ProjectConfig } from '../../services/config';

/**
 * SectionRef Interface
 * 
 * Defines the shape of the ref object that each section component exposes.
 * Each section must implement a getData() method that returns its configuration data.
 * Also includes setData() to populate the form with loaded configuration.
 */
export interface SectionRef {
  getData: () => any;
  setData?: (data: any) => void;
}

interface ProjectConfigTabProps {
  onStateChange?: (state: { hasUnsavedChanges: boolean }) => void;
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
const ProjectConfigTab: React.FC<ProjectConfigTabProps> = ({ onStateChange }) => {
  // Create refs for each section component
  // These are like "handles" we can use to call methods on the child components
  const generalRef = useRef<SectionRef>(null);
  const classesRef = useRef<SectionRef>(null);
  const viewsRef = useRef<SectionRef>(null);
  const viewGroupsRef = useRef<SectionRef>(null);
  const segmentationRef = useRef<SectionRef>(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadedConfig, setLoadedConfig] = useState<ProjectConfig | null>(null);
  const [originalConfigJson, setOriginalConfigJson] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  /**
   * Load configuration from backend on mount
   */
  useEffect(() => {
    loadConfiguration();
  }, []);

  /**
   * Populate sections after they're rendered (when loading becomes false and config is loaded)
   */
  useEffect(() => {
    if (!loading && loadedConfig) {
      populateSections(loadedConfig);
    }
  }, [loading, loadedConfig]);

  /**
   * Notify parent when unsaved changes state changes
   */
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ hasUnsavedChanges });
    }
  }, [hasUnsavedChanges, onStateChange]);

  /**
   * Periodically check for changes while component is mounted
   * This detects changes in form fields without needing onChange handlers on each section
   */
  useEffect(() => {
    if (loading || !originalConfigJson) return;

    // Check for changes every 500ms
    const interval = setInterval(() => {
      checkForChanges();
    }, 500);

    return () => clearInterval(interval);
  }, [loading, originalConfigJson]);

  /**
   * Load configuration from backend
   */
  const loadConfiguration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getProjectConfig();
      const config = response.config;
      
      // Store config - it will be populated after components render
      setLoadedConfig(config);
      setOriginalConfigJson(JSON.stringify(config));
      setHasUnsavedChanges(false);
      setSuccess('Configuration loaded successfully');
      
      // Auto-dismiss success message
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      console.error('[ProjectConfigTab] Failed to load configuration:', err);
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Populate sections with loaded config data
   * Called after components are rendered (via useEffect)
   */
  const populateSections = (config: ProjectConfig) => {
    if (generalRef.current?.setData) {
      generalRef.current.setData({
        name: config.name,
        host: config.host,
        port: config.port,
        images: config.images
      });
    } else {
      console.error('[ProjectConfigTab] GeneralSection ref not available');
    }
    
    if (classesRef.current?.setData) {
      classesRef.current.setData(config.classes);
    } else {
      console.error('[ProjectConfigTab] ClassesSection ref not available');
    }
    
    if (viewsRef.current?.setData) {
      viewsRef.current.setData(config.views);
    } else {
      console.error('[ProjectConfigTab] ViewsSection ref not available');
    }
    
    if (viewGroupsRef.current?.setData) {
      viewGroupsRef.current.setData(config.view_groups);
    } else {
      console.error('[ProjectConfigTab] ViewGroupsSection ref not available');
    }
    
    if (segmentationRef.current?.setData) {
      segmentationRef.current.setData(config.segmentation);
    } else {
      console.error('[ProjectConfigTab] SegmentationSection ref not available');
    }
  };

  /**
   * Get available view keys from the Views section
   * This is used to populate the dropdown in View Groups
   */
  const getAvailableViews = (): string[] => {
    const viewsData = viewsRef.current?.getData();
    return viewsData ? Object.keys(viewsData) : [];
  };

  /**
   * Check if current form data differs from original loaded config
   */
  const checkForChanges = () => {
    if (!originalConfigJson) return;

    try {
      // Get current data from all sections
      const generalData = generalRef.current?.getData();
      const classesData = classesRef.current?.getData();
      const viewsData = viewsRef.current?.getData();
      const viewGroupsData = viewGroupsRef.current?.getData();
      const segmentationData = segmentationRef.current?.getData();

      const currentConfig: ProjectConfig = {
        ...generalData,
        classes: classesData,
        views: viewsData,
        view_groups: viewGroupsData,
        segmentation: segmentationData,
      };

      const currentConfigJson = JSON.stringify(currentConfig);
      const changed = currentConfigJson !== originalConfigJson;
      
      setHasUnsavedChanges(changed);
      
      // Notify parent component
      if (onStateChange) {
        onStateChange({ hasUnsavedChanges: changed });
      }
    } catch (err) {
      console.error('[ProjectConfigTab] Error checking for changes:', err);
    }
  };

  /**
   * handleSaveAll - Aggregates data from all sections and saves to backend
   * 
   * When user clicks "Save Complete Configuration":
   * 1. Calls getData() on each section ref to get current form values
   * 2. Combines all section data into a single config object
   * 3. Sends to backend API
   * 
   * The "?." is optional chaining - it safely handles if ref is null
   */
  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get data from each section by calling their getData() methods
      const generalData = generalRef.current?.getData();
      const classesData = classesRef.current?.getData();
      const viewsData = viewsRef.current?.getData();
      const viewGroupsData = viewGroupsRef.current?.getData();
      const segmentationData = segmentationRef.current?.getData();

      // Combine into final config structure
      const config: ProjectConfig = {
        ...generalData,
        classes: classesData,
        views: viewsData,
        view_groups: viewGroupsData,
        segmentation: segmentationData,
      };
      
      // Validate before saving
      const validationResult = await validateProjectConfig(config);
      
      if (!validationResult.valid) {
        const msg = `Validation failed: ${validationResult.errors.join('\n')}`;
        setError(msg);
        // Make sure the user sees the validation errors immediately
        try {
          // eslint-disable-next-line no-alert
          window.alert(msg);
        } catch (e) {
          // ignore if alerts are not available
        }
        return;
      }
      
      // Only log the full configuration if the project was started in debug mode
      if (loadedConfig && (loadedConfig as any).debug) {
        try {
          console.log('Save Complete Configuration - full config:', JSON.stringify(config, null, 2));
        } catch (e) {
          console.log('Save Complete Configuration - full config (object):', config);
        }
      }

      // Save to backend
      const response = await updateProjectConfig(config);
      
      setSuccess(response.message || 'Configuration saved successfully');
      setLoadedConfig(config);
      setOriginalConfigJson(JSON.stringify(config));
      setHasUnsavedChanges(false);
      
      // Auto-dismiss success message
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err: any) {
      console.error('[ProjectConfigTab] Failed to save configuration:', err);
      const msg = err?.message || 'Failed to save configuration';
      setError(msg);
      try {
        // eslint-disable-next-line no-alert
        window.alert(msg);
      } catch (e) {
        // ignore if alerts are not available
      }
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div id="config-project" className="iris-tabs-config tabcontent" style={{ display: 'block', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>
          Loading configuration...
        </div>
      </div>
    );
  }
  
  return (
    <div id="config-project" className="iris-tabs-config tabcontent" style={{ display: 'block' }}>
      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px 20px',
          margin: '10px 20px',
          background: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div style={{
          padding: '12px 20px',
          margin: '10px 20px',
          background: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
        }}>
          <strong>Success:</strong> {success}
        </div>
      )}
      
      {/* Each section component receives a ref so we can call its getData() method */}
      <GeneralSection ref={generalRef} />
      <ClassesSection ref={classesRef} />
      <ViewsSection ref={viewsRef} />
      <ViewGroupsSection ref={viewGroupsRef} getAvailableViews={getAvailableViews} />
      <SegmentationSection ref={segmentationRef} />
      
      <div style={{ padding: '20px', borderTop: '2px solid #ddd', marginTop: '20px', background: '#f8f9fa' }}>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: saving ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Complete Configuration'}
        </button>
      </div>
    </div>
  );
};

export default ProjectConfigTab;
