<script>
  import { Card, CardContent, Icon, BlockTitle, NavRight, Popup, Button, Page, Navbar, Toolbar, Link, Tab, Tabs, Block, Searchbar, Row, Col, LoginScreen, LoginScreenTitle, List, ListInput, BlockFooter, theme, ListItem, f7 } from 'framework7-svelte';
  import Scanner from '../Scanner.svelte';
  import Camera from '../Camera.svelte';
  import Products from './Products.svelte';
  import Product from './Product.svelte';
  import Orders from './Orders.svelte';
  import Cart from './Cart.svelte';
  import Customers from './Customers.svelte';
  import Customer from './Customer.svelte';
  import { products, orders, customers, cartOrder, activeOrder, previewOrder, tags, seller } from '../store.js';
  import downloadJSON from '../utils/download.js';
  import { onMount } from 'svelte';
  
  let persistent;
  let files, fileinput;
  let fileReader = new FileReader();
  $: if(files && files[0]) {
    fileReader.readAsText(files[0]);
  }
  fileReader.onload = async () => {

    let backupData; 
    try {
      backupData = JSON.parse(fileReader.result);
    } catch(e) {
      return f7.dialog.alert('Dosya geçerli bir yedek dosyası değil.');
    }

    let importPreference = ''; 
    importPreference = await new Promise(done => {
      f7.dialog.create({
          title: 'Yedek Yükleme',
          text: 'Yüklemek istediklerinizi seçin',
          buttons: [
            {
              text: 'Hepsi',
              onClick: () => done('all')
            },
            {
              text: 'Siparişler',
              onClick: () => done('only-orders')
            },
            {
              text: 'Ürünler',
              onClick: () => done('only-products')
            },
            {
              text: 'Müşteriler',
              onClick: () => done('only-customers')
            },
            {
              text: 'Etiketler',
              onClick: () => done('only-tags')
            },
          ],
          verticalButtons: true,
        }, done, done).open();
    });

    if(importPreference == 'all' || importPreference == 'only-products') {
    
      backupData.products.forEach((product) => {
        product.tags = new Set(Array.isArray(product.tags) ? product.tags : []);
        products.setProduct(product);
      });
    
    }
    if(importPreference == 'all' || importPreference == 'only-tags') {
      backupData.customers.forEach(customer => {
        customer.tags = new Set(Array.isArray(customer.tags) ? customer.tags : []);
        customers.setCustomer(customer);
      });
    }

    if(importPreference == 'all' || importPreference == 'only-orders') {
      backupData.orderDates.forEach(date => {
        date.orders = new Set(date.orders);

      });
      
      backupData.orders.forEach(day => {
        day.forEach(orderEntry => {
          const [id, order] = orderEntry;
          orders.setDate(new Date(order.date));
          orders.setOrder(order);
          orders.setDate(new Date());
        });
      });
    }

    if(importPreference == 'all' || importPreference == 'only-tags') {
      backupData.tags.forEach(tag => {
        tags.saveTag(tag[0], tag[1])
      });
    }

    f7.dialog.alert('Yedek dosyası başarıyla yüklendi.');
  }
  let searchQuery = '';
  let barcodePopup = false;
  let productPopup = false;
  let cartPopup = false;
  let cameras = [];
  let preferredCamera = localStorage.getItem('preferredCamera');
  let customerPopup = false;
  let productNotFoundPopup = false;
  let loginScreenOpened = false;
  let temporaryProduct;
  let selectedProduct, selectedCustomer, deferredPrompt, canInstall, installed;

  $: console.log('$activeOrder', $activeOrder);
  $: console.log('$previewOrder', $previewOrder);
  $: console.log('$cartOrder', $cartOrder);

  const backupProducts = async () => {
    const allOrders = await orders.getAllOrders();
    // downloadJSON    
    console.log({
          products: Array.from($products.entries()).map(e => e[1]),
          customers: Array.from($customers.entries()).map(e => {
            const customer = e[1];
            customer.tags = Array.from(customer.tags);
            return customer;
          }),
          tags: Array.from($tags.entries()),
          orderDates: Array.from(allOrders.orderDates.map(entry => {
            const orderDay = entry[1];
              orderDay.orders = Array.from(orderDay.orders || new Set);
            return orderDay;
          })),
          orders: allOrders.orders.map(day => {
            day.forEach(entry => {
              const order = entry[1];
              (order.lineItems || []).map(lineItem => {
                  lineItem.product.tags = Array.from(lineItem.product.tags || new Set);
                return lineItem;
              });
              return order;
            });
            return day;
          }),
        }, 'yedek_' + (new Date()).toLocaleDateString() );
    };

    const uploadProducts = () => {
      fileinput.click();

    };


  window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
      installed = true;
      deferredPrompt = null;
  });

  /**
   * @return {'twa'|'standalone'|'browser'}
  */
  function getPWADisplayMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (document.referrer && document.referrer.startsWith('android-app://')) {
      return 'twa';
    } else if (navigator.standalone || isStandalone) {
      return 'standalone';
    }
    return 'browser';
  }

