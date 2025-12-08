import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import SegmentationToolbar from './components/segmentation/SegmentationToolbar';
import SegmentationStatusBar from './components/segmentation/SegmentationStatusBar';
import SegmentationModals from './components/segmentation/SegmentationModals';
import { useSegmentationSetup } from './components/segmentation/hooks/useSegmentationSetup';
import { useSegmentationStore } from './stores/segmentationStore';

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

  // Mark auth as checked immediately - legacy JS handles authentication
  useEffect(() => {
    setAuthChecked(true);
  }, []);

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

  // Setup segmentation with custom hook
  useSegmentationSetup({
    authChecked,
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

      <div id="views-container" style={{ margin: '10px 0px', width: '100%' }}>
        {/* This will be filled up by the ViewManager */}
      </div>

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