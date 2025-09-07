class ProductSampleDrawer extends DrawerComponent {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  get requiresBodyAppended() {
    return false;
  }

  get focusElement() {
    return this.querySelector('select[name="country_code"]') || this.querySelector('button.drawer__close-btn');
  }
}

customElements.define('product-sample-drawer', ProductSampleDrawer);