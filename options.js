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
		if (myCals[i].selected) {
			radioBtn = $('<input type="checkbox" name="calendarPicker" checked="true" id="' + i + '" /><label for="' + i + '">' + name + '</label>');
	    	radioBtn.appendTo('#target');
	    } else {
	    	radioBtn = $('<input type="checkbox" name="calendarPicker" id="' + i + '" /><label for="' + i + '">' + name + '</label>');
	    	radioBtn.appendTo('#target');
	    }
	}
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

var getToken = function(){
	chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
	      var x = new XMLHttpRequest();
	      x.open('GET', 'https://www.googleapis.com/calendar/v3/users/me/calendarList?alt=json&access_token=' + token);
		    x.onload = function(){
		      if (this.status === 401) {
	          // This status may indicate that the cached
	          // access token was invalid.
	          console.log("removing token");
	          chrome.identity.removeCachedAuthToken(
	              { 'token': access_token },
	              function(){});
	          return;
		      }

		      chrome.extension.sendMessage({text:"setToken", "token" : token}, function(response){});

				  var jsonResponse = JSON.parse(x.response);
				  var obj = [];
				  for (var i = 0; i< jsonResponse.items.length; i++){
				  		obj.push({"name" : jsonResponse.items[i].summary, "selected" : true, "id": jsonResponse.items[i].id});
				  }
				  localStorage["myCals"] = JSON.stringify(obj);
			  	location.reload();
		  	};
	      x.send();
	});
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
			getToken();
		});;
		$('#loggedin').hide();

	}
});