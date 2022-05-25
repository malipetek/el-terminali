import Framework7 from 'framework7/bundle';
import Framework7Svelte from 'framework7-svelte';
Framework7.use(Framework7Svelte);
import 'framework7/framework7-bundle.min.css';
import 'framework7/components/toggle/toggle.css';
import 'framework7/components/tabs/tabs.css';
import 'framework7/components/appbar/appbar.css';
import 'framework7/components/searchbar/searchbar.css';

import 'framework7-icons';
import 'framework7-icons/css/framework7-icons.css';

import './utils/bounce.js'

import { Workbox } from 'workbox-window';

import App from './App.svelte';

const app = new App({ 
	target: document.querySelector('body'),
	props: {}
});

if ('serviceWorker' in navigator) {
  const wb = new Workbox('/sw.js');

  wb.register();
}

export default app;