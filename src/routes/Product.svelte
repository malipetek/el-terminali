<script>
  import { List, ListInput, Block, BlockTitle, Card, CardHeader, CardContent, CardFooter, Link, Input, Button, ListButton, ListItem, Stepper, Chip } from 'framework7-svelte';
  import { products, activeOrder, tags } from '../store.js';
  import { tick } from 'svelte';
  import iterable from '../utils/iterable.js';
  import Camera from '../Camera.svelte';
  export let afterDelete = () => {};
  export let onSave = () => {};

  export let product;
  let tempProduct, tagToAdd;
  export let temporary = false;
  let cameraOpen = false;
  
  const debounced = (() => { 
    products.setProduct({tags: new Set, ...product});
  }).debounce(1000);
  
  $: if(product && !temporary) {
    debounced();
  }

  $: imgsrc = product.img || 'images/prod.jpg';
  
  let saleMode = !!product.sale_price;
  let profit = 0;
  
  $: if(product.price && product.cost) {
    let taxamount = product.cost * (+(product.tax || 0)/100);
    let moneyleft = product.price - taxamount - product.cost;

    profit = (moneyleft / product.cost) * 100;
  }

  $: console.log(product, tagToAdd);

  $: if(product) {
    product.tags = product.tags || new Set; 
  }

</script>
<List>
{#if $activeOrder}
  {@const stats = $activeOrder.productStats(product.barcode)}
    <ListItem>
      <div style="margin: 0 auto">
        {#if (stats.has) }
          <Stepper large fill value={stats.qty} on:input={(e) => $activeOrder.addProduct(product.barcode, e.detail[1].value)}></Stepper>
          <div on:click|stopPropagation={() => $activeOrder.addProduct(product.barcode, 1)}>
          </div>
        {:else}
          <div on:click|stopPropagation={() => $activeOrder.addProduct(product.barcode, 1)}>
            <Button large fill> Sepete Ekle </Button>
          </div>
        {/if}
      </div>
    </ListItem>
{/if}
</List>
<Card class="demo-card-header-pic">
  {#if cameraOpen}
  <Camera capture={(src) => {
    cameraOpen = false;
    product.img = src;
  }} 
  cancel={() => {
    cameraOpen = false;
  }}
  />
  {:else}
  <CardHeader
    class="no-border"
    valign="bottom"
    style="background-image: url({ imgsrc }); background-size: contain; background-repeat: no-repeat;"
  >Ürün Resmi</CardHeader>
  <CardFooter>
    <Link fill large on:click={() => { cameraOpen = true }}>Değiştir</Link>
  </CardFooter>
  {/if}
</Card>

{#if temporary}
<Button large raised fill 
    on:click={onSave}> 
    Yeni ürün olarak kaydet 
  </Button>
{/if}
<List inlineLabels noHairlinesMd>
  <ListInput
    label="Ürün Adı"
    type="text"
    placeholder="Ürün Adı"
    clearButton
    bind:value={product.title}
  />
  {#if !saleMode}
    <ListInput
      class="price-input"
      label="Ürün Fiyatı"
      type="number"
      inputmode="decimal"
      placeholder="Ürün Fiyatı"
      clearButton
      bind:value={product.price}
    />
    <ListInput
      label="Ürün İndirimli Fiyat"
      type="number"
      inputmode="decimal"
      placeholder="İndirimli Fiyat"
      clearButton
      value={product.sale_price}
      inputId="realSale"
      on:input={(e) => {
        if(!product.sale_price) {
          product.sale_price = product.price;
          product.price = +e.detail[0].data;
          saleMode = true;
          tick().then(() => {
            document.querySelector('#fakeSale').focus();
          });
        }
      }}
    />
  {:else}
    <ListInput
        class="price-input"
        label="Ürün Fiyatı"
        type="number"
        inputmode="decimal"
        placeholder="Ürün Fiyatı"
        clearButton
        bind:value={product.sale_price}
      />
    <ListInput
      label="Ürün İndirimli Fiyat"
      type="number"
      inputmode="decimal"
      placeholder="İndirimli Fiyat"
      clearButton
      inputId="fakeSale"
      bind:value={product.price}
      on:input={async (e) => {
        let newvalue = '' + (product.price || '');
      
        if (e.detail[0].inputType == 'deleteContentBackward') {
          newvalue = (newvalue || ' ').slice(0, -1);
        } else{
          newvalue = (newvalue || '' + e.detail[0].data);
        }

        if(!newvalue) {
          const sale_price = product.sale_price;
          await tick();
          product.price = sale_price;
          product.sale_price = '';
          saleMode = false;
          await tick();
          document.querySelector('#realSale').focus();
          
        } else {
          product.price = +newvalue;
        }
      }}
    />
  {/if}
  <ListInput
    label="Ürün Maliyet"
    type="number"
    inputmode="decimal"
    placeholder="Ürün Maliyeti"
    clearButton
    bind:value={product.cost}
  />
  <ListInput
    label="KDV"
    type="number"
    inputmode="decimal"
    placeholder="KDV"
    clearButton
    min="0"
    max="100"
    bind:value={product.tax}
  />
  <ListInput
    label="Barkod"
    type="text"
    placeholder=""
    readonly
    disabled
    bind:value={product.barcode}
  />
  <Block>
    <BlockTitle>Ürün Etiketleri </BlockTitle>
    <ListItem>
    <input
      class="flex-half"
      type="text"
      placeholder="Etiket Adı"
      bind:value={tagToAdd}
      list="tags"
    />
    <datalist id="tags">
      {#each iterable($tags) as etag}
        {@const tag = etag[0]}
        <option value={tag}>{tag}</option>
      {/each}
    </datalist>
    <Button 
      class="flex-half"
      color="green"
      fill
      large
      onClick={() => {console.log('add clicked'), product.tags = tags.setTag(product, tagToAdd), tagToAdd = ''}}
      > 
      Ekle 
    </Button>
    </ListItem>
    <Block>
      {#each iterable(product.tags) as tag}
        <Chip text={tag} style="filter: hue-rotate({$tags.get(tag)}deg)" color="deeppurple" deleteable onDelete={() => product.tags = tags.deleteTag(product, tag) } />
      {/each}
    </Block>
  </Block>
  {#if !temporary}
  <ListItem>
      <Button large fill raised color="red"
      on:click={() => {
        products.deleteProduct(product.barcode);
        afterDelete();
      }} >
      Ürünü Sil
    </Button>
  </ListItem>
  {/if}

   <ListInput
    label="Kârlılık"
    type="text"
    inputmode="text"
    value={ !product.price ? 
    'Ürün fiyatı belirsiz'
     : 
     !product.cost ? 'Maliyet belirsiz'
    : `${profit  < 0 ? 'Zarar' : 'Kâr' } ${ Math.abs(profit).toFixed(2) }%` }
    readonly
    disabled
  />
 
</List>