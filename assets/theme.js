window.FoxTheme = window.FoxTheme || {};
FoxTheme.config = {
  hasLocalStorage: false,
  mqlMobile: false,
  mqlTablet: false,
  mediaQueryMobile: 'screen and (max-width: 767px)',
  mediaQueryTablet: 'screen and (max-width: 1023px)',
  motionReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
  isRTL: document.documentElement.getAttribute('dir') === 'rtl',
};
console.log(
  '%c' +
    window.FoxTheme.settings.themeName +
    ' theme (v' +
    window.FoxTheme.settings.themeVersion +
    ') by Foxecom | Learn more https://foxecom.com/products/sleek-shopify-theme',
  'font-size: 14px; color: #FF5C00;'
);
(function () {
  // Detect browser has support local storage.
  try {
    const key = 'sleek:test';
    window.localStorage.setItem(key, 'test');
    window.localStorage.removeItem(key);
    FoxTheme.config.hasLocalStorage = true;
  } catch (err) {}

  FoxTheme.DOMready = function (callback) {
    document.readyState != 'loading' ? callback() : document.addEventListener('DOMContentLoaded', callback);
  };

  FoxTheme.a11y = {
    trapFocusHandlers: {},
    getFocusableElements: (container) => {
      return Array.from(
        container.querySelectorAll(
          "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
        )
      );
    },
    trapFocus: (container, elementToFocus = container) => {
      var elements = FoxTheme.a11y.getFocusableElements(container);
      var first = elements[0];
      var last = elements[elements.length - 1];

      FoxTheme.a11y.removeTrapFocus();

      FoxTheme.a11y.trapFocusHandlers.focusin = (event) => {
        if (event.target !== container && event.target !== last && event.target !== first) return;

        document.addEventListener('keydown', FoxTheme.a11y.trapFocusHandlers.keydown);
      };

      FoxTheme.a11y.trapFocusHandlers.focusout = function () {
        document.removeEventListener('keydown', FoxTheme.a11y.trapFocusHandlers.keydown);
      };

      FoxTheme.a11y.trapFocusHandlers.keydown = function (event) {
        if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
        // On the last focusable element and tab forward, focus the first element.
        if (event.target === last && !event.shiftKey) {
          event.preventDefault();
          first.focus();
        }

        //  On the first focusable element and tab backward, focus the last element.
        if ((event.target === container || event.target === first) && event.shiftKey) {
          event.preventDefault();
          last.focus();
        }
      };

      document.addEventListener('focusout', FoxTheme.a11y.trapFocusHandlers.focusout);
      document.addEventListener('focusin', FoxTheme.a11y.trapFocusHandlers.focusin);

      elementToFocus.focus();

      if (
        elementToFocus.tagName === 'INPUT' &&
        ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
        elementToFocus.value
      ) {
        elementToFocus.setSelectionRange(0, elementToFocus.value.length);
      }
    },
    removeTrapFocus: (elementToFocus = null) => {
      document.removeEventListener('focusin', FoxTheme.a11y.trapFocusHandlers.focusin);
      document.removeEventListener('focusout', FoxTheme.a11y.trapFocusHandlers.focusout);
      document.removeEventListener('keydown', FoxTheme.a11y.trapFocusHandlers.keydown);

      if (elementToFocus) elementToFocus.focus();
    },
  };

  FoxTheme.utils = {
    throttle: (callback) => {
      let requestId = null,
        lastArgs;
      const later = (context) => () => {
        requestId = null;
        callback.apply(context, lastArgs);
      };
      const throttled = (...args) => {
        lastArgs = args;
        if (requestId === null) {
          requestId = requestAnimationFrame(later(this));
        }
      };
      throttled.cancel = () => {
        cancelAnimationFrame(requestId);
        requestId = null;
      };
      return throttled;
    },
    setScrollbarWidth: () => {
      const scrollbarWidth = window.innerWidth - document.body.clientWidth;
      scrollbarWidth > 0 && document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    },
    waitForEvent: (element, eventName) => {
      return new Promise((resolve) => {
        // Event handler that checks if the event target is the expected element
        const eventHandler = (event) => {
          if (event.target === element) {
            element.removeEventListener(eventName, eventHandler); // Clean up listener
            resolve(event); // Resolve the promise with the event
          }
        };

        // Attach the event handler to the element
        element.addEventListener(eventName, eventHandler);
      });
    },
    queryDomNodes: (selectors = {}, context = document) => {
      const domNodes = Object.entries(selectors).reduce((acc, [name, selector]) => {
        const findOne = typeof selector === 'string';
        const queryMethod = findOne ? 'querySelector' : 'querySelectorAll';
        const sl = findOne ? selector : selector[0];

        acc[name] = context && context[queryMethod](sl);
        if (!findOne && acc[name]) {
          acc[name] = [...acc[name]];
        }
        return acc;
      }, {});
      return domNodes;
    },
    addEventDelegate: ({ context = document.documentElement, event = 'click', selector, handler, capture = false }) => {
      const listener = function (e) {
        // loop parent nodes from the target to the delegation node
        for (let target = e.target; target && target !== this; target = target.parentNode) {
          if (target.matches(selector)) {
            handler.call(target, e, target);
            break;
          }
        }
      };
      context.addEventListener(event, listener, capture);
      return () => {
        context.removeEventListener(event, listener, capture);
      };
    },
    getSectionId: (element) => {
      if (element.hasAttribute('data-section-id')) {
        return element.dataset.sectionId;
      } else {
        if (!element.classList.contains('shopify-section')) {
          element = element.closest('.shopify-section');
        }
        return element.id.replace('shopify-section-', '');
      }
    },
    debounce: (fn, wait) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    },
    fetchConfig: (type = 'json') => {
      return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
      };
    },
    /**
     * Store key-value pair with expiration time in localStorage
     * Use storage instead of cookie to make it work properly on Safari IOS (in iframe).
     */
    setStorage(key, value, expiryInDays) {
      if (!FoxTheme.config.hasLocalStorage) return;

      const now = new Date();
      const item = {
        value: value,
        expiry: now.getTime() + expiryInDays * 86400000,
      };
      window.localStorage.setItem(key, JSON.stringify(item));
    },
    getStorage(key) {
      if (!FoxTheme.config.hasLocalStorage) return null;

      const itemStr = window.localStorage.getItem(key);
      // If the item doesn't exist, return null.
      if (!itemStr) {
        return null;
      }
      const item = JSON.parse(itemStr);
      const now = new Date();
      // Compare the expiry time of the item with the current time.
      if (now.getTime() > item.expiry) {
        // If the item has expired, remove it from storage and return null.
        window.localStorage.removeItem(key);
        return null;
      }
      return item.value;
    },
    postLink: (path, options) => {
      options = options || {};
      const method = options['method'] || 'post';
      const params = options['parameters'] || {};

      const form = document.createElement('form');
      form.setAttribute('method', method);
      form.setAttribute('action', path);

      for (const key in params) {
        for (const index in params[key]) {
          for (const key2 in params[key][index]) {
            const hiddenField = document.createElement('input');
            hiddenField.setAttribute('type', 'hidden');
            hiddenField.setAttribute('name', `${key}[${index}][${key2}]`);
            hiddenField.setAttribute('value', params[key][index][key2]);
            form.appendChild(hiddenField);
          }
        }
      }
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    },
    imageReady: (imageOrArray) => {
      if (!imageOrArray) {
        return Promise.resolve();
      }
      imageOrArray = imageOrArray instanceof Element ? [imageOrArray] : Array.from(imageOrArray);
      return Promise.all(
        imageOrArray.map((image) => {
          return new Promise((resolve) => {
            if ((image.tagName === 'IMG' && image.complete) || !image.offsetParent) {
              resolve();
            } else {
              image.onload = () => resolve();
            }
          });
        })
      );
    },
    displayedMedia: (media) => {
      return Array.from(media).find((item) => {
        const style = window.getComputedStyle(item);
        return style.display !== 'none';
      });
    },
  };

  FoxTheme.pubsub = {
    PUB_SUB_EVENTS: {
      cartUpdate: 'cart-update',
      quantityUpdate: 'quantity-update',
      quantityRules: 'quantity-rules',
      quantityBoundries: 'quantity-boundries',
      variantChange: 'variant-change',
      cartError: 'cart-error',
      facetUpdate: 'facet-update',
      optionValueSelectionChange: 'option-value-selection-change',
    },
    subscribers: {},
    subscribe: (eventName, callback) => {
      if (FoxTheme.pubsub.subscribers[eventName] === undefined) {
        FoxTheme.pubsub.subscribers[eventName] = [];
      }

      FoxTheme.pubsub.subscribers[eventName] = [...FoxTheme.pubsub.subscribers[eventName], callback];

      return function unsubscribe() {
        FoxTheme.pubsub.subscribers[eventName] = FoxTheme.pubsub.subscribers[eventName].filter((cb) => {
          return cb !== callback;
        });
      };
    },

    publish: (eventName, data) => {
      if (FoxTheme.pubsub.subscribers[eventName]) {
        FoxTheme.pubsub.subscribers[eventName].forEach((callback) => {
          callback(data);
        });
      }
    },
  };

  FoxTheme.focusVisiblePolyfill = function () {
    const navKeys = [
      'ARROWUP',
      'ARROWDOWN',
      'ARROWLEFT',
      'ARROWRIGHT',
      'TAB',
      'ENTER',
      'SPACE',
      'ESCAPE',
      'HOME',
      'END',
      'PAGEUP',
      'PAGEDOWN',
    ];
    let currentFocusedElement = null;
    let mouseClick = null;

    window.addEventListener('keydown', (event) => {
      if (navKeys.includes(event.code.toUpperCase())) {
        mouseClick = false;
      }
    });

    window.addEventListener('mousedown', (event) => {
      mouseClick = true;
    });

    window.addEventListener(
      'focus',
      () => {
        if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

        if (mouseClick) return;

        currentFocusedElement = document.activeElement;
        currentFocusedElement.classList.add('focused');
      },
      true
    );
  };

  FoxTheme.Carousel = (function () {
    class Carousel {
      constructor(container, options, modules = null) {
        this.container = container;
        let defaultModules = [
          FoxTheme.Swiper.Navigation,
          FoxTheme.Swiper.Pagination,
          FoxTheme.Swiper.Keyboard,
          FoxTheme.Swiper.Mousewheel,
        ];
        if (modules) {
          defaultModules = defaultModules.concat(modules);
        }

        this.options = {
          modules: defaultModules,
          ...options,
        };
      }

      init() {
        this.slider = new FoxTheme.Swiper.Swiper(this.container, this.options);
      }
    }
    return Carousel;
  })();

  FoxTheme.delayUntilInteraction = (function () {
    class ScriptLoader {
      constructor(callback, delay = 5000) {
        this.loadScriptTimer = setTimeout(callback, delay);
        this.userInteractionEvents = [
          'mouseover',
          'mousemove',
          'keydown',
          'touchstart',
          'touchend',
          'touchmove',
          'wheel',
        ];

        this.onScriptLoader = this.triggerScriptLoader.bind(this, callback);
        this.userInteractionEvents.forEach((event) => {
          window.addEventListener(event, this.onScriptLoader, {
            passive: !0,
          });
        });
      }

      triggerScriptLoader(callback) {
        callback();
        clearTimeout(this.loadScriptTimer);
        this.userInteractionEvents.forEach((event) => {
          window.removeEventListener(event, this.onScriptLoader, {
            passive: !0,
          });
        });
      }
    }

    return ScriptLoader;
  })();

  FoxTheme.Currency = (function () {
    const moneyFormat = '${{amount}}'; // eslint-disable-line camelcase

    function formatMoney(cents, format) {
      if (typeof cents === 'string') {
        cents = cents.replace('.', '');
      }
      let value = '';
      const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      const formatString = format || moneyFormat;

      function formatWithDelimiters(number, precision, thousands, decimal) {
        thousands = thousands || ',';
        decimal = decimal || '.';

        if (isNaN(number) || number === null) {
          return 0;
        }

        number = (number / 100.0).toFixed(precision);

        const parts = number.split('.');
        const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
        const centsAmount = parts[1] ? decimal + parts[1] : '';

        return dollarsAmount + centsAmount;
      }

      switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
          value = formatWithDelimiters(cents, 2);
          break;
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
        case 'amount_no_decimals_with_space_separator':
          value = formatWithDelimiters(cents, 0, ' ');
          break;
        case 'amount_with_apostrophe_separator':
          value = formatWithDelimiters(cents, 2, "'");
          break;
      }

      return formatString.replace(placeholderRegex, value);
    }

    function getBaseUnit(variant) {
      if (!variant) {
        return;
      }

      if (!variant.unit_price_measurement || !variant.unit_price_measurement.reference_value) {
        return;
      }

      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit;
    }

    return {
      formatMoney: formatMoney,
      getBaseUnit: getBaseUnit,
    };
  })();

  new FoxTheme.delayUntilInteraction(() => {
    document.body.removeAttribute('data-initializing');
  });

  FoxTheme.DOMready(FoxTheme.utils.setScrollbarWidth);
  // window.addEventListener('resize', FoxTheme.utils.throttle(FoxTheme.utils.setScrollbarWidth));

  const mql = window.matchMedia(FoxTheme.config.mediaQueryMobile);
  FoxTheme.config.mqlMobile = mql.matches;
  mql.onchange = (event) => {
    if (event.matches) {
      FoxTheme.config.mqlMobile = true;
      document.dispatchEvent(new CustomEvent('matchMobile'));
    } else {
      FoxTheme.config.mqlMobile = false;
      document.dispatchEvent(new CustomEvent('unmatchMobile'));
    }
  };

  const mqlTablet = window.matchMedia(FoxTheme.config.mediaQueryTablet);
  FoxTheme.config.mqlTablet = mqlTablet.matches;
  mqlTablet.onchange = (event) => {
    if (event.matches) {
      FoxTheme.config.mqlTablet = true;
      document.dispatchEvent(new CustomEvent('matchTablet'));
    } else {
      FoxTheme.config.mqlTablet = false;
      document.dispatchEvent(new CustomEvent('unmatchTablet'));
    }
  };
})();

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(':focus-visible');
} catch (e) {
  FoxTheme.focusVisiblePolyfill();
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(oldNode, newContent, preProcessCallbacks = [], postProcessCallbacks = []) {
    if (!oldNode || !newContent) return;
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement('div');
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll('[id], [form]').forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form && element.setAttribute('form', `${element.form.getAttribute('id')}-${uniqueKey}`);
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = 'none';

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll('script').forEach((oldScriptTag) => {
      const newScriptTag = document.createElement('script');
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}

class PageTransition extends HTMLElement {
  constructor() {
    super();

    window.addEventListener('beforeunload', () => {
      document.body.classList.add('page-loading');
    });

    window.addEventListener('DOMContentLoaded', () => {
      FoxTheme.Motion.animate(this, { visibility: 'hidden', opacity: 0 }, { duration: 1 });

      document.body.classList.add('page-loaded');
      document.dispatchEvent(new CustomEvent('page:loaded'));
    });

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        document.body.classList.remove('page-loading');
      }
    });
  }
}
customElements.define('page-transition', PageTransition);

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

  get isSizeChartDrawer() {
    return this.tagName.toLowerCase() === 'size-chart-drawer';
  }
  connectedCallback() {
    // Initialize the AbortController
    this.abortController = new AbortController();

    // Add click event listeners to all controls
    this.rebindClickEvents();

    // Re-initialize controls ONLY for size-chart drawer on variant change
    if (this.isSizeChartDrawer) {
      document.addEventListener(
        'variant:changed',
        () => {
          this.rebindClickEvents();
        },
        { signal: this.abortController.signal }
      );
    }

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

  rebindClickEvents() {
    // Remove old listeners by aborting & re-creating controller
    if (this.controlsAbortController) {
      this.controlsAbortController.abort();
    }
    this.controlsAbortController = new AbortController();

    this.controls.forEach((button) => {
      button.addEventListener('click', this.onButtonClick.bind(this), {
        signal: this.controlsAbortController.signal,
      });
    });
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

class AccordionDetails extends HTMLDetailsElement {
  constructor() {
    super();
    this.initAccordion();
  }

  initAccordion() {
    this.isOpen = this.hasAttribute('open');
    this.summaryElement = this.querySelector('summary');
    this.contentElement = this.querySelector('summary + *');
    this.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');

    this.summaryElement.addEventListener('click', this.toggleAccordion.bind(this));

    if (Shopify.designMode) {
      this.designModeEventSetup();
    }
  }

  static get observedAttributes() {
    return ['open'];
  }

  get open() {
    return this.isOpen;
  }

  set open(value) {
    if (value !== this.isOpen) {
      this.isOpen = value;

      if (this.isConnected) {
        this.animateAccordion(value);
      } else {
        if (value) {
          this.setAttribute('open', '');
        } else {
          this.removeAttribute('open');
        }
      }

      this.setAttribute('aria-expanded', value ? 'true' : 'false');
      this.setAttribute('aria-controls', this.contentElement.id);

      this.handleAfterToggle();
    }
  }

  handleAfterToggle() {}

  toggleAccordion(event) {
    event.preventDefault();
    this.open = !this.open;
  }

  close() {
    this.isOpen = false;
    this.animateAccordion(false);
  }

  async animateAccordion(isOpen) {
    this.style.overflow = 'hidden';

    if (isOpen) {
      this.setAttribute('open', '');

      await FoxTheme.Motion.timeline([
        [
          this,
          { height: [`${this.summaryElement.clientHeight + 1}px`, `${this.scrollHeight + 1}px`] },
          { duration: 0.25, easing: 'ease' },
        ],
        [
          this.contentElement,
          { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
          { duration: 0.15, at: '<' },
        ],
      ]).finished;
    } else {
      await FoxTheme.Motion.timeline([
        [this.contentElement, { opacity: 0 }, { duration: 0.15 }],
        [
          this,
          { height: [`${this.clientHeight + 1}px`, `${this.summaryElement.clientHeight + 1}px`] },
          { duration: 0.25, at: '<', easing: 'ease' },
        ],
      ]).finished;

      this.removeAttribute('open');
    }

    this.style.height = 'auto';
    this.style.overflow = 'visible';
  }

  designModeEventSetup() {
    this.addEventListener('shopify:block:select', () => {
      this.open = true;
    });

    this.addEventListener('shopify:block:deselect', () => {
      this.open = false;
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      this.setAttribute('aria-controls', this.contentElement.id);
    }
  }
}
customElements.define('accordion-details', AccordionDetails, { extends: 'details' });

class AccordionGroup extends AccordionDetails {
  constructor() {
    super();
  }

  handleAfterToggle() {
    if (this.isOpen) {
      const parent = this.closest('.accordion-parent') || document;
      const siblingsAccordions = parent.querySelectorAll('details[is="accordion-group"]');

      siblingsAccordions.forEach((details) => {
        if (details !== this) {
          details.open = false;
        }
      });
    }
  }
}
customElements.define('accordion-group', AccordionGroup, { extends: 'details' });

class ProgressBar extends HTMLElement {
  constructor() {
    super();

    if (this.hasAttribute('style')) return;

    if (this.dataset.from) {
      this.initProgress();
    }

    FoxTheme.Motion.inView(this, this.init.bind(this));
  }

  init() {
    this.setPercentage(this.dataset.value, this.dataset.max);
  }

  initProgress() {
    this.setPercentage(this.dataset.from, this.dataset.max);
  }

  setPercentage(val1, val2) {
    this.style.setProperty('--percent', `${(parseInt(val1) / parseInt(val2)) * 100}%`);
  }
}
customElements.define('progress-bar', ProgressBar);

class CartCount extends HTMLElement {
  constructor() {
    super();
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = FoxTheme.pubsub.subscribe(
      FoxTheme.pubsub.PUB_SUB_EVENTS.cartUpdate,
      this.onCartUpdate.bind(this)
    );
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  get itemCount() {
    return parseInt(this.innerText);
  }

  onCartUpdate(event) {
    if (event.cart.errors) return;

    if (event.cart.item_count > 99) {
      this.innerHTML = `<span class="text-sm">99+</span>`;
      this.classList.add('cart-count--small-medium');
    } else {
      this.innerText = event.cart.item_count;
      this.classList.remove('cart-count--small-medium');
    }
    this.hidden = this.itemCount === 0;

    const method = this.itemCount === 0 ? 'remove' : 'add';
    document.documentElement.classList[method]('cart-has-items');
  }
}
customElements.define('cart-count', CartCount);

class QuantityInput extends HTMLElement {
  quantityUpdateUnsubscriber = undefined;
  quantityBoundriesUnsubscriber = undefined;
  quantityRulesUnsubscriber = undefined;

  constructor() {
    super();
  }

  get sectionId() {
    return this.getAttribute('data-section-id');
  }

  get productId() {
    return this.getAttribute('data-product-id');
  }

  get input() {
    return this.querySelector('input');
  }

  get value() {
    return this.input.value;
  }

  connectedCallback() {
    this.abortController = new AbortController();

    this.buttons = Array.from(this.querySelectorAll('button'));
    this.changeEvent = new Event('change', { bubbles: true });

    this.input.addEventListener('change', this.onInputChange.bind(this));

    this.input.addEventListener('focus', () => setTimeout(() => this.input.select()));

    this.buttons.forEach((button) => button.addEventListener('click', this.onButtonClick.bind(this)), {
      signal: this.abortController.signal,
    });

    this.validateQtyRules();

    this.quantityUpdateUnsubscriber = FoxTheme.pubsub.subscribe(
      FoxTheme.pubsub.PUB_SUB_EVENTS.quantityUpdate,
      this.validateQtyRules.bind(this)
    );
    this.quantityBoundriesUnsubscriber = FoxTheme.pubsub.subscribe(
      FoxTheme.pubsub.PUB_SUB_EVENTS.quantityBoundries,
      this.setQuantityBoundries.bind(this)
    );
    this.quantityRulesUnsubscriber = FoxTheme.pubsub.subscribe(
      FoxTheme.pubsub.PUB_SUB_EVENTS.quantityRules,
      this.updateQuantityRules.bind(this)
    );

    this.currentValue = this.value;
  }

  disconnectedCallback() {
    this.abortController.abort();

    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
    if (this.quantityBoundriesUnsubscriber) {
      this.quantityBoundriesUnsubscriber();
    }
    if (this.quantityRulesUnsubscriber) {
      this.quantityRulesUnsubscriber();
    }
  }

  onButtonClick(event) {
    const previousValue = this.input.value;

    if (event.currentTarget.name === 'plus') {
      if (parseInt(this.input.getAttribute('data-min')) > parseInt(this.input.step) && this.input.value == 0) {
        this.input.value = this.input.getAttribute('data-min');
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

    if (this.input.getAttribute('data-min') === previousValue && event.currentTarget.name === 'minus') {
      this.input.value = parseInt(this.input.min);
    }
  }

  onInputChange() {
    if (this.input.value === '') {
      this.input.value = parseInt(this.input.min);
    }
    setTimeout(() => {
      this.validateQtyRules();
    }, 350);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector('button[name="minus"]');
      if (buttonMinus) buttonMinus.toggleAttribute('disabled', parseInt(value) <= parseInt(this.input.min));
    }
    if (this.input.max) {
      const buttonPlus = this.querySelector('button[name="plus"]');
      if (buttonPlus) buttonPlus.toggleAttribute('disabled', parseInt(value) >= parseInt(this.input.max));
    } else {
      const buttonPlus = this.querySelector('button[name="plus"]');
      if (buttonPlus) buttonPlus.removeAttribute('disabled');
    }
  }

  updateQuantityRules({ data: { sectionId, productId, parsedHTML } }) {
    if (sectionId !== this.sectionId || productId !== this.productId) return;

    const selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
    const quantityFormUpdated = parsedHTML.getElementById(`QuantityForm-${sectionId}`);
    const quantityForm = this.closest(`#QuantityForm-${sectionId}`);
    for (let selector of selectors) {
      const current = quantityForm.querySelector(selector);
      const updated = quantityFormUpdated.querySelector(selector);
      if (!current || !updated) continue;

      if (selector === '.quantity__input') {
        const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
        for (let attribute of attributes) {
          const valueUpdated = updated.getAttribute(attribute);
          if (valueUpdated !== null) {
            current.setAttribute(attribute, valueUpdated);
          } else {
            current.removeAttribute(attribute);
          }
        }
      } else {
        current.innerHTML = updated.innerHTML;
      }
    }
  }

  setQuantityBoundries({ data: { sectionId, productId } }) {
    if (sectionId !== this.sectionId || productId !== this.productId) return;
    const data = {
      cartQuantity: this.input.hasAttribute('data-cart-quantity')
        ? parseInt(this.input.getAttribute('data-cart-quantity'))
        : 0,
      min: this.input.hasAttribute('data-min') ? parseInt(this.input.getAttribute('data-min')) : 1,
      max: this.input.hasAttribute('data-max') ? parseInt(this.input.getAttribute('data-max')) : null,
      step: this.input.hasAttribute('step') ? parseInt(this.input.getAttribute('step')) : 1,
    };

    let min = data.min;
    const max = data.max === null ? data.max : data.max - data.cartQuantity;
    if (max !== null) min = Math.min(min, max);
    if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

    this.input.min = min;

    if (max) {
      this.input.max = max;
    } else {
      this.input.removeAttribute('max');
    }
    this.input.value = min;

    FoxTheme.pubsub.publish(FoxTheme.pubsub.PUB_SUB_EVENTS.quantityUpdate, undefined);
  }
}
customElements.define('quantity-input', QuantityInput);

class QuantitySelector extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.abortController = new AbortController();

    this.input = this.querySelector('input');
    this.buttons = Array.from(this.querySelectorAll('button'));
    this.changeEvent = new Event('change', { bubbles: true });

    this.buttons.forEach((button) => button.addEventListener('click', this.onButtonClick.bind(this)), {
      signal: this.abortController.signal,
    });
  }

  disconnectedCallback() {
    this.abortController.abort();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.currentTarget.name === 'plus') {
      this.input.quantity = this.input.quantity + 1;
    } else {
      this.input.quantity = this.input.quantity - 1;
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}
customElements.define('quantity-selector', QuantitySelector);

const onYouTubeApiLoaded = new Promise((resolve) => {
  window.onYouTubeIframeAPIReady = () => resolve();
});
class VideoElement extends HTMLElement {
  constructor() {
    super();

    if (this.posterElement) {
      this.posterElement.addEventListener('click', this.handlePosterClick.bind(this));
    }

    if (this.autoplay) {
      FoxTheme.Motion.inView(this, () => {
        if (!this.paused) {
          this.play();
        }

        return () => {
          this.pause();
        };
      });
    }
  }

  get posterElement() {
    return this.querySelector('[id^="DeferredPoster-"]');
  }

  get controlledElement() {
    return this.hasAttribute('aria-controls') ? document.getElementById(this.getAttribute('aria-controls')) : null;
  }

  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  get playing() {
    return this.hasAttribute('playing');
  }

  get player() {
    return (this.playerProxy =
      this.playerProxy ||
      new Proxy(this.initializePlayer(), {
        get: (target, prop) => {
          return async () => {
            target = await target;
            this.handlePlayerAction(target, prop);
          };
        },
      }));
  }

  static get observedAttributes() {
    return ['playing'];
  }

  handlePosterClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.playing) {
      this.paused = true;
      this.pause();
    } else {
      this.paused = false;
      this.play();
    }
  }

  play() {
    if (!this.playing) {
      this.player.play();
    }
  }

  pause() {
    if (this.playing) {
      this.player.pause();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'playing') {
      if (oldValue === null && newValue === '') {
        return this.dispatchEvent(new CustomEvent('video:play', { bubbles: true }));
      }

      if (newValue === null) {
        return this.dispatchEvent(new CustomEvent('video:pause', { bubbles: true }));
      }
    }
  }

  initializePlayer() {
    if (this.hasAttribute('source')) {
      this.setAttribute('loaded', '');
      this.closest('.media')?.classList.remove('loading');

      return new Promise(async (resolve) => {
        const templateElement = this.querySelector('template');
        if (templateElement) {
          templateElement.replaceWith(templateElement.content.firstElementChild.cloneNode(true));
        }
        const muteVideo = this.hasAttribute('autoplay') || window.matchMedia('screen and (max-width: 1023px)').matches;
        const script = document.createElement('script');
        script.type = 'text/javascript';
        if (this.getAttribute('source') === 'youtube') {
          if (!window.YT || !window.YT.Player) {
            script.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(script);
            await new Promise((resolve2) => {
              script.onload = resolve2;
            });
          }
          await onYouTubeApiLoaded;
          const player = new YT.Player(this.querySelector('iframe'), {
            events: {
              onReady: () => {
                if (muteVideo) {
                  player.mute();
                }
                resolve(player);
              },
              onStateChange: (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                  this.setAttribute('playing', '');
                } else if (event.data === YT.PlayerState.ENDED || event.data === YT.PlayerState.PAUSED) {
                  this.removeAttribute('playing');
                }
              },
            },
          });
        }
        if (this.getAttribute('source') === 'vimeo') {
          if (!window.Vimeo || !window.Vimeo.Player) {
            script.src = 'https://player.vimeo.com/api/player.js';
            document.head.appendChild(script);
            await new Promise((resolve2) => {
              script.onload = resolve2;
            });
          }
          const player = new Vimeo.Player(this.querySelector('iframe'));
          if (muteVideo) {
            player.setMuted(true);
          }
          player.on('play', () => {
            this.setAttribute('playing', '');
          });
          player.on('pause', () => this.removeAttribute('playing'));
          player.on('ended', () => this.removeAttribute('playing'));
          resolve(player);
        }
      });
    } else {
      this.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));
      this.setAttribute('loaded', '');
      this.closest('.media')?.classList.remove('loading');

      const player = this.querySelector('video');
      player.addEventListener('play', () => {
        this.setAttribute('playing', '');
        this.removeAttribute('suspended');
      });
      player.addEventListener('pause', () => {
        if (!player.seeking && player.paused) {
          this.removeAttribute('playing');
        }
      });
      return player;
    }
  }

  handlePlayerAction(target, prop) {
    if (this.getAttribute('source') === 'youtube') {
      prop === 'play' ? target.playVideo() : target.pauseVideo();
    } else {
      if (prop === 'play' && !this.hasAttribute('source')) {
        target.play().catch((error) => {
          if (error.name === 'NotAllowedError') {
            this.setAttribute('suspended', '');
            target.controls = true;
            const replacementImageSrc = target.previousElementSibling?.currentSrc;
            if (replacementImageSrc) {
              target.poster = replacementImageSrc;
            }
          }
        });
      } else {
        target[prop]();
      }
    }
  }
}
customElements.define('video-element', VideoElement);

