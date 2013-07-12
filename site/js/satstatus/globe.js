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
[3022.599965406991,5166.473197064728,3213.0902895734393],
[2643.9678624398775,5689.196560530719,2610.9809459765374],
[2225.528854628948,6115.372386026137,1961.0265392877147],
[1773.1549899842837,6437.9185082054455,1275.1455837990288],
[1293.226118978883,6651.543152406952,565.9107606365483],
[792.543572464713,6752.833770712914,-153.68492966421422],
[278.2368885063904,6740.31112687836,-870.4700312963524],
[-242.3339615652294,6614.447835370734,-1571.3381361850597],
[-761.6817681132088,6377.65109146019,-2243.4914290121837],
[-1272.2954989811396,6034.210557822091,-2874.6743939946887],
[-1766.744818056868,5590.213229860629,-3453.3966135227197],
[-2237.7831019089454,5053.427783662185,-3969.139044155536],
[-2678.4478793274793,4433.161331809727,-4412.540629567952],
[-3082.1566697043327,3740.0933816675447,-4775.561587725453],
[-3442.799482119553,2986.0874438411674,-5051.623405331314],
[-3754.824274936266,2183.9880802171724,-5235.7210231039035],
[-4013.3170298102023,1347.4037860230899,-5324.508477156602],
[-4214.074995103951,490.48014069695716,-5316.356377997573],
[-4353.672733241931,-372.3342309917965,-5211.38090251945],
[-4429.520083641687,-1226.5242730270263,-5011.444286385193],
[-4439.9118946130275,-2057.7491994909433,-4720.126019206947],
[-4384.067613126845,-2852.078546386465,-4342.665380255117],
[-4262.160359835738,-3596.224789418209,-3885.8749894900807],
[-4075.33385636366,-4277.767579063108,-3358.0257700152015],
[-3825.7064275293005,-4885.364817391687,-2768.705311156892],
[-3516.35992686957,-5408.949957414921,-2128.648425377063],
[-3151.3139066762055,-5839.906802622476,-1449.5457014216906],
[-2735.4835601358136,-6171.221212164104,-743.830503538458],
[-2274.621629259882,-6397.604483168633,-24.449303220101637],
[-1775.2444318845264,-6515.585383689705,695.3804588769184],
[-1244.5439505818151,-6523.56814101572,1402.418347166459],
[-690.2848594313165,-6421.855296812092,2083.652809548625],
[-120.69170594769923,-6212.634102756916,2726.5464367397913],
[455.6740545170532,-5899.927700576407,3319.2727097219154],
[1030.044002250887,-5489.5122123293495,3850.937812325745],
[1593.576241050265,-4988.803176715738,4311.78218601936],
[2137.4929414561398,-4406.712370324365,4693.360650059984],
[2653.2158435604,-3753.4814401997883,4988.6944993751185],
[3132.5005934665846,-3040.4942664264813,5192.3960926817535],
[3567.5669349263253,-2280.0727787175124,5300.763295288279],
[3951.2234345567063,-1485.2597018724878,5311.843025129101],
[4276.984493703115,-669.5935481653801,5225.463482991121],
[4539.180077425394,153.12465600614763,5043.234933187101],
[4733.054104680662,969.0641723201768,4768.519137258709],
[4854.851945184337,1764.5975353535457,4406.368021783972],
[4901.894602337284,2526.5287746572085,3963.4322353936527],
[4872.638040139955,3242.3139122760485,3447.8405528745056],
[4766.7161311688715,3900.2687617916904,2869.0528128074093],
[4584.965506869625,4489.763953371475,2237.6859103983124],
[4329.43124826103,5001.398742401292,1565.3191482483255],
[4003.3524490321597,5427.153792992687,864.2799060123984],
[3611.127109943707,5760.518425697621,147.41451957672228],
[3158.257347308871,5996.589357194629,-572.149671175387],
[2651.2736097879606,6132.140601944784,-1281.2496930458642],
[2097.641827663134,6165.661165793486,-1966.9296992945742],
[1505.6533439875593,6097.362037409646,-2616.6795828774275],
[884.3005314955022,5929.152354834796,-3218.663136347477],
[243.14016142625485,5664.586183762081,-3761.9317647741977],
[-407.85165636122167,5308.782587445963,-4236.618902970976],
[-1058.4337099037361,4868.320158255778,-4634.11471112158],
[-1698.2564016808992,4351.110685666025,-4947.214973935787],
[-2317.021963512843,3766.253721297161,-5170.245225708355],
[-2904.6448820665632,3123.8754916761422,-5299.157736831856],
[-3451.411084374331,2434.9546824358035,-5331.60074057158],
[-3948.1330769702718,1711.1391434034733,-5266.959380086054],
[-4386.302036147335,964.5524465004091,-5106.368116867956],
[-4758.231363676725,207.5972424227134,-4852.694154887321],
[-5057.192530605184,-547.2457486708388,-4510.492002484944],
[-5277.539943333579,-1287.6196403039569,-4085.928916536554],
[-5414.822212900242,-2001.490380302772,-3586.682453257919],
[-5465.878273456699,-2677.343763199109,-3021.8086042710197],
[-5428.91419396359,-3304.3723837623684,-2401.58461505629],
[-5303.559268660988,-3872.652944979962,-1737.3263383167427],
[-5090.898549048495,-4373.308925899199,-1041.183638394016],
[-4793.479900359178,-4798.655497466018,-325.9170087904258],
[-4415.29496456159,-5142.322581700286,395.3388385077287],
[-3961.7319430296607,-5399.355222581455,1109.3230668921312],
[-3439.5025116149563,-5566.286084920604,1802.8982445330391],
[-2856.542590617384,-5641.180714919719,2463.2992484993856],
[-2221.8892250237272,-5623.653898446075,3078.374685148868],
[-1545.5373872340303,-5514.8575163821415,3636.8145309159822],
[-838.2765439421524,-5317.440710732318,4128.362245034142],
[-111.51464368134634,-5035.484190127458,4544.003089917214],
[622.9101290288597,-4674.410942679211,4876.128462051345],
[1352.9251109232373,-4240.87599461021,5118.672411767891],
[2066.423539513512,-3742.637914471853,5267.218796271014],
[2751.4650004540435,-3188.4160165579597,5319.077670207431],
[3396.4765880854266,-2587.733534948532,5273.330939593206],
[3990.447189935801,-1950.7528250681269,5130.846033958489],
[4523.115800171804,-1288.1026932805546,4894.2584902318395],
[4985.149689030729,-610.7012807192712,4567.923414770495]];

