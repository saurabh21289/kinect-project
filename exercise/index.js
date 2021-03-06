var Kinect2 = require('../lib/kinect2'),
	express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	XLSX = require('xlsx');
const fs = require('fs');

var kinect = new Kinect2();
var clients = 0;
if(kinect.open()) {
	// Server Initiation
	server.listen(8000);
	console.log('Server listening on port 8000');
	console.log('Point your browser to http://localhost:8000');
	app.use(express.static('public'))

	// Initiation State
	var systemState = 3; // 3 is the initiation code || 1: recording, 2: display, 0: live, 3: init == live
	var	bufferTrial= [], bufferBodyFrames =[], gtArray = [], exArray = [];
	var startTime, duration;
	var tracingID = -1;

	console.log('system init state');
	kinect.openBodyReader();

	// Connection On:
	io.on('connection', function(socket){
		++clients;
		console.log('a user connected');
		// systemState could be 0..3 during connection event, but only 2 needs signal emission
		if (systemState == 2) {
			socket.emit('disp',bufferBodyFrames,systemState, tracingID);
		}

		// transition between states
		socket.on('command',function(){
			systemState = StateTrans(systemState);
			switch (systemState) { // During the transition, prepare the buffer
				case 1: // 0->1 or 3->1 Get ready for recording
					tracingID = locateBodyTrackedIndex(bufferBodyFrames);

					bufferBodyFrames = [];
					console.log('System in Recording state');
					startTime = new Date().getTime();
				break;

				case 2: // 1->2, Push the BodyFrames Data to the current trial
					duration = ((new Date().getTime() - startTime)/1000).toFixed(2);
					kinect.closeBodyReader(); // if closeBodyReader is called twice, the server is down.
					bufferBodyFrames.durationsecs = duration;
					bufferBodyFrames.duration = duration.toString()+ " seconds";
					bufferBodyFrames.tracingID = tracingID;
					tracingID = -1;
					bufferTrial.push(bufferBodyFrames);
					console.log('system in Result Display state'); // Action
					socket.emit('disp',bufferBodyFrames,systemState, tracingID);
					socket.broadcast.emit('disp',bufferBodyFrames,systemState, tracingID);
				break;

				case 0: // 2->0, get the system from Result Disp to Live state.
					kinect.openBodyReader();// No Other Specific Actions in this block because it is done by kinect.on()
					console.log('system in Live state');
				default:
			}
		});

		socket.on('choose',function(num){
			testID = bufferTrial.length-1;
			if (gtArray[gtArray.length-1] == testID) { gtArray.pop(); }
			if (exArray[exArray.length-1] == testID) { exArray.pop(); }
						if (num == 1) { gtArray.push(testID); }
			else{	if (num == 2) { exArray.push(testID); } }
		})

		socket.on('analyze',function(){
	    console.log('analyze signal received!');

			var chartData = chartAnalyze(bufferTrial,gtArray,exArray);
			;
			var barData = barAnalyze(bufferTrial, gtArray, exArray);
			// console.log('curveRequest received!');
	    socket.emit('report',chartData, barData, gtArray, exArray);
	    save2xlsx(bufferTrial,'output.xlsx');
    });

		socket.on('curveRequest',function(gtInd,exInd,jt,datatype){
			var curveData = curveAnalyze(bufferTrial,gtArray,exArray,gtInd,exInd,jt,datatype);
			socket.emit('curveResult',curveData);
		});


		kinect.on('bodyFrame', function(bodyFrame){
			switch (systemState) {
				case 1: //recording: save the data being recorded, give identification to client
					socket.emit('rec', bodyFrame, systemState, tracingID);
					socket.broadcast.emit('rec', bodyFrame, systemState, tracingID);
					bufferBodyFrames.push(bodyFrame); // save the bodyFrame by pushing it to buffer
					break;

				case 2: //display
					console.log('system in display state, but system is streaming. Something wrong here.');
					break;

				case 0: //live
					bufferBodyFrames = [];
					bufferBodyFrames.push(bodyFrame);
					socket.emit('live', bodyFrame,systemState)
					socket.broadcast.emit('live', bodyFrame,systemState);
					break;

				case 3: //3 init
					bufferBodyFrames = [];
					bufferBodyFrames.push(bodyFrame);
					socket.emit('init', bodyFrame, systemState);
					socket.broadcast.emit('init', bodyFrame, systemState);
					break;

				default:
					console.log('System State unknown');
			}//end of switch
		}); // end of kinect.on('bodyframe',function)

		// disconnect
		socket.on('disconnect',function(){
			console.log('a user disconnect');
			--clients;
		})
	}); // end of io.on('connection',function)
}//end of kinect.open()


