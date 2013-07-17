

// loads the satellite described by the TLE file at path
// when loaded, creates an associated SatelliteTrace object.
function setupSatellite(path) {
	var req = new XMLHttpRequest();
	req.onload = function() {
		var sat = new SatelliteTrace(this.responseText);
	};
	req.open('GET', path);
	req.overrideMimeType('text/plain');
	req.send();
}

// consider populating the .points array of SatelliteTrace with objects with
// labeled member properties, rather than just pushing the arrays on.
// This approach also offers a solution to how to store display geometry info:
// as another member of this object. (For best performance, I'm thinking there
// ought to be a way to "shift/push" points onto a Three.js line, just like an
// array operation - rather than recreating the whole orbit path each frame.)
function TracePoint() {
	
	// ECF coordinates of this point
	this.x = loc[0];
	this.y = loc[1];
	this.z = loc[2];
	
	// timestamp of this point (Julian, unix, minutes from epoch?)
	this.time = time;
}


/*
 * SatelliteTrace
 * 
 * This constructor defines a draft object intended to manage orbit information
 * about a single satellite. It is initialized with a two-line element set (TLE)
 * representing the satellite's last known location and velocity. Its primary
 * member is an array containing the satellite's coordinates at a sequence of
 * points in time (see TracePoint above for prospective details). This array
 * informs the rendering of the satellite's path on the displays (possibly
 * utilizing additional geometry information stored in the TracePoint object).
 * Elements are added to the array with the .update method, which accepts a Date
 * argument specificing the time of the point to calculate (defaults to "now").
 * (Logically, the update timestamp should always be later than any in array.)
 * Each instance of the object is configured to run its update method in
 * response to 'updateOrbit' events, which are assumed to have a .time
 * member. This event handler mechanism allows multiple SatelliteTrace objects
 * to be updated by dispatching a single 'updateOrbit' event.
 */
function SatelliteTrace(tle) {
	if (typeof(tle) === 'undefined') {
		tle = "1 25544U 98067A   13181.93746528  .00008251  00000-0  14965-3 0   959\n2 25544  51.6493  40.1834 0008920 113.3890  83.5804 15.50498371836833";
	}
	this.tle = tle;
	this.tleLines = this.tle.split("\n");
	this.satRec = satellite.twoline2satrec(this.tleLines[0], this.tleLines[1]);
	
	// populate initial point set
	this.points = new Array;
	
	this.populate = function() {
		
		var now = new Date;
		
		// m is minutes - basically two orbits, ending now
		for (var m = 180; m >= 0; m -= 2) {
			
			// minute offset in milliseconds
			var ms = m * 60000;
			
			var date = new Date(now.getTime() - ms);
			
		var y = date.getUTCFullYear();
		var mo = date.getUTCMonth();
		var d = date.getUTCDate();
		var h = date.getUTCHours();
		var mi = date.getUTCMinutes();
		var s = date.getUTCSeconds();
					
			var pv_eci = satellite.propagate(this.satRec, y, mo, d, h, mi, s);
			var sidereal = satellite.gstime_from_date(y, mo, d, h, mi, s);
			var p_ecf = satellite.eci_to_ecf(pv_eci[0], sidereal);
			this.points.push(p_ecf);
			log(p_ecf);
		}
	}
	
	// this method shifts an old point out and pushes a new one on.
	this.update = function(date) {
		
		// default to update "now"
		if (typeof(date) === 'undefined') {
			date = new Date;
		}
		
		// convert timestamp to y mo d h mi s format for propagate()
		var y = date.getUTCFullYear();
		var mo = date.getUTCMonth();
		var d = date.getUTCDate();
		var h = date.getUTCHours();
		var mi = date.getUTCMinutes();
		var s = date.getUTCSeconds();
		
		var position_velocity_eci = satellite.propagate(this.satRec, y, mo, d, h, mi, s);
		
		// convert inertial to fixed coordinates, based on sidereal time
		var gmst = satellite.gstime_from_date(y, mo, d, h, mi, s);
		var position_ecf = satellite.eci_to_ecf(position_velocity_eci[0], gmst);
		
		// drop the oldest point and add this one
		//if (this.points.length == 3) {
			// (don't start dropping points until we've got a couple)
		//	this.points.shift();
		//}
		this.points.push(position_ecf);
		
		log(position_ecf);
		// consider stashing timestamp along with coordinates in "points" array
		// to facilitate actual path-age visualization (vs relative based on id)
	}
	
	// updateHandler is specifically an event handler, whereas update could be called directly.
	this.updateHandler = function(event) {
		this.update(event.detail.time);
	}
	
	// appending .bind(this) to the event handler function overrides any event-based "this" definition
	window.addEventListener("updateOrbit", this.updateHandler.bind(this), false);
	this.populate();
}

// when invoked, this function will trigger a timestamped "updateOrbit" event
// that all SatelliteTrace objects will respond to (by running their update() method)
// Run it periodically with something like window.setInterval(periodicUpdateFunc, 1000);
// Note: using 'time' for member name to avoid confusion with native .timeStamp
// member, whose resolution appears to vary among browsers tested.
function periodicUpdateFunc() {
	var nowTime = new Date;
	var timestampedEvent = new CustomEvent("updateOrbit", {"detail": {"time": nowTime}});
	window.dispatchEvent(timestampedEvent);
}

// Append a paragraph containing txt to the log-container div.
function log(txt) {
	var d = document.getElementById('log-container');
	var p = document.createElement('p');
	var t = document.createTextNode(txt);
	p.appendChild(t);
	d.appendChild(p);
}

//window.setInterval(periodicUpdateFunc, 3000);
setupSatellite('tle/test.tle');
