var socket = io.connect('/');
var width = 700;
var height = 700;
var canvas1 = document.getElementById('bodyCanvas');
var canvas2 = document.getElementById('drawCanvas_gt');
var canvas3 = document.getElementById('drawCanvas_ex');

var ctx1 = canvas1.getContext('2d');
var ctx2 = canvas2.getContext('2d');
var ctx3 = canvas3.getContext('2d');

var colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
var radius=9;

var body_joints_check; // Used to remove repeating values from being recorded
var maxX; //Record maximas and minimas on ctx1
var maxY;
var maxX2;
var maxY2;

var body_list = [];
var body_list_gt1 = [];
var body_list_gt2 = [];

var body_list_ex1 = [];
var body_list_ex2 = [];
var body_list_ex3 = [];
var body_list_ex4 = [];

var record = 0;
var selector = 0; //Used to select what to record gt or ex1. 1 - 4 = gt1 - gt4, 5 - 8 = ex1 - ex4
var selector_gt = 0; // 1 = gt1, 2 = gt2
var selector_ex = 0; // 1 = ex1, 2 = ex2
var hand_squat_selector; //string, hand/squat
var main_counter = 0; // used to keep track of total "sets" of gts & ex's recorded a maximum of 2 gts & 2 ex are supported at the moment
var gt_background = 0; //Used to draw maximas on canvas1 (i.e. ctx1)
var temp; //Used to store canvas1

// Scoring system
var score_knee_distance = [100,100,100,100];

var polling_counter = 0;
var test_counter = 0;
var color_value;

// Body joints flag
var body_joints_flag = 0;
var initial_point;
var increasing = true;
var total_distance_hand_speed;

//Video calling feature is implemented using PubNub WebRTC. Tutorial here: https://www.pubnub.com/blog/2015-08-25-webrtc-video-chat-app-in-20-lines-of-javascript/
var video_out = document.getElementById("vid-box");

$(function(){
    $( "#vid-box" ).draggable();
  });

function login(form) {
    var phone = window.phone = PHONE({
        number        : form.username.value || "Anonymous", // listen on username line else Anonymous
        publish_key   : 'pub-c-cd012920-5cef-4e13-aa6f-07cf674e9750',
        subscribe_key : 'sub-c-f6d1884c-c4c9-11e6-90ff-0619f8945a4f',
    });
    phone.ready(function(){ form.username.style.background="#55ff5b"; });
    phone.receive(function(session){
        session.connected(function(session) { video_out.appendChild(session.video); });
        session.ended(function(session) { video_out.innerHTML=''; });
    });
    return false;   // So the form does not submit.
}

function makeCall(form){
    if (!window.phone) alert("Login First!");
    else phone.dial(form.number.value);
    return false;
}
//End of video calling code section

//This function is used to draw red dots at all the body joints
function drawJoints(jointType, cx,cy){
    ctx1.beginPath();
    ctx1.arc(cx,cy,radius,0,Math.PI*2); //radius is a global variable defined at the beginning
    ctx1.closePath();
    ctx1.fill();
  }

//redraw, forloop & forloop2 are used to draw the recorded exercise
function redraw(body_list_to_draw){
  for(var value in body_list_to_draw) {
    setTimeout(forloop(value, body_list_to_draw), 2*1000);
  };
}

//Nested forloops along with setTimeout are used to add delay while draw so that it is perceivable to the user
function forloop(value, body_list_to_draw){
  var count = 0;
  for(var jointType in value){
    count++;
    (function(count,jointType,value) {
        setTimeout(function() { forloop2(jointType,value, body_list_to_draw); }, 1*1000);
    })(count,jointType,value);
  }
}

