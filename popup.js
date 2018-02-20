document.addEventListener('DOMContentLoaded',  () => { 
    var load_button = document.getElementById("loadButton");
    load_button.addEventListener("click", function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {text: "loadGCalData"}, function(response) {
                console.log(response.text);
            });
        });
    });

    // This code is used to display all calendars within the popup window
    // Load the list of currently selected calendars
    var cal_list = document.getElementById('calList');
    console.log("cal_list.childNodes.length:", cal_list.childNodes.length);
    if (cal_list.childNodes.length <= 3){
        var myCals = JSON.parse(localStorage["myCals"]);
        for(var i=0; i<myCals.length; i++){
            if (myCals[i].selected) {
                var name = myCals[i].name;
                var radioBtn = $('<div name="calendarPicker" id="' + i + '" /><label for="' + i + '">' + name + '</label> <br/>');
                radioBtn.appendTo('#calList');
            }
        }
    }

    // Handle Google Account Signin
    var signin_button = document.getElementById("popupSignInBtn");
    signin_button.addEventListener("click", function() {
        chrome.runtime.sendMessage({text: "login"}, function(response) {
            console.log(response);
        });

    });
});