// Functions ----------------------------------------------------------------------

// Define the legal move between states
function StateTrans(st){
	return (st+1)%3;
}

function locateBodyTrackedIndex(bufferBodyFrames){
	var ind = -1;
	for (var i=0; i<=5; i++){
		if (bufferBodyFrames[0].bodies[i].tracked){ // tracked in the first frame
			ind = i;
			break;
		}
	}
	return ind;
}

function typeofTest(bufferBodyFrames){
	var type // 0: Hand, 1: Squat
	var typeList = ["Hand","Squat"];
	var ind = locateBodyTrackedIndex(bufferBodyFrames);
	var max_spine_midY = -10000000, min_spine_midY = 10000000;
	// using the index to locate the bufferBodyFrames[i].body[ind].joint[0]
	// find the max and min of bufferBodyFrames[i].body[ind].joint[0].DepthY;
	if (ind>=0){
		for (var i = 0; i<=bufferBodyFrames.length-1; i++){
			if (bufferBodyFrames[i].bodies[ind].joints[1].depthY>max_spine_midY){
				max_spine_midY = bufferBodyFrames[i].bodies[ind].joints[1].depthY;
			}
			if (bufferBodyFrames[i].bodies[ind].joints[1].depthY<min_spine_midY){
				min_spine_midY = bufferBodyFrames[i].bodies[ind].joints[1].depthY;
			}
		}
	} // end of if(ind>=0)

	if (max_spine_midY-min_spine_midY > 0.12 && max_spine_midY-min_spine_midY < 1000)
		{type = "Squat"}
	else { type = "Hand"}

	return type;
}

function getRaw(bufferTrial,id,jt,datatype){
	var frames = bufferTrial[id];
	var ind = frames.tracingID, time = frames.durationsecs;
	var rawdata = []
	for(var i=0; i<frames.length; i++){
		if (datatype == 0)
			{rawdata.push(frames[i].bodies[ind].joints[jt].depthX);}
		if (datatype == 1)
			{rawdata.push(frames[i].bodies[ind].joints[jt].depthY);}
		if (datatype == 2)
			{rawdata.push(frames[i].bodies[ind].joints[jt].cameraZ);}
		else{
			var x = frames[i].bodies[ind].joints[jt].orientationX;
			var y = frames[i].bodies[ind].joints[jt].orientationY;
			var z = frames[i].bodies[ind].joints[jt].orientationZ;
			var w = frames[i].bodies[ind].joints[jt].orientationW;

			var T_x = 180 + 180/3.1416*Math.atan2( 2*y*z+2*x*w,1-2*x*x - 2*y*y); // leaning forward/backward
			var T_y = 180/3.1416*Math.asin(2*y*w-2*x*z);                   // turning
			var T_z = 180 + 180/3.1416*Math.atan2( 2*x*y + 2*z*w,1 - 2*y*y - 2*z*z); // leaning left
			if (T_x>90) {T_x += -180;}
			if (T_y>180) {T_y += -180;}
			if (T_z>180) {T_z += -180;}
			if (datatype == 3)
				{rawdata.push(T_x);}
			if (datatype == 4)
				{rawdata.push(T_y);}
			if (datatype == 5)
				{rawdata.push(T_z);}

		}
	}
	return rawdata;
}

