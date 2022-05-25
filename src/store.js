import { f7 } from 'framework7-svelte';
import { writable, get, derived } from 'svelte/store';
import { get as idbGet, set as idbSet, del as idbDel, createStore, entries } from 'idb-keyval';
import slugify from 'slugify';
const randomHueRotation = () => {
  return Math.floor(Math.random() * 360);
};

export const activeOrder = writable(null);
export const previewOrder = writable(null);
export const cartOrder = derived([activeOrder, previewOrder], ([$aorder, $porder]) => $aorder || $porder);


let initialSeller = localStorage.getItem('seller');
if (!initialSeller) {
  localStorage.setItem('seller', 'default');
  initialSeller = 'default';
}

export const seller = writable(initialSeller);
export const sellerSlug = derived(seller, $seller => {
                              if ($seller) {
                                return slugify($seller);
                              }
                            });


function createCustomers() {
  const customersMap = writable(new Map);
  const customersStore = createStore('barcode-app-customers', 'customers');

  (async () => {
    const customers = await entries(customersStore);
    customersMap.set(new Map(customers));
  })();

  return {
    subscribe: customersMap.subscribe,
    setCustomer: (customer) => customersMap.update(n => {
      n.set(customer.id, customer);
      idbSet(customer.id, customer, customersStore);
      return n;
    }),
    deleteCustomer: async (customerId) => {
      const confirmed = await new Promise(done => f7.dialog.confirm('Müşteriyi silmek istediğinize emin misiniz?', 'Müşteriyi Sil',
        (e) => {
          done(true);
        }, (e) => {
          done(false);
        }));
      if (!confirmed) return;
      
      customersMap.update(n => {
        n.delete(customerId);
        idbDel(customerId, customersStore);
        return n;
      });
    },
    getCustomer: (customerId) => {
      return get(customersMap).get(customerId);
    },
    reset: () => customersMap.set(new Map)
  };
}

function createProducts() {
  const productsMap = writable(new Map);
  const productsStore = createStore('barcode-app-db', 'products');

  (async () => {
    const products = await entries(productsStore);
    productsMap.set(new Map(products));
  })();

  return {
    subscribe: productsMap.subscribe,
    setProduct: (prod) => productsMap.update(n => {
      n.set(prod.barcode, prod);
      idbSet(prod.barcode, prod, productsStore);
      return n;
    }),
    deleteProduct: (barcode) => productsMap.update(n => {
      n.delete(barcode);
      idbDel(barcode, productsStore);
      return n;
    }),
    getProduct: (barcode) => {
      return get(productsMap).get(barcode);
    },
    reset: () => productsMap.set(new Map)
  };
}

function createTags() {
  const tagsMap = writable(new Map);
  const tagsStore = createStore('barcode-app-tags', 'tags');
  const tagsIndexStore = createStore('barcode-app-tags-index', 'tags');

  (async () => {
    const tags = await entries(tagsStore);
    tagsMap.set(new Map(tags));
  })();

  return {
    subscribe: tagsMap.subscribe,
    setTag: (prod, tag) => {
      if (!tag) return;
      if (!get(tagsMap).has(tag)) {
        get(tagsMap).set(tag, randomHueRotation());
        idbSet(tag, get(tagsMap).get(tag), tagsStore);

        idbSet(tag, new Set([prod.barcode]), tagsIndexStore).then(() => console.log('tag added'));
      } else {
        idbGet(tag, tagsIndexStore).then(productsSet => {
           (productsSet|| new Set).add(prod.barcode);
           idbSet(tag, productsSet, tagsIndexStore);
        });
      }
      return (prod.tags || new Set).add(tag);
    },
    deleteTag: (prod, tag) => { 
      idbGet(tag, tagsIndexStore).then(productsSet => {
        (productsSet  || new Set).delete(prod.barcode);
        idbSet(tag, productsSet, tagsIndexStore).then(() => console.log('deleted'));
      });
      return prod.tags = (prod.tags || new Set).delete(tag) && prod.tags;
    },
    saveTag: (tag, color) => {
      idbSet(tag, color, tagsStore);
    },
    getTag: (tag) => get(tagsMap).get(tag),
    getTaggedProducts: async (tag) => {
      return await idbGet(tag, tagsIndexStore);
    }
  };
}

export const orders = createOrdersStore(new Date());

