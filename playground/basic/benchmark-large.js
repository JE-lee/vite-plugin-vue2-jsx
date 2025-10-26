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

// Generate MORE JSX/TSX files with more complex transformations
const numFiles = 500
console.log(`Generating ${numFiles} complex test JSX/TSX files...`)

for (let i = 0; i < numFiles; i++) {
  const content = `
import { defineComponent } from 'vue'

const colors = ['red', 'blue', 'green', 'yellow', 'purple']

export default defineComponent({
  name: 'BenchmarkComponent${i}',
  props: {
    initialCount: {
      type: Number,
      default: ${i}
    }
  },
  data() {
    return {
      count: this.initialCount,
      message: 'Component ${i}',
      items: Array.from({ length: 10 }, (_, i) => ({ id: i, name: \`Item \${i}\` })),
      isActive: false,
      color: colors[${i % 5}]
    }
  },
  computed: {
    doubledCount() {
      return this.count * 2
    },
    formattedMessage() {
      return \`[\${this.color}] \${this.message}\`
    }
  },
  methods: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    reset() {
      this.count = this.initialCount
    },
    handleClick(event) {
      console.log('Clicked', this.count, event)
      this.isActive = !this.isActive
    },
    handleItemClick(item) {
      console.log('Item clicked:', item)
    }
  },
  render() {
    return (
      <div class={['benchmark-${i}', this.isActive && 'active']} style={{ color: this.color }}>
        <header>
          <h1>{this.formattedMessage}</h1>
          <span class="badge">{this.doubledCount}</span>
        </header>
        
        <div class="controls">
          <button onClick={this.decrement} disabled={this.count <= 0}>-</button>
          <span class="count-display">Count: {this.count}</span>
          <button onClick={this.increment}>+</button>
          <button onClick={this.reset}>Reset</button>
        </div>
        
        <div class="content">
          <p>Current state: {this.isActive ? 'Active' : 'Inactive'}</p>
          <button onClick={this.handleClick}>Toggle State</button>
        </div>
        
        <div class="nested">
          <div class="level-1">
            <div class="level-2">
              <span>Deeply nested content {this.count * 2}</span>
              <div class="level-3">
                <p>Level 3: {this.message}</p>
              </div>
            </div>
          </div>
        </div>
        
        <ul class="items-list">
          {this.items.map(item => (
            <li key={item.id} onClick={() => this.handleItemClick(item)}>
              <span class="item-id">{item.id}</span>
              <span class="item-name">{item.name}</span>
              {item.id % 2 === 0 && <span class="even-badge">Even</span>}
            </li>
          ))}
        </ul>
        
        <footer>
          <p>Component ID: ${i}</p>
          <p>Color: {this.color}</p>
        </footer>
      </div>
    )
  }
})
`
  fs.writeFileSync(path.join(testDir, `Component${i}.tsx`), content)
  
  if ((i + 1) % 50 === 0) {
    console.log(`  Created ${i + 1}/${numFiles} files...`)
  }
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

console.log(`✅ Created ${numFiles} complex test files in ${testDir}`)
console.log(`   Total size: ~${Math.round(numFiles * 3.5)}KB of JSX code`)
