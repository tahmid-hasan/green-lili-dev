class SizeChartDrawer extends DrawerComponent {
  constructor() {
    super();
  }

  get requiresBodyAppended() {
    return false;
  }

  get focusElement() {
    return this.querySelector('input, textarea, select') || this.querySelector('button.drawer__close-btn');
  }
}

customElements.define('size-chart-drawer', SizeChartDrawer);