chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.text == "loadTheGCal"){
			loadAndInsertCalendars();
			sendResponse({text: "Calendars have been loaded."});
		}
	}
);


// window.addEventListener('load', function(evt) { });
function loadAndInsertCalendars() {
	var mytoken;
	var myName;
	var mycals;
	chrome.extension.sendMessage({text:"getStuff"},function(response){
		mytoken = response.type;
		myName = response.name;
		mycals = response.cal;
		console.log("My Calendars: " + mycals);
		onAuthorized(mytoken);
	});

	function loadCalendars(meetingTimes, eventlist, startDate, date) {
		// Loop through event list and mark booleans in meetingTimes
		for (var i = 0; i < eventlist.length; i++){
			var event = eventlist[i];
			var eStartDay   = event.start.day;
			var eStartHour  = event.start.hour;
			var eStartMins  = event.start.min;
			var eFinishDay  = event.end.day;
			var eFinishHour = event.end.hour;
			var eFinishMins = event.end.min;
			if (eStartHour >= startDate.getHours()){
				var startIndex = (eStartHour * 4) + (eStartMins/15) - 
								((startDate.getHours() * 4) + (startDate.getMinutes()/15));
				var durationIndex = (eFinishHour * 4) + (eFinishMins/15) - 
								((eStartHour * 4) + (eStartMins/15));
				var eDay = eStartDay - (startDate.getDay() -1);
					
				for(var b = startIndex; b < startIndex + durationIndex; b++){
					console.log("eDay: ", eDay, " b: ", b);
					meetingTimes[eDay][b] = true;
				}
			} else if (eFinishHour >= startDate.getHours()){
					var startIndex = (eFinishHour * 4) + (eFinishMins/15) - 
									((startDate.getHours() * 4) + (startDate.getMinutes()/15));
					var durationIndex = (eFinishHour * 4) + (eFinishMins/15) - 
									((startDate.getHours() * 4) + (startDate.getMinutes()/15));
					var eDay = eFinishDay - (startDate.getDay() - 1);
						
					for(var b = startIndex; b > startIndex - durationIndex; b--){
						meetingTimes[eDay][b-1] = true;
					}
			}
		}

		// Get the event ID
		var cur_url = window.location.href;
		console.log(cur_url);
		for (var i = 0; i < cur_url.length; i++) {
			if (cur_url[i] === '?') {
				break;
			}
		}

		var id_num = cur_url.substring(i+1, i+8);
		console.log("id_num: ", id_num);


		// console.log("meetingTimes: ", meetingTimes);
		// console.log("ABOUT TO LOG IN");
		// var temp = document.getElementById('name');
		// temp.value = myName;
		// var scriptNode  = document.createElement('script');
		// scriptNode.textContent = "ProcessLogin();";
		// document.body.appendChild(scriptNode);

		setTimeout(function(){
			for(var a = 0; a < meetingTimes.length; a++) {
				for(var b = 0; b < meetingTimes[a].length; b++) {
					if(meetingTimes[a][b] === false) {
						var indexTime = (startDate.getTime() - (date.getTimezoneOffset() * 60 * 1000))/1000 + 86400*a + 15*60*b;
						var scriptNode  = document.createElement('script');
						scriptNode.textContent = "\
							AvailableAtSlot[TimeOfSlot.indexOf(" + indexTime + ")].push(UserID);\
							ToCol = Col[TimeOfSlot.indexOf(" + indexTime + ")];\
							ToRow = Row[TimeOfSlot.indexOf(" + indexTime + ")];\
							FromCol = ToCol;\
							FromRow = ToRow;\
							ChangeToAvailable = 1;\
							ReColorIndividual();\
							";
						document.body.appendChild(scriptNode);
					}
				}
			}
			var postChangeScript  = document.createElement('script');
			postChangeScript.textContent = "\
				var TimesToToggle = new Array();\
				console.log('TimeOfSlot.length: ', TimeOfSlot.length);\
				console.log('AvailableAtSlot.length: ', AvailableAtSlot.length);\
				var binaryAvailability = '';\
				for (var i = 0; i < AvailableAtSlot.length; i++){\
					var ColA=Col[i];\
					var ColB=ColA;\
					var RowA=Row[i];\
					var RowB=RowA;\
					if (-1!=AvailableAtSlot[i].indexOf(UserID)) {\
						TimesToToggle.push(TimeOfSlot[i]);\
						binaryAvailability += '1';\
					}\
				}\
				new Ajax.Request('SaveTimes.php', {\
				  method: 'post',\
				  parameters: 'person='+UserID\
						   +'&event=" + id_num + "6631016'\
						   +'&slots='+TimesToToggle.join(',')\
						   +'&availability='+binaryAvailability\
						   +'&ChangeToAvailable='+ChangeToAvailable,\
				  asynchronous:true,\
				  onSuccess:function(t) { console.log('Successfully added times'); }\
				});\
				IsMouseDown=false;\
				FromCol=-1; ToCol=-1; FromRow=-1; ToRow=-1;\
				ReColorIndividual();\
				ReColorGroup();\
				";
			document.body.appendChild(postChangeScript);
		}, 3000);
	}

	function onAuthorized(token) {
		console.log("token:", token);
		var date = new Date();

		/*** Get the times for the current when to meet event. ***/
		var results = $("div[id*='YouTime']");
		
		// Get the start and end times for intervals, and convert them to Date Objects
		var firstInteral = results[0].id;
		var lastInterval = results[results.length-2].id;
		var start = firstInteral.substr(7, firstInteral.length-1) + "000";
		var startDate = new Date(parseInt(start)+ (date.getTimezoneOffset() * 60 * 1000));
		var finish = lastInterval.substr(7, lastInterval.length-1) + "000";
		var finishDate = new Date(parseInt(finish)+ (date.getTimezoneOffset() * 60 * 1000) + (15 * 60 * 1000));
		
		// Get number days, hours, minutes in each day
		var totalDays = new Date(finishDate - startDate).getDate() + 1;
		var hoursPerDay = (finishDate.getHours() - startDate.getHours());
		var minutesPerDay = (finishDate.getMinutes() - startDate.getMinutes());
		if (hoursPerDay < 0)
			hoursPerDay += 24;
		if (minutesPerDay < 0)
			minutesPerDay += (60);
		
		// For each day, create array with boolean for each interval (false == free, true == busy)
		var numIntervalsPerDay = (hoursPerDay * 4) + (minutesPerDay/15);
		var meetingTimes = [];
		for (var i = 0; i < totalDays; i++){
			var intervalDayList = [];
			for (var j = 0; j < numIntervalsPerDay; j++){
				intervalDayList.push(false);
			}
			meetingTimes.push(intervalDayList);
		}
		var starttime = startDate.toISOString();
		var endtime = finishDate.toISOString();
		var eventlist = [];

		var numCalLoaded = 0;
		var targetNumLoaded = 0;
		for (var i=0; i<mycals.length; i++) {
			if (mycals[i].selected) { 
				targetNumLoaded++;
				
			}; 
		}

		var request_array = new Array(targetNumLoaded);
		var response_array = new Array(targetNumLoaded);
		for (var i=0; i<targetNumLoaded; i++){
			request_array[i]= new XMLHttpRequest();
		}

		var curCal = -1;
		// Loop through calendars and import events
		for (var i=0; i<mycals.length; i++) {
			if (!mycals[i].selected) { 
				continue;
			};
			curCal++;
			console.log("Processing :", mycals[i].id);
			var mycal = mycals[i].id;

			var url = 'https://www.googleapis.com/calendar/v3/calendars/' + mycal + '/events?alt=json&timeMin=' + starttime + '&timeMax=' + endtime + '&access_token=' + token;
			if (mycal == undefined)
				url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?alt=json&timeMin=' + starttime + '&timeMax=' + endtime + '&access_token=' + token;
			console.log("url ", url);

			request_array[curCal].open('GET', url, false);
			request_array[curCal].onload = function() {

				console.log("numCalLoaded: ", numCalLoaded);

				numCalLoaded++;
				// Update the number of calendars loaded
				console.log("x.onload --- --- --- --- --- --- --");

				var jsonResponse = JSON.parse(request_array[curCal].response);
				if (request_array[curCal].response == undefined)
					alert("You do not have access to the calendar you have picked. Please open the Options Page and change you calendar preference or reset to Default.");

				var items = jsonResponse['items'];
				var len = items.length;
				for(var i = 0; i < len; i++) {
					var entry = items[i];
					//accounts for cancellation entries, i.e. no start/end objects.
					var start = entry['start'];
					var end = entry['end'];
					var eventstart = start['dateTime'];
					var eventstart2 = new Date(eventstart);
					var eventend = end['dateTime'];
					var eventend2 = new Date(eventend);
					if(entry['start'] !== undefined && entry.start.dateTime !== undefined && eventstart2.getDay() >= startDate.getDay() && eventstart2.getDay() <= finishDate.getDay()){
						var tup = {
							"start" : {
								"day"  : eventstart2.getDay()-1, 
								"hour" : eventstart2.getHours(), 
								"min"  : eventstart2.getMinutes()
							}, 
							"end" : {
								"day"  : eventend2.getDay()-1, 
								"hour" : eventend2.getHours(), 
								"min"  : eventend2.getMinutes()
							}
						};
						eventlist.push(tup);
					}
					if (!String.prototype.startsWith) {
					  Object.defineProperty(String.prototype, 'startsWith', {
						enumerable: false,
						configurable: false,
						writable: false,
						value: function (searchString, position) {
						  position = position || 0;
						  return this.lastIndexOf(searchString, position) === position;
						}
					  });
					}
					if (entry.hasOwnProperty('recurrence')){
						var rec = entry.recurrence[0].split(";");
						for (var k = 0; k < rec.length; k++){
							if (rec[k].startsWith("B")){
								var days = rec[k].split("=")[1].split(",");
								for (var j = days.length - 1; j >= 0; j--) {
									var day;
									if (days[j] == "MO")
										day = 0
									else if (days[j] == "TU")
										day = 1
									else if (days[j] == "WE")
										day = 2
									else if (days[j] == "TH")
										day = 3
									else if (days[j] == "FR")
										day = 4
									else if (days[j] == "SA")
										day = 5
									else 
										day = 6 
									if (day != eventstart2.getDay() && day >= startDate.getDay()-1 && day <= finishDate.getDay() - 1){
										var tup = {
											"start" : {
												"day"  : day, 
												"hour" : eventstart2.getHours(), 
												"min"  : eventstart2.getMinutes()
											}, 
											"end" : {
												"day"  : day, 
												"hour" : eventend2.getHours(), 
												"min"  : eventend2.getMinutes()
											}
										};
										eventlist.push(tup);
									}
								};
							}
						}
					}
				}
				// If all the calenders have loaded, display them in the schedule
				if (numCalLoaded >= targetNumLoaded) {
					console.log("eventlist: ", eventlist);
					loadCalendars(meetingTimes, eventlist, startDate, date);
				}
			};
			request_array[curCal].send();
		}
	};
}
//});




