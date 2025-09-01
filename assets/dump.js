const clearModalComponentCount = new WeakMap();
class ModalComponent extends HTMLElement {
  constructor() {
    super();
    this.events = {
      handleAfterHide: 'modal:handleAfterHide',
      handleAfterShow: 'modal:handleAfterShow',
    };

    this.classes = {
      show: 'modal-show',
      showing: 'modal-showing',
    };
  }

  static get observedAttributes() {
    return ['id', 'open'];
  }

  get isLockingNeeded() {
    return false;
  }

  get requiresBodyAppended() {
    return false;
  }

  get controls() {
    return Array.from(document.querySelectorAll(`[aria-controls="${this.id}"]`));
  }

  get designMode() {
    return this.hasAttribute('shopify-design-mode');
  }

  get open() {
    return this.hasAttribute('open');
  }

  get overlay() {
    // Check if the _overlay property is already set
    if (!this._overlay) {
      // If not set, find the element and cache it
      this._overlay = this.querySelector('.fixed-overlay');
    }

    // Return the cached element
    return this._overlay;
  }

  get focusElement() {
    return this.querySelector('button');
  }
  connectedCallback() {
    // Initialize the AbortController
    this.abortController = new AbortController();

    // Add click event listeners to all controls
    this.controls.forEach((button) => {
      button.addEventListener('click', this.onButtonClick.bind(this), {
        signal: this.abortController.signal,
      });
    });

    // Add keyup event listener to document for handling the Escape key
    document.addEventListener(
      'keyup',
      (event) => {
        if (event.code === 'Escape') {
          this.hide();
        }
      },
      { signal: this.abortController.signal }
    );

    // Additional setup for Shopify design mode
    if (this.designMode && Shopify.designMode) {
      const section = this.closest('.shopify-section');
      section.addEventListener(
        'shopify:section:select',
        (event) => {
          this.show(null, !event.detail.load);
        },
        {
          signal: this.abortController.signal,
        }
      );
      section.addEventListener(
        'shopify:section:deselect',
        () => {
          this.hide();
        },
        {
          signal: this.abortController.signal,
        }
      );
    }
  }

