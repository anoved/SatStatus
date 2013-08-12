/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.OrbitControls = function ( object, domElement ) {

	this.object = object; // camera
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.center = new THREE.Vector3();

	this.userZoom = true;
	this.userZoomSpeed = 1.0;

	this.userRotate = true;
	this.userRotateSpeed = 1.0;

	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	this.minDistance = 0;
	this.maxDistance = Infinity;

	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// internals

	var scope = this;

	var EPS = 0.000001;
	var PIXELS_PER_ROUND = 1800;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var zoomStart = new THREE.Vector2();
	var zoomEnd = new THREE.Vector2();
	var zoomDelta = new THREE.Vector2();

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;

	var lastPosition = new THREE.Vector3();

	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1 };
	var state = STATE.NONE;

	// events

	var changeEvent = { type: 'change' };

	/* 
	 * Returns:
	 *   camera angle in radians from prime meridian
	 */
	this.getRotation = function() {
		return Math.atan2(this.object.position.z, this.object.position.x);
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
	this.setRotation = function(angle) {
		
		var position = this.object.position;
		
		// wrap angle to 0..2PI
		var theta = angle - (Math.PI * 2) * Math.floor(angle / (Math.PI * 2));
		
		// preserve phi (angle above/below equatorial plane)
		var phi = Math.atan2(Math.sqrt(position.x * position.x + position.z * position.z ), position.y );
		var radius = position.length();
		
		// update the camera position
		position.x = radius * Math.sin(phi) * Math.cos(theta);
		position.y = radius * Math.cos(phi);
		position.z = radius * Math.sin(phi) * Math.sin(theta);
		
		// consider utilizing the same phiDelta mechanism the other control
		// methods use (which is then simply applied by controls.update())
		
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
	this.addRotation = function(angleDelta) {
		return this.setRotation(this.getRotation() + angleDelta);
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
	
	this.addRotationDays = function(days) {
		return this.addRotation(daysToRadians(days));
	}

	this.addRotationHours = function(hours) {
		return this.addRotation(hoursToRadians(hours));
	}

	this.addRotationMinutes = function(minutes) {
		return this.addRotation(minutesToRadians(minutes));
	}

	this.addRotationSeconds = function(seconds) {
		return this.addRotation(secondsToRadians(seconds));
	}

	this.addRotationMilliseconds = function(milliseconds) {
		return this.addRotation(millisecondsToRadians(milliseconds));
	}

	
	this.rotateLeft = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta -= angle;

	};

	this.rotateRight = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta += angle;

	};

	this.rotateUp = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta -= angle;

	};

	this.rotateDown = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta += angle;

	};

	this.zoomIn = function ( zoomScale ) {

		if ( zoomScale === undefined ) {

			zoomScale = getZoomScale();

		}

		scale /= zoomScale;

	};

	this.zoomOut = function ( zoomScale ) {

		if ( zoomScale === undefined ) {

			zoomScale = getZoomScale();

		}

		scale *= zoomScale;

	};
	
	this.update = function () {

		var position = this.object.position;
		var offset = position.clone().sub( this.center );

		// angle from z-axis around y-axis

		var theta = Math.atan2( offset.x, offset.z );

		// angle from y-axis

		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

		if ( this.autoRotate ) {

			this.rotateLeft( getAutoRotationAngle() );

		}

		theta += thetaDelta;
		phi += phiDelta;

		// restrict phi to be between desired limits
		phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

		// restrict phi to be betwee EPS and PI-EPS
		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

		var radius = offset.length() * scale;

		// restrict radius to be between desired limits
		radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

		offset.x = radius * Math.sin( phi ) * Math.sin( theta );
		offset.y = radius * Math.cos( phi );
		offset.z = radius * Math.sin( phi ) * Math.cos( theta );

		position.copy( this.center ).add( offset );

		this.object.lookAt( this.center );

		thetaDelta = 0;
		phiDelta = 0;
		scale = 1;

		if ( lastPosition.distanceTo( this.object.position ) > 0 ) {

			this.dispatchEvent( changeEvent );

			lastPosition.copy( this.object.position );

		}

	};


	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.userZoomSpeed );

	}

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;
		if ( scope.userRotate === false ) return;

		event.preventDefault();

		if ( event.button === 0 ) {

			state = STATE.ROTATE;

			rotateStart.set( event.clientX, event.clientY );

		} else if ( event.button === 1 ) {

			state = STATE.ZOOM;

			zoomStart.set( event.clientX, event.clientY );

		}

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( state === STATE.ROTATE ) {

			rotateEnd.set( event.clientX, event.clientY );
			rotateDelta.subVectors( rotateEnd, rotateStart );

			scope.rotateLeft( 2 * Math.PI * rotateDelta.x / PIXELS_PER_ROUND * scope.userRotateSpeed );
			scope.rotateUp( 2 * Math.PI * rotateDelta.y / PIXELS_PER_ROUND * scope.userRotateSpeed );

			rotateStart.copy( rotateEnd );

		} else if ( state === STATE.ZOOM ) {

			zoomEnd.set( event.clientX, event.clientY );
			zoomDelta.subVectors( zoomEnd, zoomStart );

			if ( zoomDelta.y > 0 ) {

				scope.zoomIn();

			} else {

				scope.zoomOut();

			}

			zoomStart.copy( zoomEnd );

		}
	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;
		if ( scope.userRotate === false ) return;

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false ) return;
		if ( scope.userZoom === false ) return;

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if ( event.detail ) { // Firefox

			delta = - event.detail;

		}

		if ( delta > 0 ) {

			scope.zoomOut();

		} else {

			scope.zoomIn();

		}

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false ) return;
		
		switch ( event.keyCode ) {
			case scope.keys.UP:
				scope.rotateUp(0.1);
				break;
			case scope.keys.BOTTOM:
				scope.rotateDown(0.1);
				break;
			case scope.keys.LEFT:
				scope.rotateLeft(0.1);
				break;
			case scope.keys.RIGHT:
				scope.rotateRight(0.1);
				break;
		}
	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
	this.domElement.addEventListener( 'keydown', onKeyDown, false );

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
