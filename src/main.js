import Vue from "vue";
import App from "./App.vue";
import router from "./router";
// import AvatarPlatform from "./vm-sdk/avatar-sdk-web_3.0.3.1009/index.js";
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.config.productionTip = false;
// Vue.prototype.$AvatarPlatform = AvatarPlatform;
Vue.use(ElementUI);
new Vue({
  router,
  el: '#app',
  render: (h) => h(App),
}).$mount("#app");
