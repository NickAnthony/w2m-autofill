document.addEventListener('DOMContentLoaded',  () => { 

    var load_button = document.getElementById("loadButton");
    load_button.addEventListener("click", function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {text: "loadGCalData"}, function(response) {
                loadCalendarsToPopup();
                // Show progress bar
                var progress_bar = document.getElementById("progressbar");
                progress_bar.style.display = "block";
            });
        });
    });

    // This code is used to display all calendars within the popup window
    // Load the list of currently selected calendars
    loadCalendarsToPopup();

    // Initiallize local storage if it hasn't been initialized already
    if (!localStorage["loggedIn"]) {
        localStorage["loggedIn"] = "false";
    }

    // Handle Google Account Signin
    var signin_button = document.getElementById("popupSignInBtn");
    if (localStorage["loggedIn"] == "true") {
        signin_button.innerHTML = "You are signed in.";
    }

    console.log("localStorage['loggedIn']", localStorage["loggedIn"]);

    signin_button.addEventListener("click", function() {
        chrome.runtime.sendMessage({text: "login"}, function(response) {
            if (response.text == "logged in!") {
                localStorage["loggedIn"] = "true";
                if (response.name) {
                    signin_button.innerHTML = response.name;
                }
                else {
                    signin_button.innerHTML = "You are signed in."
                }
            }
        });
    });
});


// Once the calendars are loaded in the background, load them into the popup screen
chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
  if(request.text == "calsLoaded"){
    loadCalendarsToPopup();
  }
  if(request.text == "updateLoadStatus"){
    // Update the loading bar status
    var progress_width = document.getElementById("progresswidth");
    var progress_bar = document.getElementById("progressbar");
    if ((request.loadStatus)*100 >= 99){
        progress_bar.style.display = "none";
    }
    else {
        progress_width.style.width = String((request.loadStatus)*100)+ '%';
    }
  }
});

function loadCalendarsToPopup(){
    var cal_list = document.getElementById('calList');
    if (cal_list.childNodes.length <= 3 && localStorage["myCals"]){
        var myCals = JSON.parse(localStorage["myCals"]);
        for(var i=0; i<myCals.length; i++){
            if (myCals[i].selected) {
                var name = myCals[i].name;
                var radioBtn = $('<div name="calendarPicker" id="' + i + '" /><label for="' + i + '">' + name + '</label> <br/>');
                radioBtn.appendTo('#calList');
            }
        }
    }
}

