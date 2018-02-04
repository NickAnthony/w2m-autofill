document.addEventListener('DOMContentLoaded',  () => { 
    var load_button = document.getElementById("loadButton");
    load_button.addEventListener("click", function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {text: "loadTheGCal"}, function(response) {
                console.log(response.text);
            });
        });
    });
});