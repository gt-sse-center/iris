const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const PUBLIC_DIR = path.join(__dirname, 'public')
const SCHEMA_PATH = path.join(PUBLIC_DIR, 'irisconfig.json')
const UISCHEMA_PATH = path.join(PUBLIC_DIR, 'uischema.json')

app.get('/health', (req, res) => res.json({ ok: true }))

// Serve static assets from the public directory (so GET / works in browser)
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR))
} else {
  console.warn('public directory does not exist:', PUBLIC_DIR)
}

// Root: return index.html if present or a small informative page
app.get('/', (req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html')
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath)
  res.send('iris-config-ui persistence server. POST /save-schema to save the schema file.')
})

app.post('/save-schema', async (req, res) => {
  try {
    const { schema, uiSchema } = req.body
    if (typeof schema !== 'string') return res.status(400).json({ error: 'schema must be a string (raw JSON text)' })

    // validate JSON parseability
    JSON.parse(schema)

    // ensure public dir exists
    if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true })

    fs.writeFileSync(SCHEMA_PATH, schema, 'utf8')

    if (uiSchema && typeof uiSchema === 'string') {
      fs.writeFileSync(UISCHEMA_PATH, uiSchema, 'utf8')
    }

    res.json({ ok: true, path: SCHEMA_PATH })
  } catch (err) {
    console.error('save-schema error', err)
    res.status(500).json({ error: String(err) })
  }
})

const PORT = process.env.IRIS_CONFIG_UI_PORT || 5174
app.listen(PORT, () => console.log(`iris-config-ui server listening on http://localhost:${PORT}`))
