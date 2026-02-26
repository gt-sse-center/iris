import React from 'react';
import { useSegmentationStore } from '../../stores/segmentationStore';
import { ImageNavigationDropdown } from './toolbar/ImageNavigationDropdown';

interface TopBarProps {
  onOpenPreferences: () => void;
  onOpenHelp: () => void;
  onOpenProfile: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onOpenPreferences, onOpenHelp, onOpenProfile }) => {
  const config = useSegmentationStore((state) => state.config);
  const projectName = config?.name || 'IRIS';
  
  const { 
    getPrevImageId, 
    getNextImageId, 
    navigateNext, 
    navigatePrev,
    saveCurrentMask,
    isLoading,
    maskChanged,
  } = useSegmentationStore();
  
  const hasPrev = getPrevImageId() !== null;
  const hasNext = getNextImageId() !== null;

  const handleNavigateToImage = (imageId: string) => {
    const w = window as any;
    const store = useSegmentationStore.getState();
    const hasUnsavedChanges = store.maskChanged;
    
    if (hasUnsavedChanges) {
      if (w.dialogue_before_next_image) {
        w.pendingNavigationImageId = imageId;
        w.dialogue_before_next_image();
      }
    } else {
      const url = `/segmentation/?image_id=${encodeURIComponent(imageId)}`;
      if (w.goto_url) {
        w.goto_url(url);
      } else {
        window.location.href = url;
      }
    }
  };

  const handlePrevious = async () => {
    if (maskChanged) {
      try {
        await saveCurrentMask();
        const prevImageId = navigatePrev();
        if (prevImageId) {
          const url = `/segmentation/?image_id=${encodeURIComponent(prevImageId)}`;
          const w = window as any;
          if (w.goto_url) {
            w.goto_url(url);
          } else {
            window.location.href = url;
          }
        }
      } catch (error) {
        console.error('Failed to save before navigation:', error);
      }
    } else {
      const prevImageId = navigatePrev();
      if (prevImageId) {
        const url = `/segmentation/?image_id=${encodeURIComponent(prevImageId)}`;
        const w = window as any;
        if (w.goto_url) {
          w.goto_url(url);
        } else {
          window.location.href = url;
        }
      }
    }
  };

  const handleNext = async () => {
    if (maskChanged) {
      try {
        await saveCurrentMask();
        const nextImageId = navigateNext();
        if (nextImageId) {
          const url = `/segmentation/?image_id=${encodeURIComponent(nextImageId)}`;
          const w = window as any;
          if (w.goto_url) {
            w.goto_url(url);
          } else {
            window.location.href = url;
          }
        }
      } catch (error) {
        console.error('Failed to save before navigation:', error);
      }
    } else {
      const nextImageId = navigateNext();
      if (nextImageId) {
        const url = `/segmentation/?image_id=${encodeURIComponent(nextImageId)}`;
        const w = window as any;
        if (w.goto_url) {
          w.goto_url(url);
        } else {
          window.location.href = url;
        }
      }
    }
  };

  const handleSave = async () => {
    try {
      await saveCurrentMask();
    } catch (error) {
      console.error('Failed to save mask:', error);
    }
  };

  const handleExportGeoTIFF = async () => {
    try {
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
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        backgroundColor: '#2c3e50',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Left: Project Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{projectName}</h1>
      </div>

      {/* Center: Image Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handlePrevious}
          disabled={!hasPrev || isLoading}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            cursor: !hasPrev || isLoading ? 'not-allowed' : 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '13px',
            opacity: !hasPrev || isLoading ? 0.5 : 1,
          }}
          title={hasPrev ? "Previous image" : "No previous image"}
        >
          ◀ Prev
        </button>
        
        <div style={{ color: 'white' }}>
          <ImageNavigationDropdown onNavigate={handleNavigateToImage} />
        </div>
        
        <button
          onClick={handleNext}
          disabled={!hasNext || isLoading}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            cursor: !hasNext || isLoading ? 'not-allowed' : 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '13px',
            opacity: !hasNext || isLoading ? 0.5 : 1,
          }}
          title={hasNext ? "Next image" : "No more images"}
        >
          Next ▶
        </button>
        
        <div style={{ width: '1px', height: '30px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 5px' }} />
        
        <button
          onClick={handleSave}
          disabled={isLoading}
          style={{
            background: maskChanged ? '#e74c3c' : 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: maskChanged ? 'bold' : 'normal',
          }}
          title={isLoading ? "Saving..." : maskChanged ? "Save mask (unsaved changes)" : "Save mask"}
        >
          💾 Save
        </button>
        
        <button
          onClick={handleExportGeoTIFF}
          disabled={isLoading}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '13px',
          }}
          title="Export GeoTIFF"
        >
          📥 Export
        </button>
      </div>

      {/* Right: User & Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenProfile}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="User Profile"
        >
          👤 Profile
        </button>
        <button
          onClick={onOpenPreferences}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="Settings"
        >
          ⚙️ Settings
        </button>
        <button
          onClick={onOpenHelp}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="Help"
        >
          ❓ Help
        </button>
      </div>
    </div>
  );
};

export default TopBar;
