import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { FormInput, FormRadioGroup, FormCheckbox } from './FormField';
import MaskAreaConfig from './MaskAreaConfig';
import AIModelConfig, { AIModelConfigData } from './AIModelConfig';

const SegmentationSection = forwardRef<any, {}>((props, ref) => {
  // Basic Configuration
  const [path, setPath] = useState('');
  const [maskEnum, setMaskEnum] = useState('rgb');
  const [maskArea, setMaskArea] = useState('Mask Area option 2');
  const [maskAreaCoords, setMaskAreaCoords] = useState<number[]>([0, 0, 0, 0]);
  const [scoreEnum, setScoreEnum] = useState('f1');
  const [prioritiseUnmarked, setPrioritiseUnmarked] = useState(true);

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
      mask_area: maskArea,
      score: scoreEnum,
      prioritise_unmarked_images: prioritiseUnmarked,
      unverified_threshold: aiConfig.unverifiedThreshold,
      ai_model: {
        bands: aiConfig.bands,
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
      },
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
            maskArea={maskArea}
            setMaskArea={setMaskArea}
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

          <AIModelConfig config={aiConfig} onChange={setAiConfig} />

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
