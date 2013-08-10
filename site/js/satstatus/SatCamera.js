
/* 
 * Returns:
 *   camera angle in radians from prime meridian
 */
THREE.Camera.prototype.getCameraOrbitAngle = function() {
	return Math.atan2(this.position.z, this.position.x);		
}

/*
 * Parameter:
 *   angle in radians from prime meridian
 * 
 * Returns:
 *   camera angle in radians from prime meridian (wrapped to 0..2pi)
 * 
 * Results:
 *   camera is orbited around earth axis to the requested angle from the
 *   prime meridian. Camera radius and equatorial elevation are preserved. 
 */
THREE.Camera.prototype.setCameraOrbitAngle = function(angle) {
	
	// wrap angle to 0..2PI
	var theta = angle - (Math.PI * 2) * Math.floor(angle / (Math.PI * 2));
	
	// preserve phi (angle above/below equatorial plane)
	var phi = Math.atan2(Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z ), this.position.y );
	var radius = this.position.length();
	
	this.position.x = radius * Math.sin(phi) * Math.cos(theta);
	this.position.y = radius * Math.cos(phi);
	this.position.z = radius * Math.sin(phi) * Math.sin(theta);
	
	// needed to prevent herky jerky jitter.
	// note that we can probably collapse some of these custom camera
	// methods into the OrbitControls, since that's actually an
	// extension of camera as well.
	this.lookAt(new THREE.Vector3(0,0,0));
	
	return theta;
}

/*
 * Parameter:
 *   angleDelta, angle in radians to add to current camera orbit angle
 * 
 * Returns:
 *   camera angle in radians from prime meridian
 * 
 * Results:
 *   camera is orbited to its current position plus angleDelta 
 */
THREE.Camera.prototype.addCameraOrbitAngle = function(angleDelta) {
	return this.setCameraOrbitAngle(this.getCameraOrbitAngle() + angleDelta);
}

/*
 * [time]ToRadians Functions
 * 
 * Returns radians corresponding to rotation of the specified time period.
 */

function daysToRadians(days) {
	return Math.PI * 2 * days;
}

function hoursToRadians(hours) {
	return Math.PI / 12 * hours;
}

function minutesToRadians(minutes) {
	return Math.PI / 720 * minutes;
}

function secondsToRadians(seconds) {
	return Math.PI / 43200 * seconds;
}

function millisecondsToRadians(milliseconds) {
	return Math.PI / 43200000 * milliseconds;
}

/*
 * addCameraOrbit[Time] methods
 * 
 * Orbits camera around origin by angle corresponding to specified time period.
 */

THREE.Camera.prototype.addCameraOrbitDays = function(days) {
	return this.addCameraOrbitAngle(daysToRadians(days));
}

THREE.Camera.prototype.addCameraOrbitHours = function(hours) {
	return this.addCameraOrbitAngle(hoursToRadians(hours));
}

THREE.Camera.prototype.addCameraOrbitMinutes = function(minutes) {
	return this.addCameraOrbitAngle(minutesToRadians(minutes));
}

THREE.Camera.prototype.addCameraOrbitSeconds = function(seconds) {
	return this.addCameraOrbitAngle(secondsToRadians(seconds));
}

THREE.Camera.prototype.addCameraOrbitMilliseconds = function(milliseconds) {
	return this.addCameraOrbitAngle(millisecondsToRadians(milliseconds));
}
