const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "Dashboard",
        component: () => import("pages/DashboardPage.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "/room/:roomName",
        name: "Room",
        component: () => import("pages/RoomPage.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "/login",
        name: "Login",
        component: () => import("pages/LoginPage.vue"),
        meta: { requiresAuth: false },
      },
      {
        path: "/register",
        name: "Register",
        component: () => import("pages/RegisterPage.vue"),
        meta: { requiresAuth: false },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
