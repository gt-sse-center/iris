import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Declare global functions that exist in the legacy JavaScript
declare global {
  interface Window {
    init_segmentation: () => void;
    vars: any;
  }
}

const SegmentationApp: React.FC = () => {
  useEffect(() => {
    const isDebugMode = window.location.search.includes('debug=1') || window.location.hostname === 'localhost';
    
    if (isDebugMode) {
      console.log('🚀 IRIS Segmentation: React SPA initialized');
    }
    
    // Initialize the existing segmentation functionality
    // This calls the same init_segmentation function as before
    if (window.init_segmentation) {
      window.init_segmentation();
      if (isDebugMode) console.log('✅ Legacy segmentation initialized');
    } else {
      console.warn('⚠️ init_segmentation function not found');
    }
  }, []);

  return (
    <div>
      {/* All existing HTML content from segmentation.html - preserved exactly */}
      <ul className='toolbar' id="toolbar" style={{visibility: 'hidden'}}>
        <li className="toolbutton icon_button" id='tb_previous_image' onClick={() => (window as any).save_mask((window as any).prev_image)}>
          <img src="/segmentation/static/icons/previous.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_next_image' onClick={() => (window as any).save_mask((window as any).next_image)}>
          <img src="/segmentation/static/icons/next.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_save_mask' onClick={() => (window as any).save_mask()}>
          <img src="/segmentation/static/icons/save_mask.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_undo' onClick={() => (window as any).undo()}>
          <img src="/segmentation/static/icons/undo.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_redo' onClick={() => (window as any).redo()}>
          <img src="/segmentation/static/icons/redo.png" className="icon" />
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" id="tb_select_class" onClick={() => (window as any).dialogue_class_selection()} style={{width: '200px'}}>
          <div>
            <img src="/segmentation/static/icons/class.png" className="icon" style={{float: 'left'}} />
          </div>
          <div id="tb_current_class" style={{float: 'left', lineHeight: '28px', fontSize: '18px', fontWeight: 'normal'}}>
            No class
          </div>
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" id='tb_tool_move' onClick={() => (window as any).set_tool('move')}>
          <img src="/segmentation/static/icons/move.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_tool_reset_views' onClick={() => (window as any).reset_views()}>
          <img src="/segmentation/static/icons/reset_views.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_tool_draw' onClick={() => (window as any).set_tool('draw')}>
          <img src="/segmentation/static/icons/pencil.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_tool_eraser' onClick={() => (window as any).set_tool('eraser')}>
          <img src="/segmentation/static/icons/eraser.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_reset_mask' onClick={() => (window as any).dialogue_reset_mask()}>
          <img src="/segmentation/static/icons/reset_mask.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_predict_mask' onClick={() => (window as any).predict_mask()}>
          <img src="/segmentation/static/icons/ai.png" className="icon" />
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" id='tb_toggle_mask' onClick={() => (window as any).show_mask(!(window as any).vars.show_mask)}>
          <img src="/segmentation/static/icons/show_mask.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_mask_final' onClick={() => (window as any).set_mask_type('final')}>
          <img src="/segmentation/static/icons/mask_final.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_mask_user' onClick={() => (window as any).set_mask_type('user')}>
          <img src="/segmentation/static/icons/mask_user.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_mask_errors' onClick={() => (window as any).set_mask_type('errors')}>
          <img src="/segmentation/static/icons/mask_errors.png" className="icon" />
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" id='tb_brightness_up' onClick={() => (window as any).change_brightness(true)}>
          <img src="/segmentation/static/icons/brightness_up.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_brightness_down' onClick={() => (window as any).change_brightness(false)}>
          <img src="/segmentation/static/icons/brightness_down.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_saturation_up' onClick={() => (window as any).change_saturation(true)}>
          <img src="/segmentation/static/icons/saturation_up.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_saturation_down' onClick={() => (window as any).change_saturation(false)}>
          <img src="/segmentation/static/icons/saturation_down.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_toggle_contrast' onClick={() => (window as any).set_contrast(!(window as any).vars.vm.filters.contrast)}>
          <img src="/segmentation/static/icons/contrast.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id='tb_toggle_invert' onClick={() => (window as any).set_invert(!(window as any).vars.vm.filters.invert)}>
          <img src="/segmentation/static/icons/invert.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" id="tb_reset_filters" onClick={() => (window as any).reset_filters()}>
          <img src="/segmentation/static/icons/reset_filters.png" className="icon" />
        </li>
        <li className="toolbar_separator"></li>
        <li className="toolbutton icon_button" onClick={() => (window as any).dialogue_help()}>
          <img src="/segmentation/static/icons/help.png" className="icon" />
        </li>
        <li className="toolbutton icon_button" onClick={() => (window as any).dialogue_config()}>
          <img src="/segmentation/static/icons/preferences.png" className="icon" />
        </li>
      </ul>

      <div id="views-container" style={{margin: '10px 0px', width: '100%'}}>
        {/* This will be filled up by the ViewManager */}
      </div>

      <div id="statusbar" className='statusbar' style={{visibility: 'hidden', position: 'fixed', bottom: '10px', zIndex: 10}}>
        <div className="statusbutton" onClick={() => (window as any).dialogue_user()} id="user-info">
          <div style={{float: 'left'}}>Login</div>
        </div>
        <div className="statusbutton" id="admin-button" onClick={() => window.open('/admin/', '_blank')}>
          <div style={{fontSize: '20px'}}>Admin</div>
        </div>
        <div className="statusbutton" style={{minWidth: '150px'}} onClick={() => (window as any).dialogue_image()} id="image-info">
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
        <div className="statusbutton" onClick={() => (window as any).dialogue_confusion_matrix()}>
          <div id="ai-score" className="info-box-top">0</div>
          <div className="info-box-bottom">AI-Score</div>
        </div>
        <div className="info-box">
          <img style={{float: 'left'}} src="/segmentation/static/icons/ai.png" />
          <div style={{fontSize: '16px', float: 'left', marginLeft: '10px'}} id="ai-recommendation">AI is loading</div>
        </div>
      </div>

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
  const container = document.getElementById('react-segmentation-app');
  if (container) {
    const root = createRoot(container);
    root.render(<SegmentationApp />);
  } else {
    console.error('❌ React mount container not found! Looking for #react-segmentation-app');
  }
});

export default SegmentationApp;