class LocalizationForm extends HTMLElement {
  constructor() {
    super();
    this.elements = {
      input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
      button: this.querySelector('button'),
      panel: this.querySelector('.disclosure-list'),
    };

    this.elements.panel.removeAttribute('hidden');
    this.elements.button.addEventListener('click', this.openSelector.bind(this));
    this.elements.button.addEventListener('focusout', this.closeSelector.bind(this));
    this.addEventListener('keyup', this.onContainerKeyUp.bind(this));

    this.querySelectorAll('a').forEach((item) => item.addEventListener('click', this.onItemClick.bind(this)));

    this.handleDropdownPos();
  }

  handleDropdownPos() {
    const offsetButton = this.elements.button.getBoundingClientRect().right;
    if (window.innerWidth - offsetButton < 220) {
      this.elements.button.nextElementSibling &&
        this.elements.button.nextElementSibling.classList.add('disclosure-list__right');
    }
  }

  hidePanel() {
    this.elements.button.setAttribute('aria-expanded', 'false');
    this.removeAttribute('open');
  }

  onContainerKeyUp(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;

    this.hidePanel();
    this.elements.button.focus();
  }

  onItemClick(event) {
    event.preventDefault();
    const form = this.querySelector('form');
    this.elements.input.value = event.currentTarget.dataset.value;
    if (form) form.submit();
  }

