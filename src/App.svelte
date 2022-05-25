<script >
	import { App, Appbar, Searchbar, NavRight, Toggle, View, Button, Page, Navbar, Toolbar, Link, Tab, Tabs, Block, theme } from 'framework7-svelte';
	import { onMount } from 'svelte';
	// import Scanner from './Scanner.svelte';
	import routes from './routes.js';
	import { products } from './store.js';
	
	onMount(() => {
		
	});
</script>
<div>

<App theme="auto" autoDarkTheme={true} themeDark={true} name="Barcode Reader" id="com.barcodeapp.app" routes={routes}>
  <View main url="/" />
</App>
</div>

<style lang="postcss">
</style>