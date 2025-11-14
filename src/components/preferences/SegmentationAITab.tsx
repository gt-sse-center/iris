import React from 'react';
import { UserConfig, AIModelConfig } from '../../types/iris';
import BandSelector from './BandSelector';

/**
 * Segmentation AI Tab Component
 * 
 * Contains three accordion sections:
 * 1. Model Parameters - LightGBM model configuration
 * 2. Model Inputs - Feature selection (bands, edge filter, meshgrid, superpixels)
 * 3. Postprocessing - Suppression filter settings
 */
interface SegmentationAITabProps {
  config: UserConfig;
  allBands: string[];
  updateAIModelConfig: (key: keyof AIModelConfig, value: any) => void;
  moveBands: (from: 'included' | 'excluded', selectedBands: string[]) => void;
}

const SegmentationAITab: React.FC<SegmentationAITabProps> = ({
  config,
  allBands,
  updateAIModelConfig,
  moveBands,
}) => {
  return (
    <div id="config-segmentation-ai" className="iris-tabs-config tabcontent" style={{ display: 'block' }}>
      {/* Model Parameters Accordion */}
      <div
        className="accordion checked"
        onClick={(e) => {
          const panel = e.currentTarget.nextElementSibling as HTMLElement;
          const isVisible = panel.style.display === 'block';
          panel.style.display = isVisible ? 'none' : 'block';
          e.currentTarget.classList.toggle('checked');
        }}
      >
        Model Parameters
      </div>
      <div className="panel" style={{ display: 'block' }}>
        <table>
          <tbody>
            <tr>
              <td style={{ width: '300px' }}>Number of estimators:</td>
              <td style={{ width: '300px' }}>
                <div className="slider">
                  <input
                    type="number"
                    className="slider-value"
                    data-testid="input-n-estimators"
                    min="10"
                    max="200"
                    value={config.segmentation.ai_model.n_estimators}
                    onChange={(e) => updateAIModelConfig('n_estimators', parseInt(e.target.value) || 10)}
                    style={{ width: '60px', textAlign: 'center', border: '1px solid #ccc', padding: '2px' }}
                  />
                  <input
                    className="slider-widget"
                    type="range"
                    min="10"
                    max="200"
                    value={config.segmentation.ai_model.n_estimators}
                    onChange={(e) => updateAIModelConfig('n_estimators', parseInt(e.target.value))}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td>Maximal depth:</td>
              <td>
                <div className="slider">
                  <input type="number" className="slider-value" data-testid="input-max-depth" min="5" max="100" value={config.segmentation.ai_model.max_depth} onChange={(e) => updateAIModelConfig('max_depth', parseInt(e.target.value) || 5)} style={{ width: '60px', textAlign: 'center', border: '1px solid #ccc', padding: '2px' }} />
                  <input
                    className="slider-widget"
                    type="range"
                    min="5"
                    max="100"
                    value={config.segmentation.ai_model.max_depth}
                    onChange={(e) => updateAIModelConfig('max_depth', parseInt(e.target.value))}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td>Number of leaves:</td>
              <td>
                <div className="slider">
                  <input type="number" className="slider-value" data-testid="input-n-leaves" min="5" max="100" value={config.segmentation.ai_model.n_leaves} onChange={(e) => updateAIModelConfig('n_leaves', parseInt(e.target.value) || 5)} style={{ width: '60px', textAlign: 'center', border: '1px solid #ccc', padding: '2px' }} />
                  <input
                    className="slider-widget"
                    type="range"
                    min="5"
                    max="100"
                    value={config.segmentation.ai_model.n_leaves}
                    onChange={(e) => updateAIModelConfig('n_leaves', parseInt(e.target.value))}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td>Train ratio:</td>
              <td>
                <div className="slider">
                  <input
                    type="number"
                    className="slider-value"
                    min="10"
                    max="100"
                    value={Math.round(config.segmentation.ai_model.train_ratio * 100)}
                    onChange={(e) => updateAIModelConfig('train_ratio', (parseInt(e.target.value) || 10) / 100)}
                    style={{ width: '60px', textAlign: 'center', border: '1px solid #ccc', padding: '2px' }}
                  />
                  <span style={{ marginLeft: '5px' }}>%</span>
                  <input
                    className="slider-widget"
                    type="range"
                    min="10"
                    max="100"
                    value={config.segmentation.ai_model.train_ratio * 100}
                    onChange={(e) => updateAIModelConfig('train_ratio', parseInt(e.target.value) / 100)}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td>Max. number of training pixels per class:</td>
              <td>
                <div className="slider">
                  <input type="number" className="slider-value" min="100" max="50000" value={config.segmentation.ai_model.max_train_pixels} onChange={(e) => updateAIModelConfig('max_train_pixels', parseInt(e.target.value) || 100)} style={{ width: '80px', textAlign: 'center', border: '1px solid #ccc', padding: '2px' }} />
                  <input
                    className="slider-widget"
                    type="range"
                    min="100"
                    max="50000"
                    value={config.segmentation.ai_model.max_train_pixels}
                    onChange={(e) => updateAIModelConfig('max_train_pixels', parseInt(e.target.value))}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Model Inputs Accordion */}
      <div
        className="accordion checked"
        onClick={(e) => {
          const panel = e.currentTarget.nextElementSibling as HTMLElement;
          const isVisible = panel.style.display === 'block';
          panel.style.display = isVisible ? 'none' : 'block';
          e.currentTarget.classList.toggle('checked');
        }}
      >
        Model Inputs
      </div>
      <div className="panel" style={{ display: 'block' }}>
        <table>
          <tbody>
            <tr>
              <td>Use edge filter?</td>
              <td>
                <input
                  type="checkbox"
                  data-testid="checkbox-use-edge-filter"
                  checked={config.segmentation.ai_model.use_edge_filter}
                  onChange={(e) => updateAIModelConfig('use_edge_filter', e.target.checked)}
                />
              </td>
            </tr>
            <tr>
              <td>Use meshgrid?</td>
              <td>
                <input
                  type="checkbox"
                  data-testid="checkbox-use-meshgrid"
                  checked={config.segmentation.ai_model.use_meshgrid}
                  onChange={(e) => updateAIModelConfig('use_meshgrid', e.target.checked)}
                />
              </td>
            </tr>
            <tr>
              <td>Meshgrid cells</td>
              <td>
                <select
                  className="with-arrow"
                  data-testid="select-meshgrid-cells"
                  value={config.segmentation.ai_model.meshgrid_cells}
                  onChange={(e) => updateAIModelConfig('meshgrid_cells', e.target.value)}
                >
                  {['3x3', '5x5', '7x7', '10x10', '20x20', 'pixelwise'].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td>Use superpixels?</td>
              <td>
                <input
                  type="checkbox"
                  data-testid="checkbox-use-superpixels"
                  checked={config.segmentation.ai_model.use_superpixels}
                  onChange={(e) => updateAIModelConfig('use_superpixels', e.target.checked)}
                />
              </td>
            </tr>
            <tr>
              <td>Inputs bands</td>
              <td>
                <div style={{ display: 'flex' }}>
                  <div>
                    Bands to include
                    <BandSelector
                      bands={config.segmentation.ai_model.bands}
                      onSelectionChange={() => {}} // Handled by buttons
                      id="bands-included"
                      data-testid="select-bands-included"
                    />
                  </div>
                  <div style={{ width: '70px', display: 'flex', alignItems: 'center' }}>
                    <button
                      data-testid="button-move-bands-left"
                      onClick={() => {
                        const excludedSelect = document.getElementById('bands-excluded') as HTMLSelectElement;
                        const selected = Array.from(excludedSelect.selectedOptions).map((opt) => opt.value);
                        moveBands('excluded', selected);
                      }}
                    >
                      &lt;
                    </button>
                    <button
                      data-testid="button-move-bands-right"
                      onClick={() => {
                        const includedSelect = document.getElementById('bands-included') as HTMLSelectElement;
                        const selected = Array.from(includedSelect.selectedOptions).map((opt) => opt.value);
                        moveBands('included', selected);
                      }}
                    >
                      &gt;
                    </button>
                  </div>
                  <div>
                    Bands to exclude
                    <BandSelector
                      bands={allBands.filter((band) => !config.segmentation.ai_model.bands.includes(band))}
                      onSelectionChange={() => {}} // Handled by buttons
                      id="bands-excluded"
                      data-testid="select-bands-excluded"
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Postprocessing Accordion */}
      <div
        className="accordion checked"
        onClick={(e) => {
          const panel = e.currentTarget.nextElementSibling as HTMLElement;
          const isVisible = panel.style.display === 'block';
          panel.style.display = isVisible ? 'none' : 'block';
          e.currentTarget.classList.toggle('checked');
        }}
      >
        Postprocessing
      </div>
      <div className="panel" style={{ display: 'block' }}>
        <table>
          <tbody>
            <tr>
              <td style={{ width: '300px' }}>Suppression filter size:</td>
              <td style={{ width: '300px' }}>
                <select
                  className="with-arrow"
                  data-testid="select-suppression-filter-size"
                  value={config.segmentation.ai_model.suppression_filter_size}
                  onChange={(e) => updateAIModelConfig('suppression_filter_size', parseInt(e.target.value))}
                >
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="7">7</option>
                </select>
              </td>
            </tr>
            <tr>
              <td>Suppression filter threshold:</td>
              <td>
                <div className="slider">
                  <input type="number" className="slider-value" data-testid="input-suppression-threshold" min="0" max="100" value={config.segmentation.ai_model.suppression_threshold} onChange={(e) => updateAIModelConfig('suppression_threshold', parseInt(e.target.value) || 0)} style={{ width: '60px', textAlign: 'center', border: '1px solid #ccc', padding: '2px' }} /><span style={{ marginLeft: '5px' }}>%</span>
                  <input
                    className="slider-widget"
                    type="range"
                    min="0"
                    max="100"
                    value={config.segmentation.ai_model.suppression_threshold}
                    onChange={(e) => updateAIModelConfig('suppression_threshold', parseInt(e.target.value))}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td>Suppression filter background class:</td>
              <td>
                <select
                  className="with-arrow"
                  value={config.segmentation.ai_model.suppression_default_class}
                  onChange={(e) => updateAIModelConfig('suppression_default_class', parseInt(e.target.value))}
                >
                  {config.classes.map((cls, index) => (
                    <option key={index} value={index} style={{ backgroundColor: cls.css_colour }}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SegmentationAITab;
