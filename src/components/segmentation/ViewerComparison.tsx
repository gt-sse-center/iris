/**
 * Viewer Comparison Component
 * 
 * This component displays both the legacy ViewManager and the new React ViewManager
 * side by side for comparison during the migration process.
 */

import React, { useEffect, useState } from 'react';
import ReactViewManager from './ReactViewManager';
import DebugPanel from './DebugPanel';
import ErrorBoundary from './ErrorBoundary';
import { useViewManagerStore } from '../../stores/viewManagerStore';

interface ViewerComparisonProps {
  showComparison?: boolean;
}

const ViewerComparison: React.FC<ViewerComparisonProps> = ({ 
  showComparison = true 
}) => {
  // Use store hooks instead of direct window access
  const { debugMode, isInitialized, initializeFromLegacy } = useViewManagerStore();
  
  // Check if debug mode is enabled from store
  const isDebugMode = debugMode;
  
  const [showReactViewer, setShowReactViewer] = useState(isDebugMode);
  const [showLegacyViewer, setShowLegacyViewer] = useState(true);
  const [legacyViewerNeedsInit, setLegacyViewerNeedsInit] = useState(false);
  
  // Re-initialize legacy ViewManager when container is shown again
  useEffect(() => {
    if (showLegacyViewer && legacyViewerNeedsInit) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const w = window as any;
        if (w.vars?.vm && w.init_views) {
          try {
            // Re-initialize the legacy ViewManager
            w.init_views();
            setLegacyViewerNeedsInit(false);
            if (debugMode) {
              console.log('🔧 Legacy ViewManager re-initialized');
            }
          } catch (error) {
            console.error('Failed to re-initialize legacy ViewManager:', error);
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showLegacyViewer, legacyViewerNeedsInit, debugMode]);
  
  // Track when legacy viewer is hidden to know when to re-init
  useEffect(() => {
    if (!showLegacyViewer) {
      setLegacyViewerNeedsInit(true);
    }
  }, [showLegacyViewer]);

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
  
  // If not in debug mode, only show legacy viewer
  if (!isDebugMode || !showComparison) {
    return (
      <div>
        <div id="views-container" style={{ margin: '10px 0px', width: '100%' }}>
          {/* Legacy ViewManager container */}
        </div>
      </div>
    );
  }
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    margin: '10px 0px',
    width: '100%',
    maxHeight: '90vh', // Limit height to viewport
    overflowY: 'auto', // Make it scrollable
    padding: '10px',
    boxSizing: 'border-box',
  };
  
  const getSectionStyle = (hasContent: boolean): React.CSSProperties => ({
    border: '2px solid #ddd',
    borderRadius: '8px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    minHeight: hasContent ? '200px' : '60px', // Smaller when hidden
    maxHeight: hasContent ? '1120px' : '80px', // Dynamic based on content
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
  });
  
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    padding: '5px 10px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #ccc',
  };
  
  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
  };
  
  const toggleButtonStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  };
  
  return (
    <div style={containerStyle}>
      {/* Compact debug indicator */}
      <div style={{
        fontSize: '11px',
        color: '#856404',
        backgroundColor: '#fff3cd',
        padding: '5px 10px',
        borderRadius: '4px',
        border: '1px solid #ffc107',
        marginBottom: '10px',
        textAlign: 'center',
      }}>
        🚧 Debug Mode: Comparing Legacy vs React ViewManagers
      </div>
      
      {/* Legacy Viewer Section */}
      <div style={getSectionStyle(showLegacyViewer)}>
        <div style={headerStyle}>
          <h3 style={{ ...titleStyle, color: '#d32f2f' }}>
            🔧 Legacy ViewManager (JavaScript)
          </h3>
          <button
            style={toggleButtonStyle}
            onClick={() => setShowLegacyViewer(!showLegacyViewer)}
          >
            {showLegacyViewer ? 'Hide' : 'Show'}
          </button>
        </div>
        {showLegacyViewer && (
          <div 
            id="views-container" 
            style={{ 
              width: '100%', 
              height: '1040px', // 30% taller (800px + 30%)
              overflow: 'auto', // Allow scrolling if needed
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#fff',
            }}
          >
            {/* This will be filled by the legacy ViewManager */}
          </div>
        )}
      </div>
      
      {/* React Viewer Section */}
      <div style={getSectionStyle(showReactViewer)}>
        <div style={headerStyle}>
          <h3 style={{ ...titleStyle, color: '#4caf50' }}>
            ⚛️ React ViewManager (New)
          </h3>
          <button
            style={toggleButtonStyle}
            onClick={() => setShowReactViewer(!showReactViewer)}
          >
            {showReactViewer ? 'Hide' : 'Show'}
          </button>
        </div>
        {showReactViewer && (
          <div 
            style={{ 
              width: '100%', 
              height: '1040px', // 30% taller (800px + 30%)
              overflow: 'auto', // Allow scrolling if needed
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#fff',
            }}
          >
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
        )}
      </div>
      

      
      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
};

export default ViewerComparison;