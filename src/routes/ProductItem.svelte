<script>
  import { ListItem, Stepper, Button, Block, Chip } from 'framework7-svelte';
  import { activeOrder, previewOrder, tags } from '../store.js';
  import iterable from '../utils/iterable.js';
  export let itemClick = () => {};
  let order = $activeOrder || $previewOrder;
  $: order = $activeOrder || $previewOrder;
  export let topPosition = 0;
  export let items = [];
  export let item; 
</script>
 <ListItem
        mediaItem
        style={`top: ${topPosition}px`}
        virtualListIndex={items.indexOf(item)}
      >
      <img slot="media" alt="product" src={item[1].img || 'images/prod.jpg'} width="80" on:click={() => itemClick(item)} />
      <div slot="inner-start" style="height: 100%; flex: 1" on:click={() => console.log('clicked'),itemClick(item)}> 
        <h4 class="m-0"> { item[1].title || 'Başlıksız Ürün' } </h4>
        <Block>
          {#each (iterable(item[1].tags)) as tag}
            <Chip text={tag} style="filter: hue-rotate({$tags.get(tag)}deg)" color="deeppurple" class="mr-3" />
          {/each}
        </Block>
      </div>
      <span slot="inner-end" class="product-actions">
        {#if item[1].sale_price}
          <span class="overline">{item[1].sale_price}₺</span>
        {/if}
        {#if $previewOrder}
          {@const stats = order.productStats(item[0])}
          <span text-right monospace style="font-size: 20px">{ (+item[1].price || 0).toFixed(2) }₺ x { stats.qty } <span text-large> { ((+item[1].price || 0) * +stats.qty).toFixed(2) }₺</span></span>
        {:else}
          <span text-right monospace style="font-size: 20px">{ (+item[1].price || 0).toFixed(2) }₺</span>
        {/if}
        {#if $activeOrder}
          {@const stats = order.productStats(item[0])}
            {#if (stats.has) }
              <Stepper fill value={stats.qty} on:input={(e) => $activeOrder.addProduct(item[0], e.detail[1].value)}></Stepper>
                <div on:click|stopPropagation={() => $activeOrder.addProduct(item[0], 1)}>
              </div>
            {:else}
              <div on:click|stopPropagation={() => $activeOrder.addProduct(item[0], 1)}>
                <Button fill> Sepete Ekle </Button>
              </div>
            {/if}
        {/if}
      </span>
    </ListItem>