  disconnectedCallback() {
    this.abortController.abort();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'open':
        this.controls.forEach((button) => button.setAttribute('aria-expanded', newValue === null ? 'false' : 'true'));

        if (oldValue === null && (newValue === '' || newValue === 'immediate')) {
          this.hidden = false;
          this.removeAttribute('inert');

          this.parentElementBeforeAppend = null;
          if (this.requiresBodyAppended && this.parentElement !== document.body) {
            this.parentElementBeforeAppend = this.parentElement;
            document.body.append(this);
          }
          const handleShowTransitionPromise = this.handleShowTransition(newValue !== 'immediate') || Promise.resolve();
          handleShowTransitionPromise.then(() => {
            this.handleAfterShow();
            this.dispatchEvent(new CustomEvent(this.events.handleAfterShow, { bubbles: true }));
          });
        } else if (oldValue !== null && newValue === null) {
          this.setAttribute('inert', '');

          const handleHideTransitionPromise = this.handleHideTransition() || Promise.resolve();
          handleHideTransitionPromise.then(() => {
            this.handleAfterHide();

            if (!this.hasAttribute('inert')) return;

            if (this.parentElement === document.body && this.parentElementBeforeAppend) {
              this.parentElementBeforeAppend.appendChild(this);
              this.parentElementBeforeAppend = null;
            }
            this.dispatchEvent(new CustomEvent(this.events.handleAfterHide, { bubbles: true }));

            this.hidden = true;
          });
        }
        this.dispatchEvent(new CustomEvent('toggle', { bubbles: true }));

        break;
    }
  }

  onButtonClick(event) {
    event.preventDefault();
    if (this.open) {
      this.hide();
    } else {
      this.show(event.currentTarget);
    }
  }

  hide() {
    if (this.open) {
      this.removeAttribute('open');
      return FoxTheme.utils.waitForEvent(this, this.events.handleAfterHide);
    }
  }

  show(activeElement = null, animate = true) {
    if (!this.shouleBeShow()) {
      return;
    }

    if (!this.open) {
      this.prepareToShow();
      this.activeElement = activeElement;
      this.setAttribute('open', animate ? '' : 'immediate');

      if (this.isLockingNeeded) {
        document.body.classList.add(this.classes.showing);
      }

      return FoxTheme.utils.waitForEvent(this, this.events.handleAfterShow);
    }
  }

  handleAfterHide() {
    setTimeout(() => {
      // Remove trap focus from the active element
      FoxTheme.a11y.removeTrapFocus(this.activeElement);

      // Conditionally manage locking behavior
      if (this.isLockingNeeded) {
        // Decrement the lock layer count for the ModalElement
        const currentModalCount = clearModalComponentCount.get(ModalComponent) - 1;
        clearModalComponentCount.set(ModalComponent, currentModalCount);

        // Toggle the 'open' class on the body based on the current lock count
        document.body.classList.toggle(this.classes.show, currentModalCount > 0);
      }
    });
  }

  handleAfterShow() {
    // Trap focus on the specified elements
    FoxTheme.a11y.trapFocus(this, this.focusElement);

    // Check if locking is needed
    if (this.isLockingNeeded) {
      // Increment the lock layer count for the ModalElement
      const currentLockCount = clearModalComponentCount.get(ModalComponent) + 1;
      clearModalComponentCount.set(ModalComponent, currentLockCount);

      // Manage class changes on the document body
      document.body.classList.remove(this.classes.showing);
      document.body.classList.add(this.classes.show);
    }
  }

  shouleBeShow() {
    return true;
  }

  prepareToShow() {}

  handleShowTransition() {
    // Start a timeout to set an attribute
    setTimeout(() => {
      this.setAttribute('active', '');
    }, 75);

    // Return a promise that resolves when the transition ends
    return new Promise((resolve) => {
      this.overlay.addEventListener('transitionend', resolve, { once: true });
    });
  }

  handleHideTransition() {
    // Immediately remove the 'active' attribute
    this.removeAttribute('active');

    // Return a promise that resolves when the transition ends
    return new Promise((resolve) => {
      this.overlay.addEventListener('transitionend', resolve, { once: true });
    });
  }
}
customElements.define('modal-component', ModalComponent);
clearModalComponentCount.set(ModalComponent, 0);

class DrawerComponent extends ModalComponent {
  constructor() {
    super();
    this.events = {
      handleAfterHide: 'drawer:handleAfterHide',
      handleAfterShow: 'drawer:handleAfterShow',
    };
  }
  get isLockingNeeded() {
    return true;
  }
  get requiresBodyAppended() {
    return true;
  }
}
customElements.define('drawer-component', DrawerComponent);

class CartDrawer extends DrawerComponent {
  constructor() {
    super();
    window.FoxKitSections = FoxTheme.utils.getSectionId(this);

    this.onCartRefreshListener = this.onCartRefresh.bind(this);
    this.getSectionToRenderListener = this.getSectionToRender.bind(this);
  }

  get requiresBodyAppended() {
    return false;
  }

