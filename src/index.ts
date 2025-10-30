import path from 'node:path'
import * as babel from '@babel/core'
import jsx from '@vue/babel-preset-jsx'
// @ts-expect-error missing type
import importMeta from '@babel/plugin-syntax-import-meta'
import { createFilter } from '@rollup/pluginutils'
import { normalizePath } from 'vite'
import type { ComponentOptions } from 'vue'
import type { Plugin } from 'vite'

import { HMR_RUNTIME_ID, hmrRuntimeCode } from './hmrRuntime'
import {
  getWorkerPool,
  terminateWorkerPool,
  type WorkerTransformResult
} from './workerPool'
import { analyzeHotComponents } from './hotAnalysis'
import { loadTypescriptPlugin } from './loadTypescriptPlugin'

import type { Options } from './types'
export * from './types'

const ssrRegisterHelperId = '/__vue2-jsx-ssr-register-helper'
const ssrRegisterHelperCode =
  `export ${ssrRegisterHelper.toString()}`

/**
 * This function is serialized with toString() and evaluated as a virtual
 * module during SSR
 */
// @ts-ignore
function ssrRegisterHelper(comp: ComponentOptions, filename: string) {
  const created = comp.created
  // @ts-ignore
  comp.created = function() {
    // @ts-ignore
    const ssrContext = this.$ssrContext
    ;(ssrContext.modules || (ssrContext.modules = new Set())).add(filename)
    if (created) {
      created.call(this)
    }
  }
}

function vue2JsxPlugin(options: Options = {}): Plugin {
  let root = ''
  let needHmr = false
  let needSourceMap = true
  let workerPool: ReturnType<typeof getWorkerPool> | null = null

  return {
    name: 'vite:vue2-jsx',

    config(config) {
      return {
        // only apply esbuild to ts files
        // since we are handling jsx and tsx now
        esbuild: {
          include: /\.ts$/
        }
      }
    },

    configResolved(config) {
      needHmr = config.command === 'serve' && !config.isProduction
      needSourceMap = config.command === 'serve' || !!config.build.sourcemap
      root = config.root
      
      // Initialize worker pool with custom size if provided
      workerPool = getWorkerPool(options.workerPoolSize)
    },

    async buildEnd() {
      // Cleanup worker pool when build ends
      if (workerPool) {
        await terminateWorkerPool()
        workerPool = null
      }
    },

    resolveId(id) {
      if (id === ssrRegisterHelperId) {
        return id
      }

      if (id === HMR_RUNTIME_ID) {
        return id
      }
    },

    load(id) {
      if (id === ssrRegisterHelperId) {
        return ssrRegisterHelperCode
      }

      if (id === HMR_RUNTIME_ID) {
        return hmrRuntimeCode
      }
    },

    async transform(code, id, opt) {
      const ssr = opt?.ssr === true
      const {
        include,
        exclude,
        babelPlugins = [],
        useWorkerThreads = true,
        ...babelPresetOptions
      } = options

      const filter = createFilter(include || /\.[jt]sx$/, exclude)
      const [filepath] = id.split('?')

      // use id for script blocks in Vue SFCs (e.g. `App.vue?vue&type=script&lang.jsx`)
      // use filepath for plain jsx files (e.g. App.jsx)
      if (filter(id) || filter(filepath)) {
    const isTSX = id.endsWith('.tsx') || filepath.endsWith('.tsx')

    let result: WorkerTransformResult
        
        // Use worker threads for transformation if enabled
        if (useWorkerThreads && workerPool) {
          try {
            const workerResult = await workerPool.transform(
              code,
              id,
              isTSX,
              babelPlugins,
              babelPresetOptions,
              needSourceMap
            )
            result = workerResult
          } catch (error) {
            // Fallback to main thread on worker error
            console.warn('Worker thread transformation failed, falling back to main thread:', error)
            result = await transformInMainThread(
              code,
              id,
              isTSX,
              babelPlugins,
              babelPresetOptions,
              needSourceMap
            )
          }
        } else {
          // Use main thread transformation
          result = await transformInMainThread(
            code,
            id,
            isTSX,
            babelPlugins,
            babelPresetOptions,
            needSourceMap
          )
        }

        if (!ssr && !needHmr) {
          if (!result.code) return
          return {
            code: result.code,
            map: result.map
          }
        }

        const { hotComponents, hasDefaultExport } = result
        let transformedCode = result.code
        const sourceMap = result.map

        if (hotComponents.length) {
          if (hasDefaultExport && (needHmr || ssr)) {
            transformedCode =
              transformedCode!.replace(
                /export default defineComponent/g,
                `const __default__ = defineComponent`
              ) + `\nexport default __default__`
          }

          if (needHmr && !ssr && !/\?vue&type=script/.test(id)) {
            let code = transformedCode
            let callbackCode = ``
            
            code += `\nimport __VUE_HMR_RUNTIME__ from "${HMR_RUNTIME_ID}"`

            for (const { local, exported, id } of hotComponents) {
              code +=
                `\n${local}.__hmrId = "${id}"` +
                `\n__VUE_HMR_RUNTIME__.createRecord("${id}", ${local})`
              callbackCode += `\n__VUE_HMR_RUNTIME__.reload("${id}", __${exported})`
            }

            code += `\nimport.meta.hot.accept(({${hotComponents
              .map((c) => `${c.exported}: __${c.exported}`)
              .join(',')}}) => {${callbackCode}\n})`

            transformedCode = code
          }

          if (ssr) {
            const normalizedId = normalizePath(path.relative(root, id))
            let ssrInjectCode =
              `\nimport { ssrRegisterHelper } from "${ssrRegisterHelperId}"` +
              `\nconst __moduleId = ${JSON.stringify(normalizedId)}`
            for (const { local } of hotComponents) {
              ssrInjectCode += `\nssrRegisterHelper(${local}, __moduleId)`
            }
            transformedCode += ssrInjectCode
          }
        }

        if (!transformedCode) return
        return {
          code: transformedCode,
          map: sourceMap
        }
      }
    }
  }
}

async function transformInMainThread(
  code: string,
  id: string,
  isTSX: boolean,
  babelPlugins: any[],
  babelPresetOptions: any,
  needSourceMap: boolean
): Promise<WorkerTransformResult> {
  const plugins = [importMeta]
  const presets = [
    [jsx, {
      compositionAPI: 'native',
      ...babelPresetOptions
    }]
  ]
  
  if (isTSX) {
    const tsPlugin = await loadTypescriptPlugin()
    plugins.push([
      tsPlugin,
      // @ts-ignore
      { isTSX: true, allowExtensions: true, allowDeclareFields: true }
    ])
  }
  
  // custom babel plugins should put *after* ts plugin
  plugins.push(...babelPlugins)
  
  const babelResult = babel.transformSync(code, {
    babelrc: false,
    ast: true,
    plugins,
    presets,
    sourceMaps: needSourceMap,
    sourceFileName: id,
    configFile: false
  })!

  const { hotComponents, hasDefaultExport } = analyzeHotComponents(
    babelResult?.ast as any,
    code,
    id
  )

  return {
    id: -1,
    code: babelResult.code,
    map: babelResult.map,
    hotComponents,
    hasDefaultExport
  } as WorkerTransformResult
}

export default vue2JsxPlugin
