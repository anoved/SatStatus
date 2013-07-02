// tracks should be implemented as objects, so that we can easily display a bunch
// and just let them all keep track of themselves. updates just provide timestamp
// to each object, which pushes a point for that timestamp onto its display and
// pops off the oldest.

init();

function init() {
	
	// to convert arbitrary date or julian date to minutes from epoch:
	// var j = jday(year, month, day, hour, minute, second);
	// var m = (j - satrec.jdsatepoch) * minutes_per_day;
	
	var tle1 = "1 25544U 98067A   13181.93746528  .00008251  00000-0  14965-3 0   959";
	var tle2 = "2 25544  51.6493  40.1834 0008920 113.3890  83.5804 15.50498371836833";
	var sr = satellite.twoline2satrec(tle1, tle2);
		
	var pv_eci, gmst, p_ecf;
	for (var offset = 0; offset < 30; offset += 1) {
		
		pv = satellite.sgp4(sr, 0 - offset);
		log(pv[0]);
		
		// jdsatepoch is fractional days; gmst must be minutes.
		// so we convert days to minutes and subtract the minute offset.
		gmst = (sr.jdsatepoch * 1440) - offset;
		p_ecf = satellite.eci_to_ecf(pv[0], gmst);
		log(p_ecf);
		log(gmst);
	}
	
}

function log(txt) {
	var d = document.getElementById('log-container');
	var p = document.createElement('p');
	var t = document.createTextNode(txt);
	p.appendChild(t);
	d.appendChild(p);
}
