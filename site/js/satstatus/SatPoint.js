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
}
