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

interface ViewerComparisonProps {
  // Props interface kept for future extensibility
}

const ViewerComparison: React.FC<ViewerComparisonProps> = () => {
  // Use store hooks instead of direct window access
  const { isInitialized, initializeFromLegacy } = useViewManagerStore();

  // Initialize React ViewManager from legacy vars using store action
  useEffect(() => {
    if (!isInitialized) {
      const handleRetryInit = () => {
        console.log('🔧 ViewerComparison: Attempting to initialize ViewManager...');
        initializeFromLegacy().then(() => {
          console.log('✅ ViewerComparison: ViewManager initialized successfully');
        }).catch((error) => {
          console.error('❌ ViewerComparison: Failed to initialize React ViewManager:', error);
        });
      };
      
      // Try initialization immediately
      handleRetryInit();
      
      // Also retry periodically if not initialized
      const retryInterval = setInterval(() => {
        if (!useViewManagerStore.getState().isInitialized && window.vars?.config?.views) {
          console.log('🔄 ViewerComparison: Retrying initialization...');
          handleRetryInit();
        }
      }, 1000);
      
      // Clean up after 10 seconds
      setTimeout(() => clearInterval(retryInterval), 10000);
      
      return () => clearInterval(retryInterval);
    }
  }, [isInitialized, initializeFromLegacy]);
  
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
          Initializing React ViewManager...
        </div>
      )}
    </div>
  );
};

export default ViewerComparison;