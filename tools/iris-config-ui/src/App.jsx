import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { resolvePropSchema as resolvePropSchemaFromUtils } from './schema-utils'
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

  // Note: UI defaults that used to be hard-coded here are moved into
  // `public/uischema.json`. The runtime still provides a small custom field
  // implementation (`KeyValue`) and registers it via `fields`, but layout,
  // placeholders and helpers live in the external uiSchema file so they can be
  // edited without changing code.

  const DescriptionField = useCallback(function DescriptionField({ id, description }){
    if(!description) return null
    if (typeof description !== 'string') return (<div id={id} className="field-description">{description}</div>)

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
    // Special-case layout for `shape` arrays: render the two numeric inputs on a
    // single row (side-by-side) and hide per-item Remove buttons. Detect by
    // title or idSchema path to avoid relying on uiSchema contents.
    const isShapeArray = (title && String(title).toLowerCase() === 'shape') || (idSchema && idSchema.$id && String(idSchema.$id).toLowerCase().includes('shape'))

    if(isShapeArray){
      return (
        <div className="array-field">
          {title ? <h6 id={idSchema && idSchema.$id} className="array-field-title">{title}</h6> : null}
          {description ? <DescriptionField id={`${idSchema && idSchema.$id}__desc`} description={description} /> : null}
          <div className="row g-2">
            {items && items.map((it, idx) => (
              <div className="col-6 array-item" key={it.key || idx}>
                {it.children}
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
    }

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
    }catch(e){ /* ignore description postprocess errors */ }
  }, [schema])

  // Commit current tab's local form data into the global formData
  function commitTabToGlobal(tab, attempts = 0){
    try{
      const local = (tabFormDataRef.current && tabFormDataRef.current[tab]) || tabFormData[tab] || {}
      if(tab === 'General'){
        const g = {...(local || {})}
        if(g.images && g.images.path !== undefined){
          g.images = { ...g.images, path: arrayToPathValue(g.images.path) }
        }
        // If any image subkeys are still undefined, allow a few short retries
        // to give RJSF/widget onChange handlers time to propagate into
        // tabFormDataRef.current. This avoids losing values when blur fires
        // before onChange completes.
        try{
          if(g.images){
            // If the tab-local object lacks an explicit metadata/thumbnails key
            // but the UI toggle for that field is unchecked, explicitly set
            // the key to null so merging removes any previous value.
            try{
              const ensureToggleNull = (suffix, keyName) => {
                try{
                  // try common enabled-checkbox id we create in the widget
                  const chk = document.querySelector(`[id*='${suffix}__enabled'], [id*='${suffix}__anyof_select'], [id*='${suffix}__select']`)
                  if(chk && (chk.type === 'checkbox' || chk.getAttribute('role') === 'switch')){
                    if(!chk.checked){
                      g.images[keyName] = null
                      if(tabFormDataRef && tabFormDataRef.current && tabFormDataRef.current['General']){
                        try{ const cur = tabFormDataRef.current['General']; if(!cur.images) cur.images = {}; cur.images[keyName] = null; tabFormDataRef.current['General'] = cur }catch(e){}
                      }
                    }
                  }
                }catch(e){}
              }
              ensureToggleNull('images_metadata','metadata')
              ensureToggleNull('images_thumbnails','thumbnails')
            }catch(e){}
            const hasUndef = Object.values(g.images).some(v => v === undefined)
            if(hasUndef && attempts < 3){
              try{ console.debug('commitTabToGlobal: detected undefined image keys, retrying', {tab, attempts}) }catch(e){}
              setTimeout(()=>commitTabToGlobal(tab, attempts+1), 60)
              return
            }
          }
        }catch(e){}
          // If toggling widgets didn't propagate their value to tabFormDataRef
          // (race or widget onChange edge), attempt to read the corresponding
          // inputs from the DOM as a fallback. RJSF typically uses ids like
          // 'root_images_thumbnails' for the field; we try a suffix match to be
          // resilient to id prefixes.
          try{
            if(g.images){
              const findValueFor = (suffix) => {
                try{
                  // search any element whose id contains the suffix
                  const nodes = Array.from(document.querySelectorAll(`[id*='${suffix}']`))
                  for(const n of nodes){
                    const tag = (n.tagName || '').toLowerCase()
                    if(tag === 'input' || tag === 'textarea'){
                      const type = (n.getAttribute && n.getAttribute('type')) || ''
                      if(type === 'checkbox' || type === 'radio') continue // skip checkboxes (they have value 'on')
                      if(n.value !== undefined && n.value !== '') return n.value
                    }
                    if(tag === 'select'){
                      const val = n.value; if(val && val !== '') return val
                    }
                    // if container, look for a textual input/select/textarea inside
                    const input = n.querySelector && (n.querySelector('input[type=text]') || n.querySelector('input[type=url]') || n.querySelector('input[type=search]') || n.querySelector('input[type=email]') || n.querySelector('textarea') || n.querySelector('input'))
                    if(input && input.value !== undefined){ const itype = (input.getAttribute && input.getAttribute('type')) || ''; if(itype === 'checkbox' || itype === 'radio'){} else { if(input.value !== '') return input.value } }
                    const sel = n.querySelector && n.querySelector('select')
                    if(sel && sel.value) return sel.value
                  }
                  // also try inputs whose name attribute contains the suffix, but skip checkboxes/radios
                  const byName = Array.from(document.querySelectorAll(`input[name*='${suffix}'], textarea[name*='${suffix}'], select[name*='${suffix}']`))
                  for(const n of byName){ const type = (n.getAttribute && n.getAttribute('type')) || ''; if(type === 'checkbox' || type === 'radio') continue; if(n.value && n.value !== '') return n.value }
                }catch(e){}
                return undefined
              }
              try{
                const vThumb = findValueFor('images_thumbnails')
                if(vThumb !== undefined && vThumb !== null) g.images.thumbnails = vThumb
              }catch(e){}
              try{
                const vMeta = findValueFor('images_metadata')
                if(vMeta !== undefined && vMeta !== null) g.images.metadata = vMeta
              }catch(e){}
            }
          }catch(e){}
        const currentGlobal = JSON.stringify(formData || {})
        // Merge at top-level but deep-merge images so subfields are preserved
        const merged = { ...(formData||{}), ...(g||{}) }
        if(g.images){
          const prevImgs = (formData && formData.images) ? formData.images : {}
          // Only copy keys from g.images that are not `undefined` so we don't
          // unintentionally overwrite existing values with undefined.
          const entries = Object.entries(g.images || {}).filter(([k,v]) => v !== undefined)
          const safeG = Object.fromEntries(entries)
          merged.images = { ...prevImgs, ...safeG }
        }
        const candidate = JSON.stringify(merged)
        // DEBUG: print merge details to help trace missing subfields. Use JSON.stringify
        try{
          const safe = (v) => {
            try{ return JSON.stringify(v) }catch(e){ return String(v) }
          }
          console.debug('commitTabToGlobal: tabFormDataRef=', safe(tabFormDataRef.current))
          console.debug('commitTabToGlobal: local=', safe(local))
          console.debug('commitTabToGlobal: General g=', safe(g))
          console.debug('commitTabToGlobal: merged=', safe(merged))
          try{
            const ig = g.images || {}
            const im = merged.images || {}
            console.debug('images keys in g:', Object.keys(ig), 'values:', { thumbnails: ig.thumbnails, metadata: ig.metadata })
            console.debug('images keys in merged:', Object.keys(im), 'values:', { thumbnails: im.thumbnails, metadata: im.metadata })
          }catch(e){}
        }catch(e){}
        if(currentGlobal !== candidate){
          setFormData(merged)
        }
      } else {
        const currentGlobal = JSON.stringify(formData && formData[tab] ? formData[tab] : {})
        const candidate = JSON.stringify(local || {})
          if(currentGlobal !== candidate){
          setFormData(prev => ({ ...(prev||{}), [tab]: local }))
        }
      }
    }catch(e){ /* commitTabToGlobal error ignored */ }
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
    return resolvePropSchemaFromUtils(propSchema, schema && schema.$defs)
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
        try{
          // Diagnostic: log the original property and the resolved prop to
          // understand why some subproperties might be missing at runtime.
      if(k === 'images'){
        // intentionally quiet in production
          }
        }catch(e){/*ignore*/}
        props[k] = resolvePropSchema(schema.properties[k])
        if(k === 'images'){
          // resolved images prop handled silently
        }
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
    // Normalize thumbnails/metadata values for the per-tab form so they match
    // the nullable-string schema we provide: convert non-string values to null
    const imagesForForm = { ...imagesVal, path: pathValueToArray(imagesVal.path) }
    imagesForForm.thumbnails = (typeof imagesForForm.thumbnails === 'string') ? imagesForForm.thumbnails : null
    imagesForForm.metadata = (typeof imagesForForm.metadata === 'string') ? imagesForForm.metadata : null
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

  // UI defaults moved to `public/uischema.json` (see note above)

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

  // Custom optional-path field: renders a toggle and, when enabled, a text input.
  // This is useful for schema entries like `thumbnails` or `metadata` which can
  // be either a string path or `false`/null. The widget emits either a string
  // (the path) or `false` when disabled.
  const OptionalPathField = useCallback(function OptionalPathField(props){
    const { id, formData, onChange, schema, uiSchema = {} } = props
    const [enabled, setEnabled] = React.useState(typeof formData === 'string')
    const [val, setVal] = React.useState(typeof formData === 'string' ? formData : '')

    React.useEffect(()=>{
      setEnabled(typeof formData === 'string')
      setVal(typeof formData === 'string' ? formData : '')
    }, [formData])

    const toggle = (now)=>{
      setEnabled(now)
      if(now){
        try{ console.debug('OptionalPathField toggle ON id=', id, 'emitting value=', val || '') }catch(e){}
        onChange(val || '')
      }
      else {
        try{ console.debug('OptionalPathField toggle OFF id=', id, 'emitting null') }catch(e){}
        // clear any lingering textual input in the DOM so our DOM-fallback
        // doesn't pick up the previous value when committing
        try{
          const el = document.getElementById(id)
          if(el && (el.tagName||'').toLowerCase() === 'input'){
            el.value = ''
            el.dispatchEvent(new Event('input', { bubbles: true }))
          }
        }catch(e){}
        onChange(null)
      }
    }

    const onValChange = (v)=>{ setVal(v); onChange(v) }
    // attempt to eagerly mirror changes into tabFormDataRef to avoid races
    React.useEffect(()=>{
      try{
        const suffix = id && id.toString()
        if(!suffix) return
        const isThumb = suffix.endsWith('images_thumbnails') || suffix.endsWith('images_thumbnails__enabled') || suffix.includes('images_thumbnails')
        const isMeta = suffix.endsWith('images_metadata') || suffix.endsWith('images_metadata__enabled') || suffix.includes('images_metadata')
        if(tabFormDataRef && tabFormDataRef.current && tabFormDataRef.current['General'] && (isThumb || isMeta)){
          const cur = tabFormDataRef.current['General'] || {}
          if(!cur.images) cur.images = {}
          if(isThumb) cur.images.thumbnails = (typeof formData === 'string' ? formData : (typeof val === 'string' ? val : cur.images.thumbnails))
          if(isMeta) cur.images.metadata = (typeof formData === 'string' ? formData : (typeof val === 'string' ? val : cur.images.metadata))
          tabFormDataRef.current['General'] = cur
        }
      }catch(e){}
    }, [val, id])

    return (
      <div>
        <div className="form-check form-switch mb-2">
          <input id={id + '__enabled'} className="form-check-input" type="checkbox" role="switch" checked={enabled} onChange={e=>toggle(e.target.checked)} />
          <label className="form-check-label" htmlFor={id + '__enabled'}>{(uiSchema && uiSchema['ui:title']) || (schema && schema.title) || 'Enable'}</label>
        </div>
        {enabled ? (
          <div>
            <input id={id} type="text" className="form-control" value={val} placeholder={(uiSchema && uiSchema['ui:placeholder']) || ''} onChange={e=>onValChange(e.target.value)} />
            {uiSchema && uiSchema['ui:help'] ? <div className="form-text">{uiSchema['ui:help']}</div> : null}
          </div>
        ) : null}
      </div>
    )
  }, [])

  // Widget variant for OptionalPath so uiSchema can use `ui:widget` instead
  const OptionalPathWidget = useCallback(function OptionalPathWidget(props){
    // widget props: { id, value, onChange, schema, uiSchema }
    const { id, value, onChange, schema, uiSchema = {} } = props
    const [enabled, setEnabled] = React.useState(typeof value === 'string')
    const [val, setVal] = React.useState(typeof value === 'string' ? value : '')

    React.useEffect(()=>{
      setEnabled(typeof value === 'string')
      setVal(typeof value === 'string' ? value : '')
    }, [value])

    const toggle = (now) => {
      setEnabled(now)
      if(now){
        try{ console.debug('OptionalPathWidget toggle ON id=', id, 'emitting value=', val || '') }catch(e){}
        onChange(val || '')
        try{
          /* mirror into tabFormDataRef */
          if(tabFormDataRef && tabFormDataRef.current){
            const cur = tabFormDataRef.current['General'] || {}
            if(!cur.images) cur.images = {}
            if(id && (id.includes('images_metadata') || id.endsWith('images_metadata'))) cur.images.metadata = val || ''
            if(id && (id.includes('images_thumbnails') || id.endsWith('images_thumbnails'))) cur.images.thumbnails = val || ''
            tabFormDataRef.current['General'] = cur
            try{ console.debug('OptionalPathWidget mirrored to tabFormDataRef', JSON.stringify(tabFormDataRef.current['General'].images)) }catch(e){}
          }
        }catch(e){}
      } else {
        try{ console.debug('OptionalPathWidget toggle OFF id=', id, 'emitting null') }catch(e){}
        // clear underlying text input to avoid DOM-fallback reading stale value
        try{
          const el = document.getElementById(id)
          if(el && (el.tagName||'').toLowerCase() === 'input'){
            el.value = ''
            el.dispatchEvent(new Event('input', { bubbles: true }))
          }
        }catch(e){}
        onChange(null)
        try{
          if(tabFormDataRef && tabFormDataRef.current){
            const cur = tabFormDataRef.current['General'] || {}
            if(!cur.images) cur.images = {}
            if(id && (id.includes('images_metadata') || id.endsWith('images_metadata'))) cur.images.metadata = null
            if(id && (id.includes('images_thumbnails') || id.endsWith('images_thumbnails'))) cur.images.thumbnails = null
            tabFormDataRef.current['General'] = cur
            try{ console.debug('OptionalPathWidget mirrored OFF to tabFormDataRef', JSON.stringify(tabFormDataRef.current['General'].images)) }catch(e){}
          }
        }catch(e){}
      }
    }

    const onValChange = (v)=>{ setVal(v); onChange(v) }
    // mirror keystrokes into tabFormDataRef immediately to avoid blur races
    React.useEffect(()=>{
      try{
        if(!id) return
        const isThumb = id.includes('images_thumbnails')
        const isMeta = id.includes('images_metadata')
        if(tabFormDataRef && tabFormDataRef.current && tabFormDataRef.current['General'] && (isThumb || isMeta)){
          const cur = tabFormDataRef.current['General']
          if(!cur.images) cur.images = {}
          if(isThumb) cur.images.thumbnails = (typeof value === 'string' ? value : cur.images.thumbnails)
          if(isMeta) cur.images.metadata = (typeof value === 'string' ? value : cur.images.metadata)
          tabFormDataRef.current['General'] = cur
          try{ console.debug('OptionalPathWidget useEffect mirrored value to tabFormDataRef', isMeta?{metadata:cur.images.metadata}:{thumbnails:cur.images.thumbnails}) }catch(e){}
        }
      }catch(e){}
    }, [value, id])

    return (
      <div>
        <div className="form-check form-switch mb-2">
          <input id={id + '__enabled'} className="form-check-input" type="checkbox" role="switch" checked={enabled} onChange={e=>toggle(e.target.checked)} />
          <label className="form-check-label" htmlFor={id + '__enabled'}>{(uiSchema && uiSchema['ui:title']) || (schema && schema.title) || 'Enable'}</label>
        </div>
        {enabled ? (
          <div>
            <input id={id} type="text" className="form-control" value={val} placeholder={(uiSchema && uiSchema['ui:placeholder']) || ''} onChange={e=>onValChange(e.target.value)} />
            {uiSchema && uiSchema['ui:help'] ? <div className="form-text">{uiSchema['ui:help']}</div> : null}
          </div>
        ) : null}
      </div>
    )
  }, [])

  const fields = useMemo(()=>({ KeyValue: KeyValueField }), [KeyValueField])
  const widgets = useMemo(()=>({ OptionalPath: OptionalPathWidget }), [OptionalPathWidget])

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
          // Force thumbnails and metadata to a simple nullable-string type so
          // RJSF doesn't render an anyOf selector. We replace whatever exists
          // with a { type: ['string','null'], ... } form using available
          // title/description/default when present.
          try{
            const imgProps = tabSchemaSanitized.properties.images.properties || {}
            ['thumbnails','metadata'].forEach(pk => {
              const p = imgProps[pk] || {}
              const normalized = { type: ['string','null'] }
                if(p.title) normalized.title = p.title
                if(p.description) normalized.description = p.description
                normalized.default = (p.default !== undefined) ? p.default : null
              imgProps[pk] = normalized
            })
            tabSchemaSanitized.properties.images.properties = imgProps
          }catch(e){ /* normalization failed, ignore */ }
        }catch(e){ /* failed to force array path — ignore */ }
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
      }catch(e){ /* schema scan failed, ignore */ }

      // no debug logging here
      map[tab] = tabSchemaSanitized
    })
    return map
  }, [schema])

  // Precompute uiSchema for each tab (merge defaults only when parsedUi changes)
  const uiByTab = useMemo(()=>{
    const map = {}
    EDIT_TABS.forEach(tab => {
      if(tab === 'General'){
        // The root uiSchema controls fields under the top-level properties such as `images`,
        // `host`, `port` etc. Use the parsed uiSchema as-is for the General tab.
        map[tab] = (parsedUi || {})
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
                    const tabSchemaSanitized = schemasByTab[tab] || {}
                    const tabUi = uiByTab[tab] || {}
                    // no debug logging in render
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
                            // Run commit slightly later to avoid races where RJSF onChange
                            // hasn't updated tabFormDataRef.current yet when blur fires.
                            try{ setTimeout(()=>{ commitTabToGlobal(tab) }, 50) }catch(e){ /* commit on blur failed */ }
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
                              widgets={widgets}
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
