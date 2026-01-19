import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import SegmentationToolbar from './components/segmentation/SegmentationToolbar';
import SegmentationStatusBar from './components/segmentation/SegmentationStatusBar';
import SegmentationModals from './components/segmentation/SegmentationModals';
import ViewerComparison from './components/segmentation/ViewerComparison';
import { useSegmentationSetup } from './components/segmentation/hooks/useSegmentationSetup';
import { useSegmentationStore } from './stores/segmentationStore';
import { useViewManagerStore } from './stores/viewManagerStore';
import { useConfigLoader } from './hooks/useConfigLoader';
import './utils/legacyBridge'; // Initialize legacy bridge functions

// Declare global functions that exist in the legacy JavaScript
declare global {
  interface Window {
    init_segmentation: () => void;
    vars: any;
    openUserProfile?: (userId?: string) => void;
    openLogin?: () => void;
    openRegister?: () => void;
    reactLogout?: (callback?: () => void) => Promise<void>;
    irisReactApp?: {
      openHelpModal?: () => void;
      openUserProfile?: (userId?: string) => void;
      openPreferences?: () => void;
    };
  }
}

const SegmentationApp: React.FC = () => {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string>('current');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResetMaskOpen, setIsResetMaskOpen] = useState(false);
  const [isClassSelectionOpen, setIsClassSelectionOpen] = useState(false);
  const [isImageInfoOpen, setIsImageInfoOpen] = useState(false);
  const [isConfusionMatrixOpen, setIsConfusionMatrixOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get config loader hook
  const { loadConfig } = useConfigLoader();

  // Export GeoTIFF function - memoized to prevent re-renders
  const exportGeoTIFF = useCallback(async () => {
    try {
      // Get current image ID from React store (primary source)
      const imageId = useSegmentationStore.getState().currentImageId;
      if (!imageId) {
        alert('No image loaded');
        return;
      }

      const w = window as any;
      if (w.show_message) w.show_message('Exporting GeoTIFF...');

      const response = await fetch(`/segmentation/api/export-geotiff/${imageId}`, {
        method: 'GET',
        credentials: 'same-origin'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${imageId}_annotated.tif`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        if (w.show_message) w.show_message('GeoTIFF exported successfully', 2000);
      } else {
        const error = await response.json();
        const errorMsg = error.message || error.error || 'Export failed';
        if (w.show_dialogue) {
          w.show_dialogue('error', `<p>Could not export GeoTIFF: ${errorMsg}</p>`);
        } else {
          alert(`Export failed: ${errorMsg}`);
        }
      }
    } catch (error) {
      const w = window as any;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (w.show_dialogue) {
        w.show_dialogue('error', `<p>Could not export GeoTIFF: ${errorMsg}</p>`);
      } else {
        alert(`Export failed: ${errorMsg}`);
      }
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/user/get/current', {
          credentials: 'same-origin'
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          // Show login form if not authenticated
          setIsLoginOpen(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setIsLoginOpen(true);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // Initialize app with clean React-first architecture
  useEffect(() => {
    const initializeApp = async () => {
      if (!authChecked || !isAuthenticated) return;

      try {
        console.log('🔧 React: Starting app initialization...');
        
        // Load config directly (no polling, no legacy dependency)
        await loadConfig();
        
        // Initialize navigation
        await initializeNavigation();
        
        // CRITICAL: Initialize views and mask data (equivalent to init_views)
        // This handles ViewManager creation, so no separate service needed
        await initializeMaskData();
        
        console.log('✅ React: App initialization complete');
      } catch (error) {
        console.error('❌ React: App initialization failed:', error);
        // You can set error state here if needed
      }
    };

    initializeApp();
  }, [authChecked, isAuthenticated]); // Remove loadConfig from dependencies to prevent infinite loop

  // Initialize navigation store with image list
  const initializeNavigation = async () => {
    try {
      // Get current image ID from React store (primary source)
      const currentImageId = useSegmentationStore.getState().currentImageId;
      if (!currentImageId) {
        console.warn('No current image ID found in store, skipping navigation initialization');
        return;
      }

      const response = await fetch(
        `/segmentation/api/images/list?current_image_id=${encodeURIComponent(currentImageId)}`,
        { credentials: 'same-origin' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      const data = await response.json();

      // Set images in store
      useSegmentationStore.getState().setImages(data.images);

      // Set current image
      useSegmentationStore.getState().setCurrentImage(currentImageId);
      
      console.log('✅ React: Navigation initialized');
    } catch (error) {
      console.error('❌ React: Navigation initialization failed:', error);
    }
  };

  // Initialize mask data for current image (equivalent to legacy init_views)
  const initializeMaskData = async () => {
    try {
      // Get current image ID from React store (primary source)
      const currentImageId = useSegmentationStore.getState().currentImageId;
      if (!currentImageId) {
        console.warn('No current image ID found in store, skipping mask data initialization');
        return;
      }

      console.log('🔧 React: Initializing views and mask data for image:', currentImageId);
      
      // Call the full init_views function which handles:
      // - Hidden mask canvas creation
      // - Mask data loading
      // - Toolbar/statusbar visibility
      // - Event initialization
      const w = window as any;
      if (w.init_views) {
        await w.init_views();
        console.log('✅ React: Views and mask data initialized successfully');
        
        // CRITICAL: Set the image in viewManagerStore after init_views completes
        const imageLocation = useViewManagerStore.getState().imageLocation || [0, 0];
        useViewManagerStore.getState().setImage(currentImageId, imageLocation);
        console.log('✅ React: Image set in viewManagerStore:', currentImageId);
        
        // Verify critical components are available
        if (w.vars?.hidden_mask && w.vars?.mask && w.vars?.user_mask) {
          console.log('✅ React: All mask components verified:', {
            hasHiddenMask: !!w.vars.hidden_mask,
            maskLength: w.vars.mask.length,
            userMaskLength: w.vars.user_mask.length,
            maskShape: w.getMaskShapeFromStore ? w.getMaskShapeFromStore() : null
          });
        } else {
          console.warn('⚠️ React: Some mask components missing after init_views');
        }
      } else {
        console.error('❌ React: init_views function not available');
      }
    } catch (error) {
      console.error('❌ React: Views and mask data initialization failed:', error);
    }
  };

  // Sync Zustand store with DOM (mask layer visibility)
  // This updates the canvas layers when store changes
  useEffect(() => {
    const unsubscribe = useSegmentationStore.subscribe(
      (state) => {
        const showMask = state.showMask;
        const w = window as any;
        
        // Update DOM directly (mask layer visibility)
        // This replicates the behavior of legacy show_mask() function
        const viewManager = w.getViewManagerFromStore ? w.getViewManagerFromStore() : null;
        if (viewManager) {
          const displayState = showMask ? "block" : "none";
          try {
            const maskLayers = viewManager.getLayers("mask");
            for (let layer of maskLayers) {
              if (layer.container) {
                layer.container.style.display = displayState;
              }
            }
          } catch (error) {
            console.warn('Could not update mask layer visibility:', error);
          }
        } else {
          console.warn('[IRIS Migration] ⚠️ ViewManager not available for mask layer visibility');
        }
      }
    );
    
    return unsubscribe;
  }, []);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleOpenPreferences = useCallback(() => setIsPreferencesOpen(true), []);
  const handleOpenHelp = useCallback(() => setIsHelpOpen(true), []);
  const handleSelectClass = useCallback(() => setIsClassSelectionOpen(true), []);
  const handleResetMask = useCallback(() => setIsResetMaskOpen(true), []);
  const handleOpenProfile = useCallback(() => setIsProfileOpen(true), []);
  const handleOpenImageInfo = useCallback(() => setIsImageInfoOpen(true), []);
  const handleOpenConfusionMatrix = useCallback(() => setIsConfusionMatrixOpen(true), []);

  const handleOpenLogin = useCallback(() => {
    const w = window as any;
    if (w.hide_loader) w.hide_loader();
    setLoginMode('login');
    setIsLoginOpen(true);
  }, []);

  const handleOpenRegister = useCallback(() => {
    const w = window as any;
    if (w.hide_loader) w.hide_loader();
    setLoginMode('register');
    setIsLoginOpen(true);
  }, []);

  const handleOpenProfileWithId = useCallback((userId?: string) => {
    setProfileUserId(userId || 'current');
    setIsProfileOpen(true);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setIsLoginOpen(false);
    // Reload the page to reinitialize everything with authenticated state
    window.location.reload();
  }, []);

  // Setup segmentation with custom hook
  useSegmentationSetup({
    authChecked: authChecked && isAuthenticated,
    onOpenPreferences: handleOpenPreferences,
    onOpenLogin: handleOpenLogin,
    onOpenRegister: handleOpenRegister,
    onOpenProfile: handleOpenProfileWithId,
    onOpenHelp: handleOpenHelp
  });

  // Override legacy dialogue functions to use React modals
  useEffect(() => {
    (window as any).dialogue_reset_mask = () => setIsResetMaskOpen(true);
    (window as any).dialogue_class_selection = () => setIsClassSelectionOpen(true);
    (window as any).dialogue_image = () => setIsImageInfoOpen(true);
    (window as any).dialogue_confusion_matrix = () => setIsConfusionMatrixOpen(true);
  }, []);

  return (
    <div>
      <SegmentationToolbar
        onExportGeoTIFF={exportGeoTIFF}
        onSelectClass={handleSelectClass}
        onResetMask={handleResetMask}
        onOpenHelp={handleOpenHelp}
        onOpenPreferences={handleOpenPreferences}
      />

      <ViewerComparison />

      <SegmentationStatusBar
        onOpenProfile={handleOpenProfile}
        onOpenImageInfo={handleOpenImageInfo}
        onOpenConfusionMatrix={handleOpenConfusionMatrix}
      />

      <SegmentationModals
        isPreferencesOpen={isPreferencesOpen}
        onClosePreferences={() => setIsPreferencesOpen(false)}
        isProfileOpen={isProfileOpen}
        onCloseProfile={() => setIsProfileOpen(false)}
        profileUserId={profileUserId}
        isLoginOpen={isLoginOpen}
        loginMode={loginMode}
        onLoginSuccess={handleLoginSuccess}
        isHelpOpen={isHelpOpen}
        onCloseHelp={() => setIsHelpOpen(false)}
        isResetMaskOpen={isResetMaskOpen}
        onCloseResetMask={() => setIsResetMaskOpen(false)}
        onConfirmResetMask={() => {
          const w = window as any;
          if (w.reset_mask) w.reset_mask();
        }}
        isClassSelectionOpen={isClassSelectionOpen}
        onCloseClassSelection={() => setIsClassSelectionOpen(false)}
        isImageInfoOpen={isImageInfoOpen}
        onCloseImageInfo={() => setIsImageInfoOpen(false)}
        isConfusionMatrixOpen={isConfusionMatrixOpen}
        onCloseConfusionMatrix={() => setIsConfusionMatrixOpen(false)}
      />

      {/* React Development Indicator */}
      {(window.location.search.includes('debug=1') || window.location.hostname === 'localhost') && (
        <div style={{
          position: 'fixed',
          bottom: '0',
          right: '0',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '4px 8px',
          fontSize: '11px',
          fontFamily: 'monospace',
          zIndex: 9999,
          borderTopLeftRadius: '4px',
          opacity: 0.8,
          pointerEvents: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          ⚛️ React SPA v{React.version}
        </div>
      )}
    </div>
  );
};

// Initialize React when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    const container = document.getElementById('react-segmentation-app');
    if (container) {
      const root = createRoot(container);
      root.render(<SegmentationApp />);
    } else {
      console.error('❌ React mount container not found! Looking for #react-segmentation-app');
    }
  } catch (error) {
    console.error('❌ Failed to mount React Segmentation App:', error);
  }
});

export default SegmentationApp;