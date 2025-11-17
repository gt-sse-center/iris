import React, { useEffect, useState, useMemo } from 'react'
import Form, { withTheme } from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'

// We'll attempt to dynamically load the @rjsf/bootstrap-4 theme at runtime.
// If it's not installed, we fall back to the default Form export from @rjsf/core.
// This avoids a hard build-time dependency that would break the dev server when
// `npm install` hasn't been run yet.
const DefaultForm = Form

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

  // Custom DescriptionField: render inline backtick code as <code> tags
  // This will be passed into RJSF via the `templates` prop.
  function DescriptionField({ id, description }){
    if(!description) return null
    if (typeof description !== 'string') return (<div id={id} className="field-description">{description}</div>)

    // We'll support three things safely:
    // 1) Fenced code blocks: ```...``` -> <pre><code>...</code></pre>
    // 2) Inline backticks: `...` -> <code>...</code>
    // 3) Existing <code>...</code> tags in the source -> treat like inline code
    // Approach: extract code blocks and inline code to placeholders, escape the rest,
    // then re-insert safe HTML for code elements.

    const codeBlocks = []
    const inlineCodes = []

    // extract fenced code blocks first
    let tmp = description.replace(/```([\s\S]*?)```/g, function(_, m){
      const i = codeBlocks.push(m) - 1
      return `__CODEBLOCK_${i}__`
    })

    // extract existing <code>...</code> tags (both literal and escaped &lt;code&gt;...&lt;/code&gt;)
    tmp = tmp.replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/gi, function(_, m){
      const i = inlineCodes.push(m) - 1
      return `__INLINE_${i}__`
    })
    tmp = tmp.replace(/<code>([\s\S]*?)<\/code>/gi, function(_, m){
      const i = inlineCodes.push(m) - 1
      return `__INLINE_${i}__`
    })

    // extract inline backtick spans
    tmp = tmp.replace(/`([^`]+)`/g, function(_, m){
      const i = inlineCodes.push(m) - 1
      return `__INLINE_${i}__`
    })

    // escape remaining text
    function escapeHtml(s){
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    let escaped = escapeHtml(tmp)

    // restore inline codes
    escaped = escaped.replace(/__INLINE_(\d+)__/g, function(_, idx){
      const i = Number(idx)
      const content = inlineCodes[i] || ''
      return `<code>${escapeHtml(content)}</code>`
    })

    // restore fenced code blocks
    escaped = escaped.replace(/__CODEBLOCK_(\d+)__/g, function(_, idx){
      const i = Number(idx)
      const content = codeBlocks[i] || ''
      return `<pre><code>${escapeHtml(content)}</code></pre>`
    })

    return <div id={id} className="field-description" dangerouslySetInnerHTML={{ __html: escaped }} />
  }

  // Generic FieldTemplate to ensure we control how descriptions render.
  function FieldTemplate(props){
    const { id, classNames, label, required, description, errors, help, children, schema } = props

    // description may be a React node or a string. If it's a string, format it.
    let descNode = null
    if (typeof description === 'string'){
      // reuse DescriptionField formatting
      descNode = <DescriptionField id={id + '__description'} description={description} />
    } else {
      descNode = description
    }

    // Only set htmlFor when the field schema indicates a simple input exists (string/number/integer/boolean)
    const inputLike = schema && (schema.type === 'string' || schema.type === 'number' || schema.type === 'integer' || schema.type === 'boolean')

    return (
      <div className={classNames}>
        {label && (inputLike ? <label className="control-label" htmlFor={id}>{label}{required ? ' *' : null}</label> : <div className="control-label">{label}{required ? ' *' : null}</div>)}
        {descNode}
        {children}
        {errors}
        {help}
      </div>
    )
  }

  // DOM post-processor with MutationObserver: convert inline backticks in rendered
  // descriptions to <code> elements and re-run when RJSF updates the DOM.
  useEffect(()=>{
    // Run a single, safe pass to convert code spans/blocks in descriptions.
    // Previously we used a MutationObserver to re-run on every DOM change;
    // that has been observed to interact poorly with RJSF's updates and can
    // cause inputs to lose focus. For stability, only process descriptions
    // once after the schema renders.
    try{
      const wrapper = document.querySelector('.rjsf-wrapper')
      if(!wrapper) return
      const nodes = wrapper.querySelectorAll('.field-description')
      nodes.forEach(n => {
        if(n.dataset.codeProcessed === '1') return
        const raw = n.textContent || ''
        if(!raw.includes('`')) return
        const frag = document.createDocumentFragment()
        const re = /```([\s\S]*?)```|`([^`]+)`/g
        let lastIndex = 0
        let m
        while((m = re.exec(raw)) !== null){
          const idx = m.index
          if(idx > lastIndex){ frag.appendChild(document.createTextNode(raw.slice(lastIndex, idx))) }
          if(m[1] !== undefined){ const pre = document.createElement('pre'); const code = document.createElement('code'); code.textContent = m[1]; pre.appendChild(code); frag.appendChild(pre) }
          else if(m[2] !== undefined){ const code = document.createElement('code'); code.textContent = m[2]; frag.appendChild(code) }
          lastIndex = re.lastIndex
        }
        if(lastIndex < raw.length) frag.appendChild(document.createTextNode(raw.slice(lastIndex)))
        if(frag.childNodes.length > 0){ n.innerHTML = ''; n.appendChild(frag); n.dataset.codeProcessed = '1' }
      })
    }catch(e){ console.debug('description-postprocess', e) }
  }, [schema])

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

  const parsedUi = useMemo(()=>{
    try{ return JSON.parse(uiSchema) }catch(e){ return {} }
  }, [uiSchema])

  // Memoize templates so we pass a stable object reference to RJSF and avoid
  // unnecessary internal re-initialization which can cause focus loss.
  const templates = useMemo(()=>({ DescriptionField, FieldTemplate }), [])

  if(!schema) return <div style={{padding:20}}>Loading schema...</div>

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
              <label htmlFor="rawSchemaTextArea" className="form-label visually-hidden">IRIS JSON Schema</label>
              <textarea id="rawSchemaTextArea" className="form-control mb-2" value={rawSchemaText} onChange={e=>setRawSchemaText(e.target.value)} style={{height:220, fontFamily:'monospace'}} />
              <div className="mb-3">
                <button className="btn btn-primary" onClick={applySchemaText}>Apply Schema</button>
              </div>

              <h6>uiSchema (editable)</h6>
              <label htmlFor="uiSchemaTextArea" className="form-label visually-hidden">uiSchema JSON</label>
              <textarea id="uiSchemaTextArea" className="form-control mb-2" value={uiSchema} onChange={e=>setUiSchema(e.target.value)} style={{height:100, fontFamily:'monospace'}} />
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
                  templates={templates}
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
