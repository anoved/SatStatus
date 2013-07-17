function SatTrace(id) { 
	 
	/*
	 * SatTrace.load
	 * 
	 * Loads a TLE file, and registers this object's .setup() method to be
	 * invoked when the file contents are available. Used by constructor; may
	 * also be invoked on an existing SatTrace object to reload TLE data.
	 * 
	 * Parameters:
	 *   id, used to determine path to associated TLE file
	 *       (defaults to this SatTrace object's .id property)
	 * 
	 * Returns:
	 *   XMLHttpRequest object
	 * 
	 * Results:
	 *   Dispatches an XMLHttpRequest to load the TLE file.
	 *   Invokes .setup() onload.
	 */
	this.load = function(id) {
		
		var satId = id || this.id;
		
		var request = new XMLHttpRequest();
		
		// Pass the loaded TLE file data to this object's setup method.
		request.onload = (function(context) {
			return function(e) {
				// "this" is the XMLHttpRequest; e is ProgressEvent (e.target
				// is the XMLHttpRequest), and context is the parent SatTrace.
				context.setup(this.responseText);
			};
		})(this);
		
		// The request will GET the TLE file associated with satId.
		request.open('GET', satId);
		
		// The TLE file is expected to be plain text.
		request.overrideMimeType('text/plain');
		
		// Dispatch the request.
		request.send();
		
		return request;
	}
	this.id = id;
	this.load(id);
	
	/*
	 * SatTrace.setup
	 * 
	 * Parameters:
	 *   tleText, content of TLE file for this SatTrace.
	 * 
	 * Results:
	 *   caches TLE data in SatTrace member properties. Generates SGP4 satrec
	 *   object based on TLE data. Will [re]populate SatPoint array. (Note that
	 *   array population should behave correctly if the array already exists -
	 *   so that this method may safely be called to update existing SatTraces.)
	 */
	this.setup = function(tleText) {
		this.tleText = tleText;
		this.tleLines = this.tleText.split("\n", 2);
		this.satrec = satellite.twoline2satrec(this.tleLines[0], this.tleLines[1]);
		
		// assuming no points array yet
		this.points = [];
		
		// all points arrays should be maintained to a constant size,
		// with points representing position every few minutes.
		// ideally, the size of these arrays should be reconfigurable on the
		// fly, to allow traces to be grown or shrunk in accordance with user preference.
		
		var now = new Date;
		var nowMs = now.getTime();
		//60000 ms per minute
		
		for(var i = 90; i > 0; i--) {
			var offset = i * 60000;
			var timems = nowMs - offset;
			var timedate = new Date(timems);
			var point = new SatPoint(this.satrec, timedate);
			this.points.push(point);
		}
		
	}
}
