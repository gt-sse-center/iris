import React, { useState, useEffect, useCallback } from 'react';
import { UserConfig, UserConfigApiResponse, AIModelConfig } from '../types/iris';
import SegmentationAITab from './preferences/SegmentationAITab';
import ViewsTab from './preferences/ViewsTab';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  const [allBands, setAllBands] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'segmentation-ai' | 'views'>('segmentation-ai');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
      setAllBands(data.all_bands);
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
    <div id="dialogue" className="dialogue" style={{ display: 'block' }}>
      <div className="dialogue-content">
        <div className="dialogue-header">
          <span className="dialogue-close" onClick={onClose}>
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
                <button
                  className={`tablinks ${activeTab === 'segmentation-ai' ? 'checked' : ''}`}
                  onClick={() => setActiveTab('segmentation-ai')}
                >
                  Segmentation AI
                </button>
                <button
                  className={`tablinks ${activeTab === 'views' ? 'checked' : ''}`}
                  onClick={() => setActiveTab('views')}
                >
                  Views
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'segmentation-ai' && (
                <SegmentationAITab
                  config={config}
                  allBands={allBands}
                  updateAIModelConfig={updateAIModelConfig}
                  moveBands={moveBands}
                />
              )}

              {activeTab === 'views' && <ViewsTab />}

              {/* Error Display */}
              {error && (
                <p className="tag red" style={{ display: 'block' }}>
                  {error}
                </p>
              )}

              {/* Action Buttons */}
              <p>
                <button onClick={saveConfig} disabled={isLoading || isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={onClose} disabled={isSaving}>
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
