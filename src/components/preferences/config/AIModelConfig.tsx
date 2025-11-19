import React from 'react';
import { FormInput, FormSlider, FormCheckbox, FormSelect } from './FormField';

interface AIModelConfigProps {
  unverifiedThreshold: number;
  setUnverifiedThreshold: (value: number) => void;
  aiModel: string;
  setAiModel: (value: string) => void;
  bands: string;
  setBands: (value: string) => void;
  trainRatio: number;
  setTrainRatio: (value: number) => void;
  maxTrainPixels: number;
  setMaxTrainPixels: (value: number) => void;
  nEstimators: number;
  setNEstimators: (value: number) => void;
  maxDepth: number;
  setMaxDepth: (value: number) => void;
  nLeaves: number;
  setNLeaves: (value: number) => void;
  suppressionThreshold: number;
  setSuppressionThreshold: (value: number) => void;
  suppressionFilterSize: number;
  setSuppressionFilterSize: (value: number) => void;
  suppressionDefaultClass: number;
  setSuppressionDefaultClass: (value: number) => void;
  useEdgeFilter: boolean;
  setUseEdgeFilter: (value: boolean) => void;
  useSuperpixels: boolean;
  setUseSuperpixels: (value: boolean) => void;
  useMeshgrid: boolean;
  setUseMeshgrid: (value: boolean) => void;
  meshgridCells: number;
  setMeshgridCells: (value: number) => void;
}

const AIModelConfig: React.FC<AIModelConfigProps> = ({
  unverifiedThreshold,
  setUnverifiedThreshold,
  aiModel,
  setAiModel,
  bands,
  setBands,
  trainRatio,
  setTrainRatio,
  maxTrainPixels,
  setMaxTrainPixels,
  nEstimators,
  setNEstimators,
  maxDepth,
  setMaxDepth,
  nLeaves,
  setNLeaves,
  suppressionThreshold,
  setSuppressionThreshold,
  suppressionFilterSize,
  setSuppressionFilterSize,
  suppressionDefaultClass,
  setSuppressionDefaultClass,
  useEdgeFilter,
  setUseEdgeFilter,
  useSuperpixels,
  setUseSuperpixels,
  useMeshgrid,
  setUseMeshgrid,
  meshgridCells,
  setMeshgridCells,
}) => {
  return (
    <>
      <FormInput
        label="Unverified Threshold"
        value={unverifiedThreshold}
        onChange={(value) => setUnverifiedThreshold(parseInt(value) || 0)}
        type="number"
        description="TODO Number of unverified users contributing masks above which to tag an image 'unverified'."
      />

      <FormSelect
        label="IrisSegAIModel"
        options={['IrisSegAIModel*']}
        value={aiModel}
        onChange={setAiModel}
        required
      />

      <FormInput label="Bands" value={bands} onChange={setBands} type="text" required />

      <FormSlider
        label="Train Ratio"
        value={trainRatio}
        onChange={setTrainRatio}
        min={0}
        max={1}
        step={0.01}
      />

      <FormSlider
        label="Max Train Pixels"
        value={maxTrainPixels}
        onChange={setMaxTrainPixels}
        min={0}
        max={100000}
        step={1000}
      />

      <FormSlider label="N Estimators" value={nEstimators} onChange={setNEstimators} min={1} max={200} step={1} />

      <FormSlider label="Max Depth" value={maxDepth} onChange={setMaxDepth} min={1} max={100} step={1} />

      <FormSlider label="N Leaves" value={nLeaves} onChange={setNLeaves} min={1} max={100} step={1} />

      <FormSlider
        label="Suppression Threshold"
        value={suppressionThreshold}
        onChange={setSuppressionThreshold}
        min={0}
        max={100}
        step={1}
      />

      <FormInput
        label="Suppression Filter Size"
        value={suppressionFilterSize}
        onChange={(value) => setSuppressionFilterSize(parseInt(value) || 0)}
        type="number"
      />

      <FormInput
        label="Suppression Default Class"
        value={suppressionDefaultClass}
        onChange={(value) => setSuppressionDefaultClass(parseInt(value) || 0)}
        type="number"
      />

      <FormCheckbox label="Use Edge Filter" checked={useEdgeFilter} onChange={setUseEdgeFilter} />

      <FormCheckbox label="Use Superpixels" checked={useSuperpixels} onChange={setUseSuperpixels} />

      <FormCheckbox label="Use Meshgrid" checked={useMeshgrid} onChange={setUseMeshgrid} />

      <FormInput
        label="Meshgrid Cells"
        value={meshgridCells}
        onChange={(value) => setMeshgridCells(parseInt(value) || 0)}
        type="number"
      />
    </>
  );
};

export default AIModelConfig;