function forloop2(jointType,value, body_list_to_draw){
  // console.log("X= ", body_list_to_draw[value][11].depthX, "Y= ", body_list_to_draw[value][11].depthY);
  var joint_hand = body_list_to_draw[value][11] // right hand
  var joint_elbow = body_list_to_draw[value][9]; //elbowRight
  var joint_shoulder = body_list_to_draw[value][8]; // shoulder right
  var joint_hip = body_list_to_draw[value][16]; //hip right
  var joint_knee = body_list_to_draw[value][17]; //hip right
  var joint_ankle = body_list_to_draw[value][18]; //ankle right

  var joint_neck = body_list_to_draw[value][2]; //neck
  var joint_head = body_list_to_draw[value][3]; //neck
  var joint_spine_base = body_list_to_draw[value][0]; //spine base
  var joint_spine_mid = body_list_to_draw[value][1]; // spine mid

  var joint_hand_left = body_list_to_draw[value][7] // left hand
  var joint_elbow_left = body_list_to_draw[value][5]; //left elbow
  var joint_shoulder_left = body_list_to_draw[value][4]; //shoulder left
  var joint_hip_left = body_list_to_draw[value][12]; //hip left
  var joint_knee_left = body_list_to_draw[value][13]; //knee left
  var joint_ankle_left = body_list_to_draw[value][14]; //ankle left

  //Draw gt or ex on the two different canvases. Red = gt, green = ex
  if(selector == '1' || selector == '2' || selector == '3' || selector == '4'){
    if(hand_squat_selector == 'hand')
      drawHandOnCanvas(ctx2, joint_hand, joint_elbow, joint_shoulder, joint_neck, "red");
    else if(hand_squat_selector == 'squat')
      drawSquatOnCanvas(ctx2, joint_knee, joint_knee_left, joint_hip, joint_hip_left, joint_ankle, joint_ankle_left, "red");
  }
  //selector 5 corresponds to ex1, 6 to ex2 and so on
  if(selector == '5' || selector == '6' || selector == '7' || selector == '8'){
    if(hand_squat_selector == 'hand')
      drawHandOnCanvas(ctx3, joint_hand, joint_elbow, joint_shoulder, joint_neck, "green");
    else if(hand_squat_selector == 'squat')
      drawSquatOnCanvas(ctx3, joint_knee, joint_knee_left, joint_hip, joint_hip_left, joint_ankle, joint_ankle_left, "green");
  }
    socket.emit('db', {handX: joint_hand.depthX * width, handY: joint_hand.depthY * height, elbowX: joint_elbow.depthX * width, elbowY: joint_elbow.depthY * height, shoulderX: joint_shoulder.depthX * width, shoulderY: joint_shoulder.depthY * height })
}

//Single function to redraw all gts & ex once the patient has stopped performing the exercise
function drawHandOnCanvas(ctx, joint_hand, joint_elbow, joint_shoulder, joint_neck, color){
  ctx.beginPath();
  // ctx.arc(body_list_to_draw[value][jointType].depthX * width, body_list_to_draw[value][jointType].depthY * height, 5, 0, Math.PI * 2, true);
  //Draw skeleton for the arm
  ctx.moveTo(joint_hand.depthX * width, joint_hand.depthY * height);
  ctx.lineTo(joint_elbow.depthX * width, joint_elbow.depthY * height);
  ctx.moveTo(joint_elbow.depthX * width, joint_elbow.depthY * height);
  ctx.lineTo(joint_shoulder.depthX * width, joint_shoulder.depthY * height);
  ctx.lineWidth=1; //Since the lines usually overlap, keeping them thin looks better
  ctx.strokeStyle="black";
  ctx.stroke();

  //Draw circle for neck, shoulder, elbow & hand on canvas 2 & 3
  drawCircle(ctx, joint_hand.depthX * width, joint_hand.depthY * height, 10, color);
  drawCircle(ctx, joint_elbow.depthX * width, joint_elbow.depthY * height, 10, color);
  drawCircle(ctx, joint_shoulder.depthX * width, joint_shoulder.depthY * height, 10, color);
  drawCircle(ctx, joint_neck.depthX * width, joint_neck.depthY * height, 10, color);
  ctx.strokeStyle="black";
}

