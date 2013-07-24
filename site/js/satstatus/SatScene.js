/*
 * SatScene
 * 
 * Manages a 3d display
 */
function SatScene(containerId) {
	
	// cribbed from globe.js test
	
	this.init = function(containerId) {

		// Camera
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
		this.camera.position.set(250, 0, 0);
		
		// Controls
		this.controls = new THREE.OrbitControls(this.camera);
		this.controls.addEventListener('change', this.render.bind(this));
		
		// Scene
		this.scene = new THREE.Scene();
		this.setupScene();
		
		// Renderer (.CanvasRenderer or .WebGLRenderer)
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
			
		// Attach the renderer and the stats monitor to the page.
		var container = document.getElementById(containerId);
		container.appendChild(this.renderer.domElement);
		window.addEventListener('resize', this.onWindowResize.bind(this), false);
		
		this.render();
	}
	
	this.setupScene = function() {
		
		// Welcome to Earf.
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
	
	this.animate = function() {
		requestAnimationFrame(this.animate.bind(this));
		this.controls.update();
	}
	
	this.render = function() {
		this.renderer.render(this.scene, this.camera);
	}
	
	this.onWindowResize = function() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.render();
	}
	
	this.addTrace = function(satId, startTime) {
		if (startTime === undefined) {
			startTime = new Date;
		}
		var trace = new SatTrace(this.scene, satId, startTime);
		this.traces.push(trace);
		return trace;
	}
	
	// constructor actions
	this.traces = [];
	this.init(containerId);
	this.animate();
	
	window.addEventListener("renderEvent", this.render.bind(this), false);
}

/* temporary test helper. Dispatches an updateSatTrace event with current time. */
/* window.setInterval(UpdateSatTrace, 5000) - run it every five seconds */
function UpdateSatTrace() {
	var now = new Date;
	var event = new CustomEvent("updateSatTrace", {"detail": {"time": now}});
	window.dispatchEvent(event);
	// hacky - updateSatTrace handlers may not be done in time for render event.
	window.dispatchEvent(new CustomEvent("renderEvent"));
}
