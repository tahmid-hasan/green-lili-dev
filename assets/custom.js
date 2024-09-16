/* custom js code here*/
$(document).ready(function() {
    var sidebar_show = "";
    $(document).on("click", ".sidebar-header svg", function() {
        $('.sidebar-sticky').hide("slide", { direction: "left" }, 500);
        //sessionStorage.setItem("sidebar_show", "hide");
        sidebar_show = "hide";
    });
    $(document).on("click", ".filter-button", function() {
        $('.sidebar-sticky').show("slide", { direction: "left" }, 500);
        //sessionStorage.setItem("sidebar_show", "show"); 
        sidebar_show = "show";        
    });

    $(window).on('resize', function(){
        var win = $(this); //this = window
        // if (win.height() >= 768) { /* ... */ }
        if (win.width() >= 768) { 
            $('.sidebar-sticky').show();
        } else {
            if(sidebar_show == "hide" || sidebar_show == "") {
                $('.sidebar-sticky').hide();
            } else {
                $('.sidebar-sticky').show();
            }
        }
    });

    // const product = document.querySelector('.product-section');
    // let handle = ''
  
    // if (product) {
    //   const variantInputs = document.querySelectorAll('.variant-input');
    //   let found = false;

    //   variantInputs.forEach((variant) => {
    //     if (window.getComputedStyle(variant).display !== "none") {
    //       const input = variant.querySelector('input')

    //       if (input && found === false) {
    //         console.log(input)
    //         input.click();
    //         found = true;
    //       }
    //     }
    //   });
    // }

});