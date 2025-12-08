/**
 * Image Navigation Dropdown Component
 * 
 * Displays current image name and allows navigation to any image in the project.
 * Shows annotation status for each image.
 * 
 * Uses Zustand store as single source of truth for image list.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSegmentationStore } from '../../../stores/segmentationStore';

interface ImageNavigationDropdownProps {
  onNavigate: (imageId: string) => void;
}

export const ImageNavigationDropdown: React.FC<ImageNavigationDropdownProps> = ({
  onNavigate,
}) => {
  const { images, currentImageId } = useSegmentationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleImageSelect = (imageId: string) => {
    setIsOpen(false);
    if (imageId !== currentImageId) {
      onNavigate(imageId);
    }
  };

  const getStatusIcon = (image: { has_user_annotation: boolean; has_any_annotation: boolean }) => {
    if (image.has_user_annotation) {
      return '✓'; // User has annotated
    } else if (image.has_any_annotation) {
      return '○'; // Others have annotated
    }
    return ''; // No annotations
  };

  const getStatusClass = (image: { has_user_annotation: boolean; has_any_annotation: boolean }) => {
    if (image.has_user_annotation) {
      return 'image-status-user';
    } else if (image.has_any_annotation) {
      return 'image-status-others';
    }
    return 'image-status-none';
  };

  return (
    <li
      className="toolbutton icon_button image-navigation-dropdown"
      ref={dropdownRef}
      style={{ width: '200px', position: 'relative' }}
    >
      <div
        onClick={() => {
          console.log('Dropdown clicked, current state:', isOpen, 'images:', images.length);
          setIsOpen(!isOpen);
        }}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          lineHeight: '28px',
          fontSize: '18px',
          fontWeight: 'normal'
        }}
        title="Select image to navigate"
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentImageId}
        </span>
        <span style={{ marginLeft: '8px', fontSize: '12px' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div className="image-dropdown-menu">
          {images.length === 0 ? (
            <div className="image-dropdown-loading">No images loaded</div>
          ) : (
            <>
              <div className="image-dropdown-header">
                <span>Image</span>
                <span>Status</span>
              </div>
              <div className="image-dropdown-list">
                {images.map((image, index) => {
                  console.log(`🖼️ Rendering image ${index}:`, image.image_id, 'current:', image.image_id === currentImageId);
                  return (
                    <div
                      key={image.image_id}
                      className={`image-dropdown-item ${
                        image.image_id === currentImageId ? 'current' : ''
                      } ${getStatusClass(image)}`}
                      onClick={() => handleImageSelect(image.image_id)}
                    >
                      <span className="image-name" style={{ color: '#000', fontSize: '14px', fontWeight: 'normal' }}>
                        {image.image_id}
                      </span>
                    <span className="image-status" title={
                      image.has_user_annotation
                        ? 'You have annotated this image'
                        : image.has_any_annotation
                        ? `${image.annotation_count} annotation(s) by others`
                        : 'No annotations'
                    }>
                      {getStatusIcon(image)}
                      {image.annotation_count > 0 && (
                        <span className="annotation-count">({image.annotation_count})</span>
                      )}
                    </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
};
