import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
  // @ts-ignore
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/creator'
    },
    {
      path: '/creator',
      name: 'home',
      component: () => import('../views/CreatorView.vue'),
    },
    {
      path: '/PageNotFound',
      name: 'PageNotFound',
      component: () => import('../views/PageNotFoundView.vue')
    },
    {
      path: "/:catchAll(.*)",
      redirect: () => {
        return '/PageNotFound';
      }
    },
  ]
})

export default router
