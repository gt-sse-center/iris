import React, { useEffect, useState } from 'react'
import { withTheme } from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { Theme as Bootstrap4Theme } from '@rjsf/bootstrap-4'

// Create a themed Form component using the RJSF Bootstrap 4 theme
const Form = withTheme(Bootstrap4Theme)

function prettyJson(v){
  try{ return JSON.stringify(JSON.parse(v), null, 2)}catch(e){ return v }
}

export default function App(){
  const [schema, setSchema] = useState(null)
  const [uiSchema, setUiSchema] = useState('{}')
  const [formData, setFormData] = useState({})
  const [rawSchemaText, setRawSchemaText] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(()=>{
    fetch('/irisconfig.json')
      .then(r=>r.json())
      .then(s=>{
        setSchema(s)
        const text = JSON.stringify(s, null, 2)
        setRawSchemaText(text)
      })
      .catch(e=>setError(String(e)))
  },[])

  function applySchemaText(){
    try{
      const parsed = JSON.parse(rawSchemaText)
      setSchema(parsed)
      setError(null)
    }catch(e){
      setError('Invalid JSON: ' + e.message)
    }
  }

  function downloadConfig(){
    const blob = new Blob([JSON.stringify(formData, null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'project-config.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const [saving, setSaving] = useState(false)

  async function saveSchemaToServer(){
    // send rawSchemaText and uiSchema to the persistence endpoint
    setSaving(true)
    try{
      const res = await fetch('http://localhost:5174/save-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: rawSchemaText, uiSchema })
      })
      const j = await res.json().catch(()=>({}))
      if(!res.ok){
        setError('Save failed: ' + (j.error || res.statusText))
      } else {
        // success — update schema state from saved text
        try{ setSchema(JSON.parse(rawSchemaText)); setError(null) }catch(e){ /* ignore */ }
        setSuccess('Saved schema to server')
        setTimeout(()=>setSuccess(null), 4000)
      }
    }catch(e){
      setError('Save request failed: ' + String(e))
    }finally{
      setSaving(false)
    }
  }

  if(!schema) return <div style={{padding:20}}>Loading schema...</div>

  let parsedUi = {}
  try{ parsedUi = JSON.parse(uiSchema) }catch(e){ parsedUi = {} }

  return (
    <div className="container-fluid" style={{height:'100vh'}}>
      <div className="row h-100">
        <div className="col-12">
          {error && <div className="alert alert-danger mt-2">{error}</div>}
          {success && <div className="alert alert-success mt-2">{success}</div>}
        </div>

        <div className="col-md-4 p-3 overflow-auto">
          <div className="card h-100">
            <div className="card-header">IRIS JSON Schema (editable)</div>
            <div className="card-body">
              <textarea className="form-control mb-2" value={rawSchemaText} onChange={e=>setRawSchemaText(e.target.value)} style={{height:220, fontFamily:'monospace'}} />
              <div className="mb-3">
                <button className="btn btn-primary" onClick={applySchemaText}>Apply Schema</button>
              </div>

              <h6>uiSchema (editable)</h6>
              <textarea className="form-control mb-2" value={uiSchema} onChange={e=>setUiSchema(e.target.value)} style={{height:100, fontFamily:'monospace'}} />
              <div className="mb-3"><small className="text-muted">uiSchema is a JSON object controlling widget/layout. Example: {`{"ui:order": ["name"]}`}</small></div>

              <div>
                <button className="btn btn-outline-secondary" onClick={downloadConfig}>Download form data</button>
                <button className="btn btn-success ms-2" onClick={saveSchemaToServer} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-8 p-3 overflow-auto">
          <div className="card">
            <div className="card-header">Form Preview</div>
            <div className="card-body">
              <div className="rjsf-wrapper">
                <Form
                schema={schema}
                uiSchema={parsedUi}
                validator={validator}
                formData={formData}
                onChange={(e)=>setFormData(e.formData)}
                onSubmit={({formData})=>{ setFormData(formData); setSuccess('Form submitted'); setTimeout(()=>setSuccess(null),3000) }}
                onError={(err)=>console.log('Form errors', err)}
              />
                <h6 className="mt-3">Current formData</h6>
                <pre className="bg-light border rounded p-3 json-preview" style={{maxHeight:300, overflow:'auto'}}>{JSON.stringify(formData, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