function getSpeed(bufferTrial,id,jt){
	var frames = bufferTrial[id];
	var ind = frames.tracingID, time = frames.durationsecs;
	var accumDist = 0, speed = 0;
	for(var i=0; i<frames.length-1; i++){
		var dY = frames[i+1].bodies[ind].joints[jt].depthY-frames[i].bodies[ind].joints[jt].depthY,
				dX = frames[i+1].bodies[ind].joints[jt].depthX-frames[i].bodies[ind].joints[jt].depthX,
				dZ = frames[i+1].bodies[ind].joints[jt].cameraZ-frames[i].bodies[ind].joints[jt].cameraZ;
		var dist = Math.sqrt(Math.pow(dX,2) + Math.pow(dY,2) + Math.pow(dZ,2));
		accumDist = accumDist+dist;
	}
	speed = (accumDist/time);
	return speed;
}

function getAmptlitudeX(bufferTrial,id,jt){
	var frames = bufferTrial[id];
	var ind = frames.tracingID, time = frames.durationsecs;
	var DistX;
	var ListX = [];
	for(var i=0; i<frames.length-1; i++){
		ListX.push(frames[i+1].bodies[ind].joints[jt].depthX-frames[i].bodies[ind].joints[jt].depthX);
	}
	DistX = (Math.max(...ListX) - Math.min(...ListX));
	return DistX;
}

function getAmptlitudeY(bufferTrial,id,jt){
	var frames = bufferTrial[id];
	var ind = frames.tracingID, time = frames.durationsecs;
	var DistY;
	var ListY = [];
	for(var i=0; i<frames.length-1; i++){
		ListY.push(frames[i+1].bodies[ind].joints[jt].depthY-frames[i].bodies[ind].joints[jt].depthY);
	}
	DistY = (Math.max(...ListY) - Math.min(...ListY));
	return DistY;
}

function getAmptlitudeZ(bufferTrial,id,jt){
	var frames = bufferTrial[id];
	var ind = frames.tracingID, time = frames.durationsecs;
	var DistZ;
	var ListZ = [];
	for(var i=0; i<frames.length-1; i++){
		ListZ.push(frames[i+1].bodies[ind].joints[jt].cameraZ-frames[i].bodies[ind].joints[jt].cameraZ);
	}
	DistZ = (Math.max(...ListZ) - Math.min(...ListZ));
	return DistZ;
}

function getOrientation(bufferTrial,id,jt){
    var RotX = getRaw(bufferTrial,id,jt,4);
		var maxRot = Math.max(...RotX), minRot = Math.min(...RotX)
		var lean = Math.abs(maxRot-minRot);
    return lean;
  }

