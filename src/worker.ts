import { parentPort } from 'node:worker_threads'
import * as babel from '@babel/core'
import jsx from '@vue/babel-preset-jsx'
// @ts-expect-error missing type
import importMeta from '@babel/plugin-syntax-import-meta'

import { analyzeHotComponents, type HotComponent } from './hotAnalysis'
import { loadTypescriptPlugin } from './loadTypescriptPlugin'

interface TransformTask {
  id: number
  code: string
  filename: string
  isTSX: boolean
  babelPlugins: any[]
  babelPresetOptions: any
  needSourceMap: boolean
}

interface TransformResult {
  id: number
  code: string | null | undefined
  map: any
  hotComponents: HotComponent[]
  hasDefaultExport: boolean
  error?: { message: string; stack?: string }
}

parentPort?.on('message', async (task: TransformTask) => {
  try {
    const {
      id,
      code,
      filename,
      isTSX,
      babelPlugins,
      babelPresetOptions,
      needSourceMap
    } = task

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

    plugins.push(...babelPlugins)

    const result = babel.transformSync(code, {
      babelrc: false,
      ast: true,
      plugins,
      presets,
      sourceMaps: needSourceMap,
      sourceFileName: filename,
      configFile: false
    })

    if (!result) {
      throw new Error('Babel transform returned no result')
    }

    const { hotComponents, hasDefaultExport } = analyzeHotComponents(
      result.ast as any,
      code,
      filename
    )

    const response: TransformResult = {
      id,
      code: result.code,
      map: result.map,
      hotComponents,
      hasDefaultExport
    }

    parentPort?.postMessage(response)
  } catch (error: any) {
    const response: TransformResult = {
      id: task.id,
      code: null,
      map: null,
      hotComponents: [],
      hasDefaultExport: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    }
    parentPort?.postMessage(response)
  }
})
