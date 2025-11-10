import React, { useEffect, useState } from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'

function prettyJson(v){
  try{ return JSON.stringify(JSON.parse(v), null, 2)}catch(e){ return v }
}

export default function App(){
  const [schema, setSchema] = useState(null)
  const [uiSchema, setUiSchema] = useState('{}')
  const [formData, setFormData] = useState({})
  const [rawSchemaText, setRawSchemaText] = useState('')
  const [error, setError] = useState(null)

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
        alert('Saved schema to server')
      }
    }catch(e){
      setError('Save request failed: ' + String(e))
    }finally{
      setSaving(false)
    }
  }

  if(error) return (<div style={{padding:20}}><h3>Error</h3><pre>{error}</pre></div>)
  if(!schema) return <div style={{padding:20}}>Loading schema...</div>

  let parsedUi = {}
  try{ parsedUi = JSON.parse(uiSchema) }catch(e){ parsedUi = {} }

  return (
    <div style={{display:'flex', height:'100vh'}}>
      <div style={{flex: 1, overflow:'auto', padding:16, borderRight:'1px solid #ddd'}}>
        <h2>IRIS JSON Schema (editable)</h2>
        <textarea value={rawSchemaText} onChange={e=>setRawSchemaText(e.target.value)} style={{width:'100%', height:300, fontFamily:'monospace'}} />
        <div style={{marginTop:8}}>
          <button onClick={applySchemaText}>Apply Schema</button>
        </div>

        <h3 style={{marginTop:16}}>uiSchema (editable)</h3>
        <textarea value={uiSchema} onChange={e=>setUiSchema(e.target.value)} style={{width:'100%', height:120, fontFamily:'monospace'}} />
        <div style={{marginTop:8}}>
          <small>{'uiSchema is a JSON object controlling widget/layout. Example: {"ui:order": ["name"]}'}</small>
        </div>

        <div style={{marginTop:24}}>
          <button onClick={downloadConfig}>Download form data</button>
          <button style={{marginLeft:8}} onClick={saveSchemaToServer}>Save schema to server</button>
        </div>
      </div>

  <div style={{flex: 2, padding:16, overflow:'auto'}}>
        <h2>Form Preview</h2>
        <Form
          schema={schema}
          uiSchema={parsedUi}
          validator={validator}
          formData={formData}
          onChange={(e)=>setFormData(e.formData)}
          onSubmit={({formData})=>{ setFormData(formData); alert('Submitted — use Download button to save') }}
          onError={(err)=>console.log('Form errors', err)}
        />

        <h3>Current formData</h3>
        <pre style={{background:'#f7f7f7', padding:12, maxHeight:300, overflow:'auto'}}>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  )
}
