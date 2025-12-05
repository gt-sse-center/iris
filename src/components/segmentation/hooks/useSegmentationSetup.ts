import { useEffect } from 'react';

interface UseSegmentationSetupProps {
  authChecked: boolean;
  onOpenPreferences: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenProfile: (userId?: string) => void;
  onOpenHelp: () => void;
}

export const useSegmentationSetup = ({
  authChecked,
  onOpenPreferences,
  onOpenLogin,
  onOpenRegister,
  onOpenProfile,
  onOpenHelp
}: UseSegmentationSetupProps) => {
  useEffect(() => {
    if (!authChecked) return;

    const isDebugMode = window.location.search.includes('debug=1') || window.location.hostname === 'localhost';
    
    if (isDebugMode) {
      console.log('🚀 IRIS Segmentation: React SPA initialized');
    }
    
    // Check if we should auto-open preferences (from admin navigation)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openPreferences') === 'true') {
      onOpenPreferences();
      // Clean up URL parameter
      urlParams.delete('openPreferences');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
    
    // Wait for legacy JavaScript to load, then check auth and initialize
    const waitForLegacyScripts = setInterval(() => {
      if (window.init_segmentation) {
        clearInterval(waitForLegacyScripts);
        
        if (isDebugMode) console.log('✅ Legacy scripts loaded');
        
        // Check authentication BEFORE calling init_segmentation
        fetch('/user/get/current')
          .then(response => {
            if (response.status === 403) {
              if (isDebugMode) console.log('❌ Not authenticated, showing React login modal');
              onOpenLogin();
            } else {
              if (isDebugMode) console.log('✅ Authenticated, calling init_segmentation()');
              window.init_segmentation();
            }
          })
          .catch(error => {
            console.error('Auth check failed:', error);
            window.init_segmentation();
          });
      }
    }, 50);
    
    // Timeout waiting for scripts after 5 seconds
    setTimeout(() => {
      clearInterval(waitForLegacyScripts);
      if (!window.init_segmentation) {
        console.error('❌ Legacy scripts failed to load - init_segmentation not found');
      }
    }, 5000);

    // Override global dialogue functions to use React modals
    (window as any).dialogue_config = onOpenPreferences;
    window.openUserProfile = onOpenProfile;
    window.openLogin = onOpenLogin;
    window.openRegister = onOpenRegister;

    // Expose logout function for React
    (window as any).reactLogout = async (callback?: () => void) => {
      await fetch('/user/logout');
      if (callback) {
        callback();
      } else {
        window.location.reload();
      }
    };

    // Expose React functions for legacy JavaScript integration
    window.irisReactApp = {
      openHelpModal: onOpenHelp,
      openUserProfile: onOpenProfile,
      openPreferences: onOpenPreferences,
    };
  }, [authChecked, onOpenPreferences, onOpenLogin, onOpenRegister, onOpenProfile, onOpenHelp]);
};
