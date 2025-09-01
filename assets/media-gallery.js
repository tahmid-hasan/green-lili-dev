if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();

        this.selectors = {
          viewer: '[id^="GalleryViewer"]',
          thumbnails: '[id^="GalleryThumbnails"]',
          mediaList: '[id^="Slider-Gallery"]',
          mediaItems: ['.product__media-item'],
        };

        this.sliderInstance = false;
        this.thumbsInstance = false;
      }

      connectedCallback() {
        this.init();
      }

      init() {
        this.elements = window.FoxTheme.utils.queryDomNodes(this.selectors, this);
        this.mediaLayout = this.dataset.mediaLayout;
        this.onlyImage = this.dataset.onlyImage === 'true';
        this.enableDesktopSlider = this.dataset.enableDesktopSlider === 'true';
        this.enableMobileThumbnails = this.dataset.enableMobileThumbnails === 'true';
        this.enableImageZoom = this.dataset.enableImageZoom === 'true';
        this.setSliderOptions();

        const mql = window.matchMedia(FoxTheme.config.mediaQueryMobile);
        mql.onchange = this.updateMediaLayout.bind(this);
        this.updateMediaLayout();

        if (this.enableImageZoom) {
          this.initImageZoom();
        }
      }

      setSliderOptions() {
        const mediaItemGap = parseInt(this.dataset.mediaItemGap);

        this.sliderOptions = {
          init: false,
          slidesPerView: '1',
          spaceBetween: mediaItemGap,
          loop: true,
          grabCursor: true,
          allowTouchMove: true,
          autoHeight: true,
          navigation: {
            nextEl: this.querySelector('.swiper-button-next'),
            prevEl: this.querySelector('.swiper-button-prev'),
          },
          pagination: {
            el: this.querySelector('.swiper-pagination'),
            clickable: true,
            type: 'fraction',
          },
          threshold: 2,
        };

        this.thumbsOptions = {
          slidesPerView: 4,
          breakpoints: {
            461: {
              slidesPerView: 5,
            },
          },
          spaceBetween: mediaItemGap,
          loop: false,
          freeMode: true,
          watchSlidesProgress: true,
          threshold: 2,
        };

        switch (this.mediaLayout) {
          case 'vertical-carousel':
            this.thumbsOptions = Object.assign({}, this.thumbsOptions, {
              breakpoints: {
                768: {
                  direction: 'vertical',
                  slidesPerView: 'auto',
                },
              },
            });
            break;
          case 'slider-freemode':
            this.sliderOptions = Object.assign({}, this.sliderOptions, {
              slidesPerView: 'auto',
            });
            break;
        }
      }

      updateMediaLayout() {
        if (FoxTheme.config.mqlMobile) {
          this.initSlider();
        } else {
          if (this.enableDesktopSlider) {
            this.initSlider();
          } else {
            this.destroySlider();
          }
        }
      }

      initSlider() {
        if (typeof this.sliderInstance !== 'object') {
          if ((this.enableDesktopSlider || this.enableMobileThumbnails) && this.elements.thumbnails) {
            this.thumbsInstance = new window.FoxTheme.Carousel(this.elements.thumbnails, this.thumbsOptions);
            this.thumbsInstance.init();

            this.sliderOptions.thumbs = {
              swiper: this.thumbsInstance.slider,
              autoScrollOffset: 2,
            };
          }

          this.sliderInstance = new window.FoxTheme.Carousel(this.elements.viewer, this.sliderOptions, [
            FoxTheme.Swiper.Thumbs,
          ]);
          this.sliderInstance.init();

          this.handleSliderAfterInit();
          this.handleSlideChange();

          this.sliderInstance.slider.init();
        }
      }

      destroySlider() {
        if (typeof this.sliderInstance === 'object') {
          this.sliderInstance.slider.destroy();
          this.sliderInstance = false;
        }
      }

      initThumbsSlider() {
        if (typeof this.thumbsInstance !== 'object') {
          this.thumbsInstance = new window.FoxTheme.Carousel(this.selectors.thumbnails, this.thumbsOptions);
          this.thumbsInstance.init();
        }
      }

      initImageZoom() {
        let dataSource = [];
        const allMedia = [...this.querySelectorAll('.product__media-item:not(.swiper-slide-duplicate)')];
        if (allMedia) {
          allMedia.forEach((media) => {
            switch (media.dataset.mediaType) {
              case 'model':
                dataSource.push({
                  id: media.dataset.mediaIndex,
                  html: `<div class="pswp__item--${media.dataset.mediaType}">${
                    media.querySelector('product-model').outerHTML
                  }</div>`,
                  mediaType: media.dataset.mediaType,
                });
                break;
              case 'video':
              case 'external_video':
                dataSource.push({
                  id: media.dataset.mediaIndex,
                  html: `<div class="pswp__item--${media.dataset.mediaType}">${
                    media.querySelector('video-element').outerHTML
                  }</div>`,
                  mediaType: media.dataset.mediaType,
                });
                break;
              case 'image':
                dataSource.push({
                  id: media.dataset.mediaIndex,
                  src: media.dataset.src,
                  width: media.dataset.pswpWidth,
                  height: media.dataset.pswpHeight,
                  mediaType: media.dataset.mediaType,
                });
                break;
            }
          });
        }

        this.lightbox = new window.FoxTheme.PhotoSwipeLightbox({
          dataSource: dataSource,
          pswpModule: window.FoxTheme.PhotoSwipe,
          bgOpacity: 1,
          arrowPrev: false,
          arrowNext: false,
          zoom: false,
          close: false,
          counter: false,
          preloader: false,
        });

        this.lightbox.addFilter('thumbEl', (thumbEl, { id }, index) => {
          if (this.sliderInstance && this.sliderInstance.slider) {
            const { slides, activeIndex } = this.sliderInstance.slider;
            if (slides[activeIndex]) {
              const el = slides[activeIndex].querySelector('img');
              if (el) {
                return el;
              }
            }
          }

          return thumbEl;
        });

        this.lightbox.addFilter('placeholderSrc', (placeholderSrc, { data: { id } }) => {
          if (this.sliderInstance && this.sliderInstance.slider) {
            const { slides, activeIndex } = this.sliderInstance.slider;
            if (slides[activeIndex]) {
              const el = slides[activeIndex].querySelector('img');
              if (el) {
                return el.src;
              }
            }
          }

          return placeholderSrc;
        });

        this.lightbox.on('change', () => {
          window.pauseAllMedia(this);
          if (this.sliderInstance && this.sliderInstance.slider) {
            const { currIndex } = this.lightbox.pswp;
            if (this.sliderInstance.slider.realIndex !== currIndex) {
              this.sliderInstance.slider.slideToLoop(currIndex, 100, false);
            }
          }
        });

        this.lightbox.on('pointerDown', (e) => {
          if (this.lightbox.pswp.currSlide.data.mediaType != 'image') {
            e.preventDefault();
          }
        });

        this.lightbox.on('uiRegister', () => {
          if (!this.onlyImage) {
            this.lightbox.pswp.ui.registerElement({
              name: 'next',
              ariaLabel: 'Next slide',
              order: 3,
              isButton: true,
              html: '<svg class="pswp-icon-next flip-x" viewBox="0 0 100 100"><path d="M 10,50 L 60,100 L 65,90 L 25,50  L 65,10 L 60,0 Z"></path></svg>',
              onClick: (event, el) => {
                this.lightbox.pswp.next();
              },
            });
            this.lightbox.pswp.ui.registerElement({
              name: 'prev',
              ariaLabel: 'Previous slide',
              order: 1,
              isButton: true,
              html: '<svg class="pswp-icon-prev rtl-flip-x" viewBox="0 0 100 100"><path d="M 10,50 L 60,100 L 65,90 L 25,50  L 65,10 L 60,0 Z"></path></svg>',
              onClick: (event, el) => {
                this.lightbox.pswp.prev();
              },
            });
          }
          this.lightbox.pswp.ui.registerElement({
            name: 'close-zoom',
            ariaLabel: 'Close zoom image',
            order: 2,
            isButton: true,
            html: '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" role="presentation" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
            onClick: (event, el) => {
              this.lightbox.pswp.close();
            },
          });
        });

        this.lightbox.init();

        FoxTheme.utils.addEventDelegate({
          selector: '.js-photoswipe--zoom',
          context: this,
          handler: (e, media) => {
            if (media.dataset.mediaType === 'image') {
              const index = Number(media.dataset.mediaIndex) || 0;
              this.lightbox.loadAndOpen(index);
            }
          },
        });
      }

      handleSliderAfterInit() {
        this.sliderInstance.slider.on('afterInit', (swiper) => {
          const { slides, activeIndex } = swiper;

          if (slides[activeIndex]) {
            const isModelMediaType = slides[activeIndex].dataset.mediaType === 'model';
            this.toggleSliderDraggableState(!isModelMediaType);
          }
        });
      }

      handleSlideChange() {
        this.sliderInstance.slider.on('realIndexChange', (swiper) => {
          const { slides, activeIndex, thumbs } = swiper;

          if (thumbs.swiper) {
            thumbs.swiper.slideTo(activeIndex);
          }

          if (slides[activeIndex]) {
            this.playActiveMedia(slides[activeIndex]);

            const isModelMediaType = slides[activeIndex].dataset.mediaType === 'model';
            this.toggleSliderDraggableState(!isModelMediaType);
          }
        });
      }

      toggleSliderDraggableState(isDraggable) {
        if (this.sliderInstance.slider.allowTouchMove !== isDraggable) {
          this.sliderInstance.slider.allowTouchMove = isDraggable;
        }
      }

      playActiveMedia(selected) {
        const deferredMedia = selected.querySelector('product-model');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      setActiveMedia(variant) {
        if (!variant || !variant.hasOwnProperty('featured_media') || !variant.featured_media) return;

        if (this.sliderInstance.slider) {
          const slideIndex = variant.featured_media.position || 0;
          this.sliderInstance.slider.slideToLoop(slideIndex - 1);
        } else {
          this.sortMediaItems(variant);
        }
      }

      sortMediaItems(variant) {
        let newMedias = this.elements.mediaItems;

        // Reset ordering.
        newMedias.sort(function (a, b) {
          return a.dataset.mediaIndex - b.dataset.mediaIndex;
        });

        newMedias.some((media, index) => {
          if (media.dataset.mediaId == variant.featured_media.id) {
            const [element] = newMedias.splice(index, 1);
            newMedias.unshift(element);
            return true;
          }
        });

        this.elements.mediaList.innerHTML = '';
        newMedias.forEach((media) => {
          this.elements.mediaList.appendChild(media);
        });

        if (!FoxTheme.config.mqlMobile) {
          const selectedMedia = this.querySelector(`[data-media-id="${variant.featured_media.id}"]`);
          if (selectedMedia) {
            window.scrollTo({ top: selectedMedia.offsetTop, behavior: 'smooth' });
          }
        }
      }
    }
  );
}
