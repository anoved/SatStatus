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
		// initial position should be set more logically. If there's no trace
		// yet, perhaps adding the first trace (or any trace) should update
		// display to look at current location. Alternatively, focus on user
		// geo-ip location. Or, some other significant longitude - noon?
		this.camera.position.set(SceneUtils.kmToDisplayUnits(25000), 0, 0);
		
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
		var earthGeometry = new THREE.SphereGeometry(SceneUtils.kmToDisplayUnits(6371), 24, 24);
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
	 * SatScene.addTrace
	 * 
	 * Parameters:
	 *   satId, identifier of satellite to add to the scene
	 *   color, color of this satellite trace (defaults to red)
	 *   startTime, date of initial trace position (defaults to now)
	 * 
	 * Results:
	 *   creates a new SatTrace and adds it to the traces array
	 * 
	 * Returns:
	 *   the new SatTrace object
	 */
	this.addTrace = function(satId, color, startTime) {
		if (color === undefined) {
			color = 0xFF0000;
		}
		if (startTime === undefined) {
			startTime = new Date;
		}
		var trace = new SatTrace(this.scene, satId, startTime, color);
		this.traces.push(trace);
		return trace;
	}
	
	this.traces = [];
	this.init(containerId);
	this.animate();
	window.addEventListener("renderEvent", this.render.bind(this), false);
}

var SceneUtils = {
	
	/*
	 * Parameter:
	 *   km kilometers
	 * 
	 * Returns:
	 *   km equivalent in 3d display units
	 */
	kmToDisplayUnits: function(km) {
		return km / 100.0;
	},
	
	/*
	 * Parameter:
	 *   ecf coordinate array (x y z km)
	 * 
	 * Return:
	 *   3d display coordinate array
	 *   (x, z, -y in display units)
	 */
	ecfToDisplayCoordinates: function(ecf) {
		return [this.kmToDisplayUnits(ecf[0]), this.kmToDisplayUnits(ecf[2]), this.kmToDisplayUnits(-1 * ecf[1])];
	}
};

/* temporary test helper. Dispatches an updateDisplay event with current time. */
/* window.setInterval(UpdateSatTrace, 5000) - run it every five seconds */
function UpdateDisplay() {
	var now = new Date;
	var event = new CustomEvent("updateDisplay", {"detail": {"time": now}});
	window.dispatchEvent(event);
	// hacky - updateDisplay handlers may not be done in time for render event.
	window.dispatchEvent(new CustomEvent("renderEvent"));
}