function drawSquatOnCanvas(ctx, joint_knee, joint_knee_left, joint_hip, joint_hip_left, joint_ankle, joint_ankle_left, color){
  ctx.beginPath();
  // ctx.arc(body_list_to_draw[value][jointType].depthX * width, body_list_to_draw[value][jointType].depthY * height, 5, 0, Math.PI * 2, true);
  //Draw skeleton for the arm
  ctx.moveTo(joint_hip.depthX * width, joint_hip.depthY * height);
  ctx.lineTo(joint_knee.depthX * width, joint_knee.depthY * height);
  ctx.moveTo(joint_knee.depthX * width, joint_knee.depthY * height);
  ctx.lineTo(joint_ankle.depthX * width, joint_ankle.depthY * height);
  ctx.moveTo(joint_hip_left.depthX * width, joint_hip_left.depthY * height);
  ctx.lineTo(joint_knee_left.depthX * width, joint_knee_left.depthY * height);
  ctx.moveTo(joint_knee_left.depthX * width, joint_knee_left.depthY * height);
  ctx.lineTo(joint_ankle_left.depthX * width, joint_ankle_left.depthY * height);
  ctx.moveTo(joint_hip.depthX * width, joint_hip.depthY * height);
  ctx.lineTo(joint_hip_left.depthX * width, joint_hip_left.depthY * height);
  ctx.lineWidth=1;
  ctx.strokeStyle="black";
  ctx.stroke();

  //Draw circle for neck, shoulder, elbow & hand
  drawCircle(ctx, joint_hip.depthX * width, joint_hip.depthY * height, 10, color);
  drawCircle(ctx, joint_knee.depthX * width, joint_knee.depthY * height, 10, color);
  drawCircle(ctx, joint_hip_left.depthX * width, joint_hip_left.depthY * height, 10, color);
  drawCircle(ctx, joint_knee_left.depthX * width, joint_knee_left.depthY * height, 10, color);
  drawCircle(ctx, joint_ankle.depthX * width, joint_ankle.depthY * height, 10, color);
  drawCircle(ctx, joint_ankle_left.depthX * width, joint_ankle_left.depthY * height, 10, color);
  ctx.strokeStyle="black";
}

//Used to draw circles for hand, elbow & shoulder
function drawCircle(ctx, x, y, r, color){
  ctx.beginPath();
  ctx.strokeStyle=color;
  ctx.arc(x, y,r,0,Math.PI*2);
  ctx.stroke();
}

//Draw the circle which shows correct position in front of the Kinect
function drawCenterCircle(x, y, r, nx, ny){
  ctx1.beginPath();
  if(nx > x-r && nx < x+r && ny > y-r && ny < y+r)
    ctx1.strokeStyle="green";
  else
    ctx1.strokeStyle="red";

  ctx1.arc(x, y,r,0,Math.PI*2);
  ctx1.stroke();
  ctx1.closePath();
  ctx1.strokeStyle="black";
}

//Look-up for joint selection
// Kinect2.JointType = {
//  spineBase       : 0,
//  spineMid        : 1,
//  neck            : 2,
//  head            : 3,
//  shoulderLeft    : 4,
//  elbowLeft       : 5,
//  wristLeft       : 6,
//  handLeft        : 7,
//  shoulderRight   : 8,
//  elbowRight      : 9,
//  wristRight      : 10,
//  handRight       : 11,
//  hipLeft         : 12,
//  kneeLeft        : 13,
//  ankleLeft       : 14,
//  footLeft        : 15,
//  hipRight        : 16,
//  kneeRight       : 17,
//  ankleRight      : 18,
//  footRight       : 19,
//  spineShoulder   : 20,
//  handTipLeft     : 21,
//  thumbLeft       : 22,
//  handTipRight    : 23,
//  thumbRight      : 24
// };

