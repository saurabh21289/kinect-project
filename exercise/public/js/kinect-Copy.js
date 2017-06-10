var socket = io.connect('/');
$(document).ready(function () {
  var canvasSKLT = document.getElementById('bodyCanvas');
  var ctx1 = canvasSKLT.getContext('2d');

  document.getElementById("display").style.display = 'none';
  var colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];

  // Globals:
  var radius=9;
  var width = canvasSKLT.width;
  var height = canvasSKLT.height;

  var IntervalID;

  // Functions
  function drawJoints(cx,cy){
      ctx1.beginPath();
      ctx1.arc(cx,cy,radius,0,Math.PI*2); //radius is a global variable defined at the beginning
      ctx1.closePath();
      ctx1.fillStyle = "yellow";
      ctx1.fill();
  }
  // Draw Center Circle in ctx1 (canvasSKLT)
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


  function liveupdateCanvas1(bodyFrame){
    ctx1.clearRect(0, 0, width, height);
    //drawCircle(ctx1, 50, 50, 10, "red"); removed if following code line works
    //drawCenterCircle(width/2, height/5, 50, body.joints[2].depthX * width, body.joints[2].depthY * height);

    bodyFrame.bodies.some(function(body){
      if(body.tracked)
      {
        //drawCircle(50, 50, 10, "green");
        jointType = [7,5,4,2,8,9,11,9,8,2,3,2,1,0,12,13,14,13,12,0,16,17,18] //re visit and draw in a line
        jointType.forEach(function(jointType){
          drawJoints(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
        });
        drawCenterCircle(width/2, height/5, 50, body.joints[2].depthX * width, body.joints[2].depthY * height);

        ctx1.beginPath();
        ctx1.moveTo(body.joints[7].depthX * width, body.joints[7].depthY * height);
        jointType.forEach(function(jointType){
          ctx1.lineTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
          ctx1.moveTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
        });
        ctx1.lineWidth=10;
        ctx1.strokeStyle='blue';
        ctx1.stroke();
        ctx1.closePath();
        return(body.tracked);
      }
    });
  }

  function animateCanvas1(bufferBodyFrames){
    var i = 0;

    var TimerID = setInterval(function(){
      liveupdateCanvas1(bufferBodyFrames[i]);
      i++;
      if (i>=bufferBodyFrames.length){i=0;}
    },20);

    return TimerID;
  }

  // Signals

  // Use bodyFrame from server to update the canvas 1 on client
  socket.on('init', function(bodyFrame,systemState){

    liveupdateCanvas1(bodyFrame);
    console.log(systemState);
    document.getElementById("command").value= 'Start';;
    document.getElementById("display").style.display = 'none';
  });

  socket.on('rec', function(bodyFrame,systemState){
    liveupdateCanvas1(bodyFrame);
    console.log(systemState);

    document.getElementById("command").value = 'Stop';
    document.getElementById("display").style.display = 'none';
  });

  socket.on('live', function(bodyFrame,systemState){
    clearInterval(IntervalID);
    liveupdateCanvas1(bodyFrame);

    document.getElementById("command").value= 'Start';
    document.getElementById("display").style.display = 'none';
  });

  socket.on('disp', function(bufferBodyFrames,systemState){
    IntervalID = animateCanvas1(bufferBodyFrames);

    document.getElementById("command").value = 'Live';
    document.getElementById("display").style.display = 'block';
  });


  function drawCircle(x, y, r, color){ // Not used in current code
    ctx1.beginPath();
    ctx1.strokeStyle=color;
    ctx1.arc(x, y,r,0,Math.PI*2);
    ctx1.stroke();
  }
});



/* Reference
Look-up for joint selection
Kinect2.JointType = {
 spineBase       : 0,
 spineMid        : 1,
 neck            : 2,
 head            : 3,
 shoulderLeft    : 4,
 elbowLeft       : 5,
 wristLeft       : 6,
 handLeft        : 7,
 shoulderRight   : 8,
 elbowRight      : 9,
 wristRight      : 10,
 handRight       : 11,
 hipLeft         : 12,
 kneeLeft        : 13,
 ankleLeft       : 14,
 footLeft        : 15,
 hipRight        : 16,
 kneeRight       : 17,
 ankleRight      : 18,
 footRight       : 19,
 spineShoulder   : 20,
 handTipLeft     : 21,
 thumbLeft       : 22,
 handTipRight    : 23,
 thumbRight      : 24
};
*/
