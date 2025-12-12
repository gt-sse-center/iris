import { describe, it, expect, beforeEach } from 'vitest';
import { useViewManagerStore, initializeViewManagerFromLegacy } from './viewManagerStore';

describe('viewManagerStore', () => {
  beforeEach(() => {
    // Reset store state
    useViewManagerStore.setState({
      views: [],
      viewGroups: [],
      currentGroup: 0,
      imageId: null,
    });
  });

  it('initializes with default state', () => {
    const state = useViewManagerStore.getState();
    expect(state.views).toEqual([]);
    expect(state.currentGroup).toBe(0);
    expect(state.imageId).toBeNull();
  });

  it('updates current group', () => {
    const { setCurrentGroup } = useViewManagerStore.getState();
    setCurrentGroup(2);
    expect(useViewManagerStore.getState().currentGroup).toBe(2);
  });

  it('initializes from legacy vars', () => {
    // Mock window.vars
    (window as any).vars = {
      config: {
        views: { 'test-view': { name: 'test-view', type: 'rgb' } },
        view_groups: [['test-view']],
      },
      image_id: 'test-image',
      image_shape: [100, 100],
    };

    initializeViewManagerFromLegacy();
    const state = useViewManagerStore.getState();
    expect(state.imageId).toBe('test-image');
    expect(Object.keys(state.views)).toHaveLength(1);
  });
});