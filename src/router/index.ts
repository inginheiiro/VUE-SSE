import { createRouter, createWebHistory } from 'vue-router';
import NotificationsView from '@/views/NotificationsView.vue';
import ChatView from '@/views/ChatView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/notifications'
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsView
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView
    }
  ]
});

export default router;
