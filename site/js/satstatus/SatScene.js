/*
 * SatScene
 * 
 * Manages a 3d display
 */
function SatScene(containerId, initialDate) {
	
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
		var aspect = this.container.clientWidth / this.container.clientWidth;
		this.camera = new THREE.PerspectiveCamera(75, aspect, 1, 10000);
		// initial position should be set more logically. If there's no trace
		// yet, perhaps adding the first trace (or any trace) should update
		// display to look at current location. Alternatively, focus on user
		// geo-ip location. Or, some other significant longitude - noon?
		this.camera.position.set(SceneUtils.kmToDisplayUnits(25000), 0, 0);
		
		// Controls
		this.controls = new THREE.OrbitControls(this.camera);
		this.controls.minDistance = SceneUtils.kmToDisplayUnits(6500);
		this.controls.addEventListener('change', this.render.bind(this));
		
		// Scene
		this.scene = new THREE.Scene();
		this.setupScene();
		
		// Renderer (.CanvasRenderer or .WebGLRenderer)
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
			
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
		var aspect = this.container.clientWidth / this.container.clientHeight;
		this.camera.aspect = aspect;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
		this.render();
	}
	
	/*
	 * SatScene.addTrace
	 * 
	 * Parameters:
	 *   satId, identifier of satellite to add to the scene
	 *   color, color of this satellite trace (defaults to red)
	 *   startTime, date of initial trace position (defaults to scene ref date)
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
			startTime = this.referenceDate;
		}
		var trace = new SatTrace(this.scene, satId, startTime, color);
		this.traces.push(trace);
		return trace;
	}
	
	/*
	 * SatScene.updateHandler
	 * 
	 * Parameters:
	 *   updateEvent is a CustomEvent with a Date object as the time detail.
	 * 
	 * Results:
	 *   stores updateEvent time in this.referenceDate
	 */
	this.updateHandler = function(updateEvent) {
		var last = this.referenceDate.getTime();
		this.referenceDate = updateEvent.detail.time;
		
		// should do this only conditionally if some auto-rotate camera option is set
		this.controls.addRotationMilliseconds(this.referenceDate.getTime() - last);
	}
	
	this.animation = {
		timer: undefined,
		
		// the real time at which the last animation.update occurred
		framedate: undefined,
		
		start: function() {
			if (this.timer !== undefined) {
				return;
			}
			this.timer = window.setInterval(this.update.bind(this), 100);
			return this.timer;
		},
		
		stop: function() {
			if (this.timer === undefined) {
				return;
			}
			window.clearInterval(this.timer);
			this.timer = undefined;
		},
		
		toggle: function() {
			if (this.timer === undefined) {
				return this.start();
			} else {
				return this.stop();
			}
		},
		
		keyHandler: function(event) {
			switch (event.keyCode) {
				case 32:
					// space bar
					this.toggle();
					break;
			}
		},
		
		// call directly to advance display in real time relative to last update
		// if any fast-forward animation has occurred, this will be in future.
		update: function() {
			var now = new Date;
			if (this.timer === undefined) {
				// manual updates progress at real time elapsed since last update
				var increment = now.getTime() - this.framedate.getTime();
			} else {
				// active animation progress at 1 minute per frame
				var increment = 60000
			}
			this.framedate = now;
			var updateDate = new Date(this.referenceDate.getTime() + increment);
			var update = new CustomEvent("updateDisplay", {"detail": {"time": updateDate}});
			window.dispatchEvent(update);
		}
	};
	
	this.traces = [];
	this.init(containerId);
	this.animate();
	this.referenceDate = initialDate || new Date;
	
	this.animation.__proto__ = this;
	this.animation.framedate = this.referenceDate;
	window.addEventListener('keydown', this.animation.keyHandler.bind(this.animation), false);
	window.addEventListener("renderEvent", this.render.bind(this), false);
	window.addEventListener("updateDisplay", this.updateHandler.bind(this), false);
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
