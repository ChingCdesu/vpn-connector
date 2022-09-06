import { createApp } from 'vue'
import Main from './Main.vue'
import './assets/styles/style.less'

createApp(Main)
  .mount('#app')
  // .$nextTick(() => {
  //   postMessage({ payload: 'removeLoading' }, '*')
  // })
