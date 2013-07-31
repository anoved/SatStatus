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
		
		
		// populate initial point array with minutes preceding initial reference date
		var startMilliseconds = this.referenceDate.getTime();
		for(var i = this.pointCount - 1; i >= 0; i--) {
			var date = new Date(startMilliseconds - (i * 60000));
			var sp = new SatPoint(date);
			this.points.push(sp);
			
			// should have a method that accepts a date parameter
			// which creates a satpoint; renders it; pushes it on points[],
			// and shifts something off points if necessary.
			
			// likewise, a higher-level method that accepts a date,
			// and interpolates number of dates needed between last and that,
			
			
			
		}
		
		// initialize trace display
		for(var i = 1; i < this.points.length; i++) {
			this.points[i].updateStyle(this.referenceDate);
		}
		
		window.addEventListener("updateDisplay", this.updateHandler.bind(this), false);
		window.dispatchEvent(new CustomEvent("renderEvent"));
	}
	
	
	this.updateTrace = function(newDate, lastDate) {
		
		// use the date of the most recent point in the array if no explicit lastDate
		if (lastDate === undefined) {
			// breaks if this.points.length == 0
			lastDate = this.points[this.points.length - 1].date;
		}
		
		/*
			
			var period = newDate - lastDate;
			
			// interval is the maximum period allowed between points
			var points = Math.ceil(period / interval);
			
			// limit number of points to add to the max queue length
			if (points > limit) {
				points = limit;
			}
			
			for (var i = points - 1; i >= 0; i--) {
				
				// pointDate == newDate for last point (i == 0)
				var pointDate = newDate - (i * interval);
				
				var newSatPoint = new SatPoint(pointDate);
				
				// render new point using reference to preceding point
				var previousPoint = this.points[this.points.length - 1];
				// or if this.points.length == 0, previousPoint = undefined
				newSatPoint.updateGeometry(this.scene, previousPoint);
				
				this.points.push(newSatPoint);
				
				if (this.points.length > limit) {
					this.points.shift();
				}
				
			}
		*/
	
	}
	
	/*
	 * SatTrace.updateHandler
	 * 
	 * Parameter:
	 *   updateEvent is a CustomEvent with a Date object as the time detail.
	 * 
	 * Results:
	 *   Caches event date as SatTrace reference date.
	 *   Invokes .updateOldestPoint() to replace old point with new point.
	 *   Invokes .updateDisplay() to update trace display based on points.
	 * 
	 */
	this.updateHandler = function(updateEvent) {
		this.referenceDate = updateEvent.detail.time;
		this.updateOldestPoint();
		this.updateDisplay();
	}
	
	/*
	 * SatTrace.updateOldestPoint
	 * 
	 * Updates the oldestPoint, using updatePoint, to current referenceDate.
	 * 
	 * Parameters:
	 *   updateDate, optional explicit date for position update
	 *     (default is this.referenceDate)
	 * 
	 * Results:
	 *   invokes SatTrace.updatePoint() on oldest point
	 *   oldestPoint property is updated.
	 * 
	 * Returns:
	 *   the updated SatPoint
	 */
	this.updateOldestPoint = function(updateDate) {
		
		var date = updateDate || this.referenceDate;
		
		var point = this.updatePoint(this.oldestPoint, date);
		
		// update oldestPoint property to point at what is now the oldest point.
		if (this.oldestPoint + 1 < this.pointCount) {
			this.oldestPoint++;
		} else {
			this.oldestPoint = 0;
		}
		
		return point;
	}
	
	/*
	 * SatTrace.updatePoint
	 * 
	 * Updates specified point to position at current referenceDate.
	 * 
	 * Parameters:
	 *   index of point to update
	 *   updateDate, optional explicit date for position update.
	 *     (default is this.referenceDate)
	 * 
	 * Results:
	 *   if this.points[index] exists, updates with .update() method
	 *   if this.points[index] is undefined, assigns new SatPoint().
	 * 
	 * Returns:
	 *   the updated SatPoint
	 */
	this.updatePoint = function(index, updateDate) {
		
		var date = updateDate || this.referenceDate;
		
		// reuse existing SatPoint objects rather than repeated delete/create.
		if (typeof(this.points[index]) === 'undefined') {
			this.points[index] = new SatPoint(this.satrec, date);
		} else {
			try {
				this.points[index].update(this.satrec, date);
			} catch (e) {
				console.log(e);
			}
		}	
		return this.points[index];
	}
	
	/*
	 * SatTrace.updateDisplay
	 * 
	 * Update the trace displays based on current contents of SatPoint array
	 * and the current referenceDate. (Updates display geometry and styles.) 
	 * 
	 */
	this.updateDisplay = function() {

		// hide the oldest point
		this.points[this.oldestPoint].updateGeometry(this.scene, undefined);
		
		// update geometry of newest point
		var newestIndex = (this.oldestPoint == 0 ? this.points.length - 1 : this.oldestPoint - 1);
		var previousIndex = (newestIndex == 0 ? this.points.length - 1 : newestIndex - 1);
		this.points[newestIndex].updateGeometry(this.scene, this.points[previousIndex]);
		
		// update all the point styles
		for (var i = 0; i < this.points.length; i++) {
			this.points[i].updateStyle(this.referenceDate);
		}
	}
	
	// an array of SatPoints representing the path of this SatTrace
	this.points = [];
	
	// the index of the oldest point in the points array. On trace update,
	// the oldest point is updated in place rather than shifting array.
	this.oldestPoint = 0;
	
	// the number of points to maintain in the points array. at present,
	// modifying this value will not necessarily have intended results -
	// increasing it should effectively insert a span of empty elements after
	// oldestPoint, so that they can be populated on next update without losing
	// old points. Likewise, decreasing pointCount should delete oldest x
	// elements, ending with current oldestPoint. So, use methods to help with
	// these adjustments rather than modifying pointCount directly.
	this.pointCount = 90;
	
	this.scene = scene;
	this.id = id;
	this.referenceDate = initialDate || new Date;
	this.load(id);
}
