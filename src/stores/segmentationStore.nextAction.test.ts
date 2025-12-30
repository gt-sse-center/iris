/**
 * Tests for vars.next_action migration to React store
 * 
 * This test file covers the migration of vars.next_action to segmentationStore.nextAction
 * following the established migration pattern.
 */

import { vi } from 'vitest';
import { useSegmentationStore } from './segmentationStore';

// Mock window object for legacy compatibility tests
const mockWindow = () => {
  const w = window as any;
  w.vars = {
    next_action: null,
  };
  return w;
};

describe('SegmentationStore - Next Action Migration', () => {
  beforeEach(() => {
    // Reset store state
    useSegmentationStore.getState().setNextAction(null);
    
    // Clear any existing window vars
    const w = window as any;
    if (w.vars) {
      w.vars.next_action = null;
    }
  });

  describe('nextAction state management', () => {
    it('should initialize with null nextAction', () => {
      const { nextAction } = useSegmentationStore.getState();
      expect(nextAction).toBeNull();
    });

    it('should set nextAction callback function', async () => {
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      const { setNextAction } = useSegmentationStore.getState();
      
      setNextAction(mockCallback);
      
      const { nextAction } = useSegmentationStore.getState();
      expect(nextAction).toBe(mockCallback);
    });

    it('should clear nextAction by setting to null', () => {
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      const { setNextAction } = useSegmentationStore.getState();
      
      setNextAction(mockCallback);
      setNextAction(null);
      
      const { nextAction } = useSegmentationStore.getState();
      expect(nextAction).toBeNull();
    });

    it('should execute nextAction callback when called', async () => {
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      const { setNextAction } = useSegmentationStore.getState();
      
      setNextAction(mockCallback);
      
      const { nextAction } = useSegmentationStore.getState();
      if (nextAction) {
        await nextAction();
      }
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('legacy vars synchronization', () => {
    it('should sync nextAction to legacy vars.next_action when set', () => {
      const w = mockWindow();
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      const { setNextAction } = useSegmentationStore.getState();
      
      setNextAction(mockCallback);
      
      expect(w.vars.next_action).toBe(mockCallback);
    });

    it('should sync null to legacy vars.next_action when cleared', () => {
      const w = mockWindow();
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      const { setNextAction } = useSegmentationStore.getState();
      
      setNextAction(mockCallback);
      setNextAction(null);
      
      expect(w.vars.next_action).toBeNull();
    });

    it('should handle missing window.vars gracefully', () => {
      const w = window as any;
      delete w.vars;
      
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      const { setNextAction } = useSegmentationStore.getState();
      
      expect(() => setNextAction(mockCallback)).not.toThrow();
    });
  });

  describe('helper functions for legacy compatibility', () => {
    it('should provide getNextActionFromStore helper', () => {
      const w = window as any;
      expect(typeof w.getNextActionFromStore).toBe('function');
      
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      useSegmentationStore.getState().setNextAction(mockCallback);
      
      expect(w.getNextActionFromStore()).toBe(mockCallback);
    });

    it('should provide setNextActionInStore helper', () => {
      const w = window as any;
      expect(typeof w.setNextActionInStore).toBe('function');
      
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      w.setNextActionInStore(mockCallback);
      
      expect(useSegmentationStore.getState().nextAction).toBe(mockCallback);
    });

    it('should handle null values in helper functions', () => {
      const w = window as any;
      
      w.setNextActionInStore(null);
      expect(useSegmentationStore.getState().nextAction).toBeNull();
      expect(w.getNextActionFromStore()).toBeNull();
    });
  });

  describe('initialization flow simulation', () => {
    it('should simulate init_segmentation flow', async () => {
      const mockInitViews = vi.fn().mockResolvedValue(undefined);
      const { setNextAction } = useSegmentationStore.getState();
      
      // Simulate init_segmentation setting next_action to init_views
      setNextAction(mockInitViews);
      
      // Simulate fetch_server_update executing next_action
      const { nextAction } = useSegmentationStore.getState();
      if (nextAction) {
        await nextAction();
        setNextAction(null);
      }
      
      expect(mockInitViews).toHaveBeenCalledTimes(1);
      expect(useSegmentationStore.getState().nextAction).toBeNull();
    });

    it('should handle async callback execution', async () => {
      let callbackExecuted = false;
      const asyncCallback = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        callbackExecuted = true;
      });
      
      const { setNextAction } = useSegmentationStore.getState();
      setNextAction(asyncCallback);
      
      const { nextAction } = useSegmentationStore.getState();
      if (nextAction) {
        await nextAction();
      }
      
      expect(asyncCallback).toHaveBeenCalledTimes(1);
      expect(callbackExecuted).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle callback execution errors gracefully', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'));
      const { setNextAction } = useSegmentationStore.getState();
      
      setNextAction(errorCallback);
      
      const { nextAction } = useSegmentationStore.getState();
      if (nextAction) {
        await expect(nextAction()).rejects.toThrow('Test error');
      }
      
      expect(errorCallback).toHaveBeenCalledTimes(1);
    });

    it('should validate callback is a function or null', () => {
      const { setNextAction } = useSegmentationStore.getState();
      
      // Valid values
      expect(() => setNextAction(null)).not.toThrow();
      expect(() => setNextAction(async () => {})).not.toThrow();
      
      // Note: TypeScript prevents invalid types at compile time,
      // but we can test runtime behavior if needed
    });
  });

  describe('migration pattern compliance', () => {
    it('should follow established migration pattern structure', () => {
      const store = useSegmentationStore.getState();
      
      // Should have state property
      expect('nextAction' in store).toBe(true);
      
      // Should have setter action
      expect(typeof store.setNextAction).toBe('function');
      
      // Should have helper functions on window
      const w = window as any;
      expect(typeof w.getNextActionFromStore).toBe('function');
      expect(typeof w.setNextActionInStore).toBe('function');
    });

    it('should maintain backward compatibility during migration', () => {
      const w = mockWindow();
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      
      // Set via React store
      useSegmentationStore.getState().setNextAction(mockCallback);
      
      // Should be accessible via legacy vars
      expect(w.vars.next_action).toBe(mockCallback);
      
      // Should be accessible via helper function
      expect(w.getNextActionFromStore()).toBe(mockCallback);
    });
  });
});