import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create test files directory
const testDir = path.join(__dirname, 'benchmark-files')

if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true })
}
fs.mkdirSync(testDir, { recursive: true })

// Generate multiple JSX/TSX files
const numFiles = 100
console.log(`Generating ${numFiles} test JSX/TSX files...`)

for (let i = 0; i < numFiles; i++) {
  const content = `
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BenchmarkComponent${i}',
  data() {
    return {
      count: ${i},
      message: 'Component ${i}'
    }
  },
  methods: {
    increment() {
      this.count++
    },
    handleClick() {
      console.log('Clicked', this.count)
    }
  },
  render() {
    return (
      <div class="benchmark-${i}">
        <h1>{this.message}</h1>
        <p>Count: {this.count}</p>
        <button onClick={this.increment}>Increment</button>
        <button onClick={this.handleClick}>Log</button>
        <div class="nested">
          <span>Nested content {this.count * 2}</span>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </div>
      </div>
    )
  }
})
`
  fs.writeFileSync(path.join(testDir, `Component${i}.tsx`), content)
}

// Create an entry file that imports all components
const imports = []
const exports = []
for (let i = 0; i < numFiles; i++) {
  imports.push(`import Component${i} from './Component${i}.tsx'`)
  exports.push(`  Component${i}`)
}

const entryContent = `
${imports.join('\n')}

export {
${exports.join(',\n')}
}
`

fs.writeFileSync(path.join(testDir, 'index.ts'), entryContent)

console.log(`✅ Created ${numFiles} test files in ${testDir}`)
