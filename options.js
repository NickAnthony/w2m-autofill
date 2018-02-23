var defaultName = "";

function loadOptions() {
	var myName = localStorage["myName"];
	var myCals = JSON.parse(localStorage["myCals"]);

	if (myName == undefined || myName.length > 20)
		myName = defaultName;

	var select = document.getElementById("name");
	select.value = myName;
	console.log(myCals);
	for(var i=0; i<myCals.length; i++){
		var name = myCals[i].name;
		var radioBtn;

		// Default: select all calendars except those that break loading

		if (isCalThatBreaks(name)) {
			radioBtn = $('<li><input type="checkbox" name="calendarPicker" id="' + i + '" /><label for="' + i + '">' + name + '</label> </li>');
		}
		else {
			radioBtn = $('<li><input type="checkbox" name="calendarPicker" checked="true" id="' + i + '" /><label for="' + i + '">' + name + '</label> </li>');
		}
    	
	    radioBtn.appendTo('#target');
		myCals[i].selected = true;
	}
}

// Searches calendar name for the keyword
// Prevents loading of calendars that break loading
function isCalThatBreaks(name) {
	console.log(name);
	var error_keywords = ["Holiday", "holiday", "entre rotation", "Blue Room", "Contacts", "entree", "Episcopal"];
	for (var i = 0; i < error_keywords.length; i++) {
		console.log(name.search(error_keywords[i]), error_keywords[i]);
		if (name.search(error_keywords[i]) >= 0){
			return true
		}
	}
	return false	
}

function saveOptions() {
	var select = document.getElementById("name").value;
	localStorage["myName"] = select;

	var checkedCals = $('input[name=calendarPicker]:checked');
	var myCals = JSON.parse(localStorage["myCals"]);
	for (var i = myCals.length - 1; i >= 0; i--) {
		myCals[i].selected = false;
	};
	for (var i = 0; i<checkedCals.length; i++) {
		myCals[checkedCals[i].id].selected = true;
	}
	localStorage["myCals"] = JSON.stringify(myCals);
}

var logout = function(){
	chrome.identity.getAuthToken({ 'interactive': false },
      	function(current_token) {
        	if (!chrome.runtime.lastError) {

          	// Make a request to revoke token in the server
          	var xhr = new XMLHttpRequest();
          	xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
                   current_token);
          	xhr.onload = function(){
          		localStorage["loggedIn"] = "false";
	          	console.log("logged out");
				// @corecode_begin removeAndRevokeAuthToken
				// @corecode_begin removeCachedAuthToken
				// Remove the local cached token
				chrome.identity.removeCachedAuthToken({ token: current_token },
				function() {});
				localStorage["myCals"] = JSON.stringify([]);
				location.reload();
			}
          	xhr.send();
        }
    });
}


$(document).ready(function(){
	if (localStorage['myCals'] && localStorage['myCals'] != "[]"){
		loadOptions();
		saveOptions();
		$('#save').click(function(){
			saveOptions();
			$('#name').css({"border" : "3px solid green"});
			$('#done').css({"display" : "inline"})
			setTimeout(function(){
				$('#done').fadeOut();
			}, 1000);
		});
		$('#reset').click(function(){
			$('#name').css({"border" : "3px solid grey"});
			document.getElementById("name").value = "";
		});
		$('#logout').click(function(){
			logout();
		});
		$('#loggin').hide();
	} else {
		$('#login').click(function(){
			chrome.runtime.sendMessage({text: "login"}, function(response) {
	            if (response.text == "logged in!") {
	                localStorage["loggedIn"] = "true";
	            }
	        });
		});;
		//$('#loggedin').hide();

	}
});