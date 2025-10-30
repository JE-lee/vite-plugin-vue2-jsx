import Vue from 'vue'
import App from './App.vue'
import * as BenchmarkComponents from './benchmark-files/index.ts'

// Register all benchmark components
Object.entries(BenchmarkComponents).forEach(([name, component]) => {
  Vue.component(name, component)
})

new Vue({
  render: (h) => h(App)
}).$mount('#app')
