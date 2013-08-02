/*
 * SatScene
 * 
 * Manages a 3d display
 */
function SatScene(containerId) {
	
	/*
	 * SatScene.init
	 * 
	 * Parameters:
	 *   containerId, id of div to contain scene display (fills div dimensions)
	 * 
	 * Results:
	 *   creates a Three.js display environment populated with basic elements
	 *   and attaches it to the specified div.
	 */
	this.init = function(containerId) {
		
		this.container = document.getElementById(containerId);
		
		// Camera
		var aspect = this.container.offsetWidth / this.container.offsetHeight;
		this.camera = new THREE.PerspectiveCamera(75, aspect, 1, 10000);
		this.camera.position.set(250, 0, 0);
		
		// Controls
		this.controls = new THREE.OrbitControls(this.camera);
		this.controls.addEventListener('change', this.render.bind(this));
		
		// Scene
		this.scene = new THREE.Scene();
		this.setupScene();
		
		// Renderer (.CanvasRenderer or .WebGLRenderer)
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
			
		// Attach the renderer to the page.
		this.container.appendChild(this.renderer.domElement);
		window.addEventListener('resize', this.onContainerResize.bind(this), false);
		
		this.render();
	}
	
	/*
	 * SatScene.setupScene
	 * 
	 * Populate the scene with basic elements: Earth and illumination.
	 * 
	 */
	this.setupScene = function() {
		
		// Earth
		var earthTexture = new THREE.Texture();
		var loader = new THREE.ImageLoader();
		loader.addEventListener('load', (function(context){
			return function(event) {
				earthTexture.image = event.content;
				earthTexture.needsUpdate = true;
				context.render();
			};
			})(this));
		loader.load('images/textures/earthmap1k.jpg');
		var earthGeometry = new THREE.SphereGeometry(63.71, 24, 24);
		var earthMaterial = new THREE.MeshLambertMaterial({map: earthTexture, overdraw: true});
		var earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
		this.scene.add(earthMesh);
		
		// Simulated geocentric sunlight
		this.sun = new SatSun(this.scene, new Date);
		
		// Ambient light for night-side visibility
		this.scene.add(new THREE.AmbientLight(0x202020));
	}
	
	/*
	 * SatScene.animate
	 * 
	 * The controller update method invokes the SatScene render method if
	 * necessary (as the "change" event handler associated above). Then, this
	 * method is scheduled to run again at next available animation frame.
	 * 
	 */
	this.animate = function() {
		this.controls.update();
		requestAnimationFrame(this.animate.bind(this));
	}
	
	/*
	 * SatScene.render
	 * 
	 * Render the scene as seen from the camera.
	 */
	this.render = function() {
		this.renderer.render(this.scene, this.camera);
	}
	
	/*
	 * SatScene.onContainerResize
	 * 
	 * Respond to window resize events by recalculating camera aspect ratio and
	 * adjusting renderer dimensions. Explicitly calls render method to redraw.
	 * 
	 */
	this.onContainerResize = function() {
		var aspect = this.container.offsetWidth / this.container.offsetHeight;
		this.camera.aspect = aspect;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
		this.render();
	}
	
	/*
	 * SatScene.getCameraOrbitAngle
	 * 
	 * Returns:
	 *   camera angle in radians from prime meridian
	 */
	this.getCameraOrbitAngle = function() {
		return Math.atan2(this.camera.position.z, this.camera.position.x);		
	}
	
	/*
	 * SatScene.setCameraOrbitAngle
	 * 
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
	this.setCameraOrbitAngle = function(angle) {
		
		// wrap angle to 0..2PI
		var theta = angle - (Math.PI * 2) * Math.floor(angle / (Math.PI * 2));
		
		// preserve phi (angle above/below equatorial plane)
		var phi = Math.atan2(Math.sqrt(this.camera.position.x * this.camera.position.x + this.camera.position.z * this.camera.position.z ), this.camera.position.y );
		var radius = this.camera.position.length();
		
		this.camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
		this.camera.position.y = radius * Math.cos(phi);
		this.camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
		
		return theta;
	}
	
	/*
	 * SatScene.addCameraOrbitAngle
	 * 
	 * Parameter:
	 *   angleDelta, angle in radians to add to current camera orbit angle
	 * 
	 * Returns:
	 *   camera angle in radians from prime meridian
	 * 
	 * Results:
	 *   camera is orbited to its current position plus angleDelta 
	 */
	this.addCameraOrbitAngle = function(angleDelta) {
		return this.setCameraOrbitAngle(this.getCameraOrbitAngle() + angleDelta);
	}
	
	/*
	 * SatScene.addTrace
	 * 
	 * Parameters:
	 *   satId, identifier of satellite to add to the scene
	 *   startTime, date of initial trace position (defaults to now)
	 * 
	 * Results:
	 *   creates a new SatTrace and adds it to the traces array
	 * 
	 * Returns:
	 *   the new SatTrace object
	 */
	this.addTrace = function(satId, startTime) {
		if (startTime === undefined) {
			startTime = new Date;
		}
		var trace = new SatTrace(this.scene, satId, startTime);
		this.traces.push(trace);
		return trace;
	}
	
	this.traces = [];
	this.init(containerId);
	this.animate();
	window.addEventListener("renderEvent", this.render.bind(this), false);
}

/* consider that if it's been longer than a certain interval since the last
 * update, it may be desirable to actually dispatch a sequence of update events
 * spread over the intervening period in order to maintain a smooth display.
 * (actually, that is something for SatTrace.update to handle internally) */
/* temporary test helper. Dispatches an updateDisplay event with current time. */
/* window.setInterval(UpdateSatTrace, 5000) - run it every five seconds */
function UpdateDisplay() {
	var now = new Date;
	var event = new CustomEvent("updateDisplay", {"detail": {"time": now}});
	window.dispatchEvent(event);
	// hacky - updateDisplay handlers may not be done in time for render event.
	window.dispatchEvent(new CustomEvent("renderEvent"));
}
