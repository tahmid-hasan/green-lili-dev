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

  get isSizeChartDrawer() {
    return this.tagName.toLowerCase() === 'size-chart-drawer';
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

class BasicModal extends ModalComponent {
  constructor() {
    super();
  }

  get isLockingNeeded() {
    return true;
  }

  get requiresBodyAppended() {
    return true;
  }
}
customElements.define('basic-modal', BasicModal);

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