export class HollowOrder {
  constructor({id, date, number, lineItems, discount, customer, orderstatus, paymentstatus, fullfilmentstatus, overrideTax, paid}) {
    this.id = id;
    this.date = date;
    this.number = number;
    this.lineItems = lineItems || [];
    this.discount = discount;
    
    this.editable = false;
    
    this.customer = customer;
    this.orderstatus = orderstatus;
    this.paymentstatus = paymentstatus;
    this.fullfilmentstatus = fullfilmentstatus;
    this.paid = paid || 0;

    this.overrideTax = overrideTax || false;

    return this;
  }

  get total() {
    return ((((this.lineItems || []).reduce((acc, line) => +acc + ((+(line.product.price || 0) * 100 - (this.overrideTax ? (line.product.cost * line.product.tax) : 0)) * (+line.qty)), 0) - (this.discount * 100)) / 100) || 0).toFixed(2);
  }
  get totalTax() {
    if(this.overrideTax) return (0).toFixed(2);
    return (((this.lineItems || []).reduce((acc, line) => +acc + (((+(line.product.cost || 0) * 100) * ((+(line.product.tax || 0) * 100) / 10000) ) * (+line.qty)), 0) / 100) || 0).toFixed(2);
  }

  get totalCost() {
    return (((this.lineItems || []).reduce((acc, line) => +acc + ((+(line.product.cost || 0) * 100) * (+line.qty)), 0) / 100) || 0).toFixed(2);
  }

  get totalProfit() {
    return (this.lineItems || []).reduce((acc, line) => +acc + (((+(line.product.price || 0) * 100) - (+(line.product.cost || 0) * 100) - (+(line.product.cost || 0) * +(line.product.tax || 0))) * (+line.qty)), 0) / 100;
  }

  get due_amount() {
    const due_amount = (parseFloat(this.total) - (+this.paid || 0));

    return due_amount.toFixed(2);
  }

  get data() {
    return {
      id: this.id,
      date: this.date,
      number: this.number,
      lineItems: this.lineItems,
      orderstatus: this.orderstatus,
      paymentstatus: this.paymentstatus,
      fullfilmentstatus: this.fullfilmentstatus,
      _orderstatusTR: this.orderstatusTR,
      _paymentstatusTR: this.paymentstatusTR,
      _fullfilmentstatusTR: this.fullfilmentstatusTR,
      customer: this.customer,
      editable: this.editable,
      paid: this.paid,
      total: this.total,
      totalCost: this.totalCost,
      totalProfit: this.totalProfit,
      discount: this.discount,
      overrideTax: this.overrideTax
    };
  }

  get products() {
    return (this.lineItems || []).map(line => line.product);
  }


  setPayment(value) {
    this.paid = value;
    const due_amount = (parseFloat(this.total) - (+this.paid || 0));

    if (due_amount <= 0) {
      this.setStatus({ paymentstatus: 'paid' });
    } else if (this.paid == 0) {
      this.setStatus({ paymentstatus: 'pending' });
    } else if (+this.paid < parseFloat(this.total)) {
      this.setStatus({ paymentstatus: 'partially-paid' });
    }
    orders.setOrder(this.data);
    if (get(activeOrder)) {
      activeOrder.update(n => this);
    } else {
      previewOrder.update(n => this);
    }
  }

  productStats(productId) {
    if (!this.lineItems) return {};
    const prod = this.lineItems.find(line => line.product.barcode == productId);
    return {
      has: !!prod,
      qty: prod ? prod.qty : 0
    };
  }

  /**
   * @typedef {Object} StatusOptions
   * @property {'temporary'|'pending'|'complete'|undefined} orderstatus 
   * @property {'pending'|'paid'|'partially-paid'|'waived'|'refunded'|'partially-refunded'|undefined} paymentstatus 
   * @property {'pending'|'fullfilled'|'partially-fullfilled'|'returned'|'partially-returned'|undefined} fullfilmentstatus
  */
  /**
   * @param {StatusOptions} status
   */
  setStatus({ orderstatus, paymentstatus, fullfilmentstatus }) {
    this.orderstatus = orderstatus || this.orderstatus;
    this.paymentstatus = paymentstatus || this.paymentstatus;
    this.fullfilmentstatus = fullfilmentstatus || this.fullfilmentstatus;

    if (this.paymentstatus == 'paid' && this.fullfilmentstatus == 'fullfilled') { 
      this.orderstatus = 'complete';
    } else {
      this.orderstatus = 'pending';
    }
    
    this._fullfilmentstatusTR = this.fullfilmentstatusTR;
    this._paymentstatusTR = this.paymentstatusTR;
    this._orderstatusTR = this.orderstatusTR;

    orders.setOrder(this.data);
  }

