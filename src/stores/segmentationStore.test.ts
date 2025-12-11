import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSegmentationStore } from './segmentationStore';

// Mock window object
const mockWindow = {
  vars: {
    vm: {
      filters: {
        brightness: 100,
        saturation: 100,
        contrast: false,
        invert: false,
      },
      render: vi.fn(),
    },
  },
};

Object.defineProperty(window, 'vars', {
  value: mockWindow.vars,
  writable: true,
});

describe('segmentationStore - Filter Functions', () => {
  beforeEach(() => {
    const store = useSegmentationStore.getState();
    store.resetFilters();
    vi.clearAllMocks();
  });

  it('manages filter values with clamping and legacy sync', () => {
    const store = useSegmentationStore.getState();
    
    // Test brightness with clamping
    store.setBrightness(150);
    expect(useSegmentationStore.getState().brightness).toBe(150);
    expect(mockWindow.vars.vm.filters.brightness).toBe(150);
    
    store.setBrightness(1000); // Should clamp to 800
    expect(useSegmentationStore.getState().brightness).toBe(800);
    
    // Test incremental changes
    store.changeBrightness(false); // Should decrease by 10
    expect(useSegmentationStore.getState().brightness).toBe(790);
    
    // Test legacy render is called
    expect(mockWindow.vars.vm.render).toHaveBeenCalled();
  });

  it('handles exclusive slider expansion', () => {
    const store = useSegmentationStore.getState();
    
    expect(store.expandedFilterSlider).toBe(null);
    
    // Test exclusive expansion
    store.setExpandedFilterSlider('brightness');
    expect(useSegmentationStore.getState().expandedFilterSlider).toBe('brightness');
    
    store.setExpandedFilterSlider('saturation'); // Should replace brightness
    expect(useSegmentationStore.getState().expandedFilterSlider).toBe('saturation');
  });

  it('resets all filters to defaults', () => {
    const store = useSegmentationStore.getState();
    
    // Change values
    store.setBrightness(200);
    store.setContrast(true);
    
    // Reset
    store.resetFilters();
    
    const newState = useSegmentationStore.getState();
    expect(newState.brightness).toBe(100);
    expect(newState.contrast).toBe(false);
    expect(mockWindow.vars.vm.filters.brightness).toBe(100);
  });
});