//Voice control
socket.on('bodyFrame', function(bodyFrame){
  //Calling this function enables the voice calling features from noice.js
  voice_commands();
  //Clear canvas1 each time the entire skeleton is drawn to prevent overlapping
  ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
  var index = 0;

  bodyFrame.bodies.forEach(function(body){
    if(body.tracked) {
      test_counter++;
      ctx2.drawImage(canvas1, 0, 0);
      // console.log("tracking on")
      drawCircle(ctx1, 50, 50, 10, "green")

      for(var jointType in body.joints) {
        // console.log("body joints= ", body.joints);

        // console.log(test_counter);
        if(record == 1){

          if(JSON.stringify(body.joints) != JSON.stringify(body_joints_check)){
            polling_counter++;
            body_joints_check = body.joints;
            body_list.push(body.joints);
            get_speed(body.joints);
          }
        }

          // body_list.push(body.joints)
        var joint_hand = body.joints[11] // right hand
        var joint_elbow = body.joints[9]; //elbowRight
        var joint_shoulder = body.joints[8]; // shoulder right
        var joint_hip = body.joints[16]; //hip right
        var joint_knee = body.joints[17]; //knee right
        var joint_ankle = body.joints[18]; //ankle left

        var joint_neck = body.joints[2];  //neck
        var joint_head = body.joints[3];  //neck
        var joint_spine_base = body.joints[0]; //spine base
        var joint_spine_mid = body.joints[1]; // spine mid

        var joint_hand_left = body.joints[7] // left hand
        var joint_elbow_left = body.joints[5]; //left elbow
        var joint_shoulder_left = body.joints[4]; //shoulder left
        var joint_hip_left = body.joints[12]; //hip left
        var joint_knee_left = body.joints[13]; //knee left
        var joint_ankle_left = body.joints[14]; //ankle left

        ctx1.fillStyle = colors[index];


        //Draw the skeleton joints in real-time
        if(jointType == 11 || jointType == 9 || jointType == 9 || jointType == 8 || jointType == 16 ||
          jointType == 17 || jointType == 2 || jointType == 3 || jointType == 0 || jointType == 1 || jointType == 7 || jointType == 5 ||
          jointType == 4 || jointType == 12 || jointType == 13 || jointType == 14 || jointType == 18){
            drawJoints(jointType, body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);

        }

        //Draw center circle for checking the patient position
        drawCenterCircle(width/2, height/5, 50, joint_neck.depthX * width, joint_neck.depthY * height);

        //Draw maximas from the gt
        if(gt_background == 1){
          drawCircle(ctx1, maxX * width, maxY * height, 10);
          drawCircle(ctx1, maxX2 * width, maxY2 * height, 10);
          // console.log(maxX, maxY);
        }

        // $("#text").text("X: "+ joint_hand.depthX + ", Y: " + joint_hand.depthY);


        //Draw skeleton in real-time
        ctx1.beginPath();
        ctx1.moveTo(joint_hand.depthX * width, joint_hand.depthY * height);
        ctx1.lineTo(joint_elbow.depthX * width, joint_elbow.depthY * height);
        ctx1.moveTo(joint_elbow.depthX * width, joint_elbow.depthY * height);
        ctx1.lineTo(joint_shoulder.depthX * width, joint_shoulder.depthY * height);
        ctx1.moveTo(joint_shoulder.depthX * width, joint_shoulder.depthY * height);
        ctx1.lineTo(joint_shoulder_left.depthX * width, joint_shoulder_left.depthY * height);
        ctx1.moveTo(joint_shoulder_left.depthX * width, joint_shoulder_left.depthY * height);
        ctx1.lineTo(joint_elbow_left.depthX * width, joint_elbow_left.depthY * height);
        ctx1.moveTo(joint_elbow_left.depthX * width, joint_elbow_left.depthY * height);
        ctx1.lineTo(joint_hand_left.depthX * width, joint_hand_left.depthY * height);
        ctx1.moveTo(joint_hip_left.depthX * width, joint_hip_left.depthY * height);
        ctx1.lineTo(joint_hip.depthX * width, joint_hip.depthY * height);
        ctx1.moveTo(joint_hip.depthX * width, joint_hip.depthY * height);
        ctx1.lineTo(joint_knee.depthX * width, joint_knee.depthY * height);
        ctx1.moveTo(joint_hip_left.depthX * width, joint_hip_left.depthY * height);
        ctx1.lineTo(joint_knee_left.depthX * width, joint_knee_left.depthY * height);
        ctx1.moveTo(joint_knee_left.depthX * width, joint_knee_left.depthY * height);
        ctx1.lineTo(joint_ankle_left.depthX * width, joint_ankle_left.depthY * height);
        //
        ctx1.moveTo(joint_knee.depthX * width, joint_knee.depthY * height);
        ctx1.lineTo(joint_ankle.depthX * width, joint_ankle.depthY * height);
        ctx1.moveTo(joint_head.depthX * width, joint_head.depthY * height);
        ctx1.lineTo(joint_neck.depthX * width, joint_neck.depthY * height);
        ctx1.moveTo(joint_neck.depthX * width, joint_neck.depthY * height);
        ctx1.lineTo(joint_spine_mid.depthX * width, joint_spine_mid.depthY * height);

        //ctx1.moveTo(joint_spine_mid.depthX * width, joint_spine_mid.depthY * height);
        //ctx1.lineTo(joint_spine_base.depthX * width, joint_spine_base.depthY * height);

        ctx1.lineWidth=10;

        ctx1.stroke();
        ctx1.closePath();

        // var x = joint_spine_mid.orientationX;
        // var y = joint_spine_mid.orientationY;
        // var z = joint_spine_mid.orientationZ;
        // var w = joint_spine_mid.orientationW;
        // console.log("midX= " + joint_spine_mid.orientationX, "midY=" + joint_spine_mid.orientationY, "midZ=" + joint_spine_mid.orientationZ, "midW=" + joint_spine_mid.orientationW);
        // T_x = ((Math.atan2((2 * y * w) - (2 * x * z), (1 - 2 * y * y) - (2 * z * z)) / 3.1416) * 180.0) + 180;
        // T_y = ((Math.asin((2 * x * y) + (2 * z * w)) / 3.1416) * 180.0) + 180;
        // T_z = ((Math.atan2((2 * x * w) - (2 * y * z), (1 - 2 * x * x) - (2 * z * z)) / 3.1416) * 180.0) + 180;

        // T_x = 180/3.1416*Math.atan2( 2*y*z+2*x*w,1-2*x*x - 2*y*y); // leaning forward/backward
        // T_y = 180/3.1416*Math.asin(2*y*w-2*x*z);                   // turning
        // T_z = 180/3.1416*Math.atan2( 2*x*y + 2*z*w,1 - 2*y*y - 2*z*z); // leaning left/right
        // console.log("T_x" + T_x, "T_y" + T_y, "T_z" + T_z);
        // console.log("T_z" + T_z);

        // Calculate distance between knees. joint_knee, joint_knee_left
        var calculated_knee_distance = Math.sqrt(Math.pow(joint_knee.depthX - joint_knee_left.depthX, 2) + Math.pow(joint_knee.depthY - joint_knee_left.depthY, 2));
        var index_val;
        if (selector == '1')
          index_val = 0;
        else if (selector == '2')
          index_val = 1;
        else if (selector == '5')
          index_val = 2;
        else if (selector=='6')
          index_val = 3;
        if (calculated_knee_distance < 0.1 || calculated_knee_distance > 0.15) {
          if (score_knee_distance[index_val] > 60) {
            score_knee_distance[index_val] = score_knee_distance[index_val] - 0.01;
            //console.log(score_knee_distance[index_val]);
          }
        }

        ctx1.beginPath();
        //if(nx > x-r && nx < x+r && ny > y-r && ny < y+r)
        // $("#info").text(orientation_value);
        // color_value = ((calculateOrientation(joint_spine_mid, "spine_mid") - 80) / 40 ) * 256;
        var orien_spine_mid = calculateOrientation(joint_spine_mid, "spine_mid");
        if (orien_spine_mid > 180)
          orien_spine_mid = orien_spine_mid - 360;

        color_value =  (orien_spine_mid / 40 ) * 256 + 128;

        if(color_value  < 0)
          color_value = 0;
        else if(color_value > 255)
          color_value = 255;
        color_value = Math.round(color_value);
        var x = color_value.toString(16);
        // $("#info").text(x);
        ctx1.strokeStyle='#' + x + '0000';

        ctx1.moveTo(joint_spine_mid.depthX * width, joint_spine_mid.depthY * height);
        ctx1.lineTo(joint_spine_base.depthX * width, joint_spine_base.depthY * height);
        //ctx1.arc(x, y,r,0,Math.PI*2);
        ctx1.lineWidth=10;
        ctx1.stroke();
        ctx1.closePath();
      }
      index++;
    }
  });

});



