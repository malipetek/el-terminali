<script>
  import { Page, Card, Searchbar, Toolbar, List, ListItem, ListGroup, Button, Chip, Block, Popup, Navbar, NavRight, Link, theme } from 'framework7-svelte';
  import Customer from './Customer.svelte';
  import * as gridy from 'gridy-avatars';
  import svgToUrl from '../utils/svg-to-url.js';
  import { customers, tags } from '../store.js';
  import iterable from '../utils/iterable.js';
  import structuredClone from '@ungap/structured-clone';

  let customerNotFoundPopup = false;
  let temporaryCustomer;
  export let itemClick = () => {};
  export let newCustomerSave = () => {};

  let searchQuery = '';
  let items = [];
  $: items = [...$customers.entries()];
  
  $: vlData = {
    items: [],
  }

  function findIn(obj, key, find) {
    if(key == 'tags') {
      return find.reduce((result, tag) => result && (obj[key] || new Set).has(tag), true);
    }
    return (obj[key] || '').toLowerCase().indexOf(find.trim().toLowerCase()) > -1;
  }

  let aplhabet = 'abcçdefgğhıijklmnoöprsştuüvyz';

  $: if(searchQuery) {
    const searchTags = [];
    let _searchQuery = searchQuery.replaceAll(/#([^\s]*)(\s|$)/gi, (a, tag, end) => { searchTags.push(tag); return ''; });

    console.log('searchQuery = ', _searchQuery, _searchQuery.length);
    console.log('searchTags = ', searchTags);
    vlData.items = items.slice().filter(item => {
        console.log('item = ', item);
        console.log('tag found ', findIn(item[1], 'tags', searchTags));
      return findIn(item[1], 'tags', searchTags) && (findIn(item[1], 'name', _searchQuery) || findIn(item[1], 'email', _searchQuery)  || findIn(item[1], 'phone', _searchQuery));
    });

    console.log('vlData.items', vlData.items);
    // group items by starting char 
    let itemsByChar = {};
    for (let i = 0; i < vlData.items.length; i++) {
      let item = vlData.items[i];
      let char = (item[1].name || item[1].email || '')[0].toLowerCase();
      if (aplhabet.indexOf(char) > -1) {
        if (!itemsByChar[char]) {
          itemsByChar[char] = [];
        }
        itemsByChar[char].push(item);
      }
    }
    vlData.groupedItems = itemsByChar;
  } else {
    vlData.items = items;
     // group items by starting char 
    let itemsByChar = {};
    for (let i = 0; i < vlData.items.length; i++) {
      let item = vlData.items[i];
      let char = (item[1].name || item[1].email || '')[0].toLowerCase();
      if (aplhabet.indexOf(char) > -1) {
        if (!itemsByChar[char]) {
          itemsByChar[char] = [];
        }
        itemsByChar[char].push(item);
      }
    }
    vlData.groupedItems = itemsByChar;
  }
  
</script>
<Searchbar
        placeholder="Müşteri Ara"
        bind:value={searchQuery}
        searchContainer=".search-list"
        searchIn=".item-title"
        disableButton={!theme.aurora}
      />
<Page>
  <Card>
    <Button fill raised large on:click={async () => {
      temporaryCustomer = ({ id: Math.round(Math.random() * 999999).toString(36), 
        name: '',
         phone: '',
          email: '',
          pp: svgToUrl(gridy.outer(gridy.random())),
          tags: new Set
         });
      await new Promise(done => setTimeout(done, 200));
      customerNotFoundPopup = true;
      }}>
       Yeni Müşteri 
      </Button>
  </Card>

  <List class="searchbar-not-found">
    <ListItem title="Nothing found"></ListItem>
  </List>
  <List 
    contactsList 
    ul={false}
    class="searchbar-found customers-list"
    virtualList
    virtualListParams={{
      height: theme.ios ? 63 : (theme.md ? 73 : 77)
    }}
  >
    {#each Object.keys(vlData.groupedItems) as letter}
    <ListGroup>
      <ListItem title={letter} groupTitle></ListItem>
      {#each iterable(vlData.groupedItems[letter]) as item, index (index)}
      <ListItem
          mediaItem
          title={item[1].name || item[1].email || item[1].phone }
          subtitle={item[1].name ? item[1].email : ''}
          after={item[1].phone}
          key={item[0]}
          on:click={() => itemClick(item[1])}
        >
        <img slot="media" alt="customer pp avatar" src={item[1].pp } width="40" on:click={() => itemClick(item[1])} />
        <div>
          {#each (iterable(item[1].tags)) as tag}
            <Chip text={tag} style="filter: hue-rotate({$tags.get(tag)}deg)" color="deeppurple" class="mr-3" />
          {/each}
        </div>
      </ListItem>
      {/each}
    </ListGroup>
    {/each}
  </List>
</Page>

<Popup class="customer-popup" opened={customerNotFoundPopup} onPopupClosed={() => customerNotFoundPopup = false} onSwipeToClose={() => customerNotFoundPopup = false} >
  <Page>
    <Navbar title="Yeni Müşteri">
      <NavRight>
        <Link popupClose>Kapat</Link>
      </NavRight>
    </Navbar>
      {#if customerNotFoundPopup == true && temporaryCustomer}
        <Customer bind:customer={temporaryCustomer} temporary={true} onSave={async () => {
            customerNotFoundPopup = false;
            await new Promise(done => setTimeout(done, 200));
            newCustomerSave(structuredClone(temporaryCustomer));
          }} />
      {/if}
  </Page>
</Popup>