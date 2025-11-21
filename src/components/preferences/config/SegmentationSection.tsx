import { useState, useImperativeHandle, forwardRef } from 'react';
import { FormInput, FormRadioGroup, FormCheckbox } from './FormField';
import MaskAreaConfig from './MaskAreaConfig';
import AIModelConfig, { AIModelConfigData } from './AIModelConfig';

const SegmentationSection = forwardRef<any, {}>((_props, ref) => {
  // Basic Configuration
  const [path, setPath] = useState('');
  const [maskEnum, setMaskEnum] = useState('rgb');
  const [maskAreaEnabled, setMaskAreaEnabled] = useState(false);
  const [maskAreaCoords, setMaskAreaCoords] = useState<number[]>([0, 0, 0, 0]);
  const [scoreEnum, setScoreEnum] = useState('f1');
  const [prioritiseUnmarked, setPrioritiseUnmarked] = useState(true);

  // AI Model Enable/Disable
  const [aiModelEnabled, setAiModelEnabled] = useState(true);

  // AI Model Configuration
  const [aiConfig, setAiConfig] = useState<AIModelConfigData>({
    unverifiedThreshold: 1,
    aiModel: 'IrisSegAIModel*',
    bands: '',
    trainRatio: 0.8,
    maxTrainPixels: 20000,
    nEstimators: 20,
    maxDepth: 10,
    nLeaves: 10,
    suppressionThreshold: 0,
    suppressionFilterSize: 5,
    suppressionDefaultClass: 0,
    useEdgeFilter: false,
    useSuperpixels: false,
    useMeshgrid: false,
    meshgridCells: '3x3',
  });

  const getData = () => {
    return {
      path,
      mask_encoding: maskEnum,
      mask_area: maskAreaEnabled ? maskAreaCoords : null, // Array of 4 ints or null
      score: scoreEnum,
      prioritise_unmarked_images: prioritiseUnmarked,
      unverified_threshold: aiConfig.unverifiedThreshold,
      test_images: null, // Issue #5: Always null, used for specifying test image IDs
      // AI model can be false (disabled) or full object (enabled)
      ai_model: aiModelEnabled
        ? {
            bands: aiConfig.bands.trim() ? aiConfig.bands : null, // Issue #4: Convert empty string to null
            train_ratio: aiConfig.trainRatio,
            max_train_pixels: aiConfig.maxTrainPixels,
            n_estimators: aiConfig.nEstimators,
            max_depth: aiConfig.maxDepth,
            n_leaves: aiConfig.nLeaves,
            suppression_threshold: aiConfig.suppressionThreshold,
            suppression_filter_size: aiConfig.suppressionFilterSize,
            suppression_default_class: aiConfig.suppressionDefaultClass,
            use_edge_filter: aiConfig.useEdgeFilter,
            use_superpixels: aiConfig.useSuperpixels,
            use_meshgrid: aiConfig.useMeshgrid,
            meshgrid_cells: aiConfig.meshgridCells,
          }
        : false,
    };
  };

  useImperativeHandle(ref, () => ({
    getData,
  }));

  const handleSubmit = () => {
    const data = getData();
    console.log('Segmentation Data:', JSON.stringify(data, null, 2));
  };

  return (
    <>
      <div
        className="accordion"
        onClick={(e) => {
          const panel = e.currentTarget.nextElementSibling as HTMLElement;
          const isVisible = panel.style.display === 'block';
          panel.style.display = isVisible ? 'none' : 'block';
          e.currentTarget.classList.toggle('checked');
        }}
      >
        Segmentation
      </div>
      <div className="panel" style={{ display: 'none' }}>
        <div style={{ padding: '16px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '12px' }}>IrisSegmentationConfig</h4>

          <FormInput
            label="Path"
            value={path}
            onChange={setPath}
            required
            description="This directory will contain the mask files from the segmentation. Four different mask formats are allowed: *.npy* *tif*, *png* or *jpeg*. Example: This will create a folder next to the project file called masks containing the mask files in *png* format."
            codeExample={`"path": "masks/{id}.png"`}
          />

          <FormRadioGroup
            label="SegMaskEnum"
            options={['integer', 'binary', 'rgb', 'rgba']}
            value={maskEnum}
            onChange={setMaskEnum}
            description="Allowed encodings for final masks. Not all mask formats support all encodings."
          />

          <MaskAreaConfig
            maskAreaEnabled={maskAreaEnabled}
            setMaskAreaEnabled={setMaskAreaEnabled}
            maskAreaCoords={maskAreaCoords}
            setMaskAreaCoords={setMaskAreaCoords}
          />

          <FormRadioGroup
            label="SegScoreEnum"
            options={['f1', 'jaccard', 'accuracy']}
            value={scoreEnum}
            onChange={setScoreEnum}
            description="Allowed score measure."
          />

          <FormCheckbox
            label="Prioritise Unmarked Images"
            checked={prioritiseUnmarked}
            onChange={setPrioritiseUnmarked}
            description="Mode to serve up images with the lowest number of annotations when user asks for next image."
          />

          {/* AI Model Enable/Disable Toggle */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={aiModelEnabled}
                onChange={(e) => setAiModelEnabled(e.target.checked)}
                style={{ width: '40px', height: '20px', cursor: 'pointer' }}
              />
              <label style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAiModelEnabled(!aiModelEnabled)}>
                Enable AI Model
              </label>
            </div>
            <small style={{ display: 'block', color: '#666', lineHeight: '1.5' }}>
              {aiModelEnabled
                ? 'AI-assisted segmentation is enabled. Configure the model parameters below.'
                : 'AI-assisted segmentation is disabled. The ai_model field will be set to false.'}
            </small>
          </div>

          {/* AI Model Configuration - Only show when enabled */}
          {aiModelEnabled && <AIModelConfig config={aiConfig} onChange={setAiConfig} />}

          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 24px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </>
  );
});

SegmentationSection.displayName = 'SegmentationSection';

export default SegmentationSection;