// window.addEventListener('load', function(evt) {
// 	var date = new Date();

// 	/*** Get the times for the current when to meet event. ***/
// 	var results = $("div[id*='YouTime']");
// 	console.log("Results:", results);
// 	console.log("Results[0]:", results[0]);
	
// 	// Get the start and end times for intervals, and convert them to Date Objects
// 	var firstInteral = results[0].id;
// 	var lastInterval = results[results.length-2].id;
// 	var start = firstInteral.substr(7, firstInteral.length-1) + "000";
// 	var startDate = new Date(parseInt(start)+ (date.getTimezoneOffset() * 60 * 1000));
// 	var finish = lastInterval.substr(7, lastInterval.length-1) + "000";
// 	var finishDate = new Date(parseInt(finish)+ (date.getTimezoneOffset() * 60 * 1000) + (15 * 60 * 1000));
	
// 	// Get number days, hours, minutes in each day
// 	var totalDays = new Date(finishDate - startDate).getDate() + 1;
// 	var hoursPerDay = (finishDate.getHours() - startDate.getHours());
// 	var minutesPerDay = (finishDate.getMinutes() - startDate.getMinutes());
// 	if (hoursPerDay < 0)
// 		hoursPerDay += 24;
// 	if (minutesPerDay < 0)
// 		minutesPerDay += (60);
	
