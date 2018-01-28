window.addEventListener('load', function(evt) {
	var date = new Date();

	/*** Get the times for the current when to meet event. ***/
	var results = $("div[id*='YouTime']");
	console.log("Results:", results);
	console.log("Results[0]:", results[0]);
	
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
	var tup = {
		"start" : {
			"day"  : 6, 
			"hour" : 10, 
			"min"  : 0
		}, 
		"end" : {
			"day"  : 6, 
			"hour" : 11, 
			"min"  : 0
		}
	};
	eventlist.push(tup);


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
			
		}
		else if (eFinishHour >= startDate.getHours()){
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
	numDays = meetingTimes.length;

	// Set as the login for the current when2meet
	document.getElementById('name').value = "Todd";

	//var temp = document.getElementById('name');
	//temp.value = myName;

	var scriptNode  = document.createElement('script');
	scriptNode.textContent = "ProcessLogin();"
	document.body.appendChild(scriptNode);

	var log_times = false;

	if (log_times) {
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
		    } \
		}\
		new Ajax.Request('SaveTimes.php', {\
	      method: 'post',\
	      parameters: 'person='+UserID\
	               +'&event=6630870'\
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
});


// function SelectToHere(Time) {
// 	if (IsMouseDown) {
// 	  ToCol = Col[TimeOfSlot.indexOf(Time)];
// 	  ToRow = Row[TimeOfSlot.indexOf(Time)];
// 	  ReColorIndividual();
// 	}
// }
	
// function SelectFromHere(Time) {
//     ChangeToAvailable = (-1 == AvailableAtSlot[TimeOfSlot.indexOf(Time)].indexOf(UserID) );
//     IsMouseDown=true;
//     ToCol = Col[TimeOfSlot.indexOf(Time)];
//     ToRow = Row[TimeOfSlot.indexOf(Time)];
//     FromCol = ToCol;
//     FromRow = ToRow
//     ReColorIndividual();
//  }

function SendUpdates() {
	var TimesToToggle = new Array();
	var binaryAvailability = "";
	for (var i = 0; i < AvailableAtSlot.length; i++){
		var ColA=Col[i];
		var ColB=ColB;
	    var RowA=Row[i];
	    var RowB=RowA;
	    // If person is available at this time
	    if (-1!=AvailableAtSlot[i].indexOf(UserID)) {
	    	TimesToToggle.push(TimeOfSlot[i]);
	    	binaryAvailability += "1";
	    }
	}
	new Ajax.Request("SaveTimes.php", {
      method: "post",
      parameters: "person="+UserID
               +"&event=6630454"
               +"&slots="+TimesToToggle.join(",")
               +"&availability="+binaryAvailability
               +"&ChangeToAvailable="+ChangeToAvailable,
      asynchronous:true,
      onSuccess:function(t) { }
    });
    IsMouseDown=false;
    FromCol=-1; ToCol=-1; FromRow=-1; ToRow=-1;
    ReColorIndividual();
    ReColorGroup();
}


// function SendUpdates() {
//     if (!IsMouseDown) return;
//     var TimesToToggle = new Array();
// 	  var binaryAvailability = "";
//     for (var i=0;i<TimeOfSlot.length;i++) {
// 	if (FromCol<ToCol) { ColA=FromCol; ColB=ToCol; } else { ColA=ToCol; ColB=FromCol; }
//       if (FromRow<ToRow) { RowA=FromRow; RowB=ToRow; } else { RowA=ToRow; RowB=FromRow; }
      
//       var WithinX = ((ColA<=Col[i])&&(Col[i]<=ColB));
//       var WithinY = ((RowA<=Row[i])&&(Row[i]<=RowB));
      
//       if (WithinX && WithinY) {
//         TimesToToggle.push(TimeOfSlot[i]);
//         if (ChangeToAvailable && (-1==AvailableAtSlot[i].indexOf(UserID)))
//           AvailableAtSlot[i].push(UserID);
//         if ((!ChangeToAvailable) && (-1!=AvailableAtSlot[i].indexOf(UserID))) {
//           SplitSpot = AvailableAtSlot[i].indexOf(UserID);
//           AvailableAtSlot[i].splice(SplitSpot,1);
//         }
//       }
//       if (-1!=AvailableAtSlot[i].indexOf(UserID)) {
//           binaryAvailability += "1";
//       } else {
//           binaryAvailability += "0";
//       }
//     }
        
//     new Ajax.Request("SaveTimes.php", {
//       method: "post",
//       parameters: "person="+UserID
//                +"&event=6630454"
//                +"&slots="+TimesToToggle.join(",")
//                +"&availability="+binaryAvailability
//                +"&ChangeToAvailable="+ChangeToAvailable,
//       asynchronous:false,
//       onSuccess:function(t) { 
//      //   alert(t.responseText);
//       }
//     });
    
//     IsMouseDown=false;
//     FromCol=-1; ToCol=-1; FromRow=-1; ToRow=-1;
//     ReColorIndividual();
//     ReColorGroup();
// }

// function SelectFromHere(Time) {
// 	ChangeToAvailable = (-1 == AvailableAtSlot[TimeOfSlot.indexOf(Time)].indexOf(UserID) );
// 	IsMouseDown=true;
// 	ToCol = Col[TimeOfSlot.indexOf(Time)];
// 	ToRow = Row[TimeOfSlot.indexOf(Time)];
// 	FromCol = ToCol;
// 	FromRow = ToRow
// 	ReColorIndividual();
// }





// function SelectToHere(Time) {
// 	if (IsMouseDown) {
// 	  ToCol = Col[TimeOfSlot.indexOf(Time)];
// 	  ToRow = Row[TimeOfSlot.indexOf(Time)];
// 	  ReColorIndividual();
// 	}

// function MouseUp() {
// 	if (WriteMode!="") {
// 	  var HighlightedDates = [];
// 	  for (Row=1;Row<=6;Row++) {
// 	    for (Column=1;Column<=7;Column++) {
// 	      if (((AnchorRow-Row)*(Row-HoverRow)>=0) && ((AnchorColumn-Column)*(Column-HoverColumn)>=0)) {
// 	        HighlightedDates.push(document.getElementById("DateOf-"+Row+"-"+Column).value);
// 	      }
// 	      document.getElementById("Day-"+Row+"-"+Column).style.border='1px solid black';
// 	      document.getElementById("Day-"+Row+"-"+Column).style.padding='2px';
// 	      document.getElementById("Day-"+Row+"-"+Column).style.margin='1px';
// 	    }
// 	  }

// 	  if (WriteMode == "write") {
// 	    AddHighlightedDates(HighlightedDates);
// 	  } else { // WriteMode == "erase"
// 	    RemoveHighlightedDates(HighlightedDates);
// 	  }
// 	}
// 	WriteMode = "";

// 	IsMouseDownDates=false;
// 	IsMouseDownSideLabel=false;
// 	IsMouseDownTopLabel=false;
// }

// function ReColorIndividual() {
//     for (var i=0;i<TimeOfSlot.length;i++) {
//       if (FromCol<ToCol) { ColA=FromCol; ColB=ToCol; } else { ColA=ToCol; ColB=FromCol; }
//       if (FromRow<ToRow) { RowA=FromRow; RowB=ToRow; } else { RowA=ToRow; RowB=FromRow; }
      
//       var WithinX = ((ColA<=Col[i])&&(Col[i]<=ColB));
//       var WithinY = ((RowA<=Row[i])&&(Row[i]<=RowB));

//       if (ChangeToAvailable) NewColor="#339900"; else NewColor="#ffdede";
//       if (WithinX && WithinY && IsMouseDown) {
//           document.getElementById("YouTime"+TimeOfSlot[i]).style.background=NewColor;
//           document.getElementById("YouTime"+TimeOfSlot[i]).style.borderColor=NewColor;
//           if (ColA==Col[i]) document.getElementById("YouTime"+TimeOfSlot[i]).style.borderLeftColor="black";
//           if (ColB==Col[i]) document.getElementById("YouTime"+TimeOfSlot[i]).style.borderRightColor="black";
//           if (RowA==Row[i]) document.getElementById("YouTime"+TimeOfSlot[i]).style.borderTopColor="black";
//           if (RowB==Row[i]) document.getElementById("YouTime"+TimeOfSlot[i]).style.borderBottomColor="black";
//       } else {
//         if (-1 != AvailableAtSlot[i].indexOf(UserID) ) {
//           document.getElementById("YouTime"+TimeOfSlot[i]).style.background="#339900";
//           document.getElementById("YouTime"+TimeOfSlot[i]).style.borderColor="black";          
//         } else {
//           document.getElementById("YouTime"+TimeOfSlot[i]).style.background="#ffdede";
//           document.getElementById("YouTime"+TimeOfSlot[i]).style.borderColor="black";
//         }
//       }
//     }
//   }