socket.on('draw', function(){
  console.log("Received Canvas");
  // ctx2.drawImage(canvas1, 0, 0);
  // body_list[value][11].depthX, "Y= ", body_list[value][11].depthY
  switch(selector){
    case '1':
      redraw(body_list_gt1);
      break;
    case '2':
      redraw(body_list_gt2);
      break;
    case '3':
      redraw(body_list_gt3);
      break;
    case '4':
      redraw(body_list_gt4);
      break;
    case '5':
      redraw(body_list_ex1);
      break;
    case '6':
      redraw(body_list_ex2);
      break;
    case '7':
      redraw(body_list_ex3);
      break;
    case '8':
      redraw(body_list_ex4);
      break;
  }

  ctx1.beginPath();
  // ctx1.arc(body_list[1][11].depthX*width ,body_list[0][11].depthY*height,20,0,Math.PI*2);
  // console.log("X= ", cx);
  ctx1.closePath();
  ctx1.fill();
});

socket.on('maximas', function(data){
  maxX = data.max_X;
  maxY = data.max_Y;
  maxX2 = data.max_X2;
  maxY2 = data.max_Y2;
});

socket.on('record', function(data){
  record = data;
  // socket.emit('record', x);
});

socket.on('stop', function(data){
  record = data;
  // socket.emit('record', x);
});

