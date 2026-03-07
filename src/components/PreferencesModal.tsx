import React, { useState, useEffect, useCallback } from 'react';
import { UserConfig, UserConfigApiResponse, AIModelConfig } from '../types/iris';
import SegmentationAITab from './preferences/SegmentationAITab';
import ViewsTab from './preferences/ViewsTab';
import ProjectConfigTab from './preferences/ProjectConfigTab';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConfigTabState {
  hasUnsavedChanges: boolean;
}

/**
 * Error boundary for the preferences modal
 */
class PreferencesErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PreferencesModal error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dialogue-body">
          <p className="tag red">
            An error occurred while loading preferences. Please refresh the page.
          </p>
          {this.state.error && (
            <p style={{ fontSize: '12px', color: '#666' }}>
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Main Preferences Modal Component
 * 
 * Provides a tabbed interface for configuring:
 * - Segmentation AI settings (model parameters, inputs, postprocessing)
 * - Views configuration (not yet implemented)
 */
const PreferencesModalContent: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<UserConfig | null>(null);
  const [allBands, setAllBands] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'configuration' | 'segmentation-ai' | 'views'>('segmentation-ai');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState<boolean>(false);
  const [configTabState, setConfigTabState] = useState<ConfigTabState>({ hasUnsavedChanges: false });

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    // Check Configuration tab state
    if (activeTab === 'configuration' && configTabState.hasUnsavedChanges) {
      return true;
    }
    
    // Check other tabs (Segmentation AI, Views)
    if (!config || !originalConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  }, [config, originalConfig, activeTab, configTabState]);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  // Force close without saving
  const forceClose = useCallback(() => {
    setShowUnsavedWarning(false);
    onClose();
  }, [onClose]);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/segmentation/api/user-config');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: UserConfigApiResponse = await response.json();
      setConfig(data.config);
      setOriginalConfig(JSON.parse(JSON.stringify(data.config))); // Deep copy
      setAllBands(data.all_bands);
      
      // Check if user is admin from the config response
      const isAdminUser = data.is_admin || false;
      setIsAdmin(isAdminUser);
      
      // Set default tab to configuration for admins
      if (isAdminUser) {
        setActiveTab('configuration');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setError('Failed to load preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch config when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen, fetchConfig]);

  // Disable keyboard shortcuts when modal is open, re-enable when closed
  useEffect(() => {
    if (isOpen) {
      // Save the original handlers
      const originalKeyDownHandler = document.body.onkeydown;
      const originalKeyUpHandler = document.body.onkeyup;
      
      // Disable the legacy keyboard shortcuts by replacing with a no-op
      document.body.onkeydown = (event: KeyboardEvent) => {
        // Allow Escape key to close the modal (with unsaved changes check)
        if (event.code === 'Escape') {
          handleClose();
          event.preventDefault();
          event.stopPropagation();
        }
        // Block all other keyboard shortcuts while modal is open
        return;
      };
      
      // Also disable key_up handler
      document.body.onkeyup = null;
      
      // Cleanup function to restore handlers when modal closes
      return () => {
        document.body.onkeydown = originalKeyDownHandler;
        document.body.onkeyup = originalKeyUpHandler;
      };
    }
  }, [isOpen, handleClose]);

  // Memoized save function with separate loading state
  const saveConfig = useCallback(async () => {
    if (!config) return;

    // Validation: Need at least one band
    if (config.segmentation.ai_model.bands.length === 0) {
      setError('[Segmentation] Need at least one band as input!');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const response = await fetch('/segmentation/api/user-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update original config to match saved config
      setOriginalConfig(JSON.parse(JSON.stringify(config)));
      onClose();
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [config, onClose]);

  const updateAIModelConfig = useCallback(
    (key: keyof AIModelConfig, value: any) => {
      if (!config) return;
      setConfig({
        ...config,
        segmentation: {
          ...config.segmentation,
          ai_model: {
            ...config.segmentation.ai_model,
            [key]: value,
          },
        },
      });
    },
    [config]
  );

  const moveBands = useCallback(
    (from: 'included' | 'excluded', selectedBands: string[]) => {
      if (!config) return;

      const currentBands = config.segmentation.ai_model.bands;
      let newBands: string[];

      if (from === 'excluded') {
        // Move from excluded to included
        newBands = [...currentBands, ...selectedBands];
      } else {
        // Move from included to excluded
        newBands = currentBands.filter((band) => !selectedBands.includes(band));
      }

      updateAIModelConfig('bands', newBands);
    },
    [config, updateAIModelConfig]
  );

  if (!isOpen) return null;

  return (
    <div id="dialogue" className="dialogue" style={{ display: 'block' }} data-testid="preferences-modal">
      <div className="dialogue-content">
        <div className="dialogue-header">
          <span className="dialogue-close" onClick={handleClose}>
            &times;
          </span>
          <h2>Preferences</h2>
        </div>
        <div className="dialogue-body">
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="loader-spin" style={{ margin: '0 auto 20px' }}></div>
              <p>Loading preferences...</p>
            </div>
          ) : config ? (
            <>
              {/* Tab Navigation */}
              <div className="tab">
                {isAdmin && (
                  <button
                    className={`tablinks ${activeTab === 'configuration' ? 'checked' : ''}`}
                    data-testid="tab-configuration"
                    onClick={() => {
                      setActiveTab('configuration');
                    }}
                  >
                    Configuration
                  </button>
                )}
                <button
                  className={`tablinks ${activeTab === 'segmentation-ai' ? 'checked' : ''}`}
                  data-testid="tab-segmentation-ai"
                  onClick={() => setActiveTab('segmentation-ai')}
                >
                  Segmentation AI
                </button>
                <button
                  className={`tablinks ${activeTab === 'views' ? 'checked' : ''}`}
                  data-testid="tab-views"
                  onClick={() => setActiveTab('views')}
                >
                  Views
                </button>
              </div>

              {/* Unsaved Changes Warning - Shown at top like other notifications */}
              {showUnsavedWarning && (
                <div style={{ 
                  padding: '15px', 
                  margin: '15px 0', 
                  backgroundColor: '#fff3cd', 
                  border: '1px solid #ffc107',
                  borderRadius: '4px'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                    You have unsaved changes!
                  </p>
                  <p style={{ margin: '0 0 10px 0' }}>
                    Are you sure you want to close without saving?
                  </p>
                  <button 
                    onClick={forceClose} 
                    style={{ marginRight: '10px' }}
                    data-testid="discard-changes-button"
                  >
                    Discard Changes
                  </button>
                  <button 
                    onClick={() => setShowUnsavedWarning(false)}
                    data-testid="cancel-close-button"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <p className="tag red" style={{ display: 'block' }} data-testid="preferences-error-message">
                  {error}
                </p>
              )}

              {/* Tab Content */}
              {activeTab === 'configuration' && isAdmin && (
                <ProjectConfigTab onStateChange={setConfigTabState} />
              )}

              {activeTab === 'segmentation-ai' && (
                <SegmentationAITab
                  config={config}
                  allBands={allBands}
                  updateAIModelConfig={updateAIModelConfig}
                  moveBands={moveBands}
                />
              )}

              {activeTab === 'views' && <ViewsTab />}

              {/* Action Buttons */}
              <p>
                {/* Hide Save button when Configuration tab is active (it has its own save button) */}
                {activeTab !== 'configuration' && (
                  <button onClick={saveConfig} disabled={isLoading || isSaving} data-testid="save-preferences-button">
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                )}
                <button onClick={handleClose} disabled={isSaving} data-testid="close-preferences-button">
                  Close
                </button>
              </p>
            </>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p className="tag red">Failed to load preferences</p>
              <button onClick={fetchConfig} style={{ marginTop: '10px' }}>
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main PreferencesModal component wrapped with error boundary
 */
const PreferencesModal: React.FC<PreferencesModalProps> = (props) => {
  return (
    <PreferencesErrorBoundary>
      <PreferencesModalContent {...props} />
    </PreferencesErrorBoundary>
  );
};

export default PreferencesModal;
