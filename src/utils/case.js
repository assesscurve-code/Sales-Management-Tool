export const toSnake = (obj) => {
  const out = {}
  Object.entries(obj).forEach(([k, v]) => {
    out[k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())] = v
  })
  return out
}