function gtLoader(objDropDown) {
  selector = objDropDown.value;
  selector_gt = objDropDown.value;
  console.log("Selector = " + selector + " gt_num = " + selector_gt);
  if(selector == 'clear')
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  else
    $("#info").text("Ground Truth #" + selector + " selected");
  }

function exLoader(objDropDown) {
  selector = objDropDown.value;
  selector_ex = objDropDown.value;
  var selector_int = parseInt(selector) - 4;
  console.log("Selector = " + selector + " ex_num = " + selector_ex);
  if(selector == 'clear')
    ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
  else
    $("#info").text("Exercise #" + selector_int + " selected");
  }

function exSelector(objDropDown) {
  hand_squat_selector = objDropDown.value;
  console.log("Hand/Squat = ", hand_squat_selector);
  // $("#info").text("Loaded Ground Truth #" + selector);
  }

var initial_date;

function get_speed(joints) {
  //console.log('total distance hand when we enter get_speed function: ', total_distance_hand_speed)
  if (body_joints_flag==0) {
    initial_point = joints;
    initial_date = new Date().getTime()/1000;
    body_joints_flag = 1;
  }
  if (body_list.length > 2) {
    var prev_element = body_list[body_list.length - 2][11];
  }
  else {
    prev_element = initial_point;
  }
    var current_point = body_list[body_list.length-1][11];

          var distance = Math.sqrt(Math.pow(prev_element.cameraX - current_point.cameraX, 2) + Math.pow(prev_element.cameraY - current_point.cameraY, 2));
          //console.log('abs distance: ', isNaN(Math.abs(distance)));
          var abs_distance;
          if (isNaN(Math.abs(distance))) {
            abs_distance = 0;
          }
          else {
            abs_distance = Math.abs(distance);
          }

          total_distance_hand_speed += abs_distance
          //console.log("total_distance_hand_speed:", total_distance_hand_speed);
          //console.log(distance,current_date - initial_date, distance/(current_date-initial_date));
          initial_point = current_point;


  }
