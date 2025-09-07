document.addEventListener('DOMContentLoaded', function() {
  (function(){
    var root=document.getElementById('gl-size-charts');
    if(!root) return;
    var tabs=root.querySelectorAll('.gl-tab');
    var vals=root.querySelectorAll('.gl-val');

    function render(unit){
      tabs.forEach(function(b){
        var active=b.dataset.unit===unit;
        b.classList.toggle('is-active',active);
        b.setAttribute('aria-selected',active?'true':'false');
      });
      vals.forEach(function(el){
        var v=el.dataset[unit];
        if(unit==='inch' && el.classList.contains('gl-single') && v && !v.includes('x')){
          var num=parseFloat(v);
          if(!isNaN(num)) v=num.toFixed(1);
        }
        el.textContent = v + (unit==='cm' ? ' cm' : '"');
      });
    }

    root.addEventListener('click',function(e){
      var btn=e.target.closest('.gl-tab');
      if(!btn) return;
      render(btn.dataset.unit);
    });

    render('cm');
  })();
})