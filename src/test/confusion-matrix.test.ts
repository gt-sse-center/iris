/**
 * Confusion Matrix Store Tests
 * 
 * Tests the confusion matrix functionality in the segmentation store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSegmentationStore } from '../stores/segmentationStore';

// Mock window object
const mockWindow = {
  vars: {} as any,
  segmentationStore: null as any
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

describe('Confusion Matrix Store', () => {
  beforeEach(() => {
    // Reset store state
    useSegmentationStore.getState().clearConfusionMatrix();
    
    // Reset mock window
    mockWindow.vars = {};
    mockWindow.segmentationStore = useSegmentationStore;
  });

  it('should create and update confusion matrix with correct structure', () => {
    const store = useSegmentationStore.getState();
    
    // Test data
    const matrix = [[10, 2], [3, 15]];
    const truePositives = { 0: 10, 1: 15 };
    const userClasses = [0, 1];
    const classNames = ['Clear', 'Cloud'];
    
    // Create and update confusion matrix
    const confusionMatrix = store.createConfusionMatrix(matrix, truePositives, userClasses, classNames);
    store.updateConfusionMatrix(confusionMatrix);
    
    // Get fresh state after update
    const updatedState = useSegmentationStore.getState();
    
    // Verify structure and content
    expect(updatedState.confusionMatrix).not.toBeNull();
    expect(updatedState.confusionMatrix?.matrix).toEqual(matrix);
    expect(updatedState.confusionMatrix?.classCount).toBe(2);
    expect(updatedState.confusionMatrix?.totalSamples).toBe(30);
    expect(updatedState.confusionMatrix?.classes).toEqual(classNames);
    expect(updatedState.confusionMatrix?.timestamp).toBeInstanceOf(Date);
    
    // Verify accuracy stats structure
    const stats = updatedState.confusionMatrix?.accuracyStats;
    expect(stats).toHaveProperty('overall');
    expect(stats).toHaveProperty('perClass');
    expect(stats).toHaveProperty('worstClass');
    expect(stats).toHaveProperty('worstAccuracy');
    expect(stats).toHaveProperty('truePositives', truePositives);
    
    // Verify legacy sync (should sync the raw matrix for backward compatibility)
    expect(mockWindow.vars.confusion_matrix).toEqual(matrix);
  });

  it('should clear confusion matrix from store and legacy vars', () => {
    const store = useSegmentationStore.getState();
    
    // Set initial matrix
    const matrix = [[1, 0], [0, 1]];
    const confusionMatrix = store.createConfusionMatrix(matrix, { 0: 1, 1: 1 }, [0, 1], ['A', 'B']);
    store.updateConfusionMatrix(confusionMatrix);
    
    // Verify it's set
    expect(useSegmentationStore.getState().confusionMatrix).not.toBeNull();
    expect(mockWindow.vars.confusion_matrix).toEqual(matrix);
    
    // Clear matrix
    store.clearConfusionMatrix();
    
    // Verify it's cleared
    expect(useSegmentationStore.getState().confusionMatrix).toBeNull();
    expect(mockWindow.vars.confusion_matrix).toBeNull();
  });

  it('should validate confusion matrix structure on update', () => {
    const store = useSegmentationStore.getState();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Test invalid matrix object
    store.updateConfusionMatrix(null as any);
    expect(consoleSpy).toHaveBeenCalledWith('[IRIS] updateConfusionMatrix: Invalid matrix object', null);
    
    // Test invalid matrix array
    const invalidMatrix = {
      matrix: null,
      classCount: 2,
      totalSamples: 10,
      accuracyStats: { overall: 0.8, perClass: [], worstClass: null, worstAccuracy: 0.8, truePositives: {} },
      timestamp: new Date(),
      classes: ['A', 'B']
    };
    store.updateConfusionMatrix(invalidMatrix as any);
    expect(consoleSpy).toHaveBeenCalledWith('[IRIS] updateConfusionMatrix: Invalid matrix array');
    
    // Test non-square matrix
    const nonSquareMatrix = {
      matrix: [[1, 2], [3]], // Second row is shorter
      classCount: 2,
      totalSamples: 6,
      accuracyStats: { overall: 0.8, perClass: [], worstClass: null, worstAccuracy: 0.8, truePositives: {} },
      timestamp: new Date(),
      classes: ['A', 'B']
    };
    store.updateConfusionMatrix(nonSquareMatrix as any);
    expect(consoleSpy).toHaveBeenCalledWith('[IRIS] updateConfusionMatrix: Matrix is not square');
    
    consoleSpy.mockRestore();
  });

  it('should handle edge cases in accuracy calculation', () => {
    const store = useSegmentationStore.getState();
    
    // Test with empty matrix
    const emptyMatrix = store.createConfusionMatrix([], {}, [], []);
    expect(emptyMatrix.accuracyStats.overall).toBe(0);
    expect(emptyMatrix.accuracyStats.worstClass).toBeNull();
    expect(emptyMatrix.totalSamples).toBe(0);
    
    // Test with single class
    const singleClassMatrix = store.createConfusionMatrix([[5]], { 0: 5 }, [0], ['Single']);
    expect(singleClassMatrix.classCount).toBe(1);
    expect(singleClassMatrix.totalSamples).toBe(5);
  });
});