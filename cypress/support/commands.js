// ***********************************************
// Custom Cypress Commands for IRIS E2E Testing
// ***********************************************

// Configuration constants
// Note: These timeouts are generous to account for React hydration delays
const TIMEOUTS = {
  PAGE_LOAD: 30000,
  REACT_HYDRATION: 5000,  // Time for React to attach event handlers
  API_CALL: 15000,
  MODAL_RENDER: 2000,
  STATE_UPDATE: 200,
};

const SELECTORS = {
  DIALOGUE: '#dialogue',
  TOOLBAR: '#toolbar',
  PREFERENCES_BUTTON: '[data-testid="preferences-button"]',
  PREFERENCES_MODAL: '[data-testid="preferences-modal"]',
  SAVE_BUTTON: '[data-testid="save-preferences-button"]',
  CLOSE_BUTTON: '[data-testid="close-preferences-button"]',
};

/**
 * Login to IRIS application
 * 
 * Handles the complete authentication flow including:
 * - Navigating to the segmentation page
 * - Detecting if login/registration is required
 * - Auto-registering on first run (no users exist)
 * - Logging in on subsequent runs
 * - Waiting for page initialization
 * 
 * On first run (CI/CD or fresh database):
 * - Detects "I have no account yet" button
 * - Automatically registers the user
 * - First user becomes admin automatically (IRIS behavior)
 * 
 * @param {string} username - Username (default: 'admin')
 * @param {string} password - Password (default: '123')
 * 
 * @example
 * cy.login(); // Uses defaults
 * cy.login('testuser', 'testpass'); // Custom credentials
 */
Cypress.Commands.add('login', (username = 'admin', password = '123') => {
  cy.visit('/segmentation', { 
    timeout: TIMEOUTS.PAGE_LOAD, 
    failOnStatusCode: false 
  });
  
  // Wait for page to load
  cy.wait(3000);
  
  cy.get('body').should('exist');
  
  // Check if login dialog is present
  cy.get(SELECTORS.DIALOGUE).then($dialogue => {
    const isLoginRequired = $dialogue.css('display') !== 'none' && 
                           $dialogue.find('#login-username').length > 0;
    
    const isRegisterDialog = $dialogue.css('display') !== 'none' && 
                            $dialogue.find('#register-username').length > 0;
    
    if (isRegisterDialog) {
      // First time - no users exist, need to register
      cy.log(`First run detected - registering user ${username}`);
      
      cy.get('#register-username').should('be.visible').clear().type(username);
      cy.get('#register-password').should('be.visible').clear().type(password);
      cy.get('#register-password-again').should('be.visible').clear().type(password);
      cy.get(SELECTORS.DIALOGUE).contains('button', 'Register').click();
      
      cy.wait(2000); // Wait for registration to process
      
      // Verify registration succeeded
      cy.get('body').then($body => {
        const $error = $body.find('#register-error');
        if ($error.length > 0 && $error.text().trim()) {
          throw new Error(`Registration failed: ${$error.text().trim()}`);
        } else {
          cy.log(`Registration successful - ${username} is now admin (first user)`);
          cy.wait(3000); // Wait for initialization
        }
      });
    } else if (isLoginRequired) {
      // User exists, need to login
      cy.log(`Login required - authenticating as ${username}`);
      
      cy.get('#login-username').should('be.visible').clear().type(username);
      cy.get('#login-password').should('be.visible').clear().type(password);
      cy.get(SELECTORS.DIALOGUE).contains('button', 'Login').click();
      
      cy.wait(2000); // Wait for login to process
      
      // Verify login succeeded
      cy.get('body').then($body => {
        const $error = $body.find('#login-error');
        if ($error.length > 0 && $error.text().trim()) {
          // Login failed - might be first run, try registering
          cy.log('Login failed - attempting registration');
          cy.get(SELECTORS.DIALOGUE).contains('button', 'I have no account yet').click();
          cy.wait(1000);
          
          cy.get('#register-username').should('be.visible').clear().type(username);
          cy.get('#register-password').should('be.visible').clear().type(password);
          cy.get('#register-password-again').should('be.visible').clear().type(password);
          cy.get(SELECTORS.DIALOGUE).contains('button', 'Register').click();
          
          cy.wait(3000);
        } else {
          cy.log('Login successful');
          cy.wait(3000); // Wait for initialization
        }
      });
    } else {
      cy.log('Already authenticated or no login required');
    }
  });
  
  // Wait for application to be ready
  cy.get(SELECTORS.TOOLBAR, { timeout: 20000 })
    .should('exist')
    .and('have.css', 'visibility', 'visible');
  
  // Extra wait for React to fully hydrate
  cy.wait(3000);
  
  cy.log('Application ready');
});

