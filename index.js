const https = require('https');
var util = require('util');
const fs = require('fs');
var x = (Math.random()*0xFFFF33<<0).toString(16);
var filename = 'data_' + x + '.txt';
var DTW = require('dtw');

var data_check = "";
var data_list = [];

//I have created these arrays so that the data sent to the server is not lost when the scope of the events gt1, gt2, ex1 etc ends
var data_gt1=[];
var data_gt2=[];
var data_ex1=[];
var data_ex2=[];
var data_ex3=[];
var data_ex4=[];

var test_gt = [];
var test_ex = [];
//gt1
var gt1_dist_hand = [];
var gt1_dist_elbow = [];
var gt1_dist_shoulder = [];
//squatting
var gt1_dist_spine_mid = [];
var gt1_dist_spine_base = [];
var gt1_dist_knee = [];
var gt1_dist_knee_left = [];
var gt1_dist_ankle = [];
var gt1_dist_ankle_left = [];

//squatting
var gt2_dist_spine_mid = [];
var gt2_dist_spine_base = [];
var gt2_dist_knee = [];
var gt2_dist_knee_left = [];
var gt2_dist_ankle = [];
var gt2_dist_ankle_left = [];

var max_X = 0;
var max_Y = 0;
var max_X2 = 0;
var max_Y2 = 0;

//ex1
var ex1_dist_hand = [];
var ex1_dist_elbow = [];
var ex1_dist_shoulder = [];
//squatting
var ex1_dist_spine_mid = [];
var ex1_dist_spine_base = [];
var ex1_dist_knee = [];
var ex1_dist_knee_left = [];
var ex1_dist_ankle = [];
var ex1_dist_ankle_left = [];

//squatting
var ex2_dist_spine_mid = [];
var ex2_dist_spine_base = [];
var ex2_dist_knee_right = [];
var ex2_dist_knee_left = [];
var ex2_dist_ankle_right = [];
var ex2_dist_ankle_left = [];

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

function distance(x1, y1, x2, y2){
  return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
}


var Kinect2 = require('kinect2'), //Ensure that the directory structure is such that lib folder is accessible
	express = require('express'),
	app = express(),
	server = https.createServer(options, app),
	io = require('socket.io').listen(server);

