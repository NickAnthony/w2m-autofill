var mytoken;
var getToken = function(){
	chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
	      mytoken = token;
	      var x = new XMLHttpRequest();
	      x.open('GET', 'https://www.googleapis.com/calendar/v3/users/me/calendarList?alt=json' + '&access_token=' + token);
		    x.onload = function(){
		      if (this.status === 401) {
		          // This status may indicate that the cached
		          // access token was invalid. Retry once with
		          // a fresh token.
		          chrome.identity.removeCachedAuthToken(
		              { 'token': access_token },
		              function(){});
		          return;
		      }

			  var jsonResponse = JSON.parse(x.response);
			  var obj = [];
			  for (var i= 0; i< jsonResponse.items.length; i++){
			  	if (i == 0)
			  		obj.push({"name" : jsonResponse.items[i].summary, "selected" : true, "id": jsonResponse.items[i].id});
			  	else 
			  		obj.push({"name" : jsonResponse.items[i].summary, "selected" : false, "id": jsonResponse.items[i].id});
			  }
			  localStorage["myCals"] = JSON.stringify(obj);
		  };
	      x.send();
	});
};

getToken();

chrome.extension.onMessage.addListener(function(message,sender,sendResponse){
  if(message.text == "getStuff"){
    var myName = localStorage['myName'];
    var cals = localStorage["myCals"];
    var obj = JSON.parse(cals);
    sendResponse({type: mytoken, name: myName, cal: obj});
  }
  if (message.text == "setToken"){
  	mytoken = message.token;
  }
});