  get sectionId() {
    return this.getAttribute('data-section-id');
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener('cart:grouped-sections', this.getSectionToRenderListener);
    document.addEventListener('cart:refresh', this.onCartRefreshListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('cart:grouped-sections', this.getSectionToRenderListener);
    document.removeEventListener('cart:refresh', this.onCartRefreshListener);
  }

  getSectionToRender(event) {
    event.detail.sections.push(FoxTheme.utils.getSectionId(this));
  }

  show(focusElement = null, animate = true) {
    super.show(focusElement, animate);

    if (this.open) {
      FoxTheme.a11y.trapFocus(this, this.focusElement);
    }
  }

  async onCartRefresh(event) {
    const cartId = `CartDrawer-${this.sectionId}`;

    const cartElement = document.getElementById(cartId);
    if (!cartElement) return;

    try {
      const response = await fetch(`${FoxTheme.routes.root_url}?section_id=${this.sectionId}`);
      const responseText = await response.text();

      const parser = new DOMParser();
      const parsedHTML = parser.parseFromString(responseText, 'text/html');

      const newCartContent = parsedHTML.getElementById(cartId).innerHTML;
      cartElement.innerHTML = newCartContent;

      if (event.detail.open === true) {
        this.show();
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  }
}
customElements.define('cart-drawer', CartDrawer);

if (!customElements.get('quick-view-modal')) {
  customElements.define(
    'quick-view-modal',
    class QuickViewModal extends DrawerComponent {
      constructor() {
        super();

        this._classes = {
          loaded: 'quick-view-loaded',
        };
        this.drawerBody = this.querySelector(this.selector);
      }

      get selector() {
        return '.quick-view__content';
      }

      get sourceSelector() {
        return '#MainProduct-quick-view__content';
      }

      get requiresBodyAppended() {
        return !(Shopify.designMode && this.closest('.section-group-overlay-quick-view'));
      }

      shouleBeShow() {
        const sectionId = this.getProductQuickViewSectionId();
        return typeof sectionId === 'string';
      }

      prepareToShow() {
        super.prepareToShow();
        this.quickview();
      }

      handleAfterShow() {
        super.handleAfterShow();
        document.dispatchEvent(
          new CustomEvent('quick-view:open', {
            detail: { productUrl: this.dataset.productUrl },
          })
        );
      }

      handleAfterHide() {
        super.handleAfterHide();
        const drawerContent = this.querySelector(this.selector);
        drawerContent.innerHTML = '';
        this.classList.remove(this._classes.loaded);
      }

      getProductQuickViewSectionId() {
        let sectionId = FoxTheme.QuickViewSectionId || false;

        if (!sectionId) {
          // Get section id from overlay groups.
          const productQuickView = document.querySelector('.section-group-overlay-quick-view');
          if (productQuickView) {
            sectionId = FoxTheme.utils.getSectionId(productQuickView);
          }

          // Cache for better performance.
          FoxTheme.QuickViewSectionId = sectionId;
        }

        return sectionId;
      }

      quickview() {
        const drawerContent = this.querySelector(this.selector);
        const sectionId = this.getProductQuickViewSectionId();
        const sectionUrl = `${this.dataset.productUrl.split('?')[0]}?section_id=${sectionId}`;
        fetch(sectionUrl)
          .then((response) => response.text())
          .then((responseText) => {
            const productElement = new DOMParser()
              .parseFromString(responseText, 'text/html')
              .querySelector(this.sourceSelector);

            this.setInnerHTML(drawerContent, productElement.content.cloneNode(true));
            FoxTheme.a11y.trapFocus(this, this.focusElement);

            if (window.Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }

            setTimeout(() => {
              this.classList.add(this._classes.loaded);
            }, 300);

            document.dispatchEvent(
              new CustomEvent('quick-view:loaded', {
                detail: { productUrl: this.dataset.productUrl },
              })
            );
          })
          .catch((e) => {
            console.error(e);
          });
      }

      setInnerHTML(element, innerHTML) {
        element.innerHTML = '';
        element.appendChild(innerHTML);
        element.querySelectorAll('script').forEach((oldScriptTag) => {
          const newScriptTag = document.createElement('script');
          Array.from(oldScriptTag.attributes).forEach((attribute) => {
            newScriptTag.setAttribute(attribute.name, attribute.value);
          });
          newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
          oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
        });
      }

      disconnectedCallback() {
        super.disconnectedCallback();
        this.handleAfterHide();
      }
    }
  );
}

class SizeChartDrawer extends DrawerComponent {
  constructor() {
    super();
  }

  get requiresBodyAppended() {
    return false;
  }

  get focusElement() {
    return this.querySelector('input, textarea, select') || this.querySelector('button');
  }
}

customElements.define('size-chart-drawer', SizeChartDrawer);