<script> 
  import { List, ListItem, Button, Stepper, SwipeoutActions, SwipeoutButton, theme } from 'framework7-svelte';
  import { products, orders, activeOrder } from '../store.js';
  import ProductItem from './ProductItem.svelte';
  import { get } from 'svelte/store';
  export let onClick = () => {};
  export let searchQuery = '';

  let items = [];
  $: items = [...$products.entries()];
  
  $: vlData = {
    items: [],
  }

  function findIn(obj, key, find) {
    if(key == 'tags') {
      return find.reduce((result, tag) => result && (obj[key] || new Set).has(tag), true);
    }
    return (obj[key] || '').toLowerCase().indexOf(find.trim().toLowerCase()) > -1;
  }

  $: if(searchQuery) {
    const searchTags = [];
    searchQuery = searchQuery.replaceAll(/#([^\s]*)(\s|$)/gi, (a, tag, end) => { searchTags.push(tag); return ''; });

    vlData.items = items.slice().filter(item => {
      return findIn(item[1], 'tags', searchTags) && (findIn(item[1], 'title', searchQuery) || findIn(item[1], 'barcode', searchQuery));
    });
  } else {
    vlData.items = items;
  }

</script>
<List class="searchbar-not-found">
  <ListItem title="Nothing found"></ListItem>
</List>
<List
  class="searchbar-found products-list"
  medialList
  virtualList
  virtualListParams={{
    height: theme.ios ? 63 : (theme.md ? 73 : 77)
  }}
>
    {#each vlData.items as item, index (index)}
    <ProductItem 
      topPosition={vlData.topPosition}
      items={items}
      item={item}
      itemClick={(item) => onClick(item)}
    />
    {/each}
</List>