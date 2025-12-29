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
  cursor_image: [number, number];
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
    cursor_image: [0, 0],
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
    getCursorImageFromStore?: () => [number, number];
    setCursorImageInStore?: (x: number, y: number) => void;
    getCurrentToolFromStore?: () => 'move' | 'draw' | 'eraser';
    setCurrentToolInStore?: (tool: 'move' | 'draw' | 'eraser') => void;
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

describe('segmentationStore - Cursor Image Migration', () => {
  beforeEach(() => {
    const store = useSegmentationStore.getState();
    // Reset to default cursor position
    store.setCursorImage([0, 0]);
    vi.clearAllMocks();
  });

  it('manages cursor image coordinates with legacy sync', () => {
    const store = useSegmentationStore.getState();
    
    // Test setting cursor coordinates
    store.setCursorImage([100, 200]);
    expect(useSegmentationStore.getState().cursorImage).toEqual([100, 200]);
    expect(mockWindow.vars.cursor_image).toEqual([100, 200]);
    
    // Test updating coordinates
    store.setCursorImage([50, 75]);
    expect(useSegmentationStore.getState().cursorImage).toEqual([50, 75]);
    expect(mockWindow.vars.cursor_image).toEqual([50, 75]);
  });

  it('validates coordinate input', () => {
    const store = useSegmentationStore.getState();
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Test invalid inputs
    store.setCursorImage([100] as any); // Wrong length
    expect(consoleSpy).toHaveBeenCalledWith('[IRIS] setCursorImage: Invalid coordinates provided', [100]);
    
    store.setCursorImage(['100', '200'] as any); // Wrong type
    expect(consoleSpy).toHaveBeenCalledWith('[IRIS] setCursorImage: Invalid coordinates provided', ['100', '200']);
    
    store.setCursorImage(null as any); // Null input
    expect(consoleSpy).toHaveBeenCalledWith('[IRIS] setCursorImage: Invalid coordinates provided', null);
    
    consoleSpy.mockRestore();
  });

  it('provides helper functions for legacy JavaScript access', () => {
    const store = useSegmentationStore.getState();
    store.setCursorImage([150, 250]);
    
    // Test global helper functions
    expect(window.getCursorImageFromStore).toBeDefined();
    expect(window.setCursorImageInStore).toBeDefined();
    expect(window.getCursorImageFromStore?.()).toEqual([150, 250]);
    
    // Test setting through helper
    window.setCursorImageInStore?.(300, 400);
    expect(useSegmentationStore.getState().cursorImage).toEqual([300, 400]);
  });

  it('handles coordinate array immutability', () => {
    const store = useSegmentationStore.getState();
    const coords = [100, 200] as [number, number];
    store.setCursorImage(coords);
    
    // Modifying original array shouldn't affect store
    coords[0] = 999;
    expect(useSegmentationStore.getState().cursorImage).toEqual([100, 200]);
  });

  it('defaults to [0, 0] coordinates', () => {
    // Fresh store should have default cursor position
    const store = useSegmentationStore.getState();
    expect(store.cursorImage).toEqual([0, 0]);
  });

  it('handles negative coordinates correctly', () => {
    const store = useSegmentationStore.getState();
    
    // Test negative coordinates (valid for image coordinates)
    store.setCursorImage([-50, -100]);
    expect(useSegmentationStore.getState().cursorImage).toEqual([-50, -100]);
    expect(mockWindow.vars.cursor_image).toEqual([-50, -100]);
  });

  it('handles decimal coordinates correctly', () => {
    const store = useSegmentationStore.getState();
    
    // Test decimal coordinates (valid for image coordinates)
    store.setCursorImage([123.456, 789.012]);
    expect(useSegmentationStore.getState().cursorImage).toEqual([123.456, 789.012]);
    expect(mockWindow.vars.cursor_image).toEqual([123.456, 789.012]);
  });
});
describe('segmentationStore - Tool Type Migration', () => {
  beforeEach(() => {
    const store = useSegmentationStore.getState();
    // Reset to default tool
    store.setCurrentTool('draw');
    vi.clearAllMocks();
  });

  it('manages tool type with legacy sync', () => {
    const store = useSegmentationStore.getState();
    
    // Test setting tool type
    store.setCurrentTool('move');
    expect(useSegmentationStore.getState().currentTool).toBe('move');
    expect(mockWindow.vars.tool.type).toBe('move');
    
    // Test updating tool type
    store.setCurrentTool('eraser');
    expect(useSegmentationStore.getState().currentTool).toBe('eraser');
    expect(mockWindow.vars.tool.type).toBe('eraser');
  });

  it('validates tool type input', () => {
    const store = useSegmentationStore.getState();
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Test invalid inputs
    store.setCurrentTool('invalid' as any);
    expect(consoleSpy).toHaveBeenCalledWith('[IRIS] setCurrentTool: Invalid tool type provided', 'invalid');
    
    // Should not change current tool
    expect(useSegmentationStore.getState().currentTool).toBe('draw'); // Should remain default
    
    consoleSpy.mockRestore();
  });

  it('provides helper functions for legacy JavaScript access', () => {
    const store = useSegmentationStore.getState();
    store.setCurrentTool('move');
    
    // Test global helper functions
    expect(window.getCurrentToolFromStore).toBeDefined();
    expect(window.setCurrentToolInStore).toBeDefined();
    expect(window.getCurrentToolFromStore?.()).toBe('move');
    
    // Test setting through helper
    window.setCurrentToolInStore?.('eraser');
    expect(useSegmentationStore.getState().currentTool).toBe('eraser');
  });

  it('handles all valid tool types', () => {
    const store = useSegmentationStore.getState();
    const validTools = ['move', 'draw', 'eraser'] as const;
    
    validTools.forEach(tool => {
      store.setCurrentTool(tool);
      expect(useSegmentationStore.getState().currentTool).toBe(tool);
      expect(mockWindow.vars.tool.type).toBe(tool);
    });
  });

  it('defaults to draw tool', () => {
    // Fresh store should have default tool
    const store = useSegmentationStore.getState();
    expect(store.currentTool).toBe('draw');
  });

  it('updates DOM elements when tool changes', () => {
    const store = useSegmentationStore.getState();
    const mockGetObject = vi.fn();
    const mockButton = { classList: { remove: vi.fn(), add: vi.fn() } };
    
    (window as any).get_object = mockGetObject;
    mockGetObject.mockReturnValue(mockButton);
    
    store.setCurrentTool('move');
    
    // Should remove checked class from all tools
    expect(mockGetObject).toHaveBeenCalledWith('tb_tool_move');
    expect(mockGetObject).toHaveBeenCalledWith('tb_tool_draw');
    expect(mockGetObject).toHaveBeenCalledWith('tb_tool_eraser');
    
    // Should add checked class to current tool
    expect(mockButton.classList.add).toHaveBeenCalledWith('checked');
  });

  it('triggers preview render when tool changes', () => {
    const store = useSegmentationStore.getState();
    const mockRenderPreview = vi.fn();
    
    // Mock the render_preview function and ViewManager
    (window as any).render_preview = mockRenderPreview;
    (window as any).vars = {
      ...mockWindow.vars,
      vm: { getLayers: vi.fn() }
    };
    
    store.setCurrentTool('move');
    
    expect(mockRenderPreview).toHaveBeenCalled();
  });

  it('handles initialization gracefully when ViewManager not ready', () => {
    const store = useSegmentationStore.getState();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Remove ViewManager to simulate initialization state
    delete (window as any).vars.vm;
    
    expect(() => store.setCurrentTool('move')).not.toThrow();
    expect(useSegmentationStore.getState().currentTool).toBe('move');
    expect(consoleSpy).toHaveBeenCalledWith('[IRIS] setCurrentTool: Skipping render_preview, ViewManager not initialized yet');
    
    consoleSpy.mockRestore();
  });
});