  get orderstatusTR() { 
    return {
      temporary: 'Geçici',
      pending: 'Tamamlanmamış',
      complete: 'Tamamlanmış'
    }[this.orderstatus];
  }

  get paymentstatusTR() {
    return {
      pending: 'Ödeme Bekliyor',
      paid: 'Ödendi',
      "partially-paid": 'Kısmen Ödendi',
      waived: 'Bağış',
      refunded: 'İade edildi',
      "partially-refunded": 'Kısmi İade'
    }[this.paymentstatus];
  }

  get fullfilmentstatusTR() {
    return {
      pending: 'Teslim Edilecek',
      "partially-fullfilled": 'Kısmen Teslim Edildi',
      fullfilled: 'Teslim Edildi',
      returned: 'İade edildi',
      "partially-returned": 'Kısmi İade'
    }[this.fullfilmentstatus];
  }
}

export class Order extends HollowOrder {
  constructor(data = {}) {
    super({
      lineItems: [],
      discount: 0,
      customer: null,
      orderstatus: 'temporary',
      paymentstatus: 'pending',
      fullfilmentstatus: 'pending',
      overrideTax: false,
      paid: 0,
      ...data
    });

    this.editable = true;

    return this;
  }

  addProduct(productId, qty) {
    const existingProduct = this.lineItems.find(line => line.product.barcode == productId);
    if (existingProduct) {
      if (qty == 0) {
        this.lineItems.splice(this.lineItems.indexOf(existingProduct), 1);
      } else {
        existingProduct.qty = qty;
      }
    } else {
      // add product to order
      this.lineItems.push({ product: products.getProduct(productId), qty });
    }

    this.setStatus({ orderstatus: 'pending' });

    activeOrder.update(n => this);
    orders.setOrder(this.data);
  }

  setTaxOverride(value) { 
    this.overrideTax = value;
    activeOrder.update(n => this);
    orders.setOrder(this.data);
  }

  setDiscount(value) {
    this.discount = value;
    activeOrder.update(n => this);
    orders.setOrder(this.data);
  }

  // setStatus({ orderstatus, paymentstatus, fullfilmentstatus }) {
  //   super.setStatus({ orderstatus, paymentstatus, fullfilmentstatus });
  //   activeOrder.update(n => this);
  //   orders.setOrder(this.data);
  // }
  /**
   * Customer Object
   * @typedef {Object} Customer
   * @property {string} name
   * @property {string} email
   * @property {string} phone
   * @property {string} address
   * @property {string} city
   * @property {string} country
   * @property {string} note
   * @property {string} company
   * @property {string} taxid
   * @property {string} taxexempt
   * @property {string} discount
  * */
  /** 
   * @param {Customer} customer
  */
  async setCustomer(customerId) {
    if (this.customer) {
      // remove order from existing customers orders
      const customer = customers.getCustomer(this.customer.id);
      if (customer) {
        customer.orders = customer.orders || new Set;
        customer.orders = customer.orders.delete(this.id);
      }
    }
    this.customer = customerId;
    let customer = await customers.getCustomer(customerId);
    customer.orders = customer.orders || new Set;
    customer.orders.add(this.id);
    customers.setCustomer(customer);
    activeOrder.update(n => this);
    orders.setOrder(this.data);
  }
};