  openSelector() {
    this.elements.button.focus();
    this.toggleAttribute('open');
    this.elements.button.setAttribute(
      'aria-expanded',
      (this.elements.button.getAttribute('aria-expanded') === 'false').toString()
    );
  }

  closeSelector(event) {
    const shouldClose =
      (event.relatedTarget && event.relatedTarget.nodeName === 'BUTTON') ||
      (event.relatedTarget && !event.relatedTarget.classList.contains('disclosure-list__option'));
    if (event.relatedTarget === null || shouldClose) {
      this.hidePanel(shouldClose);
    }
  }
}
customElements.define('localization-form', LocalizationForm);

class GridList extends HTMLElement {
  constructor() {
    super();

    if (FoxTheme.config.motionReduced || this.hasAttribute('motion-reduced')) return;

    this.hideGridItems();
    FoxTheme.Motion.inView(this, this.showGridItems.bind(this), { margin: '0px 0px -50px 0px' });
  }

  get gridItems() {
    return this.querySelectorAll('.f-column');
  }

  get visibleGridItems() {
    return this.querySelectorAll('.f-column:not([style])');
  }

  hideGridItems() {
    FoxTheme.Motion.animate(
      this.gridItems,
      { transform: 'translateY(3.5rem)', opacity: 0.01, visibility: 'hidden' },
      { duration: 0 }
    );
  }

