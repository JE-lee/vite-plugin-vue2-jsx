import { Worker } from 'node:worker_threads'
import { cpus } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import type { HotComponent } from './hotAnalysis'

interface TransformTask {
  id: number
  code: string
  filename: string
  isTSX: boolean
  babelPlugins: any[]
  babelPresetOptions: any
  needSourceMap: boolean
}

export interface WorkerTransformResult {
  id: number
  code: string | null | undefined
  map: any
  hotComponents: HotComponent[]
  hasDefaultExport: boolean
  error?: { message: string; stack?: string }
}

interface WorkerWithState {
  worker: Worker
  busy: boolean
}

export class WorkerPool {
  private workers: WorkerWithState[] = []
  private queue: {
    task: TransformTask
    resolve: (result: WorkerTransformResult) => void
    reject: (error: Error) => void
  }[] = []
  private taskIdCounter = 0
  private workerPath: string

  constructor(size?: number) {
    const poolSize = size || Math.max(1, cpus().length - 1)
    
    // Determine worker path - handle both ESM and CJS
    this.workerPath = this.resolveWorkerPath()

    for (let i = 0; i < poolSize; i++) {
      this.createWorker()
    }
  }

  private resolveWorkerPath(): string {
    // Try to resolve as CJS first
    try {
      if (typeof __filename !== 'undefined') {
        // CJS environment - worker.js should be in the same directory
        return path.resolve(__dirname, 'worker.cjs')
      }
    } catch (e) {
      // Not in CJS, continue to ESM
    }

    // ESM environment
    try {
      const currentFileUrl = import.meta.url
      const currentDir = path.dirname(fileURLToPath(currentFileUrl))
      return path.resolve(currentDir, 'worker.mjs')
    } catch (e) {
      // Fallback - shouldn't reach here in normal circumstances
      return path.resolve(process.cwd(), 'dist', 'worker.mjs')
    }
  }

  private createWorker(): void {
    const worker = new Worker(this.workerPath)
    const workerWithState: WorkerWithState = {
      worker,
      busy: false
    }

  worker.on('message', (result: WorkerTransformResult) => {
      workerWithState.busy = false
      
      // Find and resolve the corresponding task
      const taskIndex = this.queue.findIndex(item => item.task.id === result.id)
      if (taskIndex !== -1) {
        const { resolve, reject } = this.queue[taskIndex]
        this.queue.splice(taskIndex, 1)
        
        if (result.error) {
          const error = new Error(result.error.message)
          error.stack = result.error.stack
          reject(error)
        } else {
          resolve(result)
        }
      }

      // Process next task in queue
      this.processQueue()
    })

    worker.on('error', (error) => {
      console.error('Worker error:', error)
      workerWithState.busy = false
      
      // Recreate worker
      worker.terminate()
      const index = this.workers.indexOf(workerWithState)
      if (index !== -1) {
        this.workers.splice(index, 1)
        this.createWorker()
      }
    })

    worker.on('exit', (code) => {
      if (code !== 0 && workerWithState.busy) {
        // Only log if worker was busy (unexpected exit)
        console.error(`Worker stopped unexpectedly with exit code ${code}`)
      }
    })

    this.workers.push(workerWithState)
  }

  private processQueue(): void {
    if (this.queue.length === 0) return

    const availableWorker = this.workers.find(w => !w.busy)
    if (!availableWorker) return

    // Get the first pending task (not yet sent to worker)
    const pendingTask = this.queue.find(item => {
      return !this.workers.some(w => w.busy && 
        w.worker.threadId === (item as any).assignedThreadId)
    })

    if (pendingTask) {
      availableWorker.busy = true
      ;(pendingTask as any).assignedThreadId = availableWorker.worker.threadId
      availableWorker.worker.postMessage(pendingTask.task)
    }
  }

  transform(
    code: string,
    filename: string,
    isTSX: boolean,
    babelPlugins: any[],
    babelPresetOptions: any,
    needSourceMap: boolean
  ): Promise<WorkerTransformResult> {
    return new Promise((resolve, reject) => {
      const task: TransformTask = {
        id: this.taskIdCounter++,
        code,
        filename,
        isTSX,
        babelPlugins,
        babelPresetOptions,
        needSourceMap
      }

      this.queue.push({ task, resolve, reject })
      this.processQueue()
    })
  }

  async terminate(): Promise<void> {
    await Promise.all(
      this.workers.map(({ worker }) => worker.terminate())
    )
    this.workers = []
    this.queue = []
  }
}

let globalPool: WorkerPool | null = null

export function getWorkerPool(size?: number): WorkerPool {
  if (!globalPool) {
    globalPool = new WorkerPool(size)
  }
  return globalPool
}

export async function terminateWorkerPool(): Promise<void> {
  if (globalPool) {
    await globalPool.terminate()
    globalPool = null
  }
}
