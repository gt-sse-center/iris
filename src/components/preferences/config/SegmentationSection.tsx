import React, { useState } from 'react';
import { FormInput, FormRadioGroup, FormCheckbox } from './FormField';
import MaskAreaConfig from './MaskAreaConfig';
import AIModelConfig from './AIModelConfig';

const SegmentationSection: React.FC = () => {
  // Basic Configuration
  const [path, setPath] = useState('');
  const [maskEnum, setMaskEnum] = useState('integer');
  const [maskArea, setMaskArea] = useState('Mask Area option 2');
  const [maskAreaCoords, setMaskAreaCoords] = useState<number[]>([0, 0, 0, 0]);
  const [scoreEnum, setScoreEnum] = useState('f1');
  const [prioritiseUnmarked, setPrioritiseUnmarked] = useState(true);

  // AI Model Configuration
  const [unverifiedThreshold, setUnverifiedThreshold] = useState(1);
  const [aiModel, setAiModel] = useState('IrisSegAIModel*');
  const [bands, setBands] = useState('');
  const [trainRatio, setTrainRatio] = useState(0.8);
  const [maxTrainPixels, setMaxTrainPixels] = useState(20000);
  const [nEstimators, setNEstimators] = useState(20);
  const [maxDepth, setMaxDepth] = useState(10);
  const [nLeaves, setNLeaves] = useState(10);
  const [suppressionThreshold, setSuppressionThreshold] = useState(0);
  const [suppressionFilterSize, setSuppressionFilterSize] = useState(0);
  const [suppressionDefaultClass, setSuppressionDefaultClass] = useState(0);
  const [useEdgeFilter, setUseEdgeFilter] = useState(false);
  const [useSuperpixels, setUseSuperpixels] = useState(false);
  const [useMeshgrid, setUseMeshgrid] = useState(false);
  const [meshgridCells, setMeshgridCells] = useState(0);

  const handleSubmit = () => {
    const data = {
      path,
      mask_encoding: maskEnum,
      mask_area: maskArea,
      score: scoreEnum,
      prioritise_unmarked: prioritiseUnmarked,
      unverified_threshold: unverifiedThreshold,
      ai_model: aiModel,
      bands,
      train_ratio: trainRatio,
      max_train_pixels: maxTrainPixels,
      n_estimators: nEstimators,
      max_depth: maxDepth,
      n_leaves: nLeaves,
      suppression_threshold: suppressionThreshold,
      suppression_filter_size: suppressionFilterSize,
      suppression_default_class: suppressionDefaultClass,
      use_edge_filter: useEdgeFilter,
      use_superpixels: useSuperpixels,
      use_meshgrid: useMeshgrid,
      meshgrid_cells: meshgridCells,
    };
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

          <AIModelConfig
            unverifiedThreshold={unverifiedThreshold}
            setUnverifiedThreshold={setUnverifiedThreshold}
            aiModel={aiModel}
            setAiModel={setAiModel}
            bands={bands}
            setBands={setBands}
            trainRatio={trainRatio}
            setTrainRatio={setTrainRatio}
            maxTrainPixels={maxTrainPixels}
            setMaxTrainPixels={setMaxTrainPixels}
            nEstimators={nEstimators}
            setNEstimators={setNEstimators}
            maxDepth={maxDepth}
            setMaxDepth={setMaxDepth}
            nLeaves={nLeaves}
            setNLeaves={setNLeaves}
            suppressionThreshold={suppressionThreshold}
            setSuppressionThreshold={setSuppressionThreshold}
            suppressionFilterSize={suppressionFilterSize}
            setSuppressionFilterSize={setSuppressionFilterSize}
            suppressionDefaultClass={suppressionDefaultClass}
            setSuppressionDefaultClass={setSuppressionDefaultClass}
            useEdgeFilter={useEdgeFilter}
            setUseEdgeFilter={setUseEdgeFilter}
            useSuperpixels={useSuperpixels}
            setUseSuperpixels={setUseSuperpixels}
            useMeshgrid={useMeshgrid}
            setUseMeshgrid={setUseMeshgrid}
            meshgridCells={meshgridCells}
            setMeshgridCells={setMeshgridCells}
          />

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
};

export default SegmentationSection;
