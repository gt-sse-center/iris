/**
 * Image Navigation Dropdown Component
 * 
 * Displays current image name and allows navigation to any image in the project.
 * Shows annotation status for each image.
 */

import React, { useState, useEffect, useRef } from 'react';

interface ImageInfo {
  image_id: string;
  has_user_annotation: boolean;
  has_any_annotation: boolean;
  annotation_count: number;
}

interface ImageNavigationDropdownProps {
  currentImageId: string;
  onNavigate: (imageId: string) => void;
}

export const ImageNavigationDropdown: React.FC<ImageNavigationDropdownProps> = ({
  currentImageId,
  onNavigate,
}) => {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    fetchImages();
  }, [currentImageId]);

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

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/segmentation/api/images/list?current_image_id=${encodeURIComponent(currentImageId)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      console.log('Fetched images:', data.images);
      setImages(data.images);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageId: string) => {
    setIsOpen(false);
    if (imageId !== currentImageId) {
      onNavigate(imageId);
    }
  };

  const getStatusIcon = (image: ImageInfo) => {
    if (image.has_user_annotation) {
      return '✓'; // User has annotated
    } else if (image.has_any_annotation) {
      return '○'; // Others have annotated
    }
    return ''; // No annotations
  };

  const getStatusClass = (image: ImageInfo) => {
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
        <div className="image-dropdown-menu" style={{ display: 'flex' }}>
          {loading ? (
            <div className="image-dropdown-loading">Loading images...</div>
          ) : (
            <>
              <div className="image-dropdown-header">
                <span>Image</span>
                <span>Status</span>
              </div>
              <div className="image-dropdown-list">
                {images.map((image) => {
                  console.log('Rendering image:', image.image_id);
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