/*	var points = [
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
	*/
	
	// pulled from three.js "earth" example
	var earthTexture = new THREE.Texture();
	var loader = new THREE.ImageLoader();
	loader.addEventListener('load', function(event) {
		earthTexture.image = event.content;
		earthTexture.needsUpdate = true;
		//earthTexture.offset.set(0.5,0);
		render();
	});
	loader.load( 'images/textures/earthmap1k.jpg' );
	var geometry = new THREE.SphereGeometry(63, 24, 24);
	var material = new THREE.MeshLambertMaterial({map: earthTexture, overdraw: true});
	var mesh = new THREE.Mesh(geometry, material);
	scene.add( mesh ); 
	
	// Issues with CanvasRenderer:
	// - Texture mapped sphere appears to obscure lines (incorrectly drawn on top).
	// - Texture mapped sphere with MeshLambertMaterial does not appear illuminated/shaded.
	
	
	var lc = new THREE.LineBasicMaterial({color: 0xFF0000, linewidth: 2});
	
	// opacity doesn't seem to be supported, at least w/Firefox on linux
	var wMaterial = new THREE.MeshBasicMaterial({color: 0xAA2222, opacity: 0.5, transparent: true});
	for (var i = 1; i < points.length; i++) {
		var pg = new THREE.Geometry();
		//pg.vertices.push(new THREE.Vector3(0, 0, 0));
		pg.vertices.push(new THREE.Vector3(points[i][0]/100.0, points[i][2]/100.0, points[i][1]/-100.0));
		pg.vertices.push(new THREE.Vector3(points[i-1][0]/100.0, points[i-1][2]/100.0, points[i-1][1]/-100.0));
		
		var segment = new THREE.Line(pg, lc);
		scene.add(segment);
		
		
		var vertices = [], faces = [], wGeometry;
		vertices.push(new THREE.Vector3(0, 0, 0));
		vertices.push(new THREE.Vector3(points[i][0]/100.0, points[i][2]/100.0, points[i][1]/-100.0));
		vertices.push(new THREE.Vector3(points[i-1][0]/100.0, points[i-1][2]/100.0, points[i-1][1]/-100.0));
		faces.push(new THREE.Face3(0, 1, 2));
		faces.push(new THREE.Face3(2, 1, 0));
		wGeometry = new THREE.Geometry();
		wGeometry.vertices = vertices;
		wGeometry.faces = faces;
		var wedge = new THREE.Mesh(wGeometry, wMaterial);
		// doesn't seem to make anything doublesided automatically, hence second faces.push above
		//wedge.doubleSided = true; 
		scene.add(wedge);
		
	}
	var mc = new THREE.LineBasicMaterial({color: 0xFFFF00, linewidth: 2});
	var pg = new THREE.Geometry();
	pg.vertices.push(new THREE.Vector3(0, 0, 0));
	pg.vertices.push(new THREE.Vector3(points[i-1][0]/100.0, points[i-1][2]/100.0, points[i-1][1]/-100.0));
	scene.add(new THREE.Line(pg, mc));
	
	// geocentric sunlight (model & position according to current timestamp) 
	var sunlight = new THREE.PointLight(0xFFFFFF);
	var sunTime = new Date;
	var julianTime = dateToJulianDate(sunTime);
	var siderealTime = satellite.gstime_from_jday(julianTime);
	var sun_eci = SolarPosition(julianTime);
	var sun_ecf = satellite.eci_to_ecf(sun_eci, siderealTime);
	var sun_tjs = satellite.ecf_to_threejs(sun_ecf);
	sunlight.position.set(sun_tjs[0]/100.0, sun_tjs[1]/100.0, sun_tjs[2]/100.0);
	scene.add(sunlight);
	
