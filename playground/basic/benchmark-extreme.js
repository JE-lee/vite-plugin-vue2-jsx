import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testDir = path.join(__dirname, 'benchmark-files')

if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true })
}
fs.mkdirSync(testDir, { recursive: true })

const numFiles = 1000
console.log(`Generating ${numFiles} extremely complex test JSX/TSX files...`)

for (let i = 0; i < numFiles; i++) {
  const content = `
import { defineComponent } from 'vue'

const config = {
  colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'],
  sizes: ['small', 'medium', 'large'],
  types: ['primary', 'secondary', 'tertiary']
}

export default defineComponent({
  name: 'ExtremeBenchmarkComponent${i}',
  props: {
    id: { type: Number, default: ${i} },
    title: { type: String, default: 'Component ${i}' },
    enabled: { type: Boolean, default: true }
  },
  data() {
    return {
      counter: ${i},
      localState: { active: false, loading: false, error: null },
      dataList: Array.from({ length: 20 }, (_, idx) => ({ 
        id: idx, 
        name: \`Item \${idx}\`,
        value: Math.random(),
        nested: { deep: { value: idx * 2 } }
      })),
      formData: { name: '', email: '', message: '', category: 'default' },
      colorIndex: ${i % 8},
      sizeIndex: ${i % 3},
      typeIndex: ${i % 3}
    }
  },
  computed: {
    currentColor() { return config.colors[this.colorIndex] },
    currentSize() { return config.sizes[this.sizeIndex] },
    currentType() { return config.types[this.typeIndex] },
    computedValue() { return this.counter * 3.14159 },
    formattedCounter() { return \`Count: \${this.counter}\` },
    isEven() { return this.counter % 2 === 0 },
    filteredList() { return this.dataList.filter(item => item.value > 0.5) },
    totalValue() { return this.dataList.reduce((sum, item) => sum + item.value, 0) }
  },
  methods: {
    increment() { this.counter++ },
    decrement() { if (this.counter > 0) this.counter-- },
    reset() { this.counter = ${i} },
    multiply(n) { this.counter *= n },
    handleClick(e) { 
      this.localState.active = !this.localState.active 
      console.log('Clicked ${i}', e)
    },
    handleItemClick(item, idx, e) {
      console.log('Item clicked:', item.id, idx, e)
      this.dataList[idx].value = Math.random()
    },
    handleFormSubmit(e) {
      e.preventDefault()
      console.log('Form submitted:', this.formData)
    },
    handleInput(e) {
      this.formData[e.target.name] = e.target.value
    },
    asyncAction() {
      this.localState.loading = true
      setTimeout(() => { this.localState.loading = false }, 1000)
    }
  },
  render() {
    const { localState, formData, dataList } = this
    return (
      <div 
        id={\`component-\${this.id}\`}
        class={[
          'extreme-benchmark',
          \`bench-\${this.id}\`,
          localState.active && 'active',
          localState.loading && 'loading',
          this.isEven && 'even',
          \`color-\${this.currentColor}\`,
          \`size-\${this.currentSize}\`,
          \`type-\${this.currentType}\`
        ]}
        style={{ 
          color: this.currentColor,
          fontSize: this.currentSize === 'large' ? '18px' : '14px'
        }}
        onClick={this.handleClick}
      >
        <header class="component-header">
          <h1>{this.title}</h1>
          <span class="badge">{this.formattedCounter}</span>
          <div class="meta">
            <span>ID: {this.id}</span>
            <span>Value: {this.computedValue.toFixed(2)}</span>
            <span>Total: {this.totalValue.toFixed(2)}</span>
          </div>
        </header>

        <section class="controls">
          <div class="button-group">
            <button onClick={this.decrement} disabled={this.counter <= 0}>-</button>
            <button onClick={this.increment}>+</button>
            <button onClick={() => this.multiply(2)}>×2</button>
            <button onClick={() => this.multiply(0.5)}>÷2</button>
            <button onClick={this.reset}>Reset</button>
          </div>
          <div class="status">
            <span class={localState.active ? 'active' : 'inactive'}>
              Status: {localState.active ? 'Active' : 'Inactive'}
            </span>
            {localState.loading && <span class="loading-indicator">Loading...</span>}
          </div>
          <button onClick={this.asyncAction} disabled={localState.loading}>
            Async Action
          </button>
        </section>

        <section class="content">
          <form onSubmit={this.handleFormSubmit} class="data-form">
            <div class="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name}
                onInput={this.handleInput}
                placeholder="Enter name"
              />
            </div>
            <div class="form-group">
              <label>Email:</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email}
                onInput={this.handleInput}
                placeholder="Enter email"
              />
            </div>
            <div class="form-group">
              <label>Message:</label>
              <textarea 
                name="message" 
                value={formData.message}
                onInput={this.handleInput}
                rows={4}
                placeholder="Enter message"
              />
            </div>
            <div class="form-group">
              <label>Category:</label>
              <select name="category" value={formData.category} onChange={this.handleInput}>
                <option value="default">Default</option>
                <option value="urgent">Urgent</option>
                <option value="info">Info</option>
              </select>
            </div>
            <button type="submit">Submit</button>
          </form>
        </section>

        <section class="data-list">
          <h3>Data List ({dataList.length} items)</h3>
          <div class="list-container">
            {dataList.map((item, idx) => (
              <div 
                key={item.id}
                class={['list-item', item.value > 0.5 && 'highlighted']}
                onClick={(e) => this.handleItemClick(item, idx, e)}
              >
                <div class="item-header">
                  <span class="item-id">#{item.id}</span>
                  <span class="item-name">{item.name}</span>
                </div>
                <div class="item-body">
                  <div class="item-value">
                    Value: {item.value.toFixed(4)}
                    {item.value > 0.7 && <span class="high-badge">High</span>}
                    {item.value < 0.3 && <span class="low-badge">Low</span>}
                  </div>
                  <div class="nested-data">
                    Deep: {item.nested.deep.value}
                  </div>
                </div>
                {idx % 3 === 0 && (
                  <div class="special-marker">Special #{idx}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section class="nested-sections">
          <div class="level-1">
            <h4>Level 1</h4>
            <div class="level-2">
              <h5>Level 2 - Counter: {this.counter}</h5>
              <div class="level-3">
                <h6>Level 3 - Even: {this.isEven ? 'Yes' : 'No'}</h6>
                <div class="level-4">
                  <p>Level 4 - Color: {this.currentColor}</p>
                  <div class="level-5">
                    <span>Level 5 - Deep nested content</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer class="component-footer">
          <div class="footer-info">
            <p>Component ${i} | Type: {this.currentType}</p>
            <p>Size: {this.currentSize} | Color: {this.currentColor}</p>
            <p>State: {JSON.stringify(localState)}</p>
          </div>
          <div class="footer-actions">
            <button onClick={() => console.log('Footer action 1')}>Action 1</button>
            <button onClick={() => console.log('Footer action 2')}>Action 2</button>
            <button onClick={() => console.log('Footer action 3')}>Action 3</button>
          </div>
        </footer>
      </div>
    )
  }
})
`
  fs.writeFileSync(path.join(testDir, `Component${i}.tsx`), content)
  
  if ((i + 1) % 100 === 0) {
    console.log(`  Created ${i + 1}/${numFiles} files...`)
  }
}

const imports = []
const exports = []
for (let i = 0; i < numFiles; i++) {
  imports.push(`import Component${i} from './Component${i}.tsx'`)
  exports.push(`  Component${i}`)
}

const entryContent = `${imports.join('\n')}\n\nexport {\n${exports.join(',\n')}\n}\n`
fs.writeFileSync(path.join(testDir, 'index.ts'), entryContent)

console.log(`✅ Created ${numFiles} extremely complex test files`)
console.log(`   Total size: ~${Math.round(numFiles * 7)}KB of JSX code`)