// 	// For each day, create array with boolean for each interval (false == free, true == busy)
// 	var numIntervalsPerDay = (hoursPerDay * 4) + (minutesPerDay/15);
// 	var meetingTimes = [];
// 	for (var i = 0; i < totalDays; i++){
// 		var intervalDayList = [];
// 		for (var j = 0; j < numIntervalsPerDay; j++){
// 			intervalDayList.push(false);
// 		}
// 		meetingTimes.push(intervalDayList);
// 	}
// 	var starttime = startDate.toISOString();
// 	var endtime = finishDate.toISOString();


// 	var eventlist = [];
// 	var tup = {
// 		"start" : {
// 			"day"  : 6, 
// 			"hour" : 10, 
// 			"min"  : 0
// 		}, 
// 		"end" : {
// 			"day"  : 6, 
// 			"hour" : 11, 
// 			"min"  : 0
// 		}
// 	};
// 	eventlist.push(tup);


// 	// Loop through event list and mark booleans in meetingTimes
// 	for (var i = 0; i < eventlist.length; i++){
// 		var event = eventlist[i];
// 		var eStartDay   = event.start.day;
// 		var eStartHour  = event.start.hour;
// 		var eStartMins  = event.start.min;
// 		var eFinishDay  = event.end.day;
// 		var eFinishHour = event.end.hour;
// 		var eFinishMins = event.end.min;
// 		if (eStartHour >= startDate.getHours()){
// 			var startIndex = (eStartHour * 4) + (eStartMins/15) - 
// 							((startDate.getHours() * 4) + (startDate.getMinutes()/15));
// 			var durationIndex = (eFinishHour * 4) + (eFinishMins/15) - 
// 							((eStartHour * 4) + (eStartMins/15));
// 			var eDay = eStartDay - (startDate.getDay() -1);
				