/*	var sunColor = new THREE.LineBasicMaterial({color: 0xFFFF00, linewidth: 3});
	var sunMarker = new THREE.Geometry();
	sunMarker.vertices.push(new THREE.Vector3(0, 0, 0));
	sunMarker.vertices.push(new THREE.Vector3(sun_tjs[0]/100.0, sun_tjs[1]/100.0, sun_tjs[2]/100.0));
	scene.add(new THREE.Line(sunMarker, sunColor));
*/	
	// low ambient light ensures the "night side" is visible.
	scene.add(new THREE.AmbientLight(0x202020));
}

/*
 * rotate the camera around the earth (simulation its revolution) an angle
 * appropriate to the given time span. For instance, 24 hours: 2pi. 12hours: pi.
 * 6hours: pi/2.
 */
function rotateTimeSpan(seconds) {
	var angle = (Math.PI/12) * (seconds / 60 / 60);
	controls.rotateLeft(angle);
}

function msToAngle(ms) {
	return secToAngle(ms / 1000);
}

function secToAngle(sec) {
	return minToAngle(sec / 60);
}

function minToAngle(min) {
	return hrsToAngle(min / 60);
}

function hrsToAngle(hrs) {
	return daysToAngle(hrs / 24);
}

function daysToAngle(days) {
	return (Math.PI * 2) * days;
}

/* orbit the camera around the y axis relative to its current position */
function incrementOrbitCameraAngle(angleIncrement) {
	return orbitCameraToAngle(getCameraOrbitAngle() + angleIncrement);
}

/*
 * return angle in radians between origin, x axis (equator x prime meridian),
 * and camera position. (only the angle around y axis matters; ignore other).
 */
function getCameraOrbitAngle() {
	return Math.atan2(camera.position.z, camera.position.x);
}

/*
 * rotate camera around threejs y axis
 * angle 0 is aligned with x axis (equator x prime meridian)
 * preserve current camera radius.
 */
function orbitCameraToAngle(angle) {
	
	// wrap angle to 0..2PI
	var theta = angle - (Math.PI * 2) * Math.floor(angle / (Math.PI * 2));
	
	// preserve phi (angle above/below equatorial plane)
	var phi = Math.atan2( Math.sqrt( camera.position.x * camera.position.x + camera.position.z * camera.position.z ), camera.position.y );
	var radius = camera.position.length();
	
	camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
	camera.position.y = radius * Math.cos(phi);
	camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
	
	return theta;
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