const cluster = require('cluster'); // using cluster module for parallel processing
const numCPUs = require('os').cpus().length; //used to identify # of CPU cores in the system

	var kinect = new Kinect2();

	if(kinect.open()) {
		server.listen(8000);
		console.log('Server listening on port 8000');
		console.log('Point your browser to https://localhost:8000');

		app.use(express.static('public'))

	io.on('connection', function(socket){
  	console.log('a user connected');
		socket.on('draw', function(data){
			// io.sockets.emit('bodyFrame', bodyFrame);
			console.log("Received canvas.");
			io.sockets.emit('draw', data);
			console.log("Emitted canvas.");
		});

    socket.on('gt1', function(body_list_gt1){
        console.log("Logging body_list_gt1");
        data_gt1 = body_list_gt1;
        exercise_vals('gt1', body_list_gt1);

      for(var value in body_list_gt1){
          // console.log(body_list_gt1[value][11].depthX, body_list_gt1[value][11].depthY)
          max_X = body_list_gt1[0][11].depthX;
          max_Y = body_list_gt1[0][11].depthY;
          max_X2 = body_list_gt1[0][11].depthX;
          max_Y2 = body_list_gt1[0][11].depthY;

          if(max_X < body_list_gt1[value][11].depthX)
            max_X = body_list_gt1[value][11].depthX;
          if(max_Y < body_list_gt1[value][11].depthY)
            max_Y = body_list_gt1[value][11].depthY;

          if(max_X2 < body_list_gt1[value][11].depthX)
            max_X2 = body_list_gt1[value][11].depthX;
          if(max_Y2 > body_list_gt1[value][11].depthY)
            max_Y2 = body_list_gt1[value][11].depthY;
      }
			io.sockets.emit('maximas', {max_X: max_X, max_Y: max_Y, max_X2: max_X2, max_Y2: max_Y2});
			console.log("Emitted maximas", max_X, max_Y, max_X2, max_Y2);
		});
    //Added conditional so that program does not break in the case of only one ground truth.

    socket.on('gt2', function (body_list_gt2) {
      if (body_list_gt2 != []){
        exercise_vals('gt2', body_list_gt2);
        console.log("Logging body_list_gt2");
        data_gt2 = body_list_gt2;
        for (var value in body_list_gt2) {

            max_X = body_list_gt2[0][11].depthX;
            max_Y = body_list_gt2[0][11].depthY;
            max_X2 = body_list_gt2[0][11].depthX;
            max_Y2 = body_list_gt2[0][11].depthY;

            if (max_X < body_list_gt2[value][11].depthX)
                max_X = body_list_gt2[value][11].depthX;
            if (max_Y < body_list_gt2[value][11].depthY)
                max_Y = body_list_gt2[value][11].depthY;

            if (max_X2 < body_list_gt2[value][11].depthX)
                max_X2 = body_list_gt2[value][11].depthX;
            if (max_Y2 > body_list_gt2[value][11].depthY)
                max_Y2 = body_list_gt2[value][11].depthY;
              }
        }
        io.sockets.emit('maximas', {max_X: max_X, max_Y: max_Y, max_X2: max_X2, max_Y2: max_Y2});
        console.log("Emitted maximas", max_X, max_Y, max_X2, max_Y2);
    });


    socket.on('ex1', function(body_list_ex1){
        console.log("Logging body_list_ex1");
        data_ex1 = body_list_ex1;
		    exercise_vals('ex1', body_list_ex1);
        // test_ex = body_list_ex1;
    });

    socket.on('ex2', function(body_list_ex2){
        console.log("Logging body_list_ex2");
        data_ex2 = body_list_ex2;
        exercise_vals('ex2',body_list_ex2);
        // test_ex = body_list_ex2;
    });

    socket.on('ex3', function(body_list_ex3){
        console.log("Logging body_list_ex3");
        data_ex3 = body_list_ex3;
        exercise_vals('ex3',body_list_ex3);
        // test_ex = body_list_ex3;
    });

    socket.on('ex4', function(body_list_ex4){
        console.log("Logging body_list_ex4");
        data_ex4 = body_list_ex4;
        exercise_vals('ex4', body_list_ex4);
        // test_ex = body_list_ex4;
    });


    function exercise_vals(ex_val, body_list_ex) {
	      eval(ex_val+"_dist_hand_right = distance_joint(body_list_ex, 'hand_right');");
        eval(ex_val+"_dist_hand_right = distance_joint(body_list_ex, 'hand_right');");
        eval(ex_val+"_dist_elbow_right = distance_joint(body_list_ex, 'shoulder_right');");
        eval(ex_val+"_dist_spine_mid = distance_joint(body_list_ex, 'spine_mid');");
        eval(ex_val+"_dist_spine_base = distance_joint(body_list_ex, 'spine_base');");
        eval(ex_val+"_dist_knee_right = distance_joint(body_list_ex, 'knee_right');");
        eval(ex_val+"_dist_knee_left = distance_joint(body_list_ex, 'knee_left');");
        eval(ex_val+"_dist_ankle_right = distance_joint(body_list_ex, 'ankle_right');");
        eval(ex_val+"_dist_ankle_left = distance_joint(body_list_ex, 'ankle_left');");
    };

    joints_vals = {'hand_right':11, 'elbow_right': 9, 'shoulder_right':8, 'spine_mid':1, 'spine_base':0, 'knee_right': 17, 'knee_left': 13, 'ankle_right':18, 'ankle_left': 14};
    function distance_joint(body_list_ex, joint) {
        var ex_dist_result = [];
        for (var value in body_list_ex) {
            point1 = body_list_ex[value][joints_vals[joint]];
            point2 = body_list_ex[value][2];
            x_value = point1.depthX  - point2.depthX;
            y_value = point1.depthY - point2.depthY;
            z_value = point1.cameraZ - point2.cameraZ;
            ex_dist_result.push({X: x_value, Y: y_value, Z: z_value})
        }
        return ex_dist_result;
    };

    socket.on('compare', function(data){
      console.log("DTW Results for: " + data.mode);
      console.log("Comparing gt: " + data.gt_num + " with ex: " + data.ex_num);

      if(data.mode == 'squat'){
        compare_values(data.gt_num, data.ex_num);
      }


      function compare_values(gt_num, ex_num) {
        var selector_values = {1: 'gt1', 2: 'gt2', 5: 'ex1', 6: 'ex2', 7:'ex3', 8:'ex4'};
        console.log('gt_num: ' +gt_num + 'ex_num: ' + ex_num);
          ex_num = ex_num - 4;
          var gt_string = selector_values[gt_num];
          var ex_string = selector_values[ex_num+4];

          //Can change these strings to be more generic variables.
          eval("gt1_dist_hand = " + gt_string + "_dist_spine_mid;");
          eval("ex1_dist_hand = " + ex_string + "_dist_spine_mid;");

          eval("gt1_dist_elbow = " + gt_string + "_dist_spine_base;");
          eval("ex1_dist_elbow = " + ex_string + "_dist_spine_base;");

          eval("gt1_dist_shoulder = " + gt_string +"_dist_knee_right;");
          eval("ex1_dist_shoulder = " + ex_string + "_dist_knee_right;");
      }

      var dtw_hand = new DTW();
      // List of objects look like this: { handX: 0.13617157936096191, handY: 0.30291637778282166, handZ: 0.30291637778282166 }
      var cost_hand = dtw_hand.compute(gt1_dist_hand, ex1_dist_hand);
      var path_hand = dtw_hand.path();
      console.log('Cost hand: ' + cost_hand);

      var dtw_elbow = new DTW();
      var cost_elbow = dtw_elbow.compute(gt1_dist_elbow, ex1_dist_elbow);
      var path_elbow = dtw_elbow.path();
      console.log('Cost elbow: ' + cost_elbow);

      var dtw_shoulder = new DTW();
      var cost_shoulder = dtw_shoulder.compute(gt1_dist_shoulder, ex1_dist_shoulder);
      var path_shoulder = dtw_shoulder.path();
      console.log('Cost shoulder: ' + cost_shoulder);
      // console.log(test_gt.length, test_ex.length);

      //Check which exercise amplitude to compare and send that value to chart.js
      console.log(data.gt_num, data.ex_num)
      if(data.gt_num == '1') test_gt = data_gt1;
      if(data.gt_num == '2') test_gt = data_gt2;
      if(data.ex_num == '5') test_ex = data_ex1;
      if(data.ex_num == '6') test_ex = data_ex2;
      if(data.ex_num == '7') test_ex = data_ex3;
      if(data.ex_num == '8') test_ex = data_ex4;
        io.sockets.emit('chart', {gt: test_gt, ex: test_ex, cost_hand: cost_hand, path_hand: path_hand, cost_elbow: cost_elbow, path_elbow: path_elbow, cost_shoulder: cost_shoulder, path_shoulder: path_shoulder} );

		});

    socket.on('db', function(data){
      // data_check = data;
      if(JSON.stringify(data_check) != JSON.stringify(data)){
        data_check = data;
        data_list.push(data);
        fs.appendFile(filename, JSON.stringify(data, null, 4), (err) => {
          // data.handX, data.handY, data.elbowX, data.elbowY, data.shoulderX, data.shoulderY
          // if (err) throw err;
          // console.log('The "data to append" was appended to file!');
        });
      }
    });

    socket.on('record', function(data){
      var x = data;
      socket.emit('record', x);
    });

    socket.on('stop', function(data){
      var x = data;
      socket.emit('stop', x);
    });

    socket.on('save', function(data){
      //Make directory
      var date = new Date();
      var h = date.getHours().toString();
      var m = date.getMinutes().toString();
      var s = date.getSeconds().toString();
      // console.log(x, y, z);
      var dir = './' + 'data' + h + '_' + m + '_' + s;
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      //Saving all the data to files
      fs.writeFileSync(dir + '/gt1_dist_spine_mid.txt', util.inspect(gt1_dist_spine_mid) , 'utf-8');
      fs.writeFileSync(dir + '/gt1_dist_spine_base.txt', util.inspect(gt1_dist_spine_base) , 'utf-8');
      fs.writeFileSync(dir + '/gt1_dist_knee_right.txt', util.inspect(gt1_dist_knee) , 'utf-8');
      fs.writeFileSync(dir + '/gt1_dist_knee_left.txt', util.inspect(gt1_dist_knee_left) , 'utf-8');
      fs.writeFileSync(dir + '/gt1_dist_ankle.txt', util.inspect(gt1_dist_ankle) , 'utf-8');
      fs.writeFileSync(dir + '/gt1_dist_ankle_left.txt', util.inspect(gt1_dist_ankle_left) , 'utf-8');

      fs.writeFileSync(dir + '/gt2_dist_spine_mid.txt', util.inspect(gt2_dist_spine_mid) , 'utf-8');
      fs.writeFileSync(dir + '/gt2_dist_spine_base.txt', util.inspect(gt2_dist_spine_base) , 'utf-8');
      fs.writeFileSync(dir + '/gt2_dist_knee_right.txt', util.inspect(gt2_dist_knee) , 'utf-8');
      fs.writeFileSync(dir + '/gt2_dist_knee_left.txt', util.inspect(gt2_dist_knee_left) , 'utf-8');
      fs.writeFileSync(dir + '/gt2_dist_ankle.txt', util.inspect(gt2_dist_ankle) , 'utf-8');
      fs.writeFileSync(dir + '/gt2_dist_ankle_left.txt', util.inspect(gt2_dist_ankle_left) , 'utf-8');

      fs.writeFileSync(dir + '/ex1_dist_spine_mid.txt', util.inspect(ex1_dist_spine_mid) , 'utf-8');
      fs.writeFileSync(dir + '/ex1_dist_spine_base.txt', util.inspect(ex1_dist_spine_base) , 'utf-8');
      fs.writeFileSync(dir + '/ex1_dist_knee_right.txt', util.inspect(ex1_dist_knee) , 'utf-8');
      fs.writeFileSync(dir + '/ex1_dist_knee_left.txt', util.inspect(ex1_dist_knee_left) , 'utf-8');
      fs.writeFileSync(dir + '/ex1_dist_ankle_right.txt', util.inspect(ex1_dist_ankle) , 'utf-8');
      fs.writeFileSync(dir + '/ex1_dist_ankle_left.txt', util.inspect(ex1_dist_ankle_left) , 'utf-8');

      fs.writeFileSync(dir + '/ex2_dist_spine_mid.txt', util.inspect(ex2_dist_spine_mid) , 'utf-8');
      fs.writeFileSync(dir + '/ex2_dist_spine_base.txt', util.inspect(ex2_dist_spine_base) , 'utf-8');
      fs.writeFileSync(dir + '/ex2_dist_knee_right.txt', util.inspect(ex2_dist_knee_right) , 'utf-8');
      fs.writeFileSync(dir + '/ex2_dist_knee_left.txt', util.inspect(ex2_dist_knee_left) , 'utf-8');
      fs.writeFileSync(dir + '/ex2_dist_ankle_right.txt', util.inspect(ex2_dist_ankle_right) , 'utf-8');
      fs.writeFileSync(dir + '/ex2_dist_ankle_left.txt', util.inspect(ex2_dist_ankle_left) , 'utf-8');

      console.log("Data saved to " + dir);

    });

	});

	kinect.on('bodyFrame', function(bodyFrame){
		io.sockets.emit('bodyFrame', bodyFrame);
	});


	kinect.openBodyReader();
}
