import Home from './routes/Home.svelte';
import Products from './routes/Products.svelte';

export default [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/products/',
    component: Products,
  }
];