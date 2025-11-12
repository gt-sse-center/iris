# Cypress E2E Tests for IRIS

This directory contains end-to-end tests for the IRIS application using Cypress.

## Setup

Cypress is already installed as a dev dependency. If you need to reinstall:

```bash
npm install
```

## Running Tests

### Interactive Mode (Cypress UI)

Open the Cypress Test Runner to run tests interactively:

```bash
npm run cypress
```

This will open the Cypress UI where you can select and run individual tests.

### Headless Mode (CI/CD)

Run all tests in headless mode:

```bash
npm run cypress:headless
```

Run only the preferences test:

```bash
npm run cypress:test
```

## Prerequisites

Before running Cypress tests, you need to:

1. **Start IRIS application** in a separate terminal:
   ```bash
   uv run iris demo
   # or
   uv run iris label <config-file>
   ```

2. **Ensure the application is running** on `http://localhost:5000` (default)

3. **Create a test user account** - The tests use `testuser/testpass` by default:
   - Visit `http://localhost:5000/segmentation` in your browser
   - Click "I have no account yet" in the login dialog
   - Register with username: `testuser`, password: `testpass`
   - Alternatively, modify credentials in `cypress/support/commands.js` (line 10)

## Test Structure

```
cypress/
├── e2e/                          # Test files
│   └── preferences-segmentation-ai.cy.js  # Preferences modal tests
├── support/                      # Support files
│   ├── commands.js              # Custom Cypress commands
│   └── e2e.js                   # Global configuration
├── screenshots/                  # Screenshots from failed tests
└── videos/                       # Recorded videos (if enabled)
```

## Custom Commands

We've defined custom commands to simplify test writing:

### `cy.login(username, password)`

Logs into the IRIS application. Defaults to `admin/admin`.

```javascript
cy.login(); // Uses default credentials
cy.login('testuser', 'testpass'); // Custom credentials
```

### `cy.openPreferences()`

Opens the preferences modal from the toolbar.

```javascript
cy.openPreferences();
```

### `cy.savePreferences()`

Saves preferences and closes the modal.

```javascript
cy.savePreferences();
```

### `cy.closePreferences()`

Closes the preferences modal without saving.

```javascript
cy.closePreferences();
```

## Test Coverage

### Preferences Modal - Segmentation AI Tab

Tests for the Segmentation AI preferences:

- ✅ Opening and closing the preferences dialog
- ✅ Displaying the Segmentation AI tab by default
- ✅ Accordion expand/collapse functionality
- ✅ Modifying model parameters using sliders
- ✅ Toggling checkboxes for model inputs
- ✅ Changing dropdown values (meshgrid cells, suppression filter)
- ✅ Modifying postprocessing parameters
- ✅ Moving bands between include/exclude lists
- ✅ Validation error when no bands selected
- ✅ **Persistence test**: Saving preferences and verifying they persist after page reload

## Configuration

Cypress configuration is in `cypress.config.js`:

- **Base URL**: `http://localhost:5000`
- **Spec Pattern**: `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`
- **Video Recording**: Disabled by default (set `video: true` to enable)

## Debugging

### Screenshots

Failed tests automatically capture screenshots to `cypress/screenshots/`.

### Videos

Enable video recording in `cypress.config.js`:

```javascript
video: true
```

Videos will be saved to `cypress/videos/`.

### Debug Mode

Run Cypress in headed mode to see the browser:

```bash
npm run cypress
```

Then select the test you want to debug.

## Writing New Tests

1. Create a new test file in `cypress/e2e/`:
   ```javascript
   describe('My Feature', () => {
     beforeEach(() => {
       cy.login();
     });

     it('should do something', () => {
       // Your test code
     });
   });
   ```

2. Use custom commands for common operations
3. Follow the existing test patterns
4. Add descriptive test names

## Troubleshooting

### Tests fail with "Cannot find element"

- Ensure IRIS is running on `http://localhost:5000`
- Check that you're logged in (use `cy.login()` in `beforeEach`)
- Verify the selector exists in the current React implementation

### Login fails

- Check credentials in `cypress/support/commands.js`
- Ensure the demo project has the user account
- Try running IRIS manually and logging in through the browser

### Timeout errors

- Increase timeout in the test: `cy.get('#element', { timeout: 10000 })`
- Check if the application is slow to load
- Verify network requests are completing

## CI/CD Integration

Cypress E2E tests are automatically run in the CI/CD pipeline on Ubuntu with Python 3.9.

### How It Works

1. **Server Startup**: IRIS demo server starts in background (`uv run iris demo &`)
2. **Health Check**: Waits up to 60 seconds for server to respond at `http://localhost:5000`
3. **Test Execution**: Runs all Cypress tests in headless mode
4. **Cleanup**: Stops the server regardless of test outcome

### User Creation in CI

The tests use `admin/123` credentials by default. On first run:
- IRIS detects no users exist
- Login dialog appears with "I have no account yet" option
- Cypress `cy.login()` command handles registration automatically
- First user becomes admin automatically (IRIS behavior)
- Subsequent runs use the existing user

### Manual CI/CD Setup

To run Cypress tests in your own CI/CD:

```bash
# Start IRIS in background
uv run iris demo &
SERVER_PID=$!

# Wait for server to be ready
for i in {1..60}; do
  if curl -s http://localhost:5000 > /dev/null; then
    echo "Server ready!"
    break
  fi
  sleep 1
done

# Run Cypress tests
npm run cypress:headless

# Stop IRIS
kill $SERVER_PID
```

### CI Configuration

See `.github/workflows/ci.yml` for the complete CI configuration. Tests run only on:
- **OS**: Ubuntu latest
- **Python**: 3.9
- **Node**: 18

This reduces CI time while ensuring comprehensive test coverage.

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress API](https://docs.cypress.io/api/table-of-contents)