function save2xlsx(bufferTrial,filename){
	var ws_name=[]; //Populate with Reference, EX1, EX2, EX3..
	ws_name.push("Reference"); //Currently only support Reference & Exercise
	ws_name.push("Exercise");
	var wb = new Workbook(); //Create new wb object
	for(var sheet_num = 0; sheet_num < bufferTrial.length; sheet_num++){
			var ws = sheet_from_buffer(bufferTrial[sheet_num], ws_name[sheet_num]); //sheet_num depends on the length of bufferTrial
			wb.SheetNames.push(ws_name[sheet_num]); //Push worksheet name into the list of sheet names
			wb.Sheets[ws_name[sheet_num]] = ws; //Push workskeet with data into the list of sheets
	}

	var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:false, type: 'binary'}); //Define workbook type
	XLSX.writeFile(wb, filename); //Write workbook
}
function Workbook() {
    if(!(this instanceof Workbook)) return new Workbook(); //Create new instance of workbook type
    this.SheetNames = [];
    this.Sheets = {};
}
function sheet_from_buffer(bufferBodyFrames, ws_name) {
    var ws = {};
    var range = {s: {c:0, r:0}, e: {c:275, r:500 }};
		skeleton = 0; //Track which skeleton # it is out of the maximum 6
		for(var i = 0; i < bufferBodyFrames[0].bodies.length; i++){
			if(bufferBodyFrames[0].bodies[i].tracked){
				skeleton = i;
				break;
			}
		}

		//Each joint has the following recorded values per frame:
		// { depthX: 0.504541277885437,
    // depthY: 0.4274001717567444,
    // colorX: 0.5274396538734436,
    // colorY: 0.43057167530059814,
    // cameraX: 0.014736349694430828,
    // cameraY: 0.07034260779619217,
    // cameraZ: 1.0115480422973633,
    // orientationX: -0.1835455298423767,
    // orientationY: 0.9150301814079285,
    // orientationZ: -0.34553292393684387,
    // orientationW: -0.09817195683717728 }
			for(var R = 0; R < bufferBodyFrames.length; R++){
				var column = 0; // Goes upto 275, i.e. 25 x 11
				for(var C = 0; C < bufferBodyFrames[R].bodies[skeleton].joints.length; C++) {
						for(var attributename in bufferBodyFrames[R].bodies[skeleton].joints[C]){
							var cell = {v: bufferBodyFrames[R].bodies[skeleton].joints[C][attributename]};
							if(cell.v == null) continue;
			        var cell_ref = XLSX.utils.encode_cell({c:column,r:R});
			        if(typeof cell.v === 'number') cell.t = 'n';
			        else if(typeof cell.v === 'boolean') cell.t = 'b';
			        else cell.t = 's';
			        ws[cell_ref] = cell;
							column++;
						}
		    }
			}
		ws['!ref'] = XLSX.utils.encode_range(range);
    return ws;
}

function chartAnalyze(bufferTrial,gtArray,exArray){
  var gtLabel = [], exLabel = [];
  for (var i in gtArray){
    gtLabel.push("GT_"+(i).toString());
  }
  for (var i in exArray){
    exLabel.push("EX_"+(i).toString());
  }

  var chartData = [
    {"Name": "Duration (seconds)",},
    {"Name": "Type",},
		{"Name": "Left Wrist Speed (m/s)"},
		{"Name": "Left Wrist Height Change (m)"},
		{"Name": "Right Wrist Speed (m/s)"},
		{"Name": "Right Wrist Height Change (m)"},
		{"Name": "Pelvic Speed (m/s)"},
		{"Name": "Pelvic Height Change (m)"},
		{"Name": "Trunk Leaning (degrees)"},
		{"Name": "Hip A-P Movement"},
  ];
  // Duration
  for (var i in gtArray){
    chartData[0][ gtLabel[i] ] = bufferTrial[gtArray[i]].duration;
		chartData[1][ gtLabel[i] ] = typeofTest( bufferTrial[gtArray[i]] );
		chartData[2][ gtLabel[i] ] = (getSpeed(bufferTrial,gtArray[i],6).toFixed(2)).toString();
		chartData[3][ gtLabel[i] ] = (getAmptlitudeY(bufferTrial,gtArray[i],6).toFixed(2)).toString();
		chartData[4][ gtLabel[i] ] = (getSpeed(bufferTrial,gtArray[i],10).toFixed(2)).toString();
		chartData[5][ gtLabel[i] ] = (getAmptlitudeY(bufferTrial,gtArray[i],10).toFixed(2)).toString();
		chartData[6][ gtLabel[i] ] = (getSpeed(bufferTrial,gtArray[i],0).toFixed(2)).toString();
		chartData[7][ gtLabel[i] ] = (getAmptlitudeY(bufferTrial,gtArray[i],0).toFixed(2)).toString();
		chartData[8][ gtLabel[i] ] = getOrientation(bufferTrial,gtArray[i],1).toString();
		chartData[9][ gtLabel[i] ] = getAmptlitudeZ(bufferTrial,gtArray[i],0).toString();
  }
  for (var i in exArray){
    chartData[0][ exLabel[i] ] = bufferTrial[exArray[i]].duration;
		chartData[1][ exLabel[i] ] = typeofTest( bufferTrial[exArray[i]] );
		chartData[2][ exLabel[i] ] = (getSpeed(bufferTrial,exArray[i],6).toFixed(2)).toString();
		chartData[3][ exLabel[i] ] = (getAmptlitudeY(bufferTrial,exArray[i],6).toFixed(2)).toString();
		chartData[4][ exLabel[i] ] = (getSpeed(bufferTrial,exArray[i],10).toFixed(2)).toString();
		chartData[5][ exLabel[i] ] = (getAmptlitudeY(bufferTrial,exArray[i],10).toFixed(2)).toString();
		chartData[6][ exLabel[i] ] = (getSpeed(bufferTrial,exArray[i],0).toFixed(2)).toString();
		chartData[7][ exLabel[i] ] = (getAmptlitudeY(bufferTrial,exArray[i],0).toFixed(2)).toString();
		chartData[8][ exLabel[i] ] = getOrientation(bufferTrial,exArray[i],1).toString();
		chartData[9][ exLabel[i] ] = getAmptlitudeZ(bufferTrial,exArray[i],0).toString();
  }
  return chartData;
}

