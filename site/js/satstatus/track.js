
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
	this.timestamp = timestamp;
}

function SatelliteTrace(tle) {
	if (typeof(tle) === 'undefined') {
		tle = "1 25544U 98067A   13181.93746528  .00008251  00000-0  14965-3 0   959\n2 25544  51.6493  40.1834 0008920 113.3890  83.5804 15.50498371836833";
	}
	this.tle = tle;
	this.tleLines = this.tle.split("\n");
	this.satRec = satellite.twoline2satrec(this.tleLines[0], this.tleLines[1]);
	
	// populate initial point set
	this.points = new Array;
	
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
		if (this.points.length == 3) {
			// (don't start dropping points until we've got a couple)
			this.points.shift();
		}
		this.points.push(position_ecf);
		
		log(position_ecf);
		// consider stashing timestamp along with coordinates in "points" array
		// to facilitate actual path-age visualization (vs relative based on id)
	}
	
	// updateHandler is specifically an event handler, whereas update could be called directly.
	this.updateHandler = function(event) {
		// issue is that in an event handler, "this" refers to event, rather than method's parent object...
		this.update(event.timestamp);
	}
	
	// appending .bind(this) to the event handler function overrides any event-based "this" definition
	window.addEventListener("updateOrbit", this.updateHandler.bind(this), false);
}

// when invoked, this function will trigger a timestamped "updateOrbit" event
// that all SatelliteTrace objects will respond to (by running their update() method)
function periodicUpdateFunc() {
	var timestamp = new Date;
	var timestampedEvent = new CustomEvent("updateOrbit", {"timestamp": timestamp});
	window.dispatchEvent(timestampedEvent);
}

//init();

function init() {
	
	// to convert arbitrary date or julian date to minutes from epoch:
	// var j = jday(year, month, day, hour, minute, second);
	// var m = (j - satrec.jdsatepoch) * minutes_per_day;
	
	var tle = "1 25544U 98067A   13181.93746528  .00008251  00000-0  14965-3 0   959\n2 25544  51.6493  40.1834 0008920 113.3890  83.5804 15.50498371836833";
	
	var tle1 = "1 25544U 98067A   13181.93746528  .00008251  00000-0  14965-3 0   959";
	var tle2 = "2 25544  51.6493  40.1834 0008920 113.3890  83.5804 15.50498371836833";
	var sr = satellite.twoline2satrec(tle1, tle2);
		
	var pv_eci, gmst, p_ecf;
	for (var offset = 0; offset < 30; offset += 1) {
		
		pv = satellite.sgp4(sr, 0 - offset);
		log(pv[0]);
		
		// jdsatepoch is fractional days; gmst must be minutes.
		// so we convert days to minutes and subtract the minute offset.
		gmst = (sr.jdsatepoch * 1440) - offset;
		p_ecf = satellite.eci_to_ecf(pv[0], gmst);
		log(p_ecf);
		log(gmst);
	}
}

// Append a paragraph containing txt to the log-container div.
function log(txt) {
	var d = document.getElementById('log-container');
	var p = document.createElement('p');
	var t = document.createTextNode(txt);
	p.appendChild(t);
	d.appendChild(p);
}
