<script>
  import { Datepicker } from "svelte-calendar";
  import { Button, Page, Icon, List, ListItem, Badge, Chip } from "framework7-svelte";
  import { orders, activeOrder, previewOrder, HollowOrder, customers, cartOrder } from '../store.js';
  export let orderClick = () => {};
  export let searchQuery = '';
  
  const theme = {
    calendar: {
      width: "600px",
      shadow: "0px 0px 5px rgba(0, 0, 0, 0.25)",
    },
  };

  let store, storeDefined;

  $: if(!storeDefined && store) {
    storeDefined = true;
    store.subscribe((n) => {
      console.log('Store changed', n);
      orders.setDate(n.selected);
    });
  }
  // Orders

  let items = [];
  $: items = [...$orders.entries()].sort((b, a) => {
    return a[1].number - b[1].number;
  });
  let vlData = { items: [] };
  
  function findIn(obj, key, find) {
    return (obj[key] || '').toLowerCase().indexOf(find.trim().toLowerCase()) > -1;
  }

  $: if(searchQuery && $orders) {
    console.log('refreshing vlData');
    vlData = { items: items.slice().filter(item => {
      return findIn(item[1], 'title', searchQuery) || findIn(item[1], 'barcode', searchQuery) || findIn(item[1], 'tags', searchQuery);
    }).sort((a, b) => a.number - b.number) };
  } else {
    vlData = { items: items.sort((a, b) => a.number - b.number) };
  }

</script>

<Page>
<div class="grid date-container">
        <Button class="day" on:click={() => store.add(-1, "day")}><Icon f7="arrowtriangle_left_fill" /> </Button>
        <Datepicker bind:store {theme} let:key let:send let:receive>
          <div in:receive|local={{ key }} out:send|local={{ key }}>
            <Button large raised fill>
              {#if $store}
                {$store.selected.toLocaleDateString("tr-TR", { weekday: 'long', month: 'long', day: 'numeric' })}
              {:else}
                Pick a Date
              {/if}
            </Button>
          </div>
        </Datepicker>
        <Button class="day" on:click={() => store.add(1, "day")}><Icon f7="arrowtriangle_right_fill" /> </Button>
      </div>
  
      <List class="searchbar-not-found">
        <ListItem title="Nothing found"></ListItem>
      </List>
      <List
        class="searchbar-found order-list"
        medialList
        virtualList
        virtualListParams={{
          height: theme.ios ? 63 : (theme.md ? 73 : 77)
        }}
      >
          {#each vlData.items as item, index (item[0])}
            <ListItem
              mediaItem
              style={`top: ${vlData.topPosition}px`}
              virtualListIndex={items.indexOf(item)}
              disabled={$activeOrder && item[0] !== $activeOrder.id}
              on:click={() => {
                  if($activeOrder && item[0] !== $activeOrder.id) return;
                  previewOrder.update(n => {
                    const ho = new HollowOrder(item[1]);
                    console.log('setting previewOrder ', ho);
                    return ho;
                  }); 
                  orderClick();
                } 
              }
            >
            <div slot="title" class="flex flex-base">
              {#if $activeOrder && $activeOrder.id === item[0]}
                <Icon f7="bag_fill" color="yellow" /> 
              {/if}
              <h2 class="m-0"> #{item[1].number} </h2> 
              <h4 class="m-0 ml-10" flex flex-wrap>
                <span flex-full>
                  { $customers.get(item[1].customer) ? ($customers.get(item[1].customer).name || $customers.get(item[1].customer).email || $customers.get(item[1].customer).phone) : item[1].id }
                </span>
                <Chip text={item[1]._orderstatusTR} />
                <Chip text={item[1]._paymentstatusTR} />
                <Chip text={item[1]._fullfilmentstatusTR} />
              </h4>
            </div>
            <span slot="inner-end" class="flex flex-vcenter">
              <Badge large color="deeppurple"> {item[1].lineItems ? item[1].lineItems.length : 0} </Badge>
              <h2 class="m-0 ml-20">{item[1].total || '-- '}₺ </h2>
            </span>
          </ListItem>
          {/each}
      </List>
</Page>
<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 3fr 1fr;
    padding-top: 1rem;
  }
  :global(.date-container .contents-wrapper) {
      padding-top: calc(var(--f7-page-navbar-offset,0px) + var(--f7-page-toolbar-top-offset,0px) + var(--f7-page-subnavbar-offset,0px) + var(--f7-page-searchbar-offset,0px) + var(--f7-page-content-extra-padding-top,0px) + 2rem);
    }
    :global(.sc-popover .trigger) {
      width: 99.7%;
    }
</style>