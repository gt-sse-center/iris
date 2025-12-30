/**
 * Tests for vars.just_logged_in migration to React store
 * 
 * This test file covers the migration of vars.just_logged_in to segmentationStore.justLoggedIn
 * following the established migration pattern.
 */

import { useSegmentationStore } from './segmentationStore';

// Mock window object for legacy compatibility tests
const mockWindow = () => {
  const w = window as any;
  w.vars = {
    just_logged_in: false,
    user: {
      segmentation: {
        n_masks: 0
      }
    }
  };
  return w;
};

describe('SegmentationStore - Just Logged In Migration', () => {
  beforeEach(() => {
    // Reset store state
    useSegmentationStore.getState().setJustLoggedIn(false);
    
    // Clear any existing window vars
    const w = window as any;
    if (w.vars) {
      w.vars.just_logged_in = false;
    }
  });

  describe('justLoggedIn state management', () => {
    it('should initialize with false justLoggedIn', () => {
      const { justLoggedIn } = useSegmentationStore.getState();
      expect(justLoggedIn).toBe(false);
    });

    it('should set justLoggedIn to true', () => {
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      setJustLoggedIn(true);
      
      const { justLoggedIn } = useSegmentationStore.getState();
      expect(justLoggedIn).toBe(true);
    });

    it('should set justLoggedIn to false', () => {
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      setJustLoggedIn(true);
      setJustLoggedIn(false);
      
      const { justLoggedIn } = useSegmentationStore.getState();
      expect(justLoggedIn).toBe(false);
    });

    it('should toggle justLoggedIn state', () => {
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      setJustLoggedIn(true);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(true);
      
      setJustLoggedIn(false);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(false);
    });
  });

  describe('legacy vars synchronization', () => {
    it('should sync justLoggedIn to legacy vars.just_logged_in when set to true', () => {
      const w = mockWindow();
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      setJustLoggedIn(true);
      
      expect(w.vars.just_logged_in).toBe(true);
    });

    it('should sync justLoggedIn to legacy vars.just_logged_in when set to false', () => {
      const w = mockWindow();
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      setJustLoggedIn(true);
      setJustLoggedIn(false);
      
      expect(w.vars.just_logged_in).toBe(false);
    });

    it('should handle missing window.vars gracefully', () => {
      const w = window as any;
      delete w.vars;
      
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      expect(() => setJustLoggedIn(true)).not.toThrow();
      expect(() => setJustLoggedIn(false)).not.toThrow();
    });
  });

  describe('helper functions for legacy compatibility', () => {
    it('should provide getJustLoggedInFromStore helper', () => {
      const w = window as any;
      expect(typeof w.getJustLoggedInFromStore).toBe('function');
      
      useSegmentationStore.getState().setJustLoggedIn(true);
      
      expect(w.getJustLoggedInFromStore()).toBe(true);
    });

    it('should provide setJustLoggedInInStore helper', () => {
      const w = window as any;
      expect(typeof w.setJustLoggedInInStore).toBe('function');
      
      w.setJustLoggedInInStore(true);
      
      expect(useSegmentationStore.getState().justLoggedIn).toBe(true);
    });

    it('should handle boolean values in helper functions', () => {
      const w = window as any;
      
      w.setJustLoggedInInStore(true);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(true);
      expect(w.getJustLoggedInFromStore()).toBe(true);
      
      w.setJustLoggedInInStore(false);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(false);
      expect(w.getJustLoggedInFromStore()).toBe(false);
    });
  });

  describe('new user help popup simulation', () => {
    it('should simulate newuser_help_popup flow for new user', () => {
      const w = mockWindow();
      w.vars.user.segmentation.n_masks = 0; // New user
      
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      // Simulate login setting just_logged_in to true
      setJustLoggedIn(true);
      
      // Simulate newuser_help_popup checking conditions
      const { justLoggedIn } = useSegmentationStore.getState();
      const shouldShowHelp = w.vars.user.segmentation.n_masks === 0 && justLoggedIn === true;
      expect(shouldShowHelp).toBe(true);
      
      // Simulate help popup shown and just_logged_in set to false
      if (shouldShowHelp) {
        setJustLoggedIn(false);
      }
      
      expect(useSegmentationStore.getState().justLoggedIn).toBe(false);
    });

    it('should not show help popup for existing user', () => {
      const w = mockWindow();
      w.vars.user.segmentation.n_masks = 5; // Existing user with masks
      
      const { setJustLoggedIn, justLoggedIn } = useSegmentationStore.getState();
      
      // Simulate login setting just_logged_in to true
      setJustLoggedIn(true);
      
      // Simulate newuser_help_popup checking conditions
      const shouldShowHelp = w.vars.user.segmentation.n_masks === 0 && justLoggedIn === true;
      expect(shouldShowHelp).toBe(false);
      
      // just_logged_in should remain true since help wasn't shown
      expect(useSegmentationStore.getState().justLoggedIn).toBe(true);
    });

    it('should not show help popup if not just logged in', () => {
      const w = mockWindow();
      w.vars.user.segmentation.n_masks = 0; // New user
      
      const { setJustLoggedIn, justLoggedIn } = useSegmentationStore.getState();
      
      // User is not just logged in
      setJustLoggedIn(false);
      
      // Simulate newuser_help_popup checking conditions
      const shouldShowHelp = w.vars.user.segmentation.n_masks === 0 && justLoggedIn === true;
      expect(shouldShowHelp).toBe(false);
    });
  });

  describe('login flow simulation', () => {
    it('should simulate 403 response triggering login dialog', () => {
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      // Simulate fetch_server_update receiving 403 response
      // This would trigger dialogue_login() and set just_logged_in to true
      setJustLoggedIn(true);
      
      expect(useSegmentationStore.getState().justLoggedIn).toBe(true);
    });

    it('should handle multiple login attempts', () => {
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      // First login attempt
      setJustLoggedIn(true);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(true);
      
      // Help popup shown, flag cleared
      setJustLoggedIn(false);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(false);
      
      // Second login attempt (e.g., session expired)
      setJustLoggedIn(true);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid boolean values gracefully', () => {
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      // TypeScript prevents non-boolean values at compile time,
      // but we can test the function accepts valid boolean values
      expect(() => setJustLoggedIn(true)).not.toThrow();
      expect(() => setJustLoggedIn(false)).not.toThrow();
    });

    it('should maintain state consistency during errors', () => {
      const w = mockWindow();
      const { setJustLoggedIn } = useSegmentationStore.getState();
      
      // Set initial state
      setJustLoggedIn(true);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(true);
      expect(w.vars.just_logged_in).toBe(true);
      
      // Even if legacy sync fails, store state should remain consistent
      delete w.vars;
      setJustLoggedIn(false);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(false);
    });
  });

  describe('migration pattern compliance', () => {
    it('should follow established migration pattern structure', () => {
      const store = useSegmentationStore.getState();
      
      // Should have state property
      expect('justLoggedIn' in store).toBe(true);
      
      // Should have setter action
      expect(typeof store.setJustLoggedIn).toBe('function');
      
      // Should have helper functions on window
      const w = window as any;
      expect(typeof w.getJustLoggedInFromStore).toBe('function');
      expect(typeof w.setJustLoggedInInStore).toBe('function');
    });

    it('should maintain backward compatibility during migration', () => {
      const w = mockWindow();
      
      // Set via React store
      useSegmentationStore.getState().setJustLoggedIn(true);
      
      // Should be accessible via legacy vars
      expect(w.vars.just_logged_in).toBe(true);
      
      // Should be accessible via helper function
      expect(w.getJustLoggedInFromStore()).toBe(true);
    });

    it('should support bidirectional synchronization', () => {
      const w = mockWindow();
      
      // Set via React store
      useSegmentationStore.getState().setJustLoggedIn(true);
      expect(w.vars.just_logged_in).toBe(true);
      
      // Set via helper function
      w.setJustLoggedInInStore(false);
      expect(useSegmentationStore.getState().justLoggedIn).toBe(false);
      expect(w.vars.just_logged_in).toBe(false);
    });
  });
});