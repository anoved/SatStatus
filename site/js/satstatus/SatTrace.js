function SatTrace(scene, id, initialDate) { 
	
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
	 */
	this.updateTrace = function() {
		
		// calculate millisecond period between current referenceTime and last.
		var referenceTime = this.referenceDate.getTime();
		if (this.points.length == 0) {
			// initialization - start 90 minutes before initial reference date
			precedingTime = referenceTime - 5400000;
		} else {
			precedingTime = this.points[this.points.length - 1].unixTime;
		}
		var period = referenceTime - precedingTime;
		
		// number of new points to add to trace - between 1 and this.limit
		var pointCount = Math.min(Math.ceil(period/this.interval), this.limit);
		
		// add new points to trace, starting w/oldest and ending w/referenceDate.
		for (var i = pointCount - 1; i >= 0; i--) {
			
			// calculate date and position of new point
			var newTime = referenceTime - (i * this.interval);
			var newDate = new Date(newTime);
			var newPoint = new SatPoint(this.satrec, newDate);
			
			// undefined previousPoint case occurs only at initialization
			var previousIndex = this.points.length - 1;
			var previousPoint = (previousIndex >= 0 ? this.points[previousIndex] : undefined);
			
			newPoint.updateGeometry(this.scene, previousPoint);
			this.points.push(newPoint);
			
			// if queue is full, remove old points from scene and array
			if (this.points.length > this.limit) {
				var disposed = this.points.shift();
				disposed.sp3d.concealGeometry(this.scene)
			}
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
		for (var i = 0; i < this.points.length; i++) {
			this.points[i].updateStyle(this.referenceDate);
		}
	}
	
	// maximum number of points in trace array
	this.limit = 90;
	
	// maximum millisecond interval between points
	this.interval = 60000;
	
	this.points = [];
	this.scene = scene;
	this.id = id;
	this.referenceDate = initialDate || new Date;
	this.load(id);
}
