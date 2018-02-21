// Searches calendar name for the keyword
// Prevents loading of calendars that break loading
function isCalThatBreaks(name) {
	console.log(name);
	var error_keywords = ["Holiday", "holiday", "entre rotation", "Blue Room", "Contacts", "entree", "Episcopal"];
	for (var i = 0; i < error_keywords.length; i++) {
		if (name.search(error_keywords[i]) >= 0){
			return true
		}
	}
	return false
}


var bgtoken;
function getTokenFromBG() {
	chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
		localStorage['token'] = token;
		bgtoken = localStorage['token'];
		var x = new XMLHttpRequest();
		x.open('GET', 'https://www.googleapis.com/calendar/v3/users/me/calendarList?alt=json' + '&access_token=' + bgtoken);
		x.onload = function(){
	  		if (this.status === 401) {
				// This status may indicate that the cached
				// access token was invalid. Retry once with
				// a fresh token.
				chrome.identity.removeCachedAuthToken(
					{ 'token': bgtoken },
					function(){});
				return;
	  		}

			var jsonResponse = JSON.parse(x.response);
			var obj = [];

			// Initiallize local storage if it hasn't been initialized already
			if (!localStorage["myCals"]) {
				localStorage["myCals"] = [];
			}

			// Go through list of calendars and add those that haven't been added so far
			for (var i= 0; i< jsonResponse.items.length; i++){
				// If it wasn't previously loaded
				if (!localStorage["myCals"][i]) {
					if (isCalThatBreaks(jsonResponse.items[i].summary)){ 
						obj.push({"name" : jsonResponse.items[i].summary, "selected" : false, "id": jsonResponse.items[i].id});
					}
					else {
						obj.push({"name" : jsonResponse.items[i].summary, "selected" : true, "id": jsonResponse.items[i].id});
					}
				}
			}
			localStorage["myCals"] = JSON.stringify(obj);
		};
		x.send();
	});
}

chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
  if(request.text == "getGCalData"){
    var myName = localStorage['myName'];
    var cals = localStorage["myCals"];
    var obj = JSON.parse(cals);
    sendResponse({type: localStorage['token'], name: myName, cal: obj});
  }
  if (request.text == "setToken"){
  	bgtoken = request.token;
  }
  if (request.text == "login"){ 
  	getTokenFromBG();
  	sendResponse({curtoken: bgtoken, name: myName, cal: obj, text: "logged in!"});
  }
});