function curveAnalyze(bufferTrial,gtArray,exArray,gtInd,exInd,jt,datatype){
	var curveData ={};
	var maxlength = 0;
	curveData["numDataSets"] = gtInd.length + exInd.length;
	curveData["labels"] = [];
	curveData["dataset"] = [];
	curveData["xticks"] = [];
	if (gtInd.length>0){
		for(var i=0 ; i<gtInd.length; i++){
			curveData.labels.push("Referece_"+gtInd[i].toString() );
			var id = gtArray[gtInd[i]];
			var rawdata = getRaw(bufferTrial,id,jt,datatype);
			curveData.dataset.push( rawdata );
			if (rawdata.length>maxlength) {maxlength = rawdata.length}
		}
	}

	if (exInd.length>0){
		for(var i=0 ; i<exInd.length; i++){
			curveData.labels.push("Exercise_"+exInd[i].toString() );
			var id = exArray[exInd[i]];
			var rawdata = getRaw(bufferTrial,id,jt,datatype);
			curveData.dataset.push( rawdata );
			if (rawdata.length>maxlength) {maxlength = rawdata.length}
		}
	}

	var pads = Math.ceil(maxlength/10);

	for (var i = 0; i<=9; i++){
		var timeMark = (i*pads*0.008342).toFixed(2);
		curveData.xticks.push(timeMark.toString());
		for (var j = 1; j<pads; j++){
			curveData.xticks.push("");
		}
	}
	//	"xticks": ["1", "", "", "", "", "6", "", "", "", "", "11"],

	return curveData;
}

