'use strict';

window.addEventListener("DOMContentLoaded", function() { //run when loaded

  let google_button = document.getElementById("d2-3-2");
  
  google_button.addEventListener("click", function(e) {
    window.location.href = "auth/google"; //send to google
    
  });

});