
var camera, scene, material, mesh, geometry, renderer;
var orientation_list =[];
var orientation_valueX;
var orientation_valueY;
var orientation_valueZ;

function drawCube() {
      init();
      animate();

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


function init() {
      // camera
      // camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
      // camera.position.y = 150;
      // camera.position.z = 500;

      scene = new THREE.Scene()
      scene.background = new THREE.Color( 0x042029 );
      camera = new THREE.PerspectiveCamera(50, 1, 1, 1000);
      camera.position.y = 0;
      camera.position.z = 900;
      camera.position.x = 0;
      scene.add(camera);

      // sphere object
      // var radius = 50,
      //     segments = 10,
      //     rings = 10;
      // // geometry = new THREE.SphereGeometry(radius, segments, rings);
      geometry = new THREE.BoxGeometry( 300, 450, 50 );
      for ( var i = 0; i < geometry.faces.length; i += 2 ) {
        var hex = Math.random() * 0xff0000;
        geometry.faces[ i ].color.setHex( hex );
        geometry.faces[ i + 1 ].color.setHex( hex );
      }
      var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
      // material = new THREE.MeshNormalMaterial({color:0x002288});
      mesh = new THREE.Mesh( geometry, material );
      // mesh = new THREE.Mesh(geometry, material);

      //scene
      ;
      scene.add(mesh);


      // renderer
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(700, 700);
      document.body.appendChild(renderer.domElement);

  }


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
      // mesh.rotateX(0.01);
      // mesh.rotateY(0.01);
      //mesh.rotateZ(0.01);
      //mesh.rotation.z += .02;

      // $("#info").text(mesh.rotation.x);
      // console.log(mesh.rotation.x);
      // mesh.rotation.x = Math.PI;
      // mesh.rotationX = temp + 90;
      // console.log(mesh.rotation.x);
    // }

    // mesh.rotateX(0.05);
    // mesh.rotateY(0.05);
    // mesh.rotateZ(0.05);
    // mesh.rotation.y += .02;
    // renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.render(scene, camera);


}

// fn callin
drawCube();
