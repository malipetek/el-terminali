<script>
  import {
    List,
    ListItem,
    ListButton,
    ListInput,
    Input,
    Range,
    Icon,
    Block,
    Row,
    Col,
    Card,
    CardHeader,
    Chip,
    Popup,
    Page,
    Navbar,
    NavRight,
    Link,
    Actions,
    ActionsGroup,
    ActionsLabel,
    ActionsButton,
    Toggle
  } from "framework7-svelte";
  import ProductItem from "./ProductItem.svelte";
  import iterable from "../utils/iterable.js";
  import Customers from "./Customers.svelte";
  import {
    cartOrder,
    previewOrder,
    activeOrder,
    Order,
    HollowOrder,
    orders,
    customers,
    tags
  } from "../store.js";
import { onDestroy, tick } from "svelte";

  export let onComplete = () => {};
  export let onDelete = () => {};

  let discounting = false;
  let discountToBeMade = 0;
  
  let paying = false;
  let paymentToBeMade = 0;

  let customerSelecting = false;

  $: console.log("cart order ", $cartOrder);
  
  onDestroy(() => {
    previewOrder.set(null);
  });
</script>
<List title="Müşteri">
  {#if $cartOrder && $cartOrder.customer}
    {@const customer = $customers.get($cartOrder.customer)}
    {#if customer}
    <ListItem
        mediaItem
        title={customer.name || customer.email || customer.phone }
        subtitle={customer.name ? customer.email : ''}
        after={customer.phone}
      >
      <img slot="media" alt="customer pp avatar" src={customer.pp } width="40" />
      <div>
        {#each (iterable(customer.tags)) as tag}
          <Chip text={tag} style="filter: hue-rotate({$tags.get(tag)}deg)" color="deeppurple" class="mr-3" />
        {/each}
      </div>
    </ListItem>
    {/if}
    {#if $cartOrder.editable}
    <ListButton large raised fill on:click={() => $cartOrder.setCustomer(null)}>
      Kaldır
    </ListButton>
    {/if}
  {:else if $cartOrder.editable}
    <ListButton large fill raised on:click={() => customerSelecting = true}>Müşteri Ekle</ListButton>
  {:else }
    <ListItem title="Müşteri Yok" />
  {/if}
</List>
<List class="cart-items products-list" medialList>
  {#if $cartOrder}
    {#each iterable($cartOrder.lineItems) as item, index (index)}
      {@const product = item.product}
      <ProductItem item={[product.barcode, product]} />
    {:else}
      <ListItem style="color: var(--f7-color-gray)">
        <div w-100 text-center>
          <Icon f7="bag" size="3rem" />
          <h2>
            {#if $activeOrder} Sepetiniz {:else} Bu Sipariş {/if} Boş
          </h2>
          <div />
        </div></ListItem
      >
    {/each}

    <!-- -------------------------------------------------------------------------- */
    /*                                   TOTALS                                   */
    /* -------------------------------------------------------------------------- -->
    <div monospace>
      <Block>
        <Row class="flex-base {$cartOrder.editable ? '' : 'border-bottom'}">
          <Col width="50">
            <div text-large>TOPKDV</div>
          </Col>
          <Col width="50" text-right>
            <div text-x-large>{$cartOrder.totalTax}₺</div>
          </Col>
        </Row>
        {#if $cartOrder.editable}
        <Row class="flex-base border-bottom">
          <Col width="50">
            <div >Vergisiz (Toptan)</div>
          </Col>
          <Col text-right width="50">
            <Toggle 
            checked={$cartOrder.overrideTax} 
            color="blue"
            on:change={(e) => {
              console.log('e ', e);
              $cartOrder.setTaxOverride(e.detail[0].target.checked);
              }}
            ></Toggle>
          </Col>
        </Row>
        {/if}
        <Row class="flex-base border-bottom">
          <Col width="50">
            <div text-large>İNDİRİM</div>
          </Col>
          <Col width="50" text-right>
            <div text-x-large>{$cartOrder.discount}₺</div>
          </Col>
        </Row>
        <Row class="flex-base border-bottom">
          <Col width="50">
            <div text-large>TOPLAM</div>
          </Col>
          <Col width="50" text-right>
            <div text-xx-large>{$cartOrder.total}₺</div>
          </Col>
        </Row>
        <Row green class="flex-base border-bottom">
          <Col width="50">
            <div text-large>ÖDEME</div>
          </Col>
          <Col width="50" text-right>
            <div text-x-large>{(isNaN($cartOrder.paid) ? 0 : (+$cartOrder.paid)).toFixed(2)}₺</div>
          </Col>
        </Row>
        <Row yellow class="flex-base border-bottom">
          <Col width="50">
            <div text>Kalan</div>
          </Col>
          <Col width="50" text-right>
            <div text-large>{$cartOrder.due_amount}₺</div>
          </Col>
        </Row>
      </Block>
    </div>

    <!-- -------------------------------------------------------------------------- */
    /*                                    EDIT                                    */
    /* -------------------------------------------------------------------------- -->
    {#if $cartOrder.editable}
      <ListButton
        large
        raised
        fill
        color="gray"
        on:click={() => {
          previewOrder.set(new HollowOrder($cartOrder.data));
          activeOrder.set(null);
        }}
      >
        <Icon f7="floppy_disk" />
        &nbsp;&nbsp;&nbsp;&nbsp; Düzenlemeyi Bitir
      </ListButton>
    {:else}
      <ListButton
        large
        raised
        fill
        color="gray"
        on:click={() => {
          orders.editOrder($cartOrder.data);
          previewOrder.set(null);
        }}
      >
        <Icon f7="square_pencil" />
        &nbsp;&nbsp;&nbsp;&nbsp; Düzenle
      </ListButton>
      {/if}
     
      <ListButton
        large
        raised
        fill
        color="gray"
        actionsOpen="#fullfilment-actions"
      >
        <Icon f7="car_fill" />
        &nbsp;&nbsp;&nbsp;&nbsp; Teslimat
      </ListButton>

    <!---------------------------------------------------------------------------- */
    /*                                   PAYMENT                                  */
    /* -------------------------------------------------------------------------- -->
    {#if !paying}
      <ListButton large raised fill color="green" on:click={() => paying = true}>
        <Icon f7="wallet" />
        &nbsp;&nbsp;&nbsp;&nbsp; Ödeme Yap
      </ListButton>
    {:else}
    <ListButton large raised fill color="green" on:click={async () => {
      $cartOrder.setPayment(parseFloat($cartOrder.total));
      paying = false;
    }}>
      <Icon f7="wallet" />
      &nbsp;&nbsp;&nbsp;&nbsp; Tamamı Ödendi
    </ListButton>
    <ListButton large raised fill on:click={() => {
      $cartOrder.setPayment(0);
      paying = false;
    }}>
      <Icon f7="wallet" />
      &nbsp;&nbsp;&nbsp;&nbsp; Ödenmedi
    </ListButton>
      <ListInput 
      inputStyle="font-size: 2em; height: 2em"
      label="İndirim"
      placeholder="--₺"
      type="number"
      bind:value={paymentToBeMade}
      />
      <ListButton large raised fill color="green" on:click={() => {
          $cartOrder.setPayment(paymentToBeMade);
          paying = false;
          tick();
        }} >
        {#if paymentToBeMade }
          <Icon f7="wallet" />
        {:else}
          <Icon f7="trash" />
        {/if}
        &nbsp;&nbsp;&nbsp;&nbsp; {#if paymentToBeMade } {paymentToBeMade}₺ Ödeme Yap {:else} İptal Et {/if}
      </ListButton>
    {/if}

    <!-- -------------------------------------------------------------------------- */
    /*                                   DELETE                                   */
    /* -------------------------------------------------------------------------- -->
    <ListButton large raised fill color="red" on:click={async () => {
        await orders.discardOrder($cartOrder, onDelete);
      }}>
      <Icon f7="trash" />
      &nbsp;&nbsp;&nbsp;&nbsp; {#if $cartOrder.editable}İptal Et ve{/if} Sil
    </ListButton>
    
    <!-- -------------------------------------------------------------------------- */
    /*                                  DISCOUNT                                  */
    /* -------------------------------------------------------------------------- -->
    {#if $cartOrder.editable && !discounting}
      <ListButton large raised fill color="yellow" on:click={() => discounting = true} >
        <Icon f7="percent" />
        &nbsp;&nbsp;&nbsp;&nbsp; İndirim Yap
      </ListButton>
    {:else if discounting}
      <ListInput 
      inputStyle="font-size: 2em; height: 2em"
      label="İndirim"
      placeholder="--₺"
      type="number"
      info={`Max indirim ${$cartOrder.totalProfit}₺ olmalı`}
      bind:value={discountToBeMade}
      />
      <ListButton large raised fill color="yellow" on:click={() => {
          $cartOrder.setDiscount(discountToBeMade);
          discounting = false;
        }} >
        {#if discountToBeMade }
          <Icon f7="percent" />
        {:else}
          <Icon f7="trash" />
        {/if}
        &nbsp;&nbsp;&nbsp;&nbsp; {#if discountToBeMade } {discountToBeMade}₺ İndirim Uygula {:else} İptal Et {/if}
      </ListButton>
    {/if}
  {/if}
</List>


<Popup class="customer-selector-popup" opened={customerSelecting} onPopupClosed={() => customerSelecting = false} onSwipeToClose={() => customerSelecting = false} swipeToClose>
  <Page>
    <Navbar title={'Müşteri Seç'}>
      <NavRight>
        <Link popupClose>Kapat</Link>
      </NavRight>
    </Navbar>
      <Customers itemClick={async (customer) => {
        $cartOrder.setCustomer(customer.id);
        await new Promise(resolve => setTimeout(resolve, 200));
        customerSelecting = false;
      }} 
      newCustomerSave={async(customer) => {
        customers.setCustomer({tags: new Set, ...customer});
        await new Promise(resolve => setTimeout(resolve, 200));
        $cartOrder.setCustomer(customer.id);
        await new Promise(resolve => setTimeout(resolve, 200));
        customerSelecting = false;
      }}
      />
  </Page>
</Popup>

<Actions id="fullfilment-actions">
<ActionsGroup>
    <ActionsLabel> Teslimat Durumunu Değiştir </ActionsLabel>
    <ActionsButton on:click={
      $cartOrder.setStatus({
        fullfilmentstatus: 'pending',
      })
    }> Teslim Edilecek </ActionsButton>
    <ActionsButton on:click={
      $cartOrder.setStatus({
        fullfilmentstatus: 'fullfilled',
      })
    }> Teslim Edildi </ActionsButton>
    <ActionsButton on:click={
      $cartOrder.setStatus({
        fullfilmentstatus: 'partially-fullfilled',
      })
    }> Kısmen Teslim Edildi </ActionsButton>
    <ActionsButton on:click={
      $cartOrder.setStatus({
        fullfilmentstatus: 'returned',
      })
    }> İade Edildi </ActionsButton>
    <ActionsButton on:click={
      $cartOrder.setStatus({
        fullfilmentstatus: 'partially-returned',
      })
    }> Kısmen İade Edildi </ActionsButton>
  </ActionsGroup>
  <ActionsGroup>
    <ActionsButton color="red">İptal</ActionsButton>
  </ActionsGroup>
</Actions>