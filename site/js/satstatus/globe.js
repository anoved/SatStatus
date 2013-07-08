var camera, scene, renderer, controls, stats;

init();
animate();

function init() {
	
	// Camera (set near/far planes to reasonable values - far enough for largest orbit?)
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
	resetCamera();
	
	// Controls
	controls = new THREE.OrbitControls(camera);
	controls.userPan = false;
	// set controls.minDistance/maxDistance to reasonable limits (whole earth/largest orbit?)
	controls.addEventListener('change', render);
	
	// Scene
	scene = new THREE.Scene();
	populateScene();
	
	// Renderer (.CanvasRenderer or .WebGLRenderer)
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	
	// Stats (stats.setMode(1) for MS/frame instead of FPS)
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.zIndex = 100;
	
	// Attach the renderer and the stats monitor to the page.
	var container = document.getElementById('globe-container');
	container.appendChild(renderer.domElement);
	container.appendChild(stats.domElement);
	window.addEventListener('resize', onWindowResize, false);
}

function populateScene() {
	
	// initially, a set of points representing present satellite path
	// needs to be generated. subsequently, just pop one old point and
	// push one newly-calculated point into the set periodically.
	// (the same point set must inform the 2D map as well. thus,
	// perhaps an independent time-based timer should manage point set,
	// calling render() explicitly when updated.)
	
	// note: rather than rely on timers being called at specific intervals (sketchy),
	// just use the current time for the point whenever if it is called in the ballpark.
	
	// earth orientation and texture map should be correct relative to satellite tracks.
	
	// illumination (light & shading) should be maintained in real time as well.
	// a geocentric sun simulation may be sufficient (eg, locate sun via ECI coords)
	// sunlight update hooked into same timer as points update.
	
	// optional equatorial/ecliptic plane visualizations
	
	// sample satellite track coordinates
	// 12 hours of a GPS satellite in 15 minute intervals.
	// Earth centered inertial coordinates in kilometers
	var points = [
			[-21072.79446816,-5355.87190019,-14759.58202168],
			[-21621.26883013,-8047.27367953,-12554.97391866],
			[-21785.07540960,-10595.49649616,-10126.96706561],
			[-21560.90358076,-12955.01633012,-7518.57776623],
			[-20952.58743547,-15083.72112290,-4776.20861967],
			[-19971.04240386,-16943.74469909,-1948.74151448],
			[-18634.04530120,-18502.20766902,913.42507539],
			[-16965.86399222,-19731.84572625,3759.36868044],
			[-14996.74803213,-20611.50983882,6538.63869008],
			[-12762.29617872,-21126.52757378,9202.22931448],
			[-10302.72029894,-21268.91986888,11703.50516687],
			[-7662.02773197,-21037.47263650,13999.05769220],
			[-4887.14553227,-20437.66733640,16049.47418467],
			[-2027.01021617,-19481.47881795,17820.00517098],
			[868.35421880,-18187.05211659,19281.12018902],
			[3748.74896428,-16578.27238026,20408.94618003],
			[6564.68511116,-14684.24367269,21185.58659548],
			[9268.22455130,-12538.69309735,21599.32271373],
			[11813.76420771,-10179.31661206,21644.70144770],
			[14158.75368825,-7647.08220373,21322.51605058],
			[16264.33922251,-4985.50492723,20639.68759394],
			[18095.92918733,-2239.90684889,19609.05595236],
			[19623.67857620,543.32667242,18249.08936262],
			[20822.89138519,3317.48454999,16583.52153626],
			[21674.34107402,6036.25307808,14640.92490359],
			[22164.51004248,8654.41761518,12454.22796591],
			[22285.74949132,11128.53696495,10060.18403481],
			[22036.36117509,13417.58539993,7498.79793623],
			[21420.60247559,15483.55781537,4812.71663241],
			[20448.61600550,17292.03377028,2046.58923025],
			[19136.28466959,18812.69619470,-753.59844683],
			[17505.01284267,20019.80035419,-3541.20961312],
			[15581.43414250,20892.58831182,-6269.65730753],
			[13397.04625094,21415.64367456,-8893.11448397],
			[10987.77343059,21579.18092242,-11367.22699391],
			[8393.45785040,21379.26317071,-13649.82214834],
			[5657.28161606,20817.94188986,-15701.60446651],
			[2825.12252671,19903.31199080,-17486.82902145],
			[-55.15194139,18649.47586232,-18973.94155658],
			[-2934.44610516,17076.41050396,-20136.17337116],
			[-5763.24456356,15209.73290659,-20952.07796810],
			[-8492.45692847,13080.36034720,-21405.99575253],
			[-11074.28556228,10724.06431475,-21488.43279420],
			[-13463.10064956,8180.91936222,-21196.33995011],
			[-15616.30468598,5494.65123853,-20533.27959697],
			[-17495.16660588,2711.89209183,-19509.46893005],
			[-19065.60449087,-118.64579651,-18141.69128266],
			[-20298.89529655,-2947.06258911,-16453.07019106]];
	
	// pulled from three.js "earth" example
	var earthTexture = new THREE.Texture();
	var loader = new THREE.ImageLoader();
	loader.addEventListener('load', function(event) {
		earthTexture.image = event.content;
		earthTexture.needsUpdate = true;
		//earthTexture.offset.set(0.5,0);
		render();
	});
	loader.load( 'images/earth_no_clouds_ecf.jpg' );
	var geometry = new THREE.SphereGeometry(63, 16, 16);
	var material = new THREE.MeshLambertMaterial({map: earthTexture, overdraw: true});
	var mesh = new THREE.Mesh(geometry, material);
	scene.add( mesh );
	
	// Issues with CanvasRenderer:
	// - Texture mapped sphere appears to obscure lines (incorrectly drawn on top).
	
	// General issues:
	// - Texture mapped sphere does not appear to be illuminated/in shade as
	//   with plain color sphere. Probably a matter of settings & properties.
	// - Texture map is off by 180 degrees. Fix rather than negate all X coords.
	
	var lc = new THREE.LineBasicMaterial({color: 0xFF0000});
	for (var i = 0; i < points.length; i++) {
		var pg = new THREE.Geometry();
		pg.vertices.push(new THREE.Vector3(0, 0, 0));
		pg.vertices.push(new THREE.Vector3(points[i][0]/100.0, points[i][1]/100.0, points[i][2]/100.0));
		var pl = new THREE.Line(pg, lc);
		scene.add(pl);
	}
	
	// Note: globe and light orientation are not necessarily
	// correctly matched to solar position and ECI orbit points.
	var light = new THREE.PointLight(0xFFFFFF);
	light.position.set(2000, 0, 0);
	scene.add(light);
	light = new THREE.AmbientLight(0x202020);
	scene.add(light);
}

/*
 * resetCamera
 * 
 * Restore initial camera position. Changing the position triggers update.
 */
function resetCamera() {
	// camera oriented on ECF X axis
	camera.position.set(250, 0, 0);
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
}

function render() {
	renderer.render(scene, camera);
	stats.update();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}