  showGridItems() {
    FoxTheme.Motion.animate(
      this.gridItems,
      { transform: ['translateY(3.5rem)', 'translateY(0)'], opacity: [0.01, 1], visibility: ['hidden', 'visible'] },
      {
        duration: 0.5,
        delay: FoxTheme.config.motionReduced ? 0 : FoxTheme.Motion.stagger(0.1),
        easing: [0, 0, 0.3, 1],
      }
    );
  }

  reShowVisibleGridItems() {
    FoxTheme.Motion.animate(
      this.visibleGridItems,
      { transform: ['translateY(3.5rem)', 'translateY(0)'], opacity: [0.01, 1], visibility: ['hidden', 'visible'] },
      { duration: 0.5, delay: FoxTheme.config.motionReduced ? 0 : FoxTheme.Motion.stagger(0.1), easing: [0, 0, 0.3, 1] }
    );
  }
}
customElements.define('grid-list', GridList);

class AnnouncementBar extends HTMLElement {
  constructor() {
    super();
    this.announcementItemsWrapper = this.querySelector('.swiper-wrapper');

    FoxTheme.Motion.inView(this, this.initializeCarousel.bind(this), { margin: '200px 0px 200px 0px' });
  }

  getNextSlideButton() {
    return this.querySelector('.swiper-button-next');
  }