// 			for(var b = startIndex; b < startIndex + durationIndex; b++){
// 				console.log("eDay: ", eDay, " b: ", b);
// 				meetingTimes[eDay][b] = true;
// 			}
			
// 		}
// 		else if (eFinishHour >= startDate.getHours()){
// 			var startIndex = (eFinishHour * 4) + (eFinishMins/15) - 
// 							((startDate.getHours() * 4) + (startDate.getMinutes()/15));
// 			var durationIndex = (eFinishHour * 4) + (eFinishMins/15) - 
// 							((startDate.getHours() * 4) + (startDate.getMinutes()/15));
// 			var eDay = eFinishDay - (startDate.getDay() - 1);
				
// 			for(var b = startIndex; b > startIndex - durationIndex; b--){
// 				meetingTimes[eDay][b-1] = true;
// 			}
// 		}
// 	}
// 	numDays = meetingTimes.length;

// 	// Set as the login for the current when2meet
// 	document.getElementById('name').value = "Todd";

// 	//var temp = document.getElementById('name');
// 	//temp.value = myName;

// 	var scriptNode  = document.createElement('script');
// 	scriptNode.textContent = "ProcessLogin();"
// 	document.body.appendChild(scriptNode);

// 	var log_times = false;

// 	if (log_times) {
// 	setTimeout(function(){
// 		for(var a = 0; a < meetingTimes.length; a++) {
// 			for(var b = 0; b < meetingTimes[a].length; b++) {
// 				if(meetingTimes[a][b] === false) {
// 					var indexTime = (startDate.getTime() - (date.getTimezoneOffset() * 60 * 1000))/1000 + 86400*a + 15*60*b;
// 					var scriptNode  = document.createElement('script');
// 					scriptNode.textContent = "\
// 						AvailableAtSlot[TimeOfSlot.indexOf(" + indexTime + ")].push(UserID);\
// 						ToCol = Col[TimeOfSlot.indexOf(" + indexTime + ")];\
// 						ToRow = Row[TimeOfSlot.indexOf(" + indexTime + ")];\
// 						FromCol = ToCol;\
// 						FromRow = ToRow;\
// 						ChangeToAvailable = 1;\
// 						ReColorIndividual();\
// 						";
// 					document.body.appendChild(scriptNode);
// 				}
// 			}
// 		}
// 		var postChangeScript  = document.createElement('script');
// 		postChangeScript.textContent = "\
// 		var TimesToToggle = new Array();\
// 		console.log('TimeOfSlot.length: ', TimeOfSlot.length);\
// 		console.log('AvailableAtSlot.length: ', AvailableAtSlot.length);\
// 		var binaryAvailability = '';\
// 		for (var i = 0; i < AvailableAtSlot.length; i++){\
// 			var ColA=Col[i];\
// 			var ColB=ColA;\
// 			var RowA=Row[i];\
// 			var RowB=RowA;\
// 			if (-1!=AvailableAtSlot[i].indexOf(UserID)) {\
// 				TimesToToggle.push(TimeOfSlot[i]);\
// 				binaryAvailability += '1';\
// 			} \
// 		}\
// 		new Ajax.Request('SaveTimes.php', {\
// 		  method: 'post',\
// 		  parameters: 'person='+UserID\
// 				   +'&event=6630870'\
// 				   +'&slots='+TimesToToggle.join(',')\
// 				   +'&availability='+binaryAvailability\
// 				   +'&ChangeToAvailable='+ChangeToAvailable,\
// 		  asynchronous:true,\
// 		  onSuccess:function(t) { console.log('Successfully added times'); }\
// 		});\
// 		IsMouseDown=false;\
// 		FromCol=-1; ToCol=-1; FromRow=-1; ToRow=-1;\
// 		ReColorIndividual();\
// 		ReColorGroup();\
// 		";
// 		document.body.appendChild(postChangeScript);
// 	}, 3000);
// 	}
// });