function createOrdersStore(date = new Date()) {
  const daysStore = createStore('barcode-app-order-dates', 'dates');
  const ordersMap = writable(new Map);
  const daysMap = writable(new Map);

  let currentDate, ordersStore;

  const dateToStr = (date) => date.toLocaleDateString("tr-TR", { day: 'numeric', month: 'numeric', year: 'numeric' }).split('.').reverse().join('-');

  const setDate = (date) => {
    const dateStr = dateToStr(date);
    currentDate = dateStr;


    ordersStore = createStore('barcode-app-orders-' + currentDate, 'orders');

    (async () => {
      const orders = await entries(ordersStore);
      // orders.sort((b, a) => (a[1]||{number:0}).number - (b[1]||{number:0}).number);
      ordersMap.set(new Map(orders));

    })();
  };

  (async () => {
    const days = await entries(daysStore);
    daysMap.set(new Map(days));
    setDate(date);
  })();

  return {
    subscribe: ordersMap.subscribe,
    setOrder: (order) => ordersMap.update(n => {
      n.set(order.id, order);
      idbSet(order.id, order, ordersStore);

      let dateStats = { orders: new Set([order.id]), numOrders: 1 };

      const days = get(daysMap);
      if (days.has(currentDate)) {
        dateStats = days.get(currentDate);

        dateStats.orders.add(order.id);
        dateStats.numOrders += 1;
      }
      
      days.set(currentDate, dateStats);
      daysMap.update(n => days);
      idbSet(currentDate, dateStats, daysStore);

      return n;
    }),
    editOrder: (data) => {
      activeOrder.set(new Order(data));
      return get(activeOrder);
    },
    newOrder: (data) => {
      const { id, date, number } = orders.createOrder();
      const orderInstance = new Order({ ...data, id, date, number });
      orderInstance.paymentstatusTR;
      orderInstance.orderstatusTR;
      orderInstance.fullfilmentstatusTR;
      activeOrder.set(orderInstance);
      return get(activeOrder);
    },
    createOrder: () => {
      const ordersArray = Array.from(get(ordersMap).entries());
      ordersArray.sort((a, b) => (a[1]||{number:0}).number - (b[1]||{number:0}).number);
      const lastOrder = ordersArray[ordersArray.length - 1];
      const lastOrderData = lastOrder ? lastOrder[1] : { number: 0 };
      const orderNumber = (lastOrderData.number || 0) + 1;
      console.log('sellerSlug ', sellerSlug);
      const orderId = `${currentDate}-${orderNumber}-${get(sellerSlug)}`;

      ordersMap.update(n => {
        n.set(orderId, { number: orderNumber, id: orderId, date: currentDate });
        idbSet(orderId, { id: orderId, number: orderNumber, date: currentDate }, ordersStore);

        let dateStats = { orders: new Set([orderId]), numOrders: 1 };
        if (get(daysMap).has(currentDate)) {
          dateStats = get(daysMap).get(currentDate);

          dateStats.orders.add(orderId);
          dateStats.numOrders++;
        }

        idbSet(currentDate, dateStats, daysStore);
        return n;
      });
      return {id: orderId, number: orderNumber, date: currentDate};
    },
    deleteOrder: (orderId) => ordersMap.update(n => {
      n.delete(orderId);

      let dateStats = { orders: new Set([orderId]), numOrders: 1 };
      if (get(daysMap).has(currentDate)) {
        dateStats = get(daysMap).get(currentDate);

        dateStats.orders.delete(orderId);
        dateStats.numOrders -= 1;
      }
      activeOrder.set(null);
      previewOrder.set(null);
      idbSet(currentDate, dateStats, daysStore);
      idbDel(orderId, ordersStore);
      return n;
    }),
    getOrder: (orderId, date) => {
      if (date) {
        idbGet(orderId, ordersStore);
      } else {
        let days = Array.from(get(daysMap)).map(entry => entry[1]);
        let dayOfOrder = days.find(day => day.orders.has(orderId));
        if (!dayOfOrder) {
          throw new Error('Order not found');
        }

        const ordersStore = createStore('barcode-app-orders-' + dayOfOrder, 'orders');

        return idbGet(orderId, ordersStore);
      }
      return get(ordersMap).get(orderId);
    },
    discardOrder: async (order, beforeDiscard = () => 1, afterDiscard = () => 1) => { 
      if (order && order.lineItems.length == 0) { 
        beforeDiscard();
        await new Promise(resolve => setTimeout(resolve, 200));
        orders.deleteOrder(order.id);
        activeOrder.set(null);
        previewOrder.set(null);
        afterDiscard();
        return true;
      } else {
        return await new Promise(done => f7.dialog.confirm('Sepeti silmek istediğinize emin misiniz?', 'Sepeti Sil', async (e) => { 
          beforeDiscard();
          await new Promise(resolve => setTimeout(resolve, 200));
          orders.deleteOrder(order.id);
          activeOrder.set(null);
          previewOrder.set(null);
          done(true);
          afterDiscard();
        }, () => {
          done(false);
        }));
      }
    },
    getAllOrders: async () => {
      const orderDates = await entries(daysStore);
      const orders = await Promise.all(orderDates.map((entry) => {
        return entries(createStore('barcode-app-orders-' + entry[0], 'orders'));
      }));
      return {
        orderDates,
        orders
      };
    },
    setDate,
    reset: () => ordersMap.set(new Map)
  };
}
orders.getAllOrders();
export const products = createProducts();
export const customers = createCustomers();
export const tags = createTags();