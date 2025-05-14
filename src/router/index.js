import Vue from "vue";
import VueRouter from "vue-router";
import XrtcPlayer from "../views/XrtcPlayer.vue";
import AvatarView from "../views/avatardemo.vue";
import HomeView from "../views/home.vue";
import AutoView from "../views/avatarAuto.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "avatar",
    component: AvatarView,
  },
   {
    path: "/home",
    name: "home",
    component: HomeView,
  },
   {
    path: "/auto",
    name: "auto",
    component: AutoView,
  },
  {
    path:"/player",
    name:"xrtcplayer",
    component:XrtcPlayer,
  }
];

const router = new VueRouter({
  routes,
});

export default router;