  getPrevSlideButton() {
    return this.querySelector('.swiper-button-prev');
  }

  get getSlideItems() {
    return (this._cachedSlideItems = this._cachedSlideItems || Array.from(this.announcementItemsWrapper.children));
  }

  isAutoplayEnabled() {
    return this.hasAttribute('autoplay');
  }

  getAutoplaySpeed() {
    return this.hasAttribute('autoplay') ? parseInt(this.getAttribute('autoplay-speed')) * 1000 : 5000;
  }

  initializeCarousel() {
    if (this.getSlideItems.length > 1) {
      this.carousel = new FoxTheme.Carousel(
        this,
        {
          navigation: {
            nextEl: this.getNextSlideButton(),
            prevEl: this.getPrevSlideButton(),
          },
          loop: true,
          autoplay: this.isAutoplayEnabled() ? { delay: this.getAutoplaySpeed(), pauseOnMouseEnter: true } : false,
        },
        FoxTheme.Swiper.Autoplay
      );
      this.carousel && this.carousel.init();

      if (Shopify.designMode) {
        this.addEventListener('shopify:block:select', (event) => {
          this.carousel.slider.slideToLoop(this.getSlideItems.indexOf(event.target));
        });
      }
    }
  }
}
customElements.define('announcement-bar', AnnouncementBar);

class SelectElement extends HTMLElement {
  constructor() {
    super();

    FoxTheme.Motion.inView(this, this.init.bind(this), { margin: '200px 0px 200px 0px' });

    this.select = this.querySelector('select');

    this.select && this.select.addEventListener('change', this.handleSelectChange.bind(this));
  }

  init() {
    const style = window.getComputedStyle(this);
    const value = this.select.options[this.select.selectedIndex].text;

    const text = document.createElement('span');
    text.style.fontFamily = style.fontFamily;
    text.style.fontSize = style.fontSize;
    text.style.fontWeight = style.fontWeight;
    text.style.visibility = 'hidden';
    text.style.position = 'absolute';
    text.innerHTML = value;

    document.body.appendChild(text);
    const width = text.clientWidth;

    this.style.setProperty('--width', `${width}px`);
    text.remove();
  }

  handleSelectChange() {
    this.init();
  }
}
customElements.define('select-element', SelectElement);

class ProductBundleVariantSelector extends HTMLElement {
  constructor() {
    super();

    this.cssClasses = {
      soldOut: 'f-price--sold-out',
      onSale: 'f-price--on-sale',
      noCompare: 'f-price--no-compare',
    };

    this.priceElement = this.querySelector('.f-price');
    this.variantSelect = this.querySelector('select');

    this.variantSelect && this.variantSelect.addEventListener('change', this.handleVariantChange.bind(this));
  }

  handleVariantChange(event) {
    const variantSelect = event.target;
    const selectedVariant = variantSelect.options[variantSelect.selectedIndex];
    const compareAtPrice = parseInt(selectedVariant.dataset.compare_at_price || 0);
    const price = parseInt(selectedVariant.dataset.price || 0);
    const available = selectedVariant.dataset.available === 'true';
    const priceVaries = variantSelect.dataset.price_varies === 'true';
    const compareAtPriceVaries = variantSelect.dataset.compare_at_price_varies === 'true';

    // Remove classes
    this.priceElement.classList.remove(this.cssClasses.soldOut);
    this.priceElement.classList.remove(this.cssClasses.onSale);
    this.priceElement.classList.remove(this.cssClasses.noCompare);

    // Add classes
    if (!available) {
      this.priceElement.classList.add(this.cssClasses.soldOut);
    } else if (compareAtPrice > price && available) {
      this.priceElement.classList.add(this.cssClasses.onSale);
    }
    if (!priceVaries && compareAtPriceVaries) {
      this.priceElement.classList.add(this.cssClasses.noCompare);
    }

    // Change price
    const regularPriceElement = this.querySelector('.f-price__regular');
    regularPriceElement.querySelector('.f-price-item--regular').innerHTML = `${FoxTheme.Currency.formatMoney(
      price,
      FoxTheme.settings.moneyFormat
    )}`;

    const salePriceElement = this.querySelector('.f-price__sale');
    salePriceElement.querySelector('.f-price-item--regular').innerHTML = `<s>${FoxTheme.Currency.formatMoney(
      compareAtPrice,
      FoxTheme.settings.moneyFormat
    )}</s>`;
    salePriceElement.querySelector('.f-price-item--sale').innerHTML = `${FoxTheme.Currency.formatMoney(
      price,
      FoxTheme.settings.moneyFormat
    )}`;
  }
}
customElements.define('product-bundle-variant-selector', ProductBundleVariantSelector);

class ProductsBundle extends HTMLElement {
  constructor() {
    super();

    this.cssClasses = {
      hover: 'is-hover',
      active: 'is-active',
    };

    this.cartDrawerElement = document.querySelector('cart-drawer');
    this.addToCartButtonElement = this.querySelector('button');

    this.addToCartButtonElement &&
      this.addToCartButtonElement.addEventListener('click', this.handleButtonClick.bind(this));

    this.productBundleBlocks = this.querySelectorAll('[data-block-id]');
    this.productBundleBlocks.forEach((block) =>
      block.addEventListener('mouseenter', this.handleBlockHover.bind(this, 'enter'))
    );
    this.productBundleBlocks.forEach((block) =>
      block.addEventListener('mouseleave', this.handleBlockHover.bind(this, 'leave'))
    );
  }

  handleBlockHover(type, event) {
    if (type === 'enter') {
      this.classList.add(this.cssClasses.hover);
      this.toggleBlockActive(event.target, true);
    } else {
      this.classList.remove(this.cssClasses.hover);
      this.toggleBlockActive(null, false);
    }
  }

  toggleBlockActive(target, isActive) {
    this.productBundleBlocks.forEach((block) => {
      if (target) {
        if (block.dataset.blockId === target.dataset.blockId) {
          block.classList.add(this.cssClasses.active);
        } else {
          block.classList.remove(this.cssClasses.active);
        }
      } else {
        block.classList.remove(this.cssClasses.active);
      }
    });
  }