function barAnalyze(bufferTrial, gtArray, exArray){
	var barData = {};
	barData.leftHandSpeed = [];
	barData.leftHandHeightChange = [];
	barData.rightHandSpeed = [];
	barData.rightHandHeightChange = [];
	barData.pelvicSpeed = [];
	barData.pelvicHeightChange = [];
  barData.SpineMidOrientation = [];
	barData.SpineBaseMovement = [];
	var threshold = {
		Speed: 0.005,
		HeightChange: 0.005,
		Orientation: 1,
	};
	var speed_jt6_gt = 0, height_jt6_gt = 0,speed_jt10_gt = 0, height_jt10_gt = 0,
			speed_jt0_gt = 0, height_jt0_gt = 0;
	var lean_jt1_gt = 0, ampZ_jt0_gt=0;
	for (var i in gtArray){
		speed_jt6_gt = getSpeed(bufferTrial,gtArray[i],6);
		height_jt6_gt += getAmptlitudeY(bufferTrial,gtArray[i],6);
		speed_jt10_gt += getSpeed(bufferTrial,gtArray[i],10);
		height_jt10_gt += getAmptlitudeY(bufferTrial,gtArray[i],10);
		speed_jt0_gt += getSpeed(bufferTrial,gtArray[i],0);
		height_jt0_gt += getAmptlitudeY(bufferTrial,gtArray[i],0);
		lean_jt1_gt += getOrientation(bufferTrial,gtArray[i],1);
		ampZ_jt0_gt += getAmptlitudeZ(bufferTrial,gtArray[i],0);
	}
	speed_jt6_gt/=gtArray.length;
	height_jt6_gt/=gtArray.length;
	speed_jt10_gt/=gtArray.length;
	height_jt10_gt/=gtArray.length;
	speed_jt0_gt/=gtArray.length;
	height_jt0_gt/=gtArray.length;
	lean_jt1_gt /=gtArray.length;
	ampZ_jt0_gt/=gtArray.length;

	for (var i in exArray){
		var speed_jt6_ex = getSpeed(bufferTrial,exArray[i],6);
		if (Math.abs(speed_jt6_gt) < threshold.Speed) { barData.leftHandSpeed.push(0);}
		else { barData.leftHandSpeed.push( (speed_jt6_ex-speed_jt6_gt)/speed_jt6_gt*100);}

		var height_jt6_ex = getAmptlitudeY(bufferTrial,exArray[i],6);
		if (Math.abs(height_jt6_gt) < threshold.HeightChange) {barData.leftHandHeightChange.push(0);}
		else {barData.leftHandHeightChange.push( (height_jt6_ex-height_jt6_gt)/height_jt6_gt*100 );}

		var speed_jt10_ex = getSpeed(bufferTrial,exArray[i],10);
		if (Math.abs(speed_jt10_gt) < threshold.Speed) { barData.rightHandSpeed.push(0);}
		else {barData.rightHandSpeed.push( (speed_jt10_ex-speed_jt10_gt)/speed_jt10_gt*100);}

		var height_jt10_ex = getAmptlitudeY(bufferTrial,exArray[i],10);
		if (Math.abs(height_jt10_gt) < threshold.HeightChange) {barData.rightHandHeightChange.push(0);}
		else {barData.rightHandHeightChange.push( (height_jt10_ex-height_jt10_gt)/height_jt10_gt*100 );}

		var speed_jt0_ex = getSpeed(bufferTrial,exArray[i],0);
		if (Math.abs(speed_jt0_gt) < threshold.Speed) { barData.pelvicSpeed.push(0);}
		else {barData.pelvicSpeed.push( (speed_jt0_ex-speed_jt0_gt)/speed_jt0_gt*100);}

		var height_jt0_ex = getAmptlitudeY(bufferTrial,exArray[i],0);
		if (Math.abs(height_jt0_gt) < threshold.HeightChange) {barData.pelvicHeightChange.push(0);}
		else {barData.pelvicHeightChange.push( (height_jt0_ex-height_jt0_gt)/height_jt0_gt*100 );}

		var lean_jt1_ex = getOrientation(bufferTrial,exArray[i],1);
		if (Math.abs(lean_jt1_ex) < threshold.HeightChange) {barData.SpineMidOrientation.push(0);}
		else {barData.SpineMidOrientation.push( (lean_jt1_ex-lean_jt1_gt)/lean_jt1_gt*100 );}

		var ampZ_jt0_ex = getAmptlitudeZ(bufferTrial,exArray[i],0);
		if (Math.abs(ampZ_jt0_gt) < threshold.HeightChange) {barData.SpineBaseMovement.push(0);}
		else {barData.SpineBaseMovement.push( (ampZ_jt0_ex-ampZ_jt0_gt)/ampZ_jt0_gt*100 );}

	}
	return barData;
}
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
