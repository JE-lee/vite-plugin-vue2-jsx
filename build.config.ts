import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/worker',
    'src/workerPool'
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true
  }
})
