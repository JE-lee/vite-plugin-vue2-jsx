import type { VueJSXPresetOptions } from '@vue/babel-preset-jsx'
import type { FilterPattern } from '@rollup/pluginutils'

export interface FilterOptions {
  include?: FilterPattern
  exclude?: FilterPattern
}

export type Options = VueJSXPresetOptions &
  FilterOptions & { 
    babelPlugins?: any[]
    /** Enable worker threads for Babel transformation (default: true) */
    useWorkerThreads?: boolean
    /** Number of worker threads in the pool (default: CPU cores - 1) */
    workerPoolSize?: number
  }
