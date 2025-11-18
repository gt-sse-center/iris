import React, { useEffect, useState, useMemo, useCallback } from 'react'
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
  const DescriptionField = useCallback(function DescriptionField({ id, description }){
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
  }, [])

  // Generic FieldTemplate to ensure we control how descriptions render.
  const FieldTemplate = useCallback(function FieldTemplate(props){
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
  }, [DescriptionField])

  // Custom ArrayFieldTemplate to render a clearer add button and nicer item layout
  const ArrayFieldTemplate = useCallback(function ArrayFieldTemplate(props){
    const { items, canAdd, onAddClick, uiSchema, title, description, idSchema } = props
    return (
      <div className="array-field">
        {title ? <h6 id={idSchema && idSchema.$id} className="array-field-title">{title}</h6> : null}
        {description ? <DescriptionField id={`${idSchema && idSchema.$id}__desc`} description={description} /> : null}
        <div>
          {items && items.map((it, idx) => (
            <div className="array-item" key={it.key || idx}>
              <div className="row g-2 align-items-start">
                <div className="col">
                  {it.children}
                </div>
                <div className="col-auto d-flex align-items-start" style={{marginTop: 4}}>
                  {it.hasRemove ? <button className="btn btn-sm btn-outline-danger" onClick={it.onDropIndexClick(it.index)} type="button">Remove</button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        {canAdd ? (
          <div className="array-item-add mt-2">
            <button type="button" className="btn btn-outline-primary fullwidth-add" onClick={onAddClick}>{(uiSchema && uiSchema['ui:options'] && uiSchema['ui:options'].addButtonText) || '+ Add'}</button>
          </div>
        ) : null}
      </div>
    )
  }, [])

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

  // Commit current tab's local form data into the global formData
  function commitTabToGlobal(tab){
    try{
      const local = (tabFormDataRef.current && tabFormDataRef.current[tab]) || tabFormData[tab] || {}
      if(tab === 'General'){
        const g = {...(local || {})}
        if(g.images && g.images.path !== undefined){
          g.images = { ...g.images, path: arrayToPathValue(g.images.path) }
        }
        const currentGlobal = JSON.stringify(formData || {})
        const candidate = JSON.stringify({ ...(formData||{}), ...(g||{}) })
        console.debug('blur-commit merge check currentGlobal vs candidate', currentGlobal, candidate)
        if(currentGlobal !== candidate){
          console.debug('blur-commit: applying merge for General', g)
          setFormData(prev => ({ ...(prev||{}), ...(g||{}) }))
        }
      } else {
        const currentGlobal = JSON.stringify(formData && formData[tab] ? formData[tab] : {})
        const candidate = JSON.stringify(local || {})
        console.debug('blur-commit merge check for tab', tab, 'current vs candidate', currentGlobal, candidate)
        if(currentGlobal !== candidate){
          console.debug('blur-commit: applying merge for tab', tab)
          setFormData(prev => ({ ...(prev||{}), [tab]: local }))
        }
      }
    }catch(e){ console.debug('commitTabToGlobal error', e) }
  }

  useEffect(()=>{
    // Load both the main schema and (if present) a persisted uiSchema file.
    // The persistence server writes `public/uischema.json` when you save from the UI.
    Promise.all([
      fetch('/irisconfig.json').then(r=>{ if(!r.ok) throw new Error('schema fetch failed'); return r.json() }),
      fetch('/uischema.json').then(r=>{ if(!r.ok) return '{}'; return r.text() }).catch(()=>'{}')
    ]).then(([s, uiText])=>{
      setSchema(s)
      const text = JSON.stringify(s, null, 2)
      setRawSchemaText(text)
      try{ if(uiText && uiText.trim()) setUiSchema(typeof uiText === 'string' ? uiText : JSON.stringify(uiText, null, 2)) }catch(e){}
    }).catch(e=>{
      // If the main schema fetch fails, keep previous state and show an error.
      setError(String(e))
    })
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
  const EDIT_TABS = ['General','classes','views','view_groups','segmentation']
  // allow multiple open panels; keep an array of open panel ids
  const [openPanels, setOpenPanels] = useState(['General'])
  const [tabFormData, setTabFormData] = useState({})
  const tabFormDataRef = React.useRef({})
  const formRenderCountsRef = React.useRef({})

  // Helpers to convert the images.path value between the project's schema form and an
  // array-of-{key,value} form convenient for RJSF editing.
  function pathValueToArray(val){
    if(val == null) return []
    if(typeof val === 'string') return [{ key: '', value: val }]
    if(typeof val === 'object'){
      return Object.entries(val).map(([k,v]) => ({ key: k, value: v }))
    }
    return []
  }

  function arrayToPathValue(arr){
    if(!Array.isArray(arr)) return arr
    if(arr.length === 0) return undefined
    if(arr.length === 1 && (!arr[0].key || arr[0].key.trim() === '')) return arr[0].value
    const out = {}
    arr.forEach((it, idx) => {
      const k = (it.key && it.key.trim() !== '') ? it.key : String(idx)
      out[k] = it.value
    })
    return out
  }

  // Resolve a property schema for a top-level property. If it's a $ref to $defs, return the referenced def schema.
  function resolvePropSchema(propSchema){
    if(!propSchema) return {}
    const defs = schema && schema.$defs ? schema.$defs : undefined
    if(propSchema.$ref && typeof propSchema.$ref === 'string'){
      const m = propSchema.$ref.match(/^#\/$defs\/(.+)$/)
      if(m && defs && defs[m[1]]){
        const cloned = JSON.parse(JSON.stringify(defs[m[1]]))
        return Object.assign({ $defs: defs }, cloned)
      }
    }
    try{
      const cloned = JSON.parse(JSON.stringify(propSchema))
      if(defs) cloned.$defs = defs
      return cloned
    }catch(e){
      return propSchema
    }
  }

  // Sanitize schemas for RJSF/AJV: remove empty anyOf arrays which cause AJV validation errors
  function sanitizeSchema(s){
    try{
      const copy = JSON.parse(JSON.stringify(s || {}))
      const walk = (obj)=>{
        if(!obj || typeof obj !== 'object') return
        if(Array.isArray(obj)){ obj.forEach(walk); return }
        Object.keys(obj).forEach(k=>{
          const v = obj[k]
          if(k === 'anyOf' && Array.isArray(v) && v.length === 0){
            console.debug('sanitizeSchema: removing empty anyOf at', obj)
            delete obj[k]
            return
          }
          walk(v)
        })
      }
      walk(copy)
      return copy
    }catch(e){ return s }
  }

  function getGeneralSchema(){
    const keys = ['name','port','host','images']
    const props = {}
    const required = []
    keys.forEach(k=>{
      if(schema.properties && schema.properties[k]){
        props[k] = resolvePropSchema(schema.properties[k])
        if(Array.isArray(schema.required) && schema.required.includes(k)) required.push(k)
      }
    })
    // Override images.path to be an array-of-key/value pairs for easier editing in RJSF
    if(props.images && props.images.properties && props.images.properties.path){
      const original = props.images.properties.path
      props.images.properties.path = {
        type: 'array',
        title: original.title || 'Path',
        description: original.description || undefined,
        items: {
          type: 'object',
          properties: {
            key: { type: 'string', title: 'Key' },
            value: { type: 'string', title: 'Path' }
          },
          required: ['value']
        },
        default: []
      }
    }
    const out = { type: 'object', title: 'General', properties: props }
    if(required.length) out.required = required
    if(schema && schema.$defs) out.$defs = schema.$defs
    return out
  }

  function getSchemaForTab(tab){
    if(!schema) return {}
    if(tab === 'General') return getGeneralSchema()
    const propSchema = schema.properties && schema.properties[tab]
    return resolvePropSchema(propSchema)
  }

  // Initialize tabFormData from global formData when schema loads
  useEffect(()=>{
    if(!schema) return
    const next = {}
    const imagesVal = formData.images || {}
    const imagesForForm = { ...imagesVal, path: pathValueToArray(imagesVal.path) }
    if(!Array.isArray(imagesForForm.path) || imagesForForm.path.length === 0){ imagesForForm.path = [{key:'', value:''}] }

    // Only include fields in the per-tab formData when they exist in the global
    // formData. If we include keys with `undefined` values, RJSF treats the
    // presence of those keys as user-provided data and will not apply schema
    // defaults (e.g. `port: 5000`). To allow schema defaults to show up, omit
    // absent keys so RJSF may fill them from `schema.default`.
    const general = {}
    if(formData.name !== undefined) general.name = formData.name
    if(formData.port !== undefined) general.port = formData.port
    if(formData.host !== undefined) general.host = formData.host
    // always include images object for editing (we provide a blank placeholder row)
    general.images = imagesForForm
    next['General'] = general
    EDIT_TABS.forEach(t=>{ if(t !== 'General') next[t] = formData[t] })
    setTabFormData(next)
    tabFormDataRef.current = next
  }, [schema])

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

  // Default uiSchema enhancements for the General tab to improve array editing UX
  const defaultGeneralUi = {
    images: {
      path: {
        'ui:options': { addButtonText: '➕ Add path', removable: true },
        // Use a custom ui:field which renders key and value side-by-side using
        // Bootstrap grid classes. This is more reliable than a generic layout
        // object because we can control the rendered markup.
        items: {
          'ui:field': 'KeyValue',
          key: { 'ui:placeholder': 'optional key (e.g. Sentinel2)' },
          value: {
            'ui:placeholder': 'images/{id}.tif',
            'ui:help': 'Full or relative path to set of image files. Must use "{id}" placeholder.'
          }
        }
      }
    }
  }

  // Custom inline field that renders a two-column Bootstrap row for a {key,value} object
  const KeyValueField = useCallback(function KeyValueField(props){
    // props: { schema, uiSchema, idSchema, formData, onChange }
    const { formData = {}, onChange, uiSchema = {} } = props
    const keyVal = formData.key || ''
    const valueVal = formData.value || ''

    return (
      <div className="row g-2 align-items-start">
        <div className="col-4">
          <input
            type="text"
            className="form-control"
            value={keyVal}
            placeholder={uiSchema.key && uiSchema.key['ui:placeholder']}
            onChange={e=> onChange({ ...(formData||{}), key: e.target.value })}
          />
        </div>
        <div className="col-8">
          <input
            type="text"
            className="form-control"
            value={valueVal}
            placeholder={uiSchema.value && uiSchema.value['ui:placeholder']}
            onChange={e=> onChange({ ...(formData||{}), value: e.target.value })}
          />
          {uiSchema.value && uiSchema.value['ui:help'] ? <div className="form-text">{uiSchema.value['ui:help']}</div> : null}
        </div>
      </div>
    )
  }, [])

  const fields = useMemo(()=>({ KeyValue: KeyValueField }), [KeyValueField])

  // Memoize templates so we pass a stable object reference to RJSF and avoid
  // unnecessary internal re-initialization which can cause focus loss.
  const templates = useMemo(()=>({ DescriptionField, FieldTemplate, ArrayFieldTemplate }), [DescriptionField, FieldTemplate, ArrayFieldTemplate])

  // Precompute sanitized schema for each tab and memoize to avoid recreating
  // a new schema object on every render (this was causing RJSF to re-init and
  // reset input focus). Only recompute when the upstream `schema` changes.
  const schemasByTab = useMemo(()=>{
    const map = {}
    EDIT_TABS.forEach(tab => {
      const tabSchema = getSchemaForTab(tab)
      let tabSchemaSanitized = sanitizeSchema(tabSchema)
      // For General, force images.path to be the array-of-{key,value} schema
      if(tab === 'General'){
        try{
          if(!tabSchemaSanitized.properties) tabSchemaSanitized.properties = {}
          if(!tabSchemaSanitized.properties.images) tabSchemaSanitized.properties.images = {}
          if(!tabSchemaSanitized.properties.images.properties) tabSchemaSanitized.properties.images.properties = {}
          const original = (tabSchemaSanitized.properties.images.properties && tabSchemaSanitized.properties.images.properties.path) || {}
          tabSchemaSanitized.properties.images.properties.path = {
            type: 'array',
            title: original.title || 'Path',
            description: original.description || undefined,
            items: {
              type: 'object',
              properties: {
                key: { type: 'string', title: 'Key' },
                value: { type: 'string', title: 'Path' }
              },
              required: ['value']
            },
            default: []
          }
        }catch(e){ console.debug('force array path failed', e) }
      }

      // debug: detect any anyOf with zero items which breaks AJV
      try{
        const scan = (obj, path=[])=>{
          if(!obj || typeof obj !== 'object') return
          if(Array.isArray(obj)){
            obj.forEach((v,i)=> scan(v, path.concat([`[${i}]`])))
            return
          }
          Object.keys(obj).forEach(k=>{
            if(k === 'anyOf' && Array.isArray(obj[k]) && obj[k].length === 0){
              console.error('Detected empty anyOf at', path.concat([k]).join('/'), 'for tab', tab, obj)
            }
            scan(obj[k], path.concat([k]))
          })
        }
        scan(tabSchema)
      }catch(e){ console.debug('schema-scan failed', e) }

      if(tab === 'General'){
        try{ console.debug('General tab schema (sanitized):', tabSchemaSanitized) }catch(e){}
      }
      map[tab] = tabSchemaSanitized
    })
    return map
  }, [schema])

  // Precompute uiSchema for each tab (merge defaults only when parsedUi changes)
  const uiByTab = useMemo(()=>{
    const map = {}
    EDIT_TABS.forEach(tab => {
      if(tab === 'General'){
        let tabUi = { ...(parsedUi || {}) }
        tabUi.images = { ...(tabUi.images || {}), ...(defaultGeneralUi.images || {}) }
        if(tabUi.images.path && defaultGeneralUi.images.path){
          tabUi.images.path = { ...(defaultGeneralUi.images.path || {}), ...(tabUi.images.path || {}) }
          tabUi.images.path.items = { ...(defaultGeneralUi.images.path.items || {}), ...((tabUi.images.path && tabUi.images.path.items) || {}) }
          tabUi.images.path['ui:options'] = { ...(defaultGeneralUi.images.path['ui:options'] || {}), ...((tabUi.images.path && tabUi.images.path['ui:options']) || {}) }
        }
        map[tab] = tabUi
      } else {
        map[tab] = (parsedUi && parsedUi[tab]) || {}
      }
    })
    return map
  }, [parsedUi])

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
                <div className="accordion" id="irisAccordion">
                  {EDIT_TABS.map(tab => {
                    const currentTabData = (tabFormData && tabFormData[tab]) || (tabFormDataRef.current && tabFormDataRef.current[tab]) || {}
                    formRenderCountsRef.current[tab] = (formRenderCountsRef.current[tab] || 0) + 1
                    console.debug(`Form render (${tab}) count:`, formRenderCountsRef.current[tab])
                    const tabSchemaSanitized = schemasByTab[tab] || {}
                    const tabUi = uiByTab[tab] || {}
                    return (
                      <div className="accordion-item" key={tab}>
                        <h2 className="accordion-header" id={`heading-${tab}`}>
                          <button className={`accordion-button ${openPanels.includes(tab) ? '' : 'collapsed'}`} type="button" onClick={()=>{
                              // toggle this panel open/closed
                              setOpenPanels(prev => {
                                const now = new Set(prev || [])
                                if(now.has(tab)) now.delete(tab)
                                else now.add(tab)
                                return Array.from(now)
                              })
                            }} aria-expanded={openPanels.includes(tab)} aria-controls={`collapse-${tab}`}>
                            {tab}
                          </button>
                        </h2>
                        <div id={`collapse-${tab}`} className={`accordion-collapse collapse ${openPanels.includes(tab) ? 'show' : ''}`} aria-labelledby={`heading-${tab}`}>
                          <div className="accordion-body" onBlurCapture={()=>{
                            try{ commitTabToGlobal(tab) }catch(e){console.debug('commit on blur failed', e)}
                          }}>
                            <Form
                              schema={tabSchemaSanitized}
                              uiSchema={tabUi}
                              validator={validator}
                              formData={currentTabData}
                              onChange={(e)=>{
                                tabFormDataRef.current = { ...(tabFormDataRef.current || {}), [tab]: e.formData }
                                setTabFormData(prev => ({ ...(prev||{}), [tab]: e.formData }))
                              }}
                              onSubmit={({formData})=>{ tabFormDataRef.current = { ...(tabFormDataRef.current || {}), [tab]: formData }; setTabFormData(prev=>({...prev, [tab]: formData})); commitTabToGlobal(tab); setSuccess('Form submitted'); setTimeout(()=>setSuccess(null),3000) }}
                              onError={(err)=>console.log('Form errors', err)}
                              templates={templates}
                              fields={fields}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
