import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    return { top: 0 };
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
    },
    {
      path: "/gallery",
      name: "gallery",
      component: () => import("../views/GalleryView.vue"),
    },
    {
      path: "/events",
      name: "events",
      component: () => import("../views/EventsView.vue"),
    },
    {
      path: "/press",
      name: "press",
      component: () => import("../views/PressView.vue"),
    },
    {
      path: "/team",
      name: "team",
      component: () => import("../views/TeamView.vue"),
    },
  ],
});

export default router;
