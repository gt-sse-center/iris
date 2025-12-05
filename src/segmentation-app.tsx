import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import PreferencesModal from './components/PreferencesModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LoginForm } from './components/LoginForm';
import HelpModal from './components/HelpModal';
import ConfirmDialog from './components/ConfirmDialog';
import ClassSelectionModal from './components/ClassSelectionModal';
import ImageInfoModal from './components/ImageInfoModal';
import ConfusionMatrixModal from './components/ConfusionMatrixModal';

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

  // Export GeoTIFF function
  const exportGeoTIFF = async () => {
    try {
      const imageId = window.vars?.image_id;
      if (!imageId) {
        alert('No image loaded');
        return;
      }

      // Show loading message
      const w = window as any;
      if (w.show_message) w.show_message('Exporting GeoTIFF...');

      const response = await fetch(`/segmentation/api/export-geotiff/${imageId}`, {
        method: 'GET',
        credentials: 'same-origin'  // Include session cookies
      });

      if (response.ok) {
        // Create blob and download
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
  };

  // Mark auth as checked immediately - legacy JS handles authentication
  useEffect(() => {
    setAuthChecked(true);
  }, []);



  useEffect(() => {
    if (!authChecked) return;

    const isDebugMode = window.location.search.includes('debug=1') || window.location.hostname === 'localhost';
    
    if (isDebugMode) {
      console.log('🚀 IRIS Segmentation: React SPA initialized');
    }
    
    // Check if we should auto-open preferences (from admin navigation)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openPreferences') === 'true') {
      setIsPreferencesOpen(true);
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
        // This prevents segmentation.js from calling dialogue_login()
        fetch('/user/get/current')
          .then(response => {
            if (response.status === 403) {
              // Not authenticated - show React login modal
              if (isDebugMode) console.log('❌ Not authenticated, showing React login modal');
              setIsLoginOpen(true);
              // Don't call init_segmentation - wait for login
            } else {
              // Authenticated - proceed with initialization
              if (isDebugMode) console.log('✅ Authenticated, calling init_segmentation()');
              window.init_segmentation();
            }
          })
          .catch(error => {
            console.error('Auth check failed:', error);
            // On error, try to initialize anyway
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

    // Override the global dialogue_config function to use React modal
    (window as any).dialogue_config = () => {
      setIsPreferencesOpen(true);
    };

    // Expose function for legacy JS to open user profile
    // This is checked by dialogue_user() in user.js
    window.openUserProfile = (userId?: string) => {
      setProfileUserId(userId || 'current');
      setIsProfileOpen(true);
    };

    // Expose function for legacy JS to open login modal
    // This is checked by dialogue_login() in user.js
    window.openLogin = () => {
      // Hide the loader if it's showing (legacy JS may have triggered it)
      const w = window as any;
      if (w.hide_loader) w.hide_loader();
      setLoginMode('login');
      setIsLoginOpen(true);
    };

    // Expose function for legacy JS to open register modal
    // This is checked by dialogue_register() in user.js
    window.openRegister = () => {
      const w = window as any;
      if (w.hide_loader) w.hide_loader();
      setLoginMode('register');
      setIsLoginOpen(true);
    };

    // Expose logout function for React
    (window as any).reactLogout = async (callback?: () => void) => {
      await fetch('/user/logout');
      if (callback) {
        callback();
      } else {
        // Default behavior: reload page to show login
        window.location.reload();
      }
    };

    // Expose React functions for legacy JavaScript integration
    window.irisReactApp = {
      openHelpModal: () => setIsHelpOpen(true),
      openUserProfile: (userId?: string) => {
        setProfileUserId(userId || 'current');
        setIsProfileOpen(true);
      },
      openPreferences: () => setIsPreferencesOpen(true),
    };

    // Override legacy dialogue functions to use React modals
    (window as any).dialogue_reset_mask = () => setIsResetMaskOpen(true);
    (window as any).dialogue_class_selection = () => setIsClassSelectionOpen(true);
    (window as any).dialogue_image = () => setIsImageInfoOpen(true);
    (window as any).dialogue_confusion_matrix = () => setIsConfusionMatrixOpen(true);
  }, [authChecked]);

  return (
    <div>
      {/* All existing HTML content from segmentation.html - preserved exactly */}
      <ul className='toolbar' id="toolbar" style={{visibility: 'hidden'}}>
        <li className="toolbutton icon_button" id='tb_previous_image' onClick={() => {
          const w = window as any;
          if (w.save_mask && w.prev_image) w.save_mask(w.prev_image);
        }}>
          <img src="/segmentation/static/icons/previous.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_next_image' onClick={() => {
          const w = window as any;
          if (w.save_mask && w.next_image) w.save_mask(w.next_image);
        }}>
          <img src="/segmentation/static/icons/next.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_save_mask' onClick={() => {
          const w = window as any;
          if (w.save_mask) w.save_mask();
        }}>
          <img src="/segmentation/static/icons/save_mask.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_export_geotiff' onClick={exportGeoTIFF} title="Export GeoTIFF">
          <img src="/segmentation/static/icons/export.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_undo' onClick={() => {
          const w = window as any;
          if (w.undo) w.undo();
        }}>
          <img src="/segmentation/static/icons/undo.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_redo' onClick={() => {
          const w = window as any;
          if (w.redo) w.redo();
        }}>
          <img src="/segmentation/static/icons/redo.png" className="icon" />
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" id="tb_select_class" onClick={() => setIsClassSelectionOpen(true)} style={{width: '200px'}}>
          <div>
            <img src="/segmentation/static/icons/class.png" className="icon" style={{float: 'left'}} />
          </div>
          <div id="tb_current_class" style={{float: 'left', lineHeight: '28px', fontSize: '18px', fontWeight: 'normal'}}>
            No class
          </div>
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" id='tb_tool_move' onClick={() => {
          const w = window as any;
          if (w.set_tool) w.set_tool('move');
        }}>
          <img src="/segmentation/static/icons/move.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_tool_reset_views' onClick={() => {
          const w = window as any;
          if (w.reset_views) w.reset_views();
        }}>
          <img src="/segmentation/static/icons/reset_views.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_tool_draw' onClick={() => {
          const w = window as any;
          if (w.set_tool) w.set_tool('draw');
        }}>
          <img src="/segmentation/static/icons/pencil.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_tool_eraser' onClick={() => {
          const w = window as any;
          if (w.set_tool) w.set_tool('eraser');
        }}>
          <img src="/segmentation/static/icons/eraser.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_reset_mask' onClick={() => setIsResetMaskOpen(true)}>
          <img src="/segmentation/static/icons/reset_mask.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_predict_mask' onClick={() => {
          const w = window as any;
          if (w.predict_mask) w.predict_mask();
        }}>
          <img src="/segmentation/static/icons/ai.png" className="icon" />
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" id='tb_toggle_mask' onClick={() => {
          const w = window as any;
          if (w.vars && w.show_mask) {
            w.show_mask(!w.vars.show_mask);
          }
        }}>
          <img src="/segmentation/static/icons/show_mask.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_mask_final' onClick={() => {
          const w = window as any;
          if (w.set_mask_type) w.set_mask_type('final');
        }}>
          <img src="/segmentation/static/icons/mask_final.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_mask_user' onClick={() => {
          const w = window as any;
          if (w.set_mask_type) w.set_mask_type('user');
        }}>
          <img src="/segmentation/static/icons/mask_user.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_mask_errors' onClick={() => {
          const w = window as any;
          if (w.set_mask_type) w.set_mask_type('errors');
        }}>
          <img src="/segmentation/static/icons/mask_errors.png" className="icon" />
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" id='tb_brightness_up' onClick={() => {
          const w = window as any;
          if (w.change_brightness) w.change_brightness(true);
        }}>
          <img src="/segmentation/static/icons/brightness_up.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_brightness_down' onClick={() => {
          const w = window as any;
          if (w.change_brightness) w.change_brightness(false);
        }}>
          <img src="/segmentation/static/icons/brightness_down.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_saturation_up' onClick={() => {
          const w = window as any;
          if (w.change_saturation) w.change_saturation(true);
        }}>
          <img src="/segmentation/static/icons/saturation_up.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_saturation_down' onClick={() => {
          const w = window as any;
          if (w.change_saturation) w.change_saturation(false);
        }}>
          <img src="/segmentation/static/icons/saturation_down.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_toggle_contrast' onClick={() => {
          const w = window as any;
          if (w.vars?.vm?.filters && w.set_contrast) {
            w.set_contrast(!w.vars.vm.filters.contrast);
          }
        }}>
          <img src="/segmentation/static/icons/contrast.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_toggle_invert' onClick={() => {
          const w = window as any;
          if (w.vars?.vm?.filters && w.set_invert) {
            w.set_invert(!w.vars.vm.filters.invert);
          }
        }}>
          <img src="/segmentation/static/icons/invert.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id="tb_reset_filters" onClick={() => {
          const w = window as any;
          if (w.reset_filters) w.reset_filters();
        }}>
          <img src="/segmentation/static/icons/reset_filters.png" className="icon" />
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" onClick={() => setIsHelpOpen(true)}>
          <img src="/segmentation/static/icons/help.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" data-testid="preferences-button" onClick={() => setIsPreferencesOpen(true)}>
          <img src="/segmentation/static/icons/preferences.png" className="icon" />
        </li>
      </ul>

      <div id="views-container" style={{margin: '10px 0px', width: '100%'}}>
        {/* This will be filled up by the ViewManager */}
      </div>

      <div id="statusbar" className='statusbar' style={{visibility: 'hidden', position: 'fixed', bottom: '10px', zIndex: 10}}>
        <div className="statusbutton" onClick={() => setIsProfileOpen(true)} id="user-info">
          <div style={{float: 'left'}}>Login</div>
        </div>
        <div className="statusbutton" id="admin-button" onClick={() => window.open('/admin/', '_blank')}>
          <div style={{fontSize: '20px'}}>Admin</div>
        </div>
        <div className="statusbutton" style={{minWidth: '150px'}} onClick={() => setIsImageInfoOpen(true)} id="image-info">
          <div className="info-box-top">{window.vars?.image_id || 'Loading...'}</div>
          <div className="info-box-bottom">image-ID</div>
        </div>
        <div className="complete-statusbutton">
          <div id="different-classes" className="info-box-top">0</div>
          <div className="info-box-bottom">Classes</div>
        </div>
        <div className="complete-statusbutton">
          <div id="drawn-pixels" className="info-box-top">0</div>
          <div className="info-box-bottom">Drawn pixels</div>
        </div>
        <div className="statusbutton" onClick={() => setIsConfusionMatrixOpen(true)}>
          <div id="ai-score" className="info-box-top">0</div>
          <div className="info-box-bottom">AI-Score</div>
        </div>
        <div className="info-box">
          <img style={{float: 'left'}} src="/segmentation/static/icons/ai.png" />
          <div style={{fontSize: '16px', float: 'left', marginLeft: '10px'}} id="ai-recommendation">AI is loading</div>
        </div>
      </div>

      {/* Preferences Modal */}
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={profileUserId}
      />

      {/* Login/Register Modal - onSuccess will reload the page */}
      {isLoginOpen && (
        <LoginForm initialMode={loginMode} />
      )}

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Reset Mask Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetMaskOpen}
        onClose={() => setIsResetMaskOpen(false)}
        onConfirm={() => {
          const w = window as any;
          if (w.reset_mask) w.reset_mask();
        }}
        message="Are you sure you want to reset all your drawn pixels?"
        confirmText="Reset"
        cancelText="Cancel"
        type="warning"
      />

      {/* Class Selection Modal */}
      <ClassSelectionModal
        isOpen={isClassSelectionOpen}
        onClose={() => setIsClassSelectionOpen(false)}
      />

      {/* Image Info Modal */}
      <ImageInfoModal
        isOpen={isImageInfoOpen}
        onClose={() => setIsImageInfoOpen(false)}
      />

      {/* Confusion Matrix Modal */}
      <ConfusionMatrixModal
        isOpen={isConfusionMatrixOpen}
        onClose={() => setIsConfusionMatrixOpen(false)}
      />

      {/* React Development Indicator - Shows in development or when ?debug=1 */}
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