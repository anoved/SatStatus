
/* 
 * Returns:
 *   camera angle in radians from prime meridian
 */
THREE.PerspectiveCamera.prototype.getCameraOrbitAngle = function() {
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
THREE.PerspectiveCamera.prototype.setCameraOrbitAngle = function(angle) {
	
	// wrap angle to 0..2PI
	var theta = angle - (Math.PI * 2) * Math.floor(angle / (Math.PI * 2));
	
	// preserve phi (angle above/below equatorial plane)
	var phi = Math.atan2(Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z ), this.position.y );
	var radius = this.position.length();
	
	this.position.x = radius * Math.sin(phi) * Math.cos(theta);
	this.position.y = radius * Math.cos(phi);
	this.position.z = radius * Math.sin(phi) * Math.sin(theta);
	
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
THREE.PerspectiveCamera.prototype.addCameraOrbitAngle = function(angleDelta) {
	return this.setCameraOrbitAngle(this.getCameraOrbitAngle() + angleDelta);
}

/* 
 * Parameter:
 *   seconds; orbit camera around earth by increment earth rotates in seconds
 * 
 * Returns:
 *   camera angle in radians from prime meridian
 * 
 * Results:
 *   camera is orbited to its current position plus angle earth rotates in seconds
 */
THREE.PerspectiveCamera.prototype.addCameraOrbitSeconds = function(seconds) {
	// 43200 is seconds per PI radians earth rotation
	var angle = (Math.PI * seconds) / 43200;
	return this.addCameraOrbitAngle(angle);
}
