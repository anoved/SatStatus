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
		this.unixtime = date.getTime();
		
		// Julian date (milliseconds since unix epoch divided by ms/day yields
		// days since unix epoch; plus difference between Julian and unix epoch)
		this.julian = (this.unixtime / 86400000.0) + 2440587.5;
		
		// Sidereal time
		this.sidereal = satellite.gstime_from_jday(this.julian);
		
		// Minutes from sat epoch (days from sat epoch times minutes per day)
		this.minutesFromEpoch = (this.julian - satrec.jdsatepoch) * 1440.0;
		
		// Coordinates
		
		this.eci_vel = satellite.sgp4(satrec, this.minutesFromEpoch);
		
		// Earth Centered Inertial coordinate vector (km)	
		this.eci = this.eci_vel[0];
		
		// Earth Centered Fixed coordinate vector (km)
		this.ecf = satellite.eci_to_ecf(this.eci, this.sidereal);
		
		// Geodetic coordinate vector (lng rad, lat rad, alt km)
		this.geo = satellite.eci_to_geodetic(this.eci, this.sidereal);
		
		// Geodetic coordinate vector (lat deg, lng deg, alt km)
		this.lla = [satellite.degrees_lat(this.geo[1]),
				satellite.degrees_long(this.geo[0]), this.geo[2]];
		
		// Display coordinates (100 km per 1 unit)
		this.xyz = [this.ecf[0]/100.0, this.ecf[2]/100.0, -1 * this.ecf[1]/100.0];
	}
	
	this.update(satrec, date);
}
