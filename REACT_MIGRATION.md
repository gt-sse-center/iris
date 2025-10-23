# React Migration Guide for IRIS

## Overview

This guide documents the incremental migration of IRIS from Flask templates to TypeScript React components.

## Architecture

- **Backend**: Flask serves as API backend
- **Frontend**: React components for individual pages
- **Build**: Vite builds React components into static assets
- **Serving**: Flask serves built React assets

## Development Workflow

### 1. Setup Development Environment

```bash
# Install Node.js dependencies
npm install

# Start Vite dev server (for hot reload during development)
npm run dev

# In another terminal, start Flask
uv run iris demo
```

### 2. Build for Production

```bash
# Build React components
./build-react.sh

# Or manually:
npm run build
```

### 3. Adding a New React Page

1. **Create React component** in `src/pages/`
2. **Add entry point** to `vite.config.js`
3. **Create API endpoint** in Flask blueprint
4. **Create React template** that loads the component
5. **Update Flask route** to serve React template

## File Structure

```
iris/
├── src/                     # React source files
│   └── pages/              # Page-specific React components
├── iris/static/dist/       # Built React assets (generated)
├── package.json            # Node.js dependencies
├── vite.config.js         # Vite build configuration
└── build-react.sh         # Build script
```

## Migration Pattern

### Before (Flask Template)
```python
@admin_app.route('/users')
def users():
    users = User.query.all()
    return render_template('admin/users.html', users=users)
```

### After (React + API)
```python
@admin_app.route('/users')
def users():
    return render_template('admin/users-react.html')

@admin_app.route('/api/users')
def api_users():
    users = User.query.all()
    return jsonify({'users': [u.to_json() for u in users]})
```
