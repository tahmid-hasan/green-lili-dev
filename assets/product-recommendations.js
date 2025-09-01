if (!customElements.get('product-recommendations')) {
  customElements.define(
    'product-recommendations',
    class ProductRecommendations extends HTMLElement {
      constructor() {
        super();

        if ('requestIdleCallback' in window) {
          requestIdleCallback(this.init.bind(this), { timeout: 1500 });
        } else {
          FoxTheme.Motion.inView(this, this.init.bind(this), { margin: '0px 0px 400px 0px' });
        }
      }

      init() {
        fetch(this.dataset.url)
          .then((response) => response.text())
          .then((responseText) => {
            const sectionInnerHTML = new DOMParser()
              .parseFromString(responseText, 'text/html')
              .querySelector('.shopify-section');

            if (sectionInnerHTML === null) return;

            const recommendations = sectionInnerHTML.querySelector('product-recommendations');
            if (recommendations && recommendations.innerHTML.trim().length) {
              this.innerHTML = recommendations.innerHTML;
            }

            if (recommendations.querySelector('.product-card')) {
              this.dispatchEvent(new CustomEvent('recommendations:loaded'));
            } else {
              if (recommendations.classList.contains('complementary-products')) {
                const productBlock = this.closest('.product__block');
                  if (productBlock) {
                    productBlock.remove();
                  }
              } else {
                const shopifySection = this.closest('.shopify-section');
                  if (shopifySection) {
                      shopifySection.remove();
                  }
              }
              this.dispatchEvent(new CustomEvent('recommendations:empty'));
            }
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }
  );
}
