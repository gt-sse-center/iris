/**
 * Segmentation Store (Zustand)
 * 
 * This store gradually replaces the global `vars` object from legacy JavaScript.
 * During migration, the store syncs with legacy code via window bridge.
 * 
 * Migration Status:
 * - [x] showMask (vars.show_mask) - PROOF OF CONCEPT
 * - [ ] currentClass (vars.current_class)
 * - [ ] tool (vars.tool)
 * - [ ] config (vars.config)
 * - [ ] user (vars.user)
 * - [ ] mask data (vars.mask, vars.user_mask, etc.)
 */

import { create } from 'zustand';

interface SegmentationState {
  // Mask Visibility
  showMask: boolean;
  setShowMask: (visible: boolean) => void;
  toggleMask: () => void;
}

export const useSegmentationStore = create<SegmentationState>((set) => ({
  // Mask Visibility State
  showMask: true,
  
  setShowMask: (visible: boolean) => {
    set({ showMask: visible });
  },
  
  toggleMask: () => {
    set((state) => ({ showMask: !state.showMask }));
  },
}));

// Bridge for legacy JavaScript access during migration
// Legacy JS can call: window.segmentationStore.getState().setShowMask(true)
if (typeof window !== 'undefined') {
  (window as any).segmentationStore = useSegmentationStore;
}
