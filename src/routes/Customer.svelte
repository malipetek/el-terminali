<script>
  import { List, ListInput, Block, BlockTitle, Card, CardHeader, CardContent, CardFooter, Link, Input, Button, ListButton, ListItem, Stepper, Chip } from 'framework7-svelte';
  import { customers, activeOrder, tags } from '../store.js';

  import iterable from '../utils/iterable.js';
  import Camera from '../Camera.svelte';
  export let afterDelete = () => {};
  export let onSave = () => {};

  export let customer;
  let tagToAdd;
  export let temporary = false;
  let cameraOpen = false;
  
  const debounced = (() => { 
    customers.setCustomer({tags: new Set, ...customer});
  }).debounce(1000);
  
  $: if(customer && !temporary) {
    debounced();
  }
  $: console.log('customer temp or normal', customer);
  $: imgsrc = customer.pp;

  $: if(customer) {
    customer.tags = customer.tags || new Set; 
  }

</script>
<!-- <List>
  <ListItem>
    <div style="margin: 0 auto">
        <div on:click|stopPropagation={() => $activeOrder.setCustomer(customer)}>
          <Button large fill> Seç </Button>
        </div>
    </div>
  </ListItem>
</List> -->
<Card class="demo-card-header-pic">
  {#if cameraOpen}
  <Camera capture={(src) => {
    cameraOpen = false;
    customer.pp = src;
  }} 
  cancel={() => {
    cameraOpen = false;
  }}
  />
  {:else}
  <CardHeader
    class="no-border"
    valign="bottom"
    style={`background-image: url("${ (imgsrc || '') }"); background-size: contain; background-repeat: no-repeat;`}
  >Müşteri PP</CardHeader>
  <CardFooter>
    <Link fill large on:click={() => { cameraOpen = true }}>Değiştir</Link>
  </CardFooter>
  {/if}
</Card>

{#if temporary}
<Card> 
  <Button large raised fill 
    on:click={onSave}> 
    Yeni müşteri kaydet 
  </Button>
</Card>
{/if}
<List inlineLabels noHairlinesMd>
  <ListInput
    label="Müşteri İsim"
    type="text"
    placeholder="Müşteri İsim"
    clearButton
    bind:value={customer.name}
  />
  <ListInput
    label="Müşteri Telefon"
    type="tel"
    placeholder="Müşteri Telefon"
    clearButton
    bind:value={customer.phone}
  />
  <ListInput
    label="Müşteri Email"
    type="email"
    placeholder="Müşteri Email"
    clearButton
    bind:value={customer.email}
  />
  <Block>
    <BlockTitle>Müşteri Etiketleri </BlockTitle>
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
      onClick={() => {console.log('add clicked'), customer.tags = tags.setTag(customer, tagToAdd), tagToAdd = ''}}
      > 
      Ekle 
    </Button>
    </ListItem>
    <Block>
      {#each iterable(customer.tags) as tag}
        <Chip text={tag} style="filter: hue-rotate({$tags.get(tag)}deg)" color="deeppurple" deleteable onDelete={() => customer.tags = tags.deleteTag(customer, tag) } />
      {/each}
    </Block>
  </Block>
  {#if !temporary}
  <ListItem>
      <Button large fill raised color="red"
      on:click={() => {
        customers.deleteCustomer(customer.id);
        afterDelete();
      }} >
      Müşteriyi Sil
    </Button>
  </ListItem>
  {/if}
</List>