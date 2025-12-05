import React from 'react';

interface ImageInfoProps {
  onOpenImageInfo: () => void;
}

const ImageInfo: React.FC<ImageInfoProps> = ({ onOpenImageInfo }) => {
  return (
    <div
      className="statusbutton"
      style={{ minWidth: '150px' }}
      onClick={onOpenImageInfo}
      id="image-info"
    >
      <div className="info-box-top">{(window as any).vars?.image_id || 'Loading...'}</div>
      <div className="info-box-bottom">image-ID</div>
    </div>
  );
};

export default ImageInfo;
