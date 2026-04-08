// Utilities for resolving $ref entries that point into schema.$defs

export function deepClone(v){
  try{ return JSON.parse(JSON.stringify(v)) }catch(e){ return v }
}

export function expandRefs(node, defs, seenRefNames = new Set()){
  if(!node || typeof node !== 'object') return node
  if(Array.isArray(node)) return node.map(it => expandRefs(it, defs, seenRefNames))

  if(node.$ref && typeof node.$ref === 'string'){
    const m = node.$ref.match(/^#\/\$defs\/(.+)$/)
    if(m && defs && defs[m[1]]){
      if(seenRefNames.has(m[1])) return {}
      seenRefNames.add(m[1])
      const resolved = deepClone(defs[m[1]])
      const expanded = expandRefs(resolved, defs, seenRefNames)
      seenRefNames.delete(m[1])
      return expanded
    }
  }

  const out = {}
  Object.keys(node).forEach(k => { out[k] = expandRefs(node[k], defs, seenRefNames) })
  return out
}

export function resolvePropSchema(propSchema, defs){
  if(!propSchema) return {}
  try{
    const cloned = deepClone(propSchema)
    const expanded = expandRefs(cloned, defs)
    if(defs) expanded.$defs = defs
    return expanded
  }catch(e){
    try{ const fallback = deepClone(propSchema); if(defs) fallback.$defs = defs; return fallback }catch(e2){ return propSchema }
  }
}
