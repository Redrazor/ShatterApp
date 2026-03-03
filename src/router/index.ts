import { createRouter, createWebHistory } from 'vue-router'
import BrowseView from '../views/BrowseView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/browse' },
    {
      path: '/browse',
      component: BrowseView,
      children: [
        { path: ':id', component: () => import('../components/browse/CharacterProfile.vue') },
      ],
    },
    { path: '/build', component: () => import('../views/BuildView.vue') },
    { path: '/collection', component: () => import('../views/CollectionView.vue') },
    { path: '/reference', component: () => import('../views/ReferenceView.vue') },
  ],
})

export default router
