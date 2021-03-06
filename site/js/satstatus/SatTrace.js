function SatTrace(scene, id, initialDate, color) { 
	
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
		
		// loadHandler passes the TLE data returned by request to .setup().
		request.onload = this.loadHandler.bind(this);
		
		// The request will GET the TLE file associated with satId.
		request.open('GET', satId);
		
		// The TLE file is expected to be plain text.
		request.overrideMimeType('text/plain');
		
		// Dispatch the request.
		request.send();
		
		return request;
	}
	
	/*
	 * SatTrace.loadHandler
	 * 
	 * Parameters:
	 *   onloadEvent is a ProgressEvent whose .target member is the controlling
	 *     XMLHttpRequest created by the .load() method.
	 * 
	 * Result:
	 *   passes content returned by XMLHttpRequest to the .setup() method.
	 */
	this.loadHandler = function(onloadEvent) {
		this.setup(onloadEvent.target.responseText);
	}
	
	/*
	 * SatTrace.setup
	 * 
	 * Parameters:
	 *   tleText, content of TLE file for this SatTrace.
	 * 
	 * Results:
	 *   caches TLE data in SatTrace member properties. Generates SGP4 satrec
	 *   object based on TLE data. Populates initial SatPoint array.
	 */
	this.setup = function(tleText) {
		
		this.tleText = tleText;
		this.tleLines = this.tleText.split("\n", 2);
		this.satrec = satellite.twoline2satrec(this.tleLines[0], this.tleLines[1]);
		
		this.updateTrace();
		this.updateDisplay();
		
		window.addEventListener("updateDisplay", this.updateHandler.bind(this), false);
	}
	
	/*
	 * SatTrace.updateHandler
	 * 
	 * Parameter:
	 *   updateEvent is a CustomEvent with a Date object as the time detail.
	 * 
	 * Results:
	 *   Caches event date as SatTrace reference date.
	 *   Updates SatPoint trace array to current reference date.
	 *   Invokes .updateDisplay() to update trace display.
	 * 
	 */
	this.updateHandler = function(updateEvent) {
		this.referenceDate = updateEvent.detail.time;
		this.updateTrace();
		this.updateDisplay();
	}
	
	/*
	 * SatTrace.updateTrace
	 * 
	 * Populates SatPoint array with as many new points as necessary to extend
	 * trace to the current referenceDate. If the SatPoint array is empty,
	 * populates it with points representing a period before initial date.
	 * 
	 * Returns:
	 *   [pointCount, period], tuple representing number of points added to the
	 *   trace, over given period in milliseconds since last update (or max)
	 *  
	 */
	this.updateTrace = function() {
		
		var suppress = false;
		
		// calculate millisecond period between current referenceTime and last.
		var referenceTime = this.referenceDate.getTime();
		if (this.points.length == 0) {
			precedingTime = referenceTime - TraceUtils.maximumTraceAge;
			suppress = true;
		} else {
			precedingTime = this.points[this.points.length - 1].unixTime;
		}
		
		// we are requesting an update to cover the period from preceding to reference
		var period = referenceTime - precedingTime;
		
		// clip requested period to maximum to prevent excessive/unnecessary updates
		if (period > TraceUtils.maximumTraceAge) {
			period = TraceUtils.maximumTraceAge;
			suppress = true;
		}
		
		// number of new points needed to extend trace to cover update period 
		var pointCount = Math.ceil(period/TraceUtils.maximumInterval);
		
		// add new points to trace, starting w/oldest and ending w/referenceDate.
		for (var i = pointCount - 1; i >= 0; i--) {
			
			// calculate date and position of new point
			var newTime = referenceTime - (i * TraceUtils.maximumInterval);
			var newDate = new Date(newTime);
			var newPoint = new SatPoint(this.satrec, newDate, this.scene, this.color);
			
			if (suppress) {
				// suppressed points are not drawn connected to any previous
				// points; either 1st in trace, or 1st after long update delay
				var previousPoint = undefined;
				suppress = false;
			} else {
				// normally, points are drawn connected to previous trace point
				var previousPoint = this.points[this.points.length - 1];
			}
			
			// display the new point and add it to the trace array
			newPoint.draw(previousPoint, this.color);
			this.points.push(newPoint);
			
			// remove any old points from trace
			this.trimTrace();
		}
		
		return [pointCount, period];
	}
	
	/*
	 * SatTrace.trimTrace
	 * 
	 * Results:
	 *   shifts old points off this.points queue until the oldest point is
	 *   within TraceUtils.maximumTraceAge milliseconds of this.referenceDate.
	 */
	this.trimTrace = function() {
		var latestTime = this.referenceDate.getTime();
		while (latestTime - this.points[0].unixTime > TraceUtils.maximumTraceAge) {
			var stalePoint = this.points.shift();
			stalePoint.erase();
		}
	}
	
	/*
	 * SatTrace.updateDisplay
	 * 
	 * Update the trace displays based on current contents of SatPoint array
	 * and the current referenceDate. Consider event-based style updating. 
	 * 
	 */
	this.updateDisplay = function() {
		var referenceTime = this.referenceDate.getTime();
		for (var i = 0; i < this.points.length; i++) {
			var age = referenceTime - this.points[i].unixTime;
			this.points[i].restyle(TraceUtils.ageFactor(age));
		}
	}
	
	this.color = color;
	this.points = [];
	this.scene = scene;
	this.id = id;
	this.referenceDate = initialDate || new Date;
	this.load(id);
}

var TraceUtils = {
	
	/*
	 * Maximum allowable interval between trace points, in milliseconds.
	 * If a period greater than this interval elapses between trace updates,
	 * additional trace points are automatically interpolated before update.
	 * 
	 * (60000 milliseconds = 1 minute)
	 */
	maximumInterval: 60000,
	
	/*
	 * Maximum age of trace (time elapsed between oldest and newest points),
	 * in milliseconds. Ideally, traces should be maintained *at* this length.
	 * 
	 * (5400000 milliseconds = 90 minutes)
	 */
	maximumTraceAge: 5400000,
	
	/*
	 * Returns:
	 *   value between 0 and 1, where 1 represents "new" and 0 represents "old"
	 *   (0 may be returned for any age parameter over a maximum threshold)
	 */
	ageFactor: function(age) {
		// need to clip age if > max to prevent weird negative results
		return 1 - (age / this.maximumTraceAge);
	}
};
