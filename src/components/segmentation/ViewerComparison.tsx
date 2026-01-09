/**
 * React ViewManager Component
 * 
 * This component displays the React ViewManager for image segmentation.
 * The legacy ViewManager has been removed as part of the migration to React.
 */

import React, { useEffect } from 'react';
import ReactViewManager from './ReactViewManager';
import ErrorBoundary from './ErrorBoundary';
import { useViewManagerStore } from '../../stores/viewManagerStore';
import { useSegmentationStore } from '../../stores/segmentationStore';

interface ViewerComparisonProps {
  // Props interface kept for future extensibility
}

const ViewerComparison: React.FC<ViewerComparisonProps> = () => {
  // Use store hooks instead of direct window access
  const { isInitialized } = useViewManagerStore();
  const { config } = useSegmentationStore();

  // Initialize React ViewManager from React config (not legacy vars)
  useEffect(() => {
    if (!isInitialized && config) {
      console.log('🔧 ViewerComparison: Attempting to initialize ViewManager from React config...');
      
      const viewManagerStore = useViewManagerStore.getState();
      
      try {
        // Initialize views from React config
        if (config.views) {
          const views: { [name: string]: any } = {};
          
          // Handle both array and object formats
          if (Array.isArray(config.views)) {
            config.views.forEach((view: any) => {
              views[view.name] = {
                name: view.name,
                type: view.type || 'image',
                description: view.description || '',
              };
            });
          } else if (typeof config.views === 'object') {
            Object.entries(config.views).forEach(([name, view]: [string, any]) => {
              views[name] = {
                name: name,
                type: view.type || 'image',
                description: view.description || '',
              };
            });
          }
          
          console.log('🔧 ViewerComparison: Setting views from React config:', Object.keys(views));
          viewManagerStore.setViews(views);
        }

        // Initialize view groups from React config
        if (config.view_groups) {
          console.log('🔧 ViewerComparison: Setting view groups from React config:', config.view_groups);
          viewManagerStore.setViewGroups(config.view_groups);
        } else {
          // Default group with available views
          const viewNames = Object.keys(views || {});
          if (viewNames.length > 0) {
            viewManagerStore.setViewGroups({ default: viewNames.slice(0, 3) });
          }
        }

        // Set image dimensions from React config
        if (config.images?.shape && Array.isArray(config.images.shape) && config.images.shape.length >= 2) {
          const [width, height] = config.images.shape;
          viewManagerStore.setImageDimensions(width, height);
          console.log('🔧 ViewerComparison: Setting image dimensions:', width, 'x', height);
        }

        // Set current image from legacy vars (still needed for image ID)
        const currentImageId = (window as any).vars?.image_id;
        if (currentImageId) {
          const imageLocation = (window as any).vars?.image_location || [0, 0];
          viewManagerStore.setImage(currentImageId, imageLocation);
          console.log('🔧 ViewerComparison: Setting image:', currentImageId, 'at', imageLocation);
        }

        // Mark as initialized
        viewManagerStore.setInitialized(true);
        console.log('✅ ViewerComparison: ViewManager initialized successfully from React config');
        
      } catch (error) {
        console.error('❌ ViewerComparison: Failed to initialize ViewManager from React config:', error);
        viewManagerStore.setInitialized(false);
      }
    }
  }, [isInitialized, config]);
  
  const containerStyle: React.CSSProperties = {
    margin: '10px 0px',
    width: '100%',
    height: '800px', // Standard height for the viewer
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    overflow: 'auto',
  };
  
  return (
    <div style={containerStyle}>
      {isInitialized ? (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('React ViewManager crashed:', error, errorInfo);
          }}
        >
          <ReactViewManager />
        </ErrorBoundary>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#666',
            fontSize: '14px',
          }}
        >
          {config ? 'Initializing React ViewManager...' : 'Loading configuration...'}
        </div>
      )}
    </div>
  );
};

export default ViewerComparison;