// // function SelectToHere(Time) {
// // 	if (IsMouseDown) {
// // 	  ToCol = Col[TimeOfSlot.indexOf(Time)];
// // 	  ToRow = Row[TimeOfSlot.indexOf(Time)];
// // 	  ReColorIndividual();
// // 	}
// // }
	
// // function SelectFromHere(Time) {
// //     ChangeToAvailable = (-1 == AvailableAtSlot[TimeOfSlot.indexOf(Time)].indexOf(UserID) );
// //     IsMouseDown=true;
// //     ToCol = Col[TimeOfSlot.indexOf(Time)];
// //     ToRow = Row[TimeOfSlot.indexOf(Time)];
// //     FromCol = ToCol;
// //     FromRow = ToRow
// //     ReColorIndividual();
// //  }

// function SendUpdates() {
// 	var TimesToToggle = new Array();
// 	var binaryAvailability = "";
// 	for (var i = 0; i < AvailableAtSlot.length; i++){
// 		var ColA=Col[i];
// 		var ColB=ColB;
// 		var RowA=Row[i];
// 		var RowB=RowA;
// 		// If person is available at this time
// 		if (-1!=AvailableAtSlot[i].indexOf(UserID)) {
// 			TimesToToggle.push(TimeOfSlot[i]);
// 			binaryAvailability += "1";
// 		}
// 	}
// 	new Ajax.Request("SaveTimes.php", {
// 	  method: "post",
// 	  parameters: "person="+UserID
// 			   +"&event=6630454"
// 			   +"&slots="+TimesToToggle.join(",")
// 			   +"&availability="+binaryAvailability
// 			   +"&ChangeToAvailable="+ChangeToAvailable,
// 	  asynchronous:true,
// 	  onSuccess:function(t) { }
// 	});
// 	IsMouseDown=false;
// 	FromCol=-1; ToCol=-1; FromRow=-1; ToRow=-1;
// 	ReColorIndividual();
// 	ReColorGroup();
// }


// // function SendUpdates() {
// //     if (!IsMouseDown) return;
// //     var TimesToToggle = new Array();
// // 	  var binaryAvailability = "";
// //     for (var i=0;i<TimeOfSlot.length;i++) {
// // 	if (FromCol<ToCol) { ColA=FromCol; ColB=ToCol; } else { ColA=ToCol; ColB=FromCol; }
// //       if (FromRow<ToRow) { RowA=FromRow; RowB=ToRow; } else { RowA=ToRow; RowB=FromRow; }
	  
// //       var WithinX = ((ColA<=Col[i])&&(Col[i]<=ColB));
// //       var WithinY = ((RowA<=Row[i])&&(Row[i]<=RowB));
	  
// //       if (WithinX && WithinY) {
// //         TimesToToggle.push(TimeOfSlot[i]);
// //         if (ChangeToAvailable && (-1==AvailableAtSlot[i].indexOf(UserID)))
// //           AvailableAtSlot[i].push(UserID);
// //         if ((!ChangeToAvailable) && (-1!=AvailableAtSlot[i].indexOf(UserID))) {
// //           SplitSpot = AvailableAtSlot[i].indexOf(UserID);
// //           AvailableAtSlot[i].splice(SplitSpot,1);
// //         }
// //       }
// //       if (-1!=AvailableAtSlot[i].indexOf(UserID)) {
// //           binaryAvailability += "1";
// //       } else {
// //           binaryAvailability += "0";
// //       }
// //     }
		
// //     new Ajax.Request("SaveTimes.php", {
// //       method: "post",
// //       parameters: "person="+UserID
// //                +"&event=6630454"
// //                +"&slots="+TimesToToggle.join(",")
// //                +"&availability="+binaryAvailability
// //                +"&ChangeToAvailable="+ChangeToAvailable,
// //       asynchronous:false,
// //       onSuccess:function(t) { 
// //      //   alert(t.responseText);
// //       }
// //     });
	