  handleButtonClick(event) {
    event.preventDefault();
    this.lastClickedElement = event.submitter || event.currentTarget;

    const productIds = this.querySelectorAll('[name="id"]');
    const items = {
      items: [...productIds]
        .map((e) => e.value)
        .map((e) => ({
          id: e,
          quantity: 1,
        })),
    };

    if (document.body.classList.contains('cart-template') || FoxTheme.settings.cartType != 'drawer') {
      FoxTheme.utils.postLink(FoxTheme.routes.cart_add_url, {
        parameters: {
          ...items,
        },
      });
      return;
    }

    this.showErrorMessage();
    this.toggleButtonLoading(true);

    let sectionsToBundle = [];
    document.documentElement.dispatchEvent(
      new CustomEvent('cart:grouped-sections', { bubbles: true, detail: { sections: sectionsToBundle } })
    );

    const body = JSON.stringify({
      ...items,
      sections: sectionsToBundle,
      section_url: window.pathname,
    });

    fetch(`${FoxTheme.routes.cart_add_url}`, { ...FoxTheme.utils.fetchConfig('javascript'), ...{ body } })
      .then((response) => response.json())
      .then(async (parsedState) => {
        if (parsedState.status) {
          this.showErrorMessage(parsedState.description);
          return;
        }
        if (parsedState.status === 422) {
          document.dispatchEvent(
            new CustomEvent('product-ajax:error', {
              detail: {
                errorMessage: parsedState.description,
              },
            })
          );
        } else {
          const cartJson = await (
            await fetch(`${FoxTheme.routes.cart_url}`, { ...FoxTheme.utils.fetchConfig() })
          ).json();
          cartJson['sections'] = parsedState['sections'];

          FoxTheme.pubsub.publish(FoxTheme.pubsub.PUB_SUB_EVENTS.cartUpdate, { cart: cartJson });
          document.dispatchEvent(
            new CustomEvent('product-ajax:added', {
              detail: {
                product: parsedState,
              },
            })
          );
          this.cartDrawerElement && this.cartDrawerElement.show(this.lastClickedElement);
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.toggleButtonLoading(false);
      });
  }

  showErrorMessage(errorMessage = false) {
    this.errorMessageElement = this.errorMessageElement || this.querySelector('.product-form__error-message');
    if (this.errorMessageElement) {
      this.errorMessageElement.hidden = !errorMessage;

      if (errorMessage) this.errorMessageElement.textContent = errorMessage;
    } else {
      errorMessage && alert(errorMessage);
    }
  }

  toggleButtonLoading(status) {
    if (status) {
      this.addToCartButtonElement.classList.add('btn--loading');
      this.addToCartButtonElement.setAttribute('disabled', true);
    } else {
      this.addToCartButtonElement.classList.remove('btn--loading');
      this.addToCartButtonElement.removeAttribute('disabled');
    }
  }
}
customElements.define('products-bundle', ProductsBundle);

class ProductRecentlyViewed extends HTMLElement {
  constructor() {
    super();

    if (FoxTheme.config.hasLocalStorage) {
      const productId = parseInt(this.dataset.productId);
      const cookieName = 'sleektheme:recently-viewed';
      const items = JSON.parse(window.localStorage.getItem(cookieName) || '[]');

      if (items.includes(productId)) {
        items.splice(items.indexOf(productId), 1);
      }

      items.unshift(productId);

      window.localStorage.setItem(cookieName, JSON.stringify(items.slice(0, 20)));
    }
  }
}
customElements.define('product-recently-viewed', ProductRecentlyViewed);

class MotionElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (FoxTheme.config.motionReduced) return;
    if (this.animationType === "zoom-out" || this.animationType === "zoom-out-sm")
      return;
    this.preInitialize();
    FoxTheme.Motion.inView(
      this,
      async () => {
        if (!this.isInstant && this.media) await FoxTheme.utils.imageReady(this.media);
        this.initialize();
      },
      { margin: '0px 0px -50px 0px' }
    );
  }

  get isHold() {
    return this.hasAttribute('hold');
  }

  get isInstant() {
    return this.hasAttribute('data-instantly');
  }

  get mediaElements() {
    return Array.from(this.querySelectorAll('img, iframe, svg'));
  }

  get animationType() {
    return this.dataset.motion || 'fade-up';
  }

  get animationDelay() {
    return parseInt(this.dataset.motionDelay || 0) / 1000;
  }

  preInitialize() {
    if (this.isHold) return;
    switch (this.animationType) {
      case 'fade-in':
        FoxTheme.Motion.animate(this, { opacity: 0.01 }, { duration: 0 });
        break;

      case 'fade-up':
        FoxTheme.Motion.animate(this, { transform: 'translateY(2.5rem)', opacity: 0.01 }, { duration: 0 });
        break;

      case 'zoom-in':
        FoxTheme.Motion.animate(this, { transform: 'scale(0.8)' }, { duration: 0 });
        break;
      case 'zoom-in-lg':
        FoxTheme.Motion.animate(this, { transform: 'scale(0)' }, { duration: 0 });
        break;

      case 'zoom-out':
        FoxTheme.Motion.animate(this, { transform: 'scale(1.3)' }, { duration: 0 });
        break;

      case 'zoom-out-sm':
        FoxTheme.Motion.animate(this, { transform: 'scale(1.1)' }, { duration: 0 });
    }
  }

  async initialize() {
    if (this.isHold) return;

    switch (this.animationType) {
      case 'fade-in':
        await FoxTheme.Motion.animate(
          this,
          { opacity: 1 },
          { duration: 1.5, delay: this.animationDelay, easing: [0, 0, 0.3, 1] }
        ).finished;
        break;

      case 'fade-up':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'translateY(0)', opacity: 1 },
          { duration: 0.5, delay: this.animationDelay, easing: [0, 0, 0.3, 1] }
        ).finished;
        break;

      case 'zoom-in':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'scale(1)' },
          { duration: 1.3, delay: this.animationDelay, easing: [0, 0, 0.3, 1] }
        ).finished;
        break;

      case 'zoom-in-lg':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'scale(1)' },
          { duration: 0.5, delay: this.animationDelay, easing: [0, 0, 0.3, 1] }
        ).finished;
        break;

      case 'zoom-out':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'scale(1)' },
          { duration: 1.5, delay: this.animationDelay, easing: [0, 0, 0.3, 1] }
        ).finished;
        break;

      case 'zoom-out-sm':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'scale(1)' },
          { duration: 1, delay: this.animationDelay, easing: [0, 0, 0.3, 1] }
        ).finished;
        break;
    }
  }

  async resetAnimation(duration) {
    switch (this.animationType) {
      case 'fade-in':
        await FoxTheme.Motion.animate(
          this,
          { opacity: 0 },
          {
            duration: duration ? duration : 1.5,
            delay: this.animationDelay,
            easing: duration ? 'none' : [0, 0, 0.3, 1],
          }
        ).finished;
        break;

      case 'fade-up':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'translateY(2.5rem)', opacity: 0 },
          {
            duration: duration ? duration : 0.5,
            delay: this.animationDelay,
            easing: duration ? 'none' : [0, 0, 0.3, 1],
          }
        ).finished;
        break;

      case 'zoom-in':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'scale(0)' },
          {
            duration: duration ? duration : 1.3,
            delay: this.animationDelay,
            easing: duration ? 'none' : [0, 0, 0.3, 1],
          }
        ).finished;
        break;

      case 'zoom-in-lg':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'scale(0)' },
          {
            duration: duration ? duration : 1.3,
            delay: this.animationDelay,
            easing: duration ? 'none' : [0, 0, 0.3, 1],
          }
        ).finished;
        break;

      case 'zoom-out':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'scale(0)' },
          {
            duration: duration ? duration : 1.3,
            delay: this.animationDelay,
            easing: duration ? 'none' : [0.16, 1, 0.3, 1],
          }
        ).finished;
        break;

      case 'zoom-out-sm':
        await FoxTheme.Motion.animate(
          this,
          { transform: 'scale(0)' },
          {
            duration: duration ? duration : 1.3,
            delay: this.animationDelay,
            easing: duration ? 'none' : [0.16, 1, 0.3, 1],
          }
        ).finished;
        break;
    }
  }

  refreshAnimation() {
    this.removeAttribute('hold');
    this.preInitialize();
    setTimeout(() => {
      this.initialize();
    }, 50); // Delay a bit to make animation re init properly.
  }
}
customElements.define('motion-element', MotionElement);

