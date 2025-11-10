import React from 'react';

/**
 * Views Tab Component
 * 
 * Placeholder for future views configuration functionality.
 * Currently displays "Not yet implemented" message matching legacy behavior.
 * 
 * Future functionality will allow users to configure:
 * - View layouts and arrangements
 * - Custom view groups
 * - View-specific settings
 */
const ViewsTab: React.FC = () => {
  return (
    <div id="config-views" className="iris-tabs-config tabcontent" style={{ display: 'block' }}>
      <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Not yet implemented.
      </p>
    </div>
  );
};

export default ViewsTab;