// //     IsMouseDown=false;
// //     FromCol=-1; ToCol=-1; FromRow=-1; ToRow=-1;
// //     ReColorIndividual();
// //     ReColorGroup();
// // }

// // function SelectFromHere(Time) {
// // 	ChangeToAvailable = (-1 == AvailableAtSlot[TimeOfSlot.indexOf(Time)].indexOf(UserID) );
// // 	IsMouseDown=true;
// // 	ToCol = Col[TimeOfSlot.indexOf(Time)];
// // 	ToRow = Row[TimeOfSlot.indexOf(Time)];
// // 	FromCol = ToCol;
// // 	FromRow = ToRow
// // 	ReColorIndividual();
// // }





// // function SelectToHere(Time) {
// // 	if (IsMouseDown) {
// // 	  ToCol = Col[TimeOfSlot.indexOf(Time)];
// // 	  ToRow = Row[TimeOfSlot.indexOf(Time)];
// // 	  ReColorIndividual();
// // 	}

// // function MouseUp() {
// // 	if (WriteMode!="") {
// // 	  var HighlightedDates = [];
// // 	  for (Row=1;Row<=6;Row++) {
// // 	    for (Column=1;Column<=7;Column++) {
// // 	      if (((AnchorRow-Row)*(Row-HoverRow)>=0) && ((AnchorColumn-Column)*(Column-HoverColumn)>=0)) {
// // 	        HighlightedDates.push(document.getElementById("DateOf-"+Row+"-"+Column).value);
// // 	      }
// // 	      document.getElementById("Day-"+Row+"-"+Column).style.border='1px solid black';
// // 	      document.getElementById("Day-"+Row+"-"+Column).style.padding='2px';
// // 	      document.getElementById("Day-"+Row+"-"+Column).style.margin='1px';
// // 	    }
// // 	  }

// // 	  if (WriteMode == "write") {
// // 	    AddHighlightedDates(HighlightedDates);
// // 	  } else { // WriteMode == "erase"
// // 	    RemoveHighlightedDates(HighlightedDates);
// // 	  }
// // 	}
// // 	WriteMode = "";

// // 	IsMouseDownDates=false;
// // 	IsMouseDownSideLabel=false;
// // 	IsMouseDownTopLabel=false;
// // }

// // function ReColorIndividual() {
// //     for (var i=0;i<TimeOfSlot.length;i++) {
// //       if (FromCol<ToCol) { ColA=FromCol; ColB=ToCol; } else { ColA=ToCol; ColB=FromCol; }
// //       if (FromRow<ToRow) { RowA=FromRow; RowB=ToRow; } else { RowA=ToRow; RowB=FromRow; }
	  
// //       var WithinX = ((ColA<=Col[i])&&(Col[i]<=ColB));
// //       var WithinY = ((RowA<=Row[i])&&(Row[i]<=RowB));

// //       if (ChangeToAvailable) NewColor="#339900"; else NewColor="#ffdede";
// //       if (WithinX && WithinY && IsMouseDown) {
// //           document.getElementById("YouTime"+TimeOfSlot[i]).style.background=NewColor;
// //           document.getElementById("YouTime"+TimeOfSlot[i]).style.borderColor=NewColor;
// //           if (ColA==Col[i]) document.getElementById("YouTime"+TimeOfSlot[i]).style.borderLeftColor="black";
// //           if (ColB==Col[i]) document.getElementById("YouTime"+TimeOfSlot[i]).style.borderRightColor="black";
// //           if (RowA==Row[i]) document.getElementById("YouTime"+TimeOfSlot[i]).style.borderTopColor="black";
// //           if (RowB==Row[i]) document.getElementById("YouTime"+TimeOfSlot[i]).style.borderBottomColor="black";
// //       } else {
// //         if (-1 != AvailableAtSlot[i].indexOf(UserID) ) {
// //           document.getElementById("YouTime"+TimeOfSlot[i]).style.background="#339900";
// //           document.getElementById("YouTime"+TimeOfSlot[i]).style.borderColor="black";          
// //         } else {
// //           document.getElementById("YouTime"+TimeOfSlot[i]).style.background="#ffdede";
// //           document.getElementById("YouTime"+TimeOfSlot[i]).style.borderColor="black";
// //         }
// //       }
// //     }
// //   }


