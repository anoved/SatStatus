/*
 * SatSun
 * 
 * Parameters:
 *   scene associated with display representation of sun
 *   initialDate is JavaScript date for initial sun position (defaults to now)
 * 
 */
function SatSun(scene, initialDate) {
	
	/*
	 * SatSun.update
	 * 
	 * Parameter:
	 *   referenceDate is a Javascript Date
	 * 
	 * Results:
	 *   Underlying timestamps and coordinates of sun position are updated.
	 *   Then, the display representation is updated as well.
	 */
	this.update = function(referenceDate) {
		
		// Dates
		
		// Unix timestamp (milliseconds since unix epoch)
		this.unixTime = referenceDate.getTime();
		
		// Julian date (milliseconds since unix epoch divided by ms/day yields
		// days since unix epoch; plus difference between Julian and unix epoch)
		this.julianDate = (this.unixTime / 86400000.0) + 2440587.5;
		
		// Sidereal time
		this.siderealTime = satellite.gstime_from_jday(this.julianDate);
		
		// Coordinates
		
		this.eci = findSolarPosition(this.julianDate);
		
		this.ecf = satellite.eci_to_ecf(this.eci, this.siderealTime);
		
		this.xyz = SceneUtils.ecfToDisplayCoordinates(this.ecf);
				
		// Display
		
		this.updateDisplay();
	}
	
	/*
	 * SatSun.updateHandler
	 * 
	 * Parameter:
	 *   updateEvent is an updateDisplay CustomEvent
	 * 
	 * Results:
	 *   invokes object's update method with reference time from updateEvent
	 */
	this.updateHandler = function(updateEvent) {
		this.update(updateEvent.detail.time);
	}
	
	/*
	 * SatSun.updateDisplay
	 * 
	 * Updates the display representation of this sun position. Creates display
	 * representation if necessary; otherwise, sets existing light to new xyz.
	 */
	this.updateDisplay = function() {
		if (this.sunlight === undefined) {
			this.createDisplay();
		} else {
			this.setDisplay();
		}
	}
	
	/*
	 * SatSun.createDisplay
	 * 
	 * Creates display representation (a point light) of this sun position and
	 * adds it to the associated scene.
	 */
	this.createDisplay = function() {
		this.sunlight = new THREE.PointLight(0xFFFFFF);
		this.setDisplay();
		this.scene.add(this.sunlight);
	}
	
	/*
	 * SatSun.setDisplay
	 * 
	 * Sets the position of the display representation of the sun to xyz vector.
	 */
	this.setDisplay = function() {
		this.sunlight.position.set(this.xyz[0], this.xyz[1], this.xyz[2]);
	}
	
	/*
	 * SatSun initilization
	 */
	this.scene = scene;
	if (initialDate === undefined) {
		initialDate = new Date;
	}
	this.update(initialDate);
	window.addEventListener("updateDisplay", this.updateHandler.bind(this), false);
}

/*
 * findSolarPosition
 * 
 * Derived from SolarPosition::FindPosition() in Dan Warner's C++ SGP4 library.
 * 
 * Parameters:
 *    Julian date
 * 
 * Result:
 *    ECI vector [x, y, z] km of solar position at given Julian date
 */
function findSolarPosition(julianDate) {
	
	function DegreesToRadians(degrees) {
		return degrees * Math.PI / 180;
	}
	
	function Modulus(x, y) {
		if (x == 0) {
			return x;
		}
		return x - y * Math.floor(x / y);
	}
	
	function Wrap360(degrees) {
		return Modulus(degrees, 360.0);
	}
	
	function Wrap2PI(degrees) {
		return Modulus(degrees, Math.PI * 2);
	}
	
	function Delta_ET(year) {
		return 26.465 + 0.747622 * (year - 1950) + 1.886913
			* Math.sin((Math.PI * 2) * (year - 1975) / 33);
	}
	
	var mjd = julianDate - 2415020.0;
	
	var year = 1900 + mjd / 365.25;
	
	var T = (mjd + Delta_ET(year) / 86400.0) / 36525.0;
	
	var M = DegreesToRadians(Wrap360(358.47583
			+ Wrap360(35999.04975 * T)
			- (0.000150 + 0.0000033 * T) * T * T));
	
	var L = DegreesToRadians(Wrap360(279.69668
			+ Wrap360(36000.76892 * T)
			+ 0.0003025 * T * T));
	
	var e = 0.01675104 - (0.0000418 + 0.000000126 * T) * T;
	
	var C = DegreesToRadians((1.919460
			- (0.004789 + 0.000014 * T) * T) * Math.sin(M)
			+ (0.020094 - 0.000100 * T) * Math.sin(2 * M)
			+ 0.000293 * Math.sin(3 * M));
	
	var O = DegreesToRadians(Wrap360(259.18 - 1934.142 * T));
	
	var Lsa = Wrap2PI(L + C
			- DegreesToRadians(0.00569 - 0.00479 * Math.sin(O)));
	
	var nu = Wrap2PI(M + C);
	
	var R = 1.0000002 * (1 - e * e) / (1 + e * Math.cos(nu));
	
	var eps = DegreesToRadians(23.452294 - (0.0130125
			+ (0.00000164 - 0.000000503 * T) * T) * T + 0.00256 * Math.cos(O));
	
	R = R * 1.49597870691e8;
	
	var solar_eci = [
			R * Math.cos(Lsa),
			R * Math.sin(Lsa) * Math.cos(eps),
			R * Math.sin(Lsa) * Math.sin(eps)
	];
	
	return solar_eci;
}

