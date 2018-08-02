

var orientation_list =[];
var orientation_valueX;
var orientation_valueY;
var orientation_valueZ;

var camera, scene, material, mesh, geometry, renderer, controls;

init();
animate();

function init() {

    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( 700, 700 );
    document.body.appendChild( renderer.domElement );

    // scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera( 30, 1, 1, 1000 ); // fov, aspect ratio, near, far
    camera.position.set( 20, 20, 20 );

    // controls
    controls = new THREE.OrbitControls( camera, renderer.domElement );

	var light = new THREE.HemisphereLight( 0xeeeeee, 0x888888, 1 );
	light.position.set( 0, 20, 0 );
	scene.add( light );

    // axes
    scene.add( new THREE.AxisHelper( 10 ) );

    // geometry
    // var geometry = new THREE.SphereGeometry( 5, 12, 8 );
    var geometry = new THREE.BoxGeometry( 6, 9, 1 );

    // material
    var material = new THREE.MeshPhongMaterial( {
        color: 0xff0000,
        shading: THREE.SmoothShading,
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1
    } );

    // mesh
    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    // wireframe - old way
    /*
    var helper = new THREE.EdgesHelper( mesh, 0xffffff );
    //var helper = new THREE.WireframeHelper( mesh, 0xffffff ); // alternate
    helper.material.linewidth = 2;
    scene.add( helper );
    */

    // wireframe - new way
    var geo = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
    var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
    var wireframe = new THREE.LineSegments( geo, mat );
    mesh.add( wireframe );

}

// function init() {
//       // camera
//       // camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
//       // camera.position.y = 150;
//       // camera.position.z = 500;
//       // renderer
//       renderer = new THREE.WebGLRenderer();
//       renderer.setSize( 700, 700 );
//       document.body.appendChild( renderer.domElement );
//
//       scene = new THREE.Scene()
//       scene.background = new THREE.Color( 0x042029 );
//       // camera = new THREE.PerspectiveCamera(50, 1, 1, 1000);
//       // camera.position.y = 0;
//       // camera.position.z = 900;
//       // camera.position.x = 0;
//       camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
//     camera.position.set( 20, 20, 20 );
//
//     // controls
//     controls = new THREE.OrbitControls( camera );
//
//       scene.add(camera);
//       scene.add( new THREE.AxisHelper( 20 ) );
//
//       // sphere object
//       // var radius = 50,
//       //     segments = 10,
//       //     rings = 10;
//       // // geometry = new THREE.SphereGeometry(radius, segments, rings);
//       geometry = new THREE.BoxGeometry( 300, 450, 50 );
//       // for ( var i = 0; i < geometry.faces.length; i += 2 ) {
//       //   var hex = Math.random() * 0xff0000;
//       //   geometry.faces[ i ].color.setHex( hex );
//       //   geometry.faces[ i + 1 ].color.setHex( hex );
//       // }
//       // var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
//       var material = new THREE.MeshPhongMaterial({
//
//           color: 0xff0000,
//           polygonOffset: true,
//           polygonOffsetFactor: 1, // positive value pushes polygon further away
//           polygonOffsetUnits: 1
//       });
//       // material = new THREE.MeshNormalMaterial({color:0x002288});
//       mesh = new THREE.Mesh( geometry, material );
//       // mesh = new THREE.Mesh(geometry, material);
//
//       //scene
//       ;
//       scene.add(mesh);
//
//       // wireframe
//       var geo = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
//       var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
//       var wireframe = new THREE.LineSegments( geo, mat );
//       mesh.add( wireframe );
//
//       // renderer
//       renderer = new THREE.WebGLRenderer();
//       renderer.setSize(700, 700);
//       document.body.appendChild(renderer.domElement);
//
//   }


function animate() {
    requestAnimationFrame(animate);
    render();

}

function render() {
    // resize(gl.canvas);
    // var rotation_value = 0.0001 * T.T_x;
    // // console.log(rotation_value);
    // orientation_value = (Math.abs(T.T_x) / T.T_x) * (180 - Math.abs(T.T_x)) + 90;
    // // $("#info").text(temp);
    // // orientation_list.push(temp);
    // // $("#info").text(temp);
    // var temp2 = orientation_value;
    // -16 => leaning backward
    // +60 => leaning forward a lot
    //range -1 - 30
    // if(temp >  && Math.abs(rotation_value) < 0.0175){
      mesh.rotation.x = (orientation_valueX/180) * 3.1416;
      mesh.rotation.y = (orientation_valueY/180) * 3.1416;
      mesh.rotation.z = -1 * (orientation_valueZ/180) * 3.1416;
      renderer.render(scene, camera);


}

//Z values are the most useful ones for the knee orientation
function calculateOrientation(body_joint, joint_string){
    var x = body_joint.orientationX;
    var y = body_joint.orientationY;
    var z = body_joint.orientationZ;
    var w = body_joint.orientationW;
    // $('#text').text(body_joint);
    // console.log(body_joint);
    var T_x = 180/3.1416*Math.atan2( 2*y*z+2*x*w,1-2*x*x - 2*y*y); // leaning forward/backward
    var T_y = 180/3.1416*Math.asin(2*y*w-2*x*z);                   // turning
    var T_z = 180/3.1416*Math.atan2( 2*x*y + 2*z*w,1 - 2*y*y - 2*z*z); // leaning left/right

    // orientation_value = (Math.abs(T_x) / T_x) * (180 - Math.abs(T_x)) + 90;
    // var joint_orientationX = (Math.abs(T_x) / T_x) * (180 - Math.abs(T_x)) + 180;
    // var joint_orientationY = (Math.abs(T_y) / T_y) * (Math.abs(T_y) ) + 180;
    // var joint_orientationZ = (Math.abs(T_z) / T_z) * (180 - Math.abs(T_z)) + 180;
    var joint_orientationX = T_x + 180;
    var joint_orientationY = T_y + 180;
    var joint_orientationZ = T_z + 180;
    // console.log(joint_orientationX, joint_orientationY, joint_orientationZ);
    // $('#text').text(Math.round(joint_orientationX) + ' ' + Math.round(joint_orientationY) + ' ' + Math.round(joint_orientationZ));
    // $('#text').text(Math.round(T_x) + ' ' + Math.round(T_y) + ' ' + Math.round(T_z));
    if(joint_string == "spine_mid"){
      orientation_valueX = joint_orientationX;
      orientation_valueY = joint_orientationY;
      orientation_valueZ = joint_orientationZ;
    }

    return joint_orientationX;
  }
