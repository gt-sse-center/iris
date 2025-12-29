import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSegmentationStore } from './segmentationStore';

// Mock window object with proper typing
interface MockVars {
  vm?: {
    filters: {
      brightness: number;
      saturation: number;
      contrast: boolean;
      invert: boolean;
    };
    render: ReturnType<typeof vi.fn>;
    getLayers?: ReturnType<typeof vi.fn>;
  };
  tool: {
    size: number;
    type: string;
    resizing_mode: boolean;
  };
}

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
    tool: {
      size: 5,
      type: 'draw',
      resizing_mode: false,
    },
  } as MockVars,
  render_preview: vi.fn(),
};

Object.defineProperty(window, 'vars', {
  value: mockWindow.vars,
  writable: true,
});

// Mock global functions
Object.defineProperty(window, 'render_preview', {
  value: mockWindow.render_preview,
  writable: true,
});

// Mock dispatchEvent for React preview layer updates
const mockDispatchEvent = vi.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
});

// Add getToolSizeFromStore to window for testing
declare global {
  interface Window {
    getToolSizeFromStore?: () => number;
    getToolResizingModeFromStore?: () => boolean;
  }
}

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
    expect(mockWindow.vars.vm?.filters.brightness).toBe(150);
    
    store.setBrightness(1000); // Should clamp to 800
    expect(useSegmentationStore.getState().brightness).toBe(800);
    
    // Test incremental changes
    store.changeBrightness(false); // Should decrease by 10
    expect(useSegmentationStore.getState().brightness).toBe(790);
    
    // Test legacy render is called
    expect(mockWindow.vars.vm?.render).toHaveBeenCalled();
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
    expect(mockWindow.vars.vm?.filters.brightness).toBe(100);
  });
});

describe('segmentationStore - Tool Size Migration', () => {
  beforeEach(() => {
    const store = useSegmentationStore.getState();
    // Reset to default tool size
    store.setToolSize(5);
    vi.clearAllMocks();
  });

  it('manages tool size with proper bounds and legacy sync', () => {
    const store = useSegmentationStore.getState();
    
    // Test normal tool size setting
    store.setToolSize(10);
    expect(useSegmentationStore.getState().toolSize).toBe(10);
    expect(mockWindow.vars.tool.size).toBe(10);
    
    // Test lower bound clamping
    store.setToolSize(0);
    expect(useSegmentationStore.getState().toolSize).toBe(1);
    expect(mockWindow.vars.tool.size).toBe(1);
    
    // Test upper bound clamping
    store.setToolSize(150);
    expect(useSegmentationStore.getState().toolSize).toBe(100);
    expect(mockWindow.vars.tool.size).toBe(100);
    
    // Test negative values
    store.setToolSize(-5);
    expect(useSegmentationStore.getState().toolSize).toBe(1);
    expect(mockWindow.vars.tool.size).toBe(1);
  });

  it('triggers preview render when tool size changes', () => {
    const store = useSegmentationStore.getState();
    
    // Mock ViewManager initialization
    if (mockWindow.vars.vm) {
      mockWindow.vars.vm.getLayers = vi.fn();
    }
    
    store.setToolSize(15);
    
    // Should trigger legacy preview render
    expect(mockWindow.render_preview).toHaveBeenCalled();
    
    // Should trigger React preview layer update
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'react-preview-render'
      })
    );
  });

  it('handles initialization gracefully when ViewManager not ready', () => {
    const store = useSegmentationStore.getState();
    
    // Remove ViewManager to simulate initialization state
    mockWindow.vars.vm = undefined;
    
    // Should not throw error
    expect(() => store.setToolSize(20)).not.toThrow();
    expect(useSegmentationStore.getState().toolSize).toBe(20);
  });

  it('provides helper function for legacy JavaScript access', () => {
    const store = useSegmentationStore.getState();
    store.setToolSize(25);
    
    // Test global helper function
    expect(window.getToolSizeFromStore).toBeDefined();
    expect(window.getToolSizeFromStore?.()).toBe(25);
  });
});

describe('segmentationStore - Tool Resizing Mode Migration', () => {
  beforeEach(() => {
    const store = useSegmentationStore.getState();
    // Reset to default resizing mode
    store.setToolResizingMode(false);
    vi.clearAllMocks();
  });

  it('manages tool resizing mode with legacy sync', () => {
    const store = useSegmentationStore.getState();
    
    // Test setting resizing mode
    store.setToolResizingMode(true);
    expect(useSegmentationStore.getState().toolResizingMode).toBe(true);
    expect(mockWindow.vars.tool.resizing_mode).toBe(true);
    
    // Test disabling resizing mode
    store.setToolResizingMode(false);
    expect(useSegmentationStore.getState().toolResizingMode).toBe(false);
    expect(mockWindow.vars.tool.resizing_mode).toBe(false);
  });

  it('provides helper function for legacy JavaScript access', () => {
    const store = useSegmentationStore.getState();
    store.setToolResizingMode(true);
    
    // Test global helper function
    expect(window.getToolResizingModeFromStore).toBeDefined();
    expect(window.getToolResizingModeFromStore?.()).toBe(true);
  });

  it('handles boolean validation correctly', () => {
    const store = useSegmentationStore.getState();
    
    // Test with boolean values
    store.setToolResizingMode(true);
    expect(useSegmentationStore.getState().toolResizingMode).toBe(true);
    
    store.setToolResizingMode(false);
    expect(useSegmentationStore.getState().toolResizingMode).toBe(false);
  });

  it('defaults to false (zoom mode)', () => {
    const store = useSegmentationStore.getState();
    
    // Should default to false (zoom mode, not resize mode)
    expect(store.toolResizingMode).toBe(false);
  });
});