import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ActionsPage: React.FC = () => {
  const params = useParams();
  const type = params.type;
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('🚀 React Actions page loaded (legacy content)');
    fetchLegacyContent();
  }, [type]);

  const fetchLegacyContent = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Fetch the legacy HTML content from Flask
      const response = await fetch(`/admin/fragments/actions/${type || 'segmentation'}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      setHtmlContent(data);
    } catch (error) {
      console.error('Error fetching actions content:', error);
      setHtmlContent('<p>Error loading actions data</p>');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading actions...</div>;
  }

  return (
    <div>
      {/* Legacy Content Indicator */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '2px solid #ffc107',
        padding: '10px',
        margin: '10px 0',
        borderRadius: '5px',
        textAlign: 'center'
      }}>
        ⚠️ <strong>Legacy Content</strong> - This page shows Flask-rendered content (to be converted to TypeScript React)
      </div>

      {/* Render legacy HTML content */}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
};

export default ActionsPage;