//   window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
//   let displayMode = 'browser';
//     canInstall = true;
//   if (evt.matches) {
//     displayMode = 'standalone';
//     canInstall = false;
//     installed = true;
//   }
// });

  onMount(async () => {
    cameras = (await navigator.mediaDevices.enumerateDevices()).filter(dev => dev.kind == 'videoinput');
    if (navigator.storage && navigator.storage.persist){
      persistent = await navigator.storage.persist();
    }
  });

  const preferredCameraChange = e => {
    preferredCamera = e.srcElement.value;
    localStorage.setItem('preferredCamera', preferredCamera);
  }

  $: console.log('cartPopup ', cartPopup);

  $: if(cartPopup) {
    setTimeout(() => {
            const cartPopupEl = document.querySelector('.cart-popup');
            if(!cartPopupEl.classList.contains('modal-in')) {
              cartPopupEl.classList.add('modal-in');
            }
          }, 1000);
  }
</script>
<input type="file" bind:this={fileinput} bind:files>
<Page pageContent={false}>
  <Toolbar tabbar top>
    <Link tabLink="#tab-1" tabLinkActive><Icon f7="tag" /></Link>
    <Link tabLink="#tab-2"><Icon f7="folder" /></Link>
    <Link tabLink="#tab-3"><Icon f7="person_3" /></Link>
    <Link tabLink="#tab-4"><Icon f7="wrench" /></Link>
  </Toolbar>
  <Tabs 
  swipeable
  swiperParams={{
    shortSwipes: true
  }}>
    <Tab id="tab-1" class="page-content" tabActive>
      <Searchbar
        placeholder="Ürün Ara"
        bind:value={searchQuery}
        searchContainer=".search-list"
        searchIn=".item-title"
        disableButton={!theme.aurora}
      />
      <Card>
        <CardContent>
          {#if !barcodePopup}
            <Button large raised fill on:click={() => barcodePopup = true}> <Icon f7="barcode" /> &nbsp;&nbsp;&nbsp;&nbsp;Ürün Okut </Button>
          {:else}
            <Scanner onDetected={async (barcode) => {
              barcodePopup = false;
              await new Promise(done => setTimeout(done, 200));
              selectedProduct = products.getProduct(barcode);
              if(!selectedProduct) {
                temporaryProduct = ({ barcode, title: '', tags: new Set });
                await new Promise(done => setTimeout(done, 200));
                productNotFoundPopup = true;
              } else {
                await new Promise(done => setTimeout(done, 200));
                productPopup = true;
              }
            }} />
            <Button large raised fill color="red" on:click={() => barcodePopup = false}> İptal </Button>
          {/if}
            {#if $activeOrder}
              <p>
                <Button large raised fill color="deeppurple" on:click={() => cartPopup = true}> <Icon f7="bag" /> &nbsp;&nbsp;&nbsp;&nbsp; Sepet </Button>
              </p>
            {:else }
            <p>
              <Button large raised fill on:click={orders.newOrder}> <Icon f7="bag" /> &nbsp;&nbsp;&nbsp;&nbsp;Yeni Sipariş </Button>
            </p>
            {/if}

        </CardContent>
      </Card>
      <BlockTitle>Ürünler</BlockTitle>
      <Products onClick={(item) => {productPopup = true; selectedProduct = item[1];} } searchQuery={searchQuery} />
    </Tab>
    <Tab id="tab-2" class="page-content">
      <Orders orderClick={() => {
        console.log('$cartOrder, $previewOrder, $activeOrder ', $cartOrder, $previewOrder, $activeOrder);
        cartPopup = true;
        }} />
    </Tab>
    <Tab id="tab-3" class="page-content">
      <Customers  
        itemClick={async customer => {
            selectedCustomer = customer;
            await new Promise(done => setTimeout(done, 200));
            customerPopup = true;
          }
        }
        newCustomerSave={async (customer) => {
            selectedCustomer = customer;
            await new Promise(done => setTimeout(done, 200));
            customerPopup = true;
            await new Promise(done => setTimeout(done, 200));
        }}
        />
    </Tab>
    <Tab id="tab-4" class="page-content">
      <Block>
        <BlockTitle> Ayarlar </BlockTitle>
        {#if deferredPrompt}
          <Card>
            <CardContent>
              <Button on:click={async () => {
                
                deferredPrompt.prompt();
                /** @const {'dismissed'|'accepted'} outcome */
                const { outcome } = await deferredPrompt.userChoice;
              }}> Uygulamayı Yükle </Button>
            </CardContent>
          </Card>
        {/if}
        <p> </p>
        <p>
          <Button large raised fill on:click={backupProducts}> Yedek Al </Button>
        </p>
        <p>
          <Button large raised fill on:click={uploadProducts}> Yedek Yükle </Button>
        </p>

        <List> 
          <ListInput 
            label="Satıcı İsmi" 
            type="text"
            on:change={(e) => {
              seller.set(e.detail[0].srcElement.value);
            }}
            value={$seller}
          />
        </List>
        <List title="Tercih Edilen Kamera" >
          {#each cameras as camera}
            <ListItem 
              onChange={preferredCameraChange}
              radio
              checked={preferredCamera == camera.deviceId}
              title={camera.label}
              value={camera.deviceId} 
              name="preferred-camera"
               />
          {/each}
          </List>
      </Block>
      <Block title="Hafıza Türü">
        {#if persistent } Kalıcı (Yedek çok gerekli değil) {:else } Geçici (Yedek gerekli) {/if}
      </Block>
    </Tab>
  </Tabs>
  {#if $activeOrder }
  <Toolbar bottom >
        <div width="33">
          <Button large color="gray" on:click={() => {
            activeOrder.set(null);
            previewOrder.set(null);
            }}> Bitir </Button> 
        </div>
        <div style="flex: 1 1 100%;">
          <Link on:click={() => cartPopup = true} > <h1> {$activeOrder.total} ₺ </h1> </Link>
        </div>
        <div width="33">
          <Button large color="red" on:click={() => orders.discardOrder($activeOrder)}> Sil </Button> 
        </div>
  </Toolbar>
  {/if}
</Page>

<!-- <Popup class="scanner-popup" opened={barcodePopup} onPopupClosed={() => barcodePopup = false} onSwipeToClose={() => barcodePopup = false}>
  <Page>
    <Navbar title="Kamera ile Okut">
      <NavRight>
        <Link popupClose>Kapat</Link>
      </NavRight>
    </Navbar>
      {#if barcodePopup == true }
        
      {/if}
  </Page>
</Popup> -->

<Popup class="cart-popup" opened={cartPopup} onPopupClosed={() => cartPopup = false} onSwipeToClose={() => cartPopup = false} swipeToClose>
  <Page>
    <Navbar title="Sipariş #{ ($activeOrder || $previewOrder || {}).number }">
      <NavRight>
        <Link popupClose>Kapat</Link>
      </NavRight>
    </Navbar>
      {#if cartPopup == true }
        <Cart onDelete={() => {
          cartPopup = false;

          setTimeout(() => {
            cartPopup = false;
          }, 100);
        }} />
      {/if}
  </Page>
</Popup>

<Popup class="product-popup" opened={productPopup} onPopupClosed={() => productPopup = false} onSwipeToClose={() => productPopup = false} swipeToClose>
  <Page>
    <Navbar title={selectedProduct ? selectedProduct.title : 'Ürün'}>
      <NavRight>
        <Link popupClose>Kapat</Link>
      </NavRight>
    </Navbar>
      {#if productPopup == true && selectedProduct}
        <Product bind:product={selectedProduct} afterDelete={() => { 
            productPopup = false;
            selectedProduct = null;
         } } />
      {/if}
  </Page>
</Popup>

<Popup class="product-popup" opened={productNotFoundPopup} onPopupClosed={() => productNotFoundPopup = false} onSwipeToClose={() => productNotFoundPopup = false} >
  <Page>
    <Navbar title="Ürün Bulunamadı">
      <NavRight>
        <Link popupClose>Kapat</Link>
      </NavRight>
    </Navbar>
      {#if productNotFoundPopup == true && temporaryProduct}
        <Product bind:product={temporaryProduct} temporary={true} onSave={async () => {
            productNotFoundPopup = false;
            await new Promise(done => setTimeout(done, 200));
            selectedProduct = structuredClone(temporaryProduct);
            temporaryProduct = null;
            await new Promise(done => setTimeout(done, 200));
            productPopup = true;
            await new Promise(done => setTimeout(done, 200));
          }} />
      {/if}
  </Page>
</Popup>

<Popup class="customer-popup" opened={customerPopup} onPopupClosed={() => customerPopup = false} onSwipeToClose={() => customerPopup = false} swipeToClose>
  <Page>
    <Navbar title={selectedCustomer ? (selectedCustomer.name || selectedCustomer.email || selectedCustomer.phone) : 'Müşteri'}>
      <NavRight>
        <Link popupClose>Kapat</Link>
      </NavRight>
    </Navbar>
      {#if customerPopup == true && selectedCustomer}
        <Customer bind:customer={selectedCustomer} afterDelete={() => { 
            customerPopup = false;
            selectedCustomer = null;
         } } />
      {/if}
  </Page>
</Popup>

<!-- 
<LoginScreen
class=""
opened={loginScreenOpened}
onLoginScreenClosed={() => loginScreenOpened = false}
>
<Page loginScreen>
  <LoginScreenTitle>Framework7</LoginScreenTitle>
  <List form>
    <ListInput
      label="Kullanıcı"
      type="text"
      placeholder="Kullanıcı"
      value={$user.name}
      onInput={(e) => $user.name}
    />
    <ListInput
      label="Password"
      type="password"
      placeholder="Your password"
      value={password}
      onInput={(e) => password = e.target.value}
    />
  </List>
  <List>
    <ListButton onClick={signIn}>Giriş Yap</ListButton>
  </List>
  <BlockFooter>Some text about login information.<br />Lorem ipsum dolor sit amet, consectetur adipiscing elit.</BlockFooter>
</Page>
</LoginScreen> -->