class TabsComponent extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      tabHeader: '[role="tablist"]',
      tabPanels: ['[role="tabpanel"]'],
      tabNavs: ['[role="tab"]'],
      tabSelect: 'tab-selector',
    };
    this.domNodes = FoxTheme.utils.queryDomNodes(this.selectors, this);

    this.selectedIndex = 0;
    this.selectedTab = this.domNodes.tabPanels[this.selectedIndex];
    this.scrollToActiveTab = this.dataset.scrollToActiveTab === 'true';
    this.scrollOffset = 20;
    this.headerEl = document.querySelector('.header-section header[is="sticky-header"]');

    this.init();
    this.setActiveTab(0);

    this.tabChange = new CustomEvent('tabChange', {
      bubbles: true,
      detail: { selectedTab: this.selectedTab },
    });
  }

  connectedCallback() {
    this.setActiveTab(0);
  }

  init = () => {
    this.domNodes.tabNavs.forEach((tab) => {
      tab.addEventListener('click', this.onTabClick.bind(this));
    });
    this.domNodes.tabHeader && this.domNodes.tabHeader.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.setAccessible();

    this.checkProductRecommendations();
  };

  static get observedAttributes() {
    return ['data-selected'];
  }

  get buttons() {
    return (this._buttons = this._buttons || Array.from(this.querySelectorAll('button[role="tab"]')));
  }

  getHeaderHeight() {
    let headerHeight = 0;

    if (this.headerEl) {
      const height = Math.round(this.headerEl.offsetHeight);
      if (this.headerEl.isAlwaysSticky) {
        headerHeight = height;
      } else {
        const isSticky = document.body.classList.contains(this.headerEl.classes.pinned);

        if (window.scrollY > this.offsetTop - this.scrollOffset) {
          headerHeight = height;
        }

        if (isSticky && window.scrollY >= this.offsetTop - this.scrollOffset - height) {
          headerHeight = height;
        }
      }
    }

    return headerHeight;
  }

  scrollToTop() {
    let offsetTop = this.offsetTop - this.scrollOffset - this.getHeaderHeight();
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  }

  onTabClick(evt) {
    if (evt.target.tagName === 'A' && evt.target.hasAttribute('href')) return;
    evt.preventDefault();
    const currentTab = evt.currentTarget;

    if (currentTab && currentTab.classList.contains('hidden')) {
      return;
    }

    const index = currentTab ? Number(currentTab.dataset.index) : 0;
    this.setActiveTab(index);

    if (this.scrollToActiveTab) {
      this.scrollToTop();
    }
  }

  setActiveTab = (tabIndex) => {
    const { tabNavs, tabPanels, tabSelect } = this.domNodes;
    if (tabIndex !== -1) {
      const newHeader = tabNavs && tabNavs[tabIndex];
      const newTab = tabPanels && tabPanels[tabIndex];

      if (newHeader && newHeader.classList.contains('hidden')) {
        const firstVisibleTabIndex = tabNavs.findIndex((tab) => !tab.classList.contains('hidden'));
        if (firstVisibleTabIndex !== -1) {
          this.setActiveTab(firstVisibleTabIndex);
          return;
        }
      }

      this.setAttribute('data-selected', tabIndex);

      tabNavs.forEach((nav) => nav.setAttribute('aria-selected', false));

      newHeader && newHeader.setAttribute('aria-selected', true);

      this.selectedIndex = tabIndex;
      this.selectedTab = newTab;

      this.dispatchEvent(
        new CustomEvent('tabChange', {
          bubbles: true,
          detail: { selectedIndex: tabIndex, selectedTab: newTab },
        })
      );

      if (tabSelect) {
        tabSelect.querySelector('select').value = tabIndex;
      }
    }
  };

  setAccessible() {
    const { tabNavs, tabPanels } = this.domNodes;
    tabNavs.forEach((tab, index) => {
      if (tab.id) tabPanels[index].setAttribute('aria-labelledby', tab.id);
      tab.setAttribute('aria-selected', index === 0);
      tab.setAttribute('data-index', index);
      if (index !== 0) {
        // tab.setAttribute('tabindex', -1);
      }
    });
    tabPanels.forEach((panel, index) => {
      if (panel.id) tabNavs[index].setAttribute('aria-controls', panel.id);
      panel.setAttribute('tabindex', 0);
    });
  }

  handleKeyDown(e) {
    const { tabNavs } = this.domNodes;
    if (e.keyCode === 39 || e.keyCode === 37) {
      tabNavs[this.selectedIndex].setAttribute('tabindex', -1);

      if (e.keyCode === 39) {
        let nextIndex = this.selectedIndex + 1;
        while (nextIndex < tabNavs.length && tabNavs[nextIndex].classList.contains('hidden')) {
          nextIndex++;
        }
        if (nextIndex >= tabNavs.length) {
          nextIndex = 0;
          while (nextIndex < this.selectedIndex && tabNavs[nextIndex].classList.contains('hidden')) {
            nextIndex++;
          }
        }
        this.selectedIndex = nextIndex;
      } else if (e.keyCode === 37) {
        let prevIndex = this.selectedIndex - 1;
        while (prevIndex >= 0 && tabNavs[prevIndex].classList.contains('hidden')) {
          prevIndex--;
        }
        if (prevIndex < 0) {
          prevIndex = tabNavs.length - 1;
          while (prevIndex > this.selectedIndex && tabNavs[prevIndex].classList.contains('hidden')) {
            prevIndex--;
          }
        }
        this.selectedIndex = prevIndex;
      }

      tabNavs[this.selectedIndex].setAttribute('tabindex', 0);
      tabNavs[this.selectedIndex].focus();

      this.setActiveTab(this.selectedIndex);
    }
  }

  getSelected() {
    return {
      index: this.selectedIndex,
      element: this.selectedTab,
    };
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-selected' && oldValue !== null && oldValue !== newValue) {
      const fromButton = this.buttons[parseInt(oldValue)];
      const toButton = this.buttons[parseInt(newValue)];
      this.transition(
        document.getElementById(fromButton.getAttribute('aria-controls')),
        document.getElementById(toButton.getAttribute('aria-controls'))
      );
    }
  }

  async transition(fromPanel, toPanel) {
    await FoxTheme.Motion.animate(
      fromPanel,
      { transform: ['translateY(0)', 'translateY(2rem)'], opacity: [1, 0] },
      { duration: 0.3 }
    ).finished;

    fromPanel.hidden = true;
    toPanel.hidden = false;

    FoxTheme.Motion.animate(
      toPanel,
      { transform: ['translateY(2rem)', 'translateY(0)'], opacity: [0, 1] },
      { duration: 0.3 }
    ).finished;

    toPanel.querySelector('grid-list') && toPanel.querySelector('grid-list').showGridItems();

    this.checkProductRecommendations();
  }

  checkProductRecommendations() {
    const { tabPanels, tabNavs } = this.domNodes;

    tabPanels.forEach((panel, index) => {
      const productRecommendations = panel.querySelector('product-recommendations');
      const tabButton = tabNavs[index];

      if (productRecommendations) {
        productRecommendations.addEventListener('recommendations:loaded', () => {
          this.updateTabButtonClass(tabButton, productRecommendations, false);
        });

        productRecommendations.addEventListener('recommendations:empty', () => {
          this.updateTabButtonClass(tabButton, productRecommendations, true);
        });

        this.updateTabButtonClass(tabButton, productRecommendations, false);
      }
    });
  }

  updateTabButtonClass(tabButton, productRecommendations, isEmpty) {
    if (!tabButton) return;

    const hasProducts = productRecommendations.querySelector('.product-card, .card-product');
    const shouldAddClass = isEmpty || !hasProducts;

    if (shouldAddClass) {
      tabButton.classList.add('hidden');
    } else {
      tabButton.classList.remove('hidden');
    }

    this.checkAndUpdateActiveTab();
  }

  checkAndUpdateActiveTab() {
    const { tabNavs } = this.domNodes;

    const currentTabButton = tabNavs[this.selectedIndex];
    if (currentTabButton && currentTabButton.classList.contains('hidden')) {
      const firstVisibleTabIndex = tabNavs.findIndex((tab) => !tab.classList.contains('hidden'));

      if (firstVisibleTabIndex !== -1) {
        this.setActiveTab(firstVisibleTabIndex);
      }
    }
  }
}
customElements.define('tabs-component', TabsComponent);

class TabSelector extends HTMLElement {
  constructor() {
    super();

    this.tabs = this.closest('tabs-component');

    this.querySelector('select').addEventListener('change', (e) => {
      this.tabs.setActiveTab(e.target.value);
    });
  }
}
customElements.define('tab-selector', TabSelector);

class Parallax extends HTMLElement {
  get parallax() {
    return this.dataset.parallax ? parseFloat(this.dataset.parallax) : false;
  }

  get parallaxDirection() {
    return this.dataset.parallaxDirection || 'vertical';
  }

  get parallaxMediaElements() {
    return Array.from(this.querySelectorAll('img, video, iframe, svg, video-element'));
  }

  connectedCallback() {
    if (this.shouldInitializeParallax()) {
      this.setupParallax();
    }
  }

