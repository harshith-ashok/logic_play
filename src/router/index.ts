import { createRouter, createWebHistory } from "vue-router";
import { watch } from "vue";
import { useAuth, type UserRole } from "../composables/useAuth";
import { useRouteSeo } from "../composables/useRouteSeo";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    roles?: UserRole[];
    title?: string;
    description?: string;
    noindex?: boolean;
  }
}

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
      meta: { title: "Gallery — Logic Play", description: "Build sessions, hackathons and club life at Logic Play, SRM's student builder club." },
    },
    {
      path: "/events",
      name: "events",
      component: () => import("../views/EventsView.vue"),
      meta: { title: "Events — Logic Play", description: "Upcoming and past Logic Play events: workshops, build sessions and hackathons at SRM." },
    },
    {
      path: "/blog",
      name: "blog",
      component: () => import("../views/BlogView.vue"),
      meta: {
        title: "Blog — Logic Play",
        description: "Build logs, write-ups and lessons from the people shipping at Logic Play, SRM's student builder club.",
      },
    },
    {
      path: "/blog/write",
      name: "blog-write",
      component: () => import("../views/BlogEditorView.vue"),
      meta: { requiresAuth: true, roles: ["member", "core_team"], noindex: true, title: "Write a post — Logic Play" },
    },
    {
      path: "/blog/edit/:slug",
      name: "blog-edit",
      component: () => import("../views/BlogEditorView.vue"),
      meta: { requiresAuth: true, roles: ["member", "core_team"], noindex: true, title: "Edit post — Logic Play" },
    },
    {
      path: "/blog/dashboard",
      name: "blog-dashboard",
      component: () => import("../views/BlogDashboardView.vue"),
      meta: { requiresAuth: true, roles: ["member", "core_team"], noindex: true, title: "My posts — Logic Play" },
    },
    {
      // Title/description are replaced by BlogPostView once the post loads.
      path: "/blog/:slug",
      name: "blog-post",
      component: () => import("../views/BlogPostView.vue"),
      meta: { title: "Blog — Logic Play" },
    },
    {
      path: "/press",
      name: "press",
      component: () => import("../views/PressView.vue"),
      meta: { title: "Press & Media Kit — Logic Play", description: "Logic Play logo pack, brand colors, boilerplate and press contact." },
    },
    {
      path: "/team",
      name: "team",
      component: () => import("../views/TeamView.vue"),
      meta: { title: "Team — Logic Play", description: "Meet the founder and leads running Logic Play, the builder's club at SRM." },
    },
    {
      path: "/join",
      name: "join",
      component: () => import("../views/JoinView.vue"),
      meta: { title: "Join the Club — Logic Play", description: "Join Logic Play: ship real projects, form hackathon teams and get mentored at SRM." },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { guestOnly: true, noindex: true, title: "Log in — Logic Play" },
    },
    {
      path: "/signup",
      name: "signup",
      component: () => import("../views/SignupView.vue"),
      meta: { guestOnly: true, noindex: true, title: "Sign up — Logic Play" },
    },
    {
      path: "/account",
      name: "account",
      component: () => import("../views/AccountView.vue"),
      meta: { requiresAuth: true, noindex: true, title: "Account — Logic Play" },
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
      meta: { requiresAuth: true, roles: ["core_team"], noindex: true, title: "Admin — Logic Play" },
    },
    {
      path: "/leaderboard",
      name: "leaderboard",
      component: () => import("../views/LeaderboardView.vue"),
      meta: { requiresAuth: true, roles: ["member", "core_team"], noindex: true, title: "Leaderboard — Logic Play" },
    },
    {
      path: "/events-attended",
      name: "events-attended",
      component: () => import("../views/EventsAttendedStubView.vue"),
      meta: { requiresAuth: true, roles: ["member", "volunteer", "core_team"], noindex: true, title: "Events attended — Logic Play" },
    },
  ],
});

router.beforeEach(async (to) => {
  const { ready, user, profile } = useAuth();

  if (!ready.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(ready, (v) => {
        if (v) {
          stop();
          resolve();
        }
      });
    });
  }

  if (to.meta.guestOnly && user.value) {
    return { name: "account" };
  }
  if (to.meta.requiresAuth && !user.value) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.roles && (!profile.value || !to.meta.roles.includes(profile.value.role))) {
    return { name: "account" };
  }
  return true;
});

useRouteSeo(router);

export default router;
