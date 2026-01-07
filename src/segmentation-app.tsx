import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import SegmentationToolbar from './components/segmentation/SegmentationToolbar';
import SegmentationStatusBar from './components/segmentation/SegmentationStatusBar';
import SegmentationModals from './components/segmentation/SegmentationModals';
import ViewerComparison from './components/segmentation/ViewerComparison';
import { useSegmentationSetup } from './components/segmentation/hooks/useSegmentationSetup';
import { useSegmentationStore } from './stores/segmentationStore';
import { useViewManagerStore } from './stores/viewManagerStore';
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

  // Export GeoTIFF function - memoized to prevent re-renders
  const exportGeoTIFF = useCallback(async () => {
    try {
      const imageId = window.vars?.image_id;
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

  // Initialize legacy segmentation system
  useEffect(() => {
    const initializeLegacySystem = () => {
      const w = window as any;
      
      // Wait for legacy scripts to be loaded
      if (typeof w.init_segmentation === 'function') {
        console.log('🔧 Calling legacy init_segmentation...');
        w.init_segmentation();
      } else {
        console.warn('❌ Legacy scripts failed to load - init_segmentation not found');
      }
    };

    // Try multiple times with increasing delays to ensure scripts are loaded
    const tryInit = (attempt: number = 1) => {
      if (typeof window.init_segmentation === 'function') {
        initializeLegacySystem();
      } else if (attempt < 10) {
        setTimeout(() => tryInit(attempt + 1), attempt * 100);
      } else {
        console.error('❌ Failed to find init_segmentation after 10 attempts');
      }
    };

    tryInit();
  }, []);

  // Initialize ViewManager store from React store config (not legacy vars)
  useEffect(() => {
    const initializeViewManager = () => {
      const config = useSegmentationStore.getState().config;
      console.log('🔧 initializeViewManager called, config:', config ? 'available' : 'null', 'views:', config?.views ? 'available' : 'missing');
      
      if (config && config.views) {
        console.log('🔧 Initializing ViewManager from React store config...');
        
        const viewManagerStore = useViewManagerStore.getState();
        
        // Set views from config
        const views: { [name: string]: any } = {};
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
        
        console.log('🔧 ViewManager: Setting views:', Object.keys(views));
        viewManagerStore.setViews(views);
        
        // Set view groups - handle both array and object formats
        if (config.view_groups) {
          console.log('🔧 ViewManager: Setting view groups:', config.view_groups);
          if (Array.isArray(config.view_groups)) {
            // Convert array format to object format
            const viewGroupsObj: { [key: string]: string[] } = {};
            config.view_groups.forEach((group: string[], index: number) => {
              viewGroupsObj[`group_${index}`] = group;
            });
            viewManagerStore.setViewGroups(viewGroupsObj);
          } else {
            viewManagerStore.setViewGroups(config.view_groups);
          }
        } else {
          const viewNames = Object.keys(views);
          if (viewNames.length > 0) {
            viewManagerStore.setViewGroups({ default: viewNames.slice(0, 3) });
          }
        }
        
        // Set image info
        const currentImageId = window.vars?.image_id;
        if (currentImageId) {
          viewManagerStore.setImage(currentImageId, window.vars?.image_location || [0, 0]);
        }
        
        // Set image dimensions
        if (window.vars?.image_shape && window.vars.image_shape.length >= 2) {
          const [width, height] = window.vars.image_shape;
          viewManagerStore.setImageDimensions(width, height);
        }
        
        // Mark as initialized
        viewManagerStore.setInitialized(true);
        
        console.log('✅ ViewManager initialized from React store successfully');
      } else {
        console.log('⚠️ ViewManager: Config or views not available yet');
      }
    };

    // Subscribe to config changes in the segmentation store
    console.log('🔧 Setting up ViewManager subscription...');
    const unsubscribe = useSegmentationStore.subscribe(
      (state) => {
        console.log('🔧 Store subscription triggered, config available:', !!state.config, 'views available:', !!state.config?.views);
        const viewManagerState = useViewManagerStore.getState();
        const hasViews = Object.keys(viewManagerState.views).length > 0;
        
        // Initialize if we have config with views but ViewManager doesn't have views yet
        if (state.config && state.config.views && !hasViews) {
          console.log('🔧 Config detected in store and ViewManager has no views, initializing ViewManager...');
          // Add a small delay to ensure the config is fully processed
          setTimeout(() => {
            initializeViewManager();
          }, 100);
        }
      }
    );

    // Try to initialize immediately if config is already available
    console.log('🔧 Trying immediate ViewManager initialization...');
    initializeViewManager();

    return unsubscribe;
  }, []);

  // Initialize navigation store with image list
  useEffect(() => {
    const initializeNavigation = async () => {
      try {
        const currentImageId = window.vars?.image_id;
        if (!currentImageId) {
          console.warn('No current image ID found, skipping navigation initialization');
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
      } catch (error) {
        console.error('Failed to initialize navigation:', error);
      }
    };

    if (authChecked && isAuthenticated) {
      initializeNavigation();
    }
  }, [authChecked, isAuthenticated]);

  // Sync Zustand store with DOM (mask layer visibility)
  // This updates the canvas layers when store changes
  useEffect(() => {
    const unsubscribe = useSegmentationStore.subscribe(
      (state) => {
        const showMask = state.showMask;
        const w = window as any;
        
        // Update DOM directly (mask layer visibility)
        // This replicates the behavior of legacy show_mask() function
        if (w.vars?.vm) {
          const displayState = showMask ? "block" : "none";
          try {
            const maskLayers = w.vars.vm.getLayers("mask");
            for (let layer of maskLayers) {
              if (layer.container) {
                layer.container.style.display = displayState;
              }
            }
          } catch (error) {
            console.warn('Could not update mask layer visibility:', error);
          }
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

      <ViewerComparison showComparison={true} />

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