///////////////////////////////////////////////////////////////////////////////////////////////////
//
//        File: tcx.js
//
// Description: Module of functions for handling Garmin's TCX format. The tags handled here
//              are in no way complete.
//
///////////////////////////////////////////////////////////////////////////////////////////////////

var sax = require("sax");

var parseTCXString = function(xmlstr, cb) {

	var parser = sax.parser(true);

	var currentWorkout = {};
	var currentLap = null;
	var currentTrack = [];
	var currentTrackpoint = null;
	var currentHR = false;

	var currentTag = null;

	//END TAG
	parser.onclosetag = function (tagName) {

		if (tagName === "Activity") {

			var datetime = new Date(currentWorkout.title);                
			currentWorkout.title = currentWorkout.type + " - " + datetime.toLocaleDateString();
			currentWorkout.datetime = datetime;
		
			/// Success Callback
			cb(null, currentWorkout);

			currentWorkout = undefined;
		
		} else if (tagName === "Lap") {
			
			currentWorkout.duration += currentLap.duration;
			currentWorkout.distance += currentLap.distance;

			currentWorkout.laps.push(currentLap);
			currentLap = null;
			
		} else if (tagName === "Track") {
			
			currentLap.track = currentTrack;
			currentTrack = null;
			
		} else if (tagName === "Trackpoint") {
			
			if (currentTrackpoint.distance !== -1) {
				currentTrack.push(currentTrackpoint);
			}
			currentTrackpoint = null;
			
		} else if (tagName === "HeartRateBpm") { 	
			currentHR = false;	
		} else {    
			//Unsupported tag 
		}
	}

	//BEGIN TAG
	parser.onopentag = function (tag) {
		if (tag.name === "Activity") {
		
			//Start a new workout
			currentWorkout = {};

			//Workout Type
			var type = tag.attributes['Sport'];
			if (type === "Biking") {
				currentWorkout.type = "Bike";
			} else if (type === "Running") {
				currentWorkout.type = "Run";
			} else {
				currentWorkout.type = "Other";
			}
			
			//Workout ID
			currentWorkout.title = "";           
			currentWorkout.laps = [];
		
			currentWorkout.distance = 0;
			currentWorkout.distanceUnits = "m";
		
			currentWorkout.duration = 0;

		} else if (tag.name === "Lap") {
	
			//Start a new lap
			currentLap = {};
			currentLap.startTime = tag.attributes["StartTime"];
			currentLap.duration = 0;
			currentLap.distance = 0;
			currentLap.track = [];
			currentTrack = undefined;

		} else if (tag.name === "Track") {

			currentTrack = [];

		} else if (tag.name === "Trackpoint") {

			currentTrackpoint = {};
			currentTrackpoint.datetime = null;
			//currentTrackpoint.latitude = null;
			//currentTrackpoint.longitude = null;
			currentTrackpoint.altitude = -1;
			currentTrackpoint.distance = -1;
			currentTrackpoint.speed = -1;

		} else if (tag.name === "HeartRateBpm") {

			currentHR = true;

		} else {  
		
			if (currentLap && !currentTrack) {
			
				if (tag.name === "TotalTimeSeconds") {
				
					var lapDuration = parseFloat(tag.text);
					if (!isNaN(lapDuration))
						currentLap.duration += parseFloat(tag.text);
				}
			}
		}
		currentTag = tag;
	}   

	parser.ontext = function (text) {
		if (currentTag) {
			if (currentTag.name === "Id") { 
				if (!currentWorkout.title)
					currentWorkout.title = text;
			}
			if (currentTrack) {
				if (currentTrackpoint) {
				
					//
					// GARMIN CONNECT TCX FILES
					//
			
					if (currentTag.name === "Time") {
						if (!currentTrackpoint.datetime)
							currentTrackpoint.datetime = new Date(text);
					
					} else if (currentTag.name === "LatitudeDegrees") {
					
						if (!currentTrackpoint.latitude)
							if (!isNaN(parseFloat(text)))
								currentTrackpoint.latitude = parseFloat(text);
								
					} else if (currentTag.name === "LongitudeDegrees") {
					
						if (!currentTrackpoint.longitude)
							if (!isNaN(parseFloat(text)))
								currentTrackpoint.longitude = parseFloat(text);
								
					} else if (currentTag.name === "DistanceMeters") {
					
						if (currentTrackpoint.distance === -1)
							if (!isNaN(parseFloat(text)))
								currentTrackpoint.distance = parseFloat(text);
								
					} else if (currentTag.name === "AltitudeMeters") {
					
						if (currentTrackpoint.altitude === -1)
							if (!isNaN(parseFloat(text)))
								currentTrackpoint.altitude = parseFloat(text);
								
					} else if (currentTag.name === "ns3:Speed" || 
							   currentTag.name === "Speed") {
							   
						if (currentTrackpoint.speed === -1)
							if (!isNaN(parseFloat(text)))
								currentTrackpoint.speed = parseFloat(text);
					 
				
					//
					// POWERTAP FILES
					//
				
					} else if (currentTag.name === "Watts") {
					
						if (!currentTrackpoint.power)
							if (!isNaN(parseInt(text)))
								currentTrackpoint.power = parseInt(text);
								
					} else if (currentTag.name === "Cadence") {
					
						if (!currentTrackpoint.cadence)
							if (!isNaN(parseFloat(text)))
								currentTrackpoint.cadence = parseFloat(text);
								
					} else if (currentTag.name === "SpeedKph") {
					
						//Speed in Kph is converted to m/s
						var KphToMps = function(kph) { return 0.277777778*kph; };
						if (!currentTrackpoint.speed)
							if (!isNaN(parseFloat(text)))
								currentTrackpoint.speed = KphToMps(parseFloat(text));
								
					} else if (currentHR && currentTag.name === "Value") {
					
						if (!currentTrackpoint.hr)
							if (!isNaN(parseInt(text)))
								currentTrackpoint.hr = parseInt(text);
					} else {
						//Within Trackpoint: unsupported tag
					}
				}
				
			} else if (currentLap && !currentTrack) {
			
				if (currentTag.name === "TotalTimeSeconds") {
					var lapDuration = parseFloat(text);
					if (!isNaN(lapDuration))
						currentLap.duration += lapDuration;
				}
			
				if (currentTag.name === "DistanceMeters") {
					var lapDistance = parseFloat(text);
					if (!isNaN(lapDistance)) {
						currentLap.distance += lapDistance;
					}
				}
			} else {
				//unsupported tag
			}
		}
	}

	parser.onend = function () {
		//END    
	}

	parser.write(xmlstr).end();
};
    
exports.parseTCXString = parseTCXString;
