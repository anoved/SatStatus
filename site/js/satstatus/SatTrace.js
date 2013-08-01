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
	 *   object based on TLE data. Will [re]populate SatPoint array. (Note that
	 *   array population should behave correctly if the array already exists -
	 *   so that this method may safely be called to update existing SatTraces.)
	 */
	this.setup = function(tleText) {
		
		
		this.tleText = tleText;
		this.tleLines = this.tleText.split("\n", 2);
		this.satrec = satellite.twoline2satrec(this.tleLines[0], this.tleLines[1]);
		
		var backdate = new Date(this.referenceDate.getTime() - 5400000);
		this.updateTrace(this.referenceDate, backdate);
		this.updateDisplay();
	
		window.addEventListener("updateDisplay", this.updateHandler.bind(this), false);
		window.dispatchEvent(new CustomEvent("renderEvent"));
	}
	
	
	this.updateTrace = function(newDate, lastDate) {
		
		// use the date of the most recent point in the array if no explicit lastDate
		if (lastDate === undefined) {
			if (this.points.length == 0) {
				// throw an error - no explicit lastDate and none implicit
			}
			lastDate = this.points[this.points.length - 1].date;
		}
		
		var period = newDate.getTime() - lastDate.getTime();
		
		var interval = 60000;
		
		var limit = this.pointCount;
		
		var newPointCount = Math.min(Math.ceil(period/interval), limit);
		
		// add newDate last, as well as pointCount points every interval ms before
		for (var i = newPointCount - 1; i >= 0; i--) {
			
			var pointDate = new Date(newDate.getTime() - (i * interval));
			
			var newSatPoint = new SatPoint(this.satrec, pointDate);
			
			var previousIndex = this.points.length - 1;
			var previousPoint = (previousIndex >= 0 ? this.points[previousIndex] : undefined);
			
			newSatPoint.updateGeometry(this.scene, previousPoint);
			
			this.points.push(newSatPoint);
			
			if (this.points.length > limit) {
				var disposed = this.points.shift();
				disposed.sp3d.concealGeometry(this.scene)
			}
		}
	}
	
	/*
	 * SatTrace.updateHandler
	 * 
	 * Parameter:
	 *   updateEvent is a CustomEvent with a Date object as the time detail.
	 * 
	 * Results:
	 *   Caches event date as SatTrace reference date.
	 *   Invokes .updateDisplay() to update trace display based on points.
	 * 
	 */
	this.updateHandler = function(updateEvent) {
		this.referenceDate = updateEvent.detail.time;
		this.updateTrace(this.referenceDate);
		this.updateDisplay();
	}
	
	/*
	 * SatTrace.updateDisplay
	 * 
	 * Update the trace displays based on current contents of SatPoint array
	 * and the current referenceDate. 
	 * 
	 */
	this.updateDisplay = function() {
		
		// what if points could just respond to an eg updateStyle event?
		// update all the point styles
		for (var i = 0; i < this.points.length; i++) {
			this.points[i].updateStyle(this.referenceDate);
		}
	}
	
	// an array of SatPoints representing the path of this SatTrace
	this.points = [];
		
	// the number of points to maintain in the points array.
	this.pointCount = 90;
	
	this.scene = scene;
	this.id = id;
	this.referenceDate = initialDate || new Date;
	this.load(id);
}