  shouldInitializeParallax() {
    return !FoxTheme.config.motionReduced && this.parallax;
  }

  setupParallax() {
    const parallaxScale = 1 + this.parallax;
    const parallaxTranslate = (this.parallax * 100) / (1 + this.parallax);

    let parallaxTransformProperties = {};

    if (this.parallaxDirection === 'vertical') {
      parallaxTransformProperties = {
        transform: [
          `scale(${parallaxScale}) translateY(0)`,
          `scale(${parallaxScale}) translateY(${parallaxTranslate}%)`,
        ],
        transformOrigin: ['bottom', 'bottom'],
      };
    } else if (this.parallaxDirection === 'horizontal') {
      parallaxTransformProperties = {
        transform: [
          `scale(${parallaxScale}) translateX(0)`,
          `scale(${parallaxScale}) translateX(${parallaxTranslate}%)`,
        ],
        transformOrigin: ['right', 'right'],
      };
    } else {
      parallaxTransformProperties = {
        transform: [`scale(1)`, `scale(${parallaxScale})`],
        transformOrigin: ['center', 'center'],
      };
    }

    FoxTheme.Motion.scroll(
      FoxTheme.Motion.animate(this.parallaxMediaElements, parallaxTransformProperties, { easing: 'linear' }),
      {
        target: this,
        offset: ['start end', 'end start'],
      }
    );
  }
}
customElements.define('parallax-element', Parallax);

class ProductForm extends HTMLFormElement {
  constructor() {
    super();

    this.productIdInput = this.querySelector('[name=id]');
    this.productIdInput.disabled = false;
    this.addEventListener('submit', this.handleFormSubmit);
  }

  get cartDrawerElement() {
    return document.querySelector('cart-drawer');
  }

  get submitButtonElement() {
    return (this._submitButtonElement = this._submitButtonElement || this.querySelector('[type="submit"]'));
  }

  get isHideErrors() {
    return this.dataset.hideErrors === 'true';
  }

  handleFormSubmit = (event) => {
    if (document.body.classList.contains('cart-template') || FoxTheme.settings.cartType === 'page') return;

    event.preventDefault();
    if (this.submitButtonElement.hasAttribute('aria-disabled')) return;
    this.lastSubmittedElement = event.submitter || event.currentTarget;

    this.displayFormErrors();

    let sectionsToBundle = [];
    document.documentElement.dispatchEvent(
      new CustomEvent('cart:grouped-sections', { bubbles: true, detail: { sections: sectionsToBundle } })
    );

    const config = FoxTheme.utils.fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    this.formData = new FormData(this);
    this.formData.append('sections', sectionsToBundle);
    this.formData.append('sections_url', window.location.pathname);

    config.body = this.formData;

    this.submitButtonElement.setAttribute('aria-disabled', 'true');
    this.submitButtonElement.classList.add('btn--loading');

    this.handleFormSubmission(config);
  };

  displayFormErrors = (errorMessage = false) => {
    if (this.isHideErrors) return;

    this.formErrorMessage = this.formErrorMessage || this.querySelector('.product-form__error-message');
    if (!this.formErrorMessage) {
      if (errorMessage !== false) {
        alert(errorMessage);
      }
    } else {
      this.formErrorMessage.toggleAttribute('hidden', !errorMessage);
      this.formErrorMessage.innerText = errorMessage;
    }
  };

  handleFormSubmission = (config) => {
    fetch(`${FoxTheme.routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then(async (parsedState) => {
        if (parsedState.status) {
          this.handleCartError(parsedState);
          return;
        }

        const cartJson = await (await fetch(`${FoxTheme.routes.cart_url}`, { ...FoxTheme.utils.fetchConfig() })).json();
        cartJson['sections'] = parsedState['sections'];

        this.updateCartState(cartJson);
        this.dispatchProductAddedEvent(parsedState);

        this.showCartDrawer();
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        this.submitButtonElement.classList.remove('btn--loading');
        this.submitButtonElement.removeAttribute('aria-disabled');

        if (!this.hasError) {
          this.submitButtonElement.removeAttribute('aria-disabled');
        }
      });
  };

  handleCartError = (parsedState) => {
    FoxTheme.pubsub.publish(FoxTheme.pubsub.PUB_SUB_EVENTS.cartError, {
      source: 'product-form',
      productVariantId: this.formData.get('id'),
      errors: parsedState.errors || parsedState.description,
      message: parsedState.message,
    });

    this.displayFormErrors(parsedState.description);
    document.dispatchEvent(
      new CustomEvent('product-ajax:error', {
        detail: {
          errorMessage: parsedState.description,
        },
      })
    );
    this.hasError = true;
  };

  updateCartState = (cartJson) => {
    FoxTheme.pubsub.publish(FoxTheme.pubsub.PUB_SUB_EVENTS.cartUpdate, { cart: cartJson });
  };

  dispatchProductAddedEvent = (parsedState) => {
    document.dispatchEvent(
      new CustomEvent('product-ajax:added', {
        detail: {
          product: parsedState,
        },
      })
    );
  };

  showCartDrawer = () => {
    const quickViewModal = this.closest('quick-view-modal');
    if (quickViewModal) {
      if (this.cartDrawerElement && !this.cartDrawerElement.open) {
        document.body.addEventListener(
          quickViewModal.events.handleAfterHide,
          () => {
            setTimeout(() => {
              this.cartDrawerElement.show(this.lastSubmittedElement);
            });
          },
          { once: true }
        );
      }

      quickViewModal.hide(true);
    } else {
      this.cartDrawerElement && this.cartDrawerElement.show(this.lastSubmittedElement);
    }
  };
}
customElements.define('product-form', ProductForm, { extends: 'form' });

class OrderSample extends HTMLElement {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  connectedCallback() {
    this.form = this.querySelector('form[is="product-form"]');
    this.link = this.querySelector('[data-submit-sample]');

    if (!this.form || !this.link) return;
    this.link.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    if (this.link) {
      this.link.removeEventListener('click', this.handleClick);
    }
  }

  handleClick(e) {
    e.preventDefault();
    if (!this.form) return;

    // mimic theme's loading state
    // this.link.classList.add('btn--loading');
    this.link.setAttribute('aria-disabled', 'true');

    // submit via native requestSubmit (triggers ProductForm logic)
    this.form.requestSubmit();

    // // wait for ProductForm to clean up (theme removes loading states)
    // const observer = new MutationObserver(() => {
    //   if (!this.form.querySelector('.btn--loading')) {
    //     this.link.classList.remove('btn--loading');
    //     this.link.removeAttribute('aria-disabled');
    //     observer.disconnect();
    //   }
    // });
    // observer.observe(this.form, {
    //   attributes: true,
    //   subtree: true,
    //   attributeFilter: ['class'],
    // });
  }

  get submitButtonElement() {
    return (this._submitButtonElement = this._submitButtonElement || this.querySelector('[data-submit-sample]'));
  }
}

customElements.define('order-sample', OrderSample);

class HighlightText extends HTMLElement {
  constructor() {
    super();

    FoxTheme.Motion.inView(this, this.init.bind(this));
  }

  init() {
    this.classList.add('animate');
  }
}
customElements.define('highlight-text', HighlightText, { extends: 'em' });

class NewsletterForm extends HTMLFormElement {
  constructor() {
    super();

    this.selectors = {
      subscribedMessage: '[id*=Newsletter-error-subscribed]',
      modal: '[id*=NewsletterAlertModal-]',
    };

    this.init();
  }

  /**
   * Show message when user re-subscribe with exists email.
   */
  init() {
    const liveUrl = window.location.href;
    const result = liveUrl.includes('form_type=customer');
    const inputVal = this.querySelector('[id*="NewsletterForm"]').value.length;
    const modalEl = this.querySelector(this.selectors.modal);

    if (result && inputVal != 0) {
      const subscribedMessageEl = this.querySelector(this.selectors.subscribedMessage);
      subscribedMessageEl && subscribedMessageEl.classList.remove('hidden');

      if (!window.isNewsletterModalShow) {
        modalEl && modalEl.show();
        window.isNewsletterModalShow = true;
      }
    }

    const alertEl = this.querySelector('.form-message--main');
    if (alertEl) {
      if (!window.isNewsletterModalShow) {
        modalEl && modalEl.show();
        window.isNewsletterModalShow = true;
      }
    }
  }
}
customElements.define('newsletter-form', NewsletterForm, { extends: 'form' });
