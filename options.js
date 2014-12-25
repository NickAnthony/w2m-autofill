var defaultName = "";

function loadOptions() {
	var myName = localStorage["myName"];
	var myCals = JSON.parse(localStorage["myCals"]);

	if (myName == undefined || myName.length > 20)
		myName = defaultName;

	var select = document.getElementById("name");
	select.value = myName;

	for(var i=0; i<myCals.length; i++){
		var name = myCals[i].name;
		var radioBtn;
		if (myCals[i].selected){
			radioBtn = $('<input type="radio" name="calendarPicker" checked="true" id="' + i + '" /><label for="' + i + '">' + name + '</label>');
	    	radioBtn.appendTo('#target');
	    } else {
	    	radioBtn = $('<input type="radio" name="calendarPicker" id="' + i + '" /><label for="' + i + '">' + name + '</label>');
	    	radioBtn.appendTo('#target');
	    }
	}
}

function saveOptions() {
	var select = document.getElementById("name").value;
	localStorage["myName"] = select;

	var cal = $('input[name=calendarPicker]:checked').attr('id');
	var myCals = JSON.parse(localStorage["myCals"]);
	for (var i = myCals.length - 1; i >= 0; i--) {
		myCals[i].selected = false;
	};
	myCals[cal].selected = true;
	localStorage['myCals'] = JSON.stringify(myCals);
}

var getToken = function(){
	chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
	      var mytoken = token;
	      var x = new XMLHttpRequest();
	      x.open('GET', 'https://www.googleapis.com/calendar/v3/users/me/calendarList?alt=json' + '&access_token=' + token);
		    x.onload = function(){
		      if (this.status === 401) {
		          // This status may indicate that the cached
		          // access token was invalid.
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
			  localStorage['myCals'] = JSON.stringify(obj);
			  location.reload();
		  };
	      x.send();
	});
}

var logout = function(){
	chrome.identity.getAuthToken({ 'interactive': false },
      function(current_token) {
        if (!chrome.runtime.lastError) {

          // @corecode_begin removeAndRevokeAuthToken
          // @corecode_begin removeCachedAuthToken
          // Remove the local cached token
          chrome.identity.removeCachedAuthToken({ token: current_token },
            function() {
              	localStorage["myName"] = "";
              	localStorage['myCals'] = "";
          		//location.reload();
            });
          // @corecode_end removeCachedAuthToken

          // Make a request to revoke token in the server
          var xhr = new XMLHttpRequest();
          xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
                   current_token);
          xhr.onload = function(){
          	console.log("logged out");
          	location.reload();
          }
          xhr.send();
        }
    });
}


$(document).ready(function(){
	if (localStorage['myCals'] && localStorage['myCals'] != ""){
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