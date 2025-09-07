class LocalizationDrawer extends DrawerComponent {
  constructor() {
    super();

    this.form = this.querySelector('form')
  }

  connectedCallback() {
    super.connectedCallback();
    this.form?.addEventListener('change', this.onCountryChange.bind(this));
    this.form?.addEventListener('submit', this.onFormSubmit.bind(this));
  }

  onFormSubmit(evt) {
    this.hide();
  }

  onCountryChange(evt) {
    const isCountryChange = evt.target.name == 'country_code' ? true : false

    if(!isCountryChange) {
      return
    }

    const selectedCountry = evt.target.querySelector(`option[value="${evt.target.value}"]`)

    const market = selectedCountry.dataset.market
    this.reRenderLocaleSelector(market)
  }

  reRenderLocaleSelector(market) {
    let url = `${location.origin}?sections=localization-switcher`
    if(market == 'eu') {
      url = `${location.origin}/en-eu?sections=localization-switcher`
    }

    const localeSelect = this.form.querySelector('select[name="language_code"]')
    if(!localeSelect) return;
    localeSelect.setAttribute('disabled', true)
    
    fetch(url)
    .then(res => res.json())
    .then(data => {
      const html = data['localization-switcher']
      
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const newLocaleSelect = doc.querySelector('select[name="language_code"]')
      
      localeSelect.replaceWith(newLocaleSelect)
    })
  }

  get input() {
    return this.querySelector('select[name="country_code"]');
  }

  get requiresBodyAppended() {
    return false;
  }

  get focusElement() {
    return this.querySelector('select[name="country_code"]') || this.querySelector('button.drawer__close-btn');
  }
}

customElements.define('localization-drawer', LocalizationDrawer);