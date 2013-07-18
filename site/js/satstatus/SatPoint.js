/*
 * SatPoint constructor
 *
 * Input:
 *   satrec, satellite.js object
 *   date, Javascript date 
 */
function SatPoint(satrec, date) {
	
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
		this.geo = [
				satellite.degrees_long(this.geo_rad[0]),
				satellite.degrees_lat(this.geo_rad[1]),
				this.geo_rad[2]
		];
		
		// Display coordinates (100 km per 1 unit)
		this.xyz = [
				this.ecf[0]/100.0,
				this.ecf[2]/100.0,
				this.ecf[1]/100.0 * -1.0
		];
	}
	
	this.update(satrec, date);
	
	/*
	 * SatPoint.update3dGeometry
	 * 
	 * Parameters:
	 *   scene is the THREE.js scene to which the geometry should be shown
	 *   previous is a reference to the previous SatPoint, used to draw path.
	 *    (if undefined, this point has no predecessor and should be shown)
	 */
	this.update3dGeometry = function(scene, previous) {
		
		if (previous === undefined) {
			if (this.pathLine !== undefined) {
				
				// do not display this point (remove from scene without
				// discarding object) if there is no previous point.
				scene.remove(this.pathLine);
			}
			
			return;
		}
		
		if (this.pathLine === undefined) {
			
			// create new line
			
			var geometry = new THREE.Geometry();
			geometry.vertices.push(new THREE.Vector3(previous.xyz[0], previous.xyz[1], previous.xyz[2]));
			geometry.vertices.push(new THREE.Vector3(this.xyz[0], this.xyz[1], this.xyz[2]));
			
			// expect to adjust material color & opacity, etc, based on point age
			var material = new THREE.LineBasicMaterial({linewidth: 4, transparent: true});
			
			this.pathLine = new THREE.Line(geometry, material);
			scene.add(this.pathLine);
			
		} else {
			
			// update exisiting line
			
			// might it be useful to use THREE.Vector3 for SatPoint vectors instead of generic arrays?
			this.pathLine.geometry.vertices[0].set(previous.xyz[0], previous.xyz[1], previous.xyz[2]);
			this.pathLine.geometry.vertices[1].set(this.xyz[0], this.xyz[1], this.xyz[2]);
			
			this.pathLine.geometry.verticesNeedUpdate = true;
			
			// expect to trigger render() redraw later after all updates, if not automatic
			
			// restore line to scene if it appears to have been removed
			if (this.pathLine.parent === undefined) {
				scene.add(this.pathLine);
			}
		}
	}
	
	/*
	 * expectation is that update3dmaterial will be called on points, with
	 * current timestamp, once update3dGeometry is called.
	 * 
	 * Parameters:
	 *   currentTimestamp, Javascript date of "current" time
	 */
	this.update3dMaterial = function(currentTimestamp) {
		var age = currentTimestamp.getTime() - this.unixTime;
		// age factor related to maximum age of display (eg, 90 minutes in ms)
		var factor = 1 - (age / 5400000);
		if (this.pathLine !== undefined) {
			this.pathLine.material.color.setRGB(0.8 * factor + 0.2, 0, 0);
			this.pathLine.material.opacity = 0.8 * factor + 0.2;
		}
	}
	

}