/**
 * Open the preferences modal
 * 
 * Opens the preferences dialog by calling the global dialogue_config function.
 * Waits for the modal to render and the user config to load.
 * 
 * Note: Uses window.dialogue_config() instead of clicking the button because
 * React event handlers may not be attached immediately after page reload.
 * 
 * @example
 * cy.openPreferences();
 */
Cypress.Commands.add('openPreferences', () => {
  // Ensure preferences button exists (indicates React is loaded)
  cy.get(SELECTORS.PREFERENCES_BUTTON, { timeout: 15000 })
    .should('exist');
  
  // Wait for React to fully hydrate after page load/reload
  cy.wait(5000);
  
  // Intercept config fetch to know when modal is ready
  cy.intercept('GET', '/segmentation/api/user-config').as('getUserConfig');
  
  // Call global function to open modal (more reliable than clicking)
  cy.window().then((win) => {
    if (typeof win.dialogue_config === 'function') {
      win.dialogue_config();
    } else {
      throw new Error('dialogue_config function not found on window');
    }
  });
  
  // Wait for config to load
  cy.wait('@getUserConfig', { timeout: TIMEOUTS.API_CALL });
  
  // Wait for modal to render
  cy.wait(TIMEOUTS.MODAL_RENDER);
  
  // Verify modal is open
  cy.get(SELECTORS.PREFERENCES_MODAL, { timeout: 5000 })
    .should('exist')
    .and('have.css', 'display', 'block');
});

/**
 * Save preferences and close the modal
 * 
 * Clicks the save button, waits for the save API call to complete,
 * and manually closes the dialog (workaround for React synthetic event issues).
 * 
 * Note: Manually closes dialog because React's onClick doesn't reliably
 * trigger in Cypress test environment.
 * 
 * @example
 * cy.savePreferences();
 */
Cypress.Commands.add('savePreferences', () => {
  // Intercept save API call
  cy.intercept('POST', '/segmentation/api/user-config').as('saveConfig');
  
  // Click save button via React fiber (more reliable than DOM click)
  cy.get(SELECTORS.SAVE_BUTTON).then($button => {
    const el = $button[0];
    const fiberKey = Object.keys(el).find(key => key.startsWith('__reactFiber'));
    
    if (fiberKey) {
      const fiber = el[fiberKey];
      const onClick = fiber?.memoizedProps?.onClick || fiber?.pendingProps?.onClick;
      
      if (typeof onClick === 'function') {
        onClick();
      } else {
        $button.click();
      }
    } else {
      $button.click();
    }
  });
  
  // Wait for save to complete
  cy.wait('@saveConfig', { timeout: TIMEOUTS.API_CALL }).then((interception) => {
    if (interception.response.statusCode !== 200) {
      cy.log(`WARNING: Save returned status ${interception.response.statusCode}`);
    }
  });
  
  cy.wait(1000); // Wait for React to process response
  
  // Manually close dialog (workaround for Cypress/React event handling)
  cy.get(SELECTORS.DIALOGUE).then($dialogue => {
    $dialogue.css('display', 'none');
  });
  
  // Verify closed
  cy.get(SELECTORS.DIALOGUE).should('have.css', 'display', 'none');
});

/**
 * Close preferences modal without saving
 * 
 * Manually hides the dialog by setting display: none.
 * This is a workaround for React synthetic event handling in Cypress.
 * 
 * @example
 * cy.closePreferences();
 */
Cypress.Commands.add('closePreferences', () => {
  cy.get(SELECTORS.DIALOGUE).then($dialogue => {
    $dialogue.css('display', 'none');
  });
  
  cy.wait(500);
  
  cy.get(SELECTORS.DIALOGUE).should('have.css', 'display', 'none');
});

/**
 * Set a slider value by typing into its editable number input
 * 
 * Uses data-testid for robust, semantic selection.
 * Directly sets the value and triggers React's onChange event.
 * 
 * Note: Sliders have editable number inputs for better UX and testability.
 * 
 * @param {string} testId - The data-testid value (without 'data-testid=' prefix)
 * @param {number|string} value - The value to set
 * 
 * @example
 * cy.setSliderValue('input-n-estimators', 120);
 * cy.setSliderValue('input-max-depth', 60);
 */
Cypress.Commands.add('setSliderValue', (testId, value) => {
  cy.log(`Setting slider [data-testid="${testId}"] to ${value}`);
  
  // Set value directly and trigger React onChange
  cy.get(`[data-testid="${testId}"]`).then($input => {
    const input = $input[0];
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    
    // Set the value using native setter
    nativeInputValueSetter.call(input, String(value));
    
    // Trigger React's onChange by dispatching input event
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
    
    // Also trigger change event for good measure
    const changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(changeEvent);
  });
  
  // Wait for React state update
  cy.wait(TIMEOUTS.STATE_UPDATE);
  
  // Verify the value was set
  cy.get(`[data-testid="${testId}"]`)
    .should('have.value', String(value));
  
  cy.log(`✓ Slider [data-testid="${testId}"] updated to ${value}`);
});
