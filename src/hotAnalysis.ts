import { createHash } from 'node:crypto'
import type { types } from '@babel/core'

export interface HotComponent {
  local: string
  exported: string
  id: string
}

export interface HotAnalysisResult {
  hotComponents: HotComponent[]
  hasDefaultExport: boolean
}

export function analyzeHotComponents(
  ast: types.File | null | undefined,
  source: string,
  id: string
): HotAnalysisResult {
  const programBody = ast?.program.body
  if (!programBody) {
    return {
      hotComponents: [],
      hasDefaultExport: false
    }
  }

  const declaredComponents: { name: string }[] = []
  const hotComponents: HotComponent[] = []
  let hasDefaultExport = false

  for (const node of programBody) {
    if (node.type === 'VariableDeclaration') {
      const names = parseComponentDecls(node)
      if (names.length) {
        declaredComponents.push(...names)
      }
    }

    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration && node.declaration.type === 'VariableDeclaration') {
        hotComponents.push(
          ...parseComponentDecls(node.declaration).map(({ name }) => ({
            local: name,
            exported: name,
            id: getHash(id + name)
          }))
        )
      } else if (node.specifiers.length) {
        for (const spec of node.specifiers) {
          if (
            spec.type === 'ExportSpecifier' &&
            spec.exported.type === 'Identifier'
          ) {
            const matched = declaredComponents.find(
              ({ name }) => name === spec.local.name
            )
            if (matched) {
              hotComponents.push({
                local: spec.local.name,
                exported: spec.exported.name,
                id: getHash(id + spec.exported.name)
              })
            }
          }
        }
      }
    }

    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'Identifier') {
        const identifier = node.declaration
        const matched = declaredComponents.find(
          ({ name }) => name === identifier.name
        )
        if (matched) {
          hotComponents.push({
            local: identifier.name,
            exported: 'default',
            id: getHash(id + 'default')
          })
        }
      } else if (isDefineComponentCall(node.declaration)) {
        hasDefaultExport = true
        hotComponents.push({
          local: '__default__',
          exported: 'default',
          id: getHash(id + 'default')
        })
      }
    }
  }

  return {
    hotComponents,
    hasDefaultExport
  }
}

function parseComponentDecls(node: types.VariableDeclaration) {
  const names: { name: string }[] = []
  for (const decl of node.declarations) {
    if (decl.id.type === 'Identifier' && isDefineComponentCall(decl.init)) {
      names.push({
        name: decl.id.name
      })
    }
  }
  return names
}

function isDefineComponentCall(node?: types.Node | null) {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'defineComponent'
  )
}

function getHash(text: string) {
  return createHash('sha256').update(text).digest('hex').substring(0, 8)
}
