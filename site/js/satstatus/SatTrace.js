function SatTrace(id) {
	
	/*
	 * Initilize with satellite ID or path. Issues an XMLHttpRequest to get the
	 * current associated TLE. Handler method generates satrec and proceeds with
	 * remainder of setup (SatPoint array population, etc.).
	 * 
	 * Expect initial timestamp as constructor argument, or implicitly use now?
	 */
	
	
	/*
	 * SatTrace.setup
	 * 
	 * Invoked as onload handler for TLE request dispatched by SatTrace.prep.
	 */
	 
	 
	 /*
	  * Parameters:
	  *   tleText, content of TLE file for this SatTrace.
	  */
	this.setup = function(tleText) {
		this.tleText = tleText;
		this.tleLines = this.tleText.split("\n");
		this.satrec = satellite.twoline2satrec(this.tleLines[0], this.tleLines[1]);
		
		// do other SatTrace initialization now that we have this.satrec.
		// for instance, create and populate an array of SatPoints.
		// Should we select initial time now, or go with something specified
		// at constructor time?
	}
	
	/*
	 * SatTrace.prep
	 * 
	 * Parameters:
	 *   id, satellite id (used to determine path to associated TLE file)
	 * 
	 * Results:
	 *   Dispatches an XMLHttpRequest to load the TLE file.
	 *   Invokes .setup onload.
	 */
	this.prep = function(id) {
		
		var request = new XMLHttpRequest();
		request.onload = (function(context) {
			return function(e) {
				// "this" is the XMLHttpRequest; e is ProgressEvent (e.target
				// is the XMLHttpRequest), and context is the parent SatTrace.
				context.setup(this.responseText);
			};
		})(this);
		
		// The request will GET the TLE file at id (a path).
		request.open('GET', id);
		
		// The TLE file is expected to be plain text.
		request.overrideMimeType('text/plain');
		
		// Dispatch the request.
		request.send();
	}
	
	this.prep(id);
}
