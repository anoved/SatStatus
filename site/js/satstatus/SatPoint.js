/*
 * SatPoint constructor
 *
 * Input:
 *   satrec, satellite.js object
 *   date, Javascript date 
 *   scene is the 3d display context for this point
 */
function SatPoint(satrec, date, scene) {
	
	/*
	 * SatPoint.update
	 * 
	 * Updates underlying display-independent timestamps and coordinates.
	 * 
	 * Parameters:
	 *   satrec is the satellite object to use for calculations
	 *   date is the timestamp for this update
	 * 
	 * Results:
	 *   timestamp and coordinate members are updated.
	 * 
	 */
	this.update = function(satrec, date) {
		
		// Dates
		
		// Unix timestamp (milliseconds since unix epoch)
		this.unixTime = date.getTime();
		
		// Julian date (milliseconds since unix epoch divided by ms/day yields
		// days since unix epoch; plus difference between Julian and unix epoch)
		this.julianDate = (this.unixTime / 86400000.0) + 2440587.5;
		
		// Sidereal time
		this.siderealTime = satellite.gstime_from_jday(this.julianDate);
		
		// Minutes from sat epoch (days from sat epoch times minutes per day)
		this.minutesFromEpoch = (this.julianDate - satrec.jdsatepoch) * 1440.0;
		
		// Coordinates
		
		// SGP4 result array [position, velocity] in ECI km and ECI km/s
		this.pos_vel = satellite.sgp4(satrec, this.minutesFromEpoch);
		
		// Earth Centered Inertial coordinate vector (km)	
		this.eci = this.pos_vel[0];
		
		// Earth Centered Fixed coordinate vector (km)
		this.ecf = satellite.eci_to_ecf(this.eci, this.siderealTime);
		
		// Geodetic coordinate vector radians [lng rad, lat rad, alt km]
		this.geo_rad = satellite.eci_to_geodetic(this.eci, this.siderealTime);
		
		// Geodetic coordinate vector degrees [lng deg, lat deg, alt km]
		this.geo = [satellite.degrees_long(this.geo_rad[0]), satellite.degrees_lat(this.geo_rad[1]), this.geo_rad[2]];
		
		// Update display-specific coordinates (100 km per 1 unit).
		this.sp3d.updateVector(SceneUtils.ecfToDisplayCoordinates(this.ecf));
		
	}
	
	this.draw = function(previousPoint) {
		this.sp3d.draw(previousPoint);
	}
	
	this.erase = function() {
		this.sp3d.erase();
	}
	
	this.restyle = function(referenceDate) {
		this.sp3d.restyle(referenceDate);
	}
	
	this.sp3d = new SatPoint3d(this, scene);
	this.update(satrec, date);
}

/*
 * SatPoint3d constructor
 * 
 * Parameter:
 *   parent SatPoint object reference
 *   scene is the 3d display context for this point
 */
function SatPoint3d(parent, scene) {
	
	// coordinates of this point in 3d display coordinate system
	this.xyz = undefined;
	
	// line segment representing satellite path from previous to this point
	this.pathLine = undefined;
	
	// the parent SatPoint object
	this.parent = parent;
	
	// the Three.js scene in which this point will appear
	this.scene = scene;
	
	/*
	 * SatPoint3d.update
	 * 
	 * Parameters:
	 *   new x, y, and z coordinates in 3d display coordinate system
	 * 
	 * Returns:
	 *   newly created or updated this.xyz (a Vector3 object)
	 * 
	 * Results:
	 *   If .xyz member is undefined, create as new Vector3 with x, y, z.
	 *   Otherwise updates .xyz Vector3 with new coordinates.
	 * 
	 */
	this.update = function(x, y, z) {
		if (this.xyz === undefined) {
			this.xyz = new THREE.Vector3(x, y, z);
		} else {
			this.xyz.set(x, y, z);
		}
		return this.xyz;
	}
	
	/*
	 * SatPoint3d.updateVector
	 * 
	 * Parameters:
	 *   xyzVector is a three-element array containing x, y, and z coordinates
	 * 
	 * Returns:
	 *   newly created or updated this.xyz (a Vector3 object)
	 * 
	 * Results:
	 *   invokes this.update with x, y, and z vector coords (elements 0, 1, 2)
	 * s
	 */
	this.updateVector = function(xyzVector) {
		return this.update(xyzVector[0], xyzVector[1], xyzVector[2]);
	}
	
	/*
	 * SatPoint3d.draw
	 *
	 * Parameters:
	 *   previousPoint is the SatPoint representing the sat's previous location
	 *
	 * Results:
	 *   3d representation of this point is created and added to scene
	 */
	this.draw = function(previousPoint) {
		// does nothing if already drawn
		if (this.pathLine === undefined && previousPoint !== undefined) {
			var geometry = new THREE.Geometry();
			geometry.vertices.push(previousPoint.sp3d.xyz, this.xyz);
			var material = new THREE.LineBasicMaterial({linewidth: 4, transparent: true, color: 0xFF0000});
			this.pathLine = new THREE.Line(geometry, material);
			this.scene.add(this.pathLine);
		}
	}
	
	/*
	 * SatPoint3d.erase
	 *
	 * Results:
	 *   if this point exists and is present in scene, it is removed from scene
	 */
	this.erase = function() {
		// does nothing if not already drawn
		if (this.pathLine !== undefined) {
			this.scene.remove(this.pathLine);
		}
	}

	/*
	 * SatPoint3d.restyle
	 * 
	 * Parameters:
	 *   factor, a value in the range 0..1 where 1 represents newest point and
	 *   0 represents oldest point (plus any points older than max trace age)
	 * 
	 * Results:
	 *   this SatPoint3d material is restyled to reflect age
	 */
	this.restyle = function(factor) {
		// does nothing if not already drawn
		if (this.pathLine !== undefined) {	
			this.pathLine.material.opacity = factor;
		}
	}
}
