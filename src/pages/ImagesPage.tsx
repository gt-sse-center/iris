import React, { useState, useEffect } from 'react';
import { ImageData, ImagesApiResponse } from '../types/iris';

// Declare global function from base.html
declare global {
  interface Window {
    goto_image: (mode: string, imageId: string) => void;
  }
}

const ImagesPage: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [orderBy, setOrderBy] = useState<string>('image_id');
  const [isAscending, setIsAscending] = useState<boolean>(true);

  const fetchImages = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/admin/api/images?order_by=${orderBy}&ascending=${isAscending}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ImagesApiResponse = await response.json();
      setImages(data.images);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 React Images page loaded (full React)');
    fetchImages();
  }, [orderBy, isAscending]);

  const handleGotoImage = (imageId: string) => {
    if (window.goto_image) {
      window.goto_image('segmentation', imageId);
    }
  };

  if (isLoading) {
    return <div>Loading images...</div>;
  }

  return (
    <div>
      {/* TypeScript Version Indicator */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '2px solid #2196f3',
        padding: '10px',
        margin: '10px 0',
        borderRadius: '5px',
        textAlign: 'center'
      }}>
        🚀 <strong>TypeScript React Images Page</strong> - Fully migrated from legacy templates!
      </div>

      {/* Sorting Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '400px',
        margin: '20px 0'
      }}>
        <span style={{ width: '150px' }}>Order by:</span>
        <select
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value)}
          className="with-arrow"
        >
          <option value="image_id">Image ID</option>
        </select>

        <label style={{ marginLeft: '10px' }}>
          <input
            type="checkbox"
            checked={isAscending}
            onChange={(e) => setIsAscending(e.target.checked)}
          />
          Ascending?
        </label>
      </div>

      {/* Images Table */}
      <table className="striped" style={{ width: '100%' }}>
        <thead>
          <tr style={{ fontWeight: 'bold' }}>
            <td>Image ID</td>
            <td>Segmentation Count</td>
            <td>Avg Score</td>
            <td>Avg Difficulty</td>
            <td>Avg Time (hours)</td>
          </tr>
        </thead>
        <tbody>
          {images.map((image) => {
            const segData = image.types.segmentation;
            return (
              <tr key={image.image_id}>
                <td>
                  <button onClick={() => handleGotoImage(image.image_id)}>
                    {image.image_id}
                  </button>
                </td>
                <td>{segData ? segData.count : 0}</td>
                <td>{segData ? segData.score.toFixed(2) : 'N/A'}</td>
                <td>{segData ? segData.difficulty.toFixed(2) : 'N/A'}</td>
                <td>{segData ? segData.time_spent.toFixed(2) : 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ImagesPage;