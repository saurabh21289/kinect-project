//Receiving the DTW path & cost for visualization
var chart1, chart2, chart3;
var chart1_ctx = document.getElementById("chart1");
var chart2_ctx = document.getElementById("chart2");
var chart3_ctx = document.getElementById("chart3");

var charts_already_exist = 0;

socket.on('chart', function(data){

//This check determines if chart already exist on the page. If yes, then it only updates the values instead of recreating the charts which lead to a lot of bugs
  if(chart1){
    console.log("Setting to 1");
    charts_already_exist = 1;
  }
  else
    charts_already_exist = 0;


  $("#text").text("Costs: " + data.cost_hand.toFixed(4) + ", " + data.cost_elbow.toFixed(4) + ", " + data.cost_shoulder.toFixed(4));
  //create the graph using CanvasJS

  var elbow_gt = [];
  var elbow_ex1 = [];
  var shoulder_gt = [];
  var shoulder_ex1 = [];
  var size;
  //graph data for dtw, chart1
  var x_axis_dtw = []; // this stores X-axis values
  var y_dtw_gt = [];  // this stores Y-axis values for ground truth line
  var y_dtw_ex = []; // // this stores Y-axis values for exercise line

  //graph data for amplitude, chart3. same naming convetion as in line 33, 34, 35
  var x_axis_amp = [];
  var y_amp_gt = [];
  var y_amp_ex = [];


  for(value in data.path_hand){
    x_axis_dtw.push(value);
    y_dtw_gt.push(data.path_hand[value].x);
    y_dtw_ex.push(data.path_hand[value].y);

    size = value;
  }
  for(value in data.path_elbow){
    // console.log(value);
    elbow_gt.push({x: value, y: data.path_elbow[value].x})
    elbow_ex1.push({x: value, y: data.path_elbow[value].y})
  }

  for(value in data.path_shoulder){
    // console.log(value);
    shoulder_gt.push({x: value, y: data.path_shoulder[value].x})
    shoulder_ex1.push({x: value, y: data.path_shoulder[value].y})
  }

  // console.log(data);
  //The code below is used for sensor value to time-index mapping for easy to perceive graphs
  var gthand_X = [];
  var exhand_X = [];
  var gthand_Y = [];
  var exhand_Y = [];
  var gthand_Z = [];
  var exhand_Z = [];
  // console.log(data.ex);
  for(var value in data.gt){
    // console.log(value);
    x_axis_amp.push(value);
    y_amp_gt.push(data.gt[value][11].depthY);
    gthand_X.push({x: value, y: data.gt[value][11].depthX})
    gthand_Y.push({x: value, y: data.gt[value][11].depthY})
    gthand_Z.push({x: value, y: data.gt[value][11].cameraZ})
    size = value;
  }
  for(var value in data.ex){
    y_amp_ex.push(data.ex[value][11].depthY);
    exhand_X.push({x: value, y: data.ex[value][11].depthX})
    exhand_Y.push({x: value, y: data.ex[value][11].depthY})
    exhand_Z.push({x: value, y: data.ex[value][11].cameraZ})
  }



  // console.log(body_list_gt1);
  // console.log(gthand_X);
  // console.log(exhand_X);
  console.log()

//Define data and it's properties for the charts
  var data_chart1 = {
    labels: x_axis_dtw,
    datasets: [
        {
            label: "Ground truth",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(0,0,192,1)",
            borderColor: "rgba(0,0,192,1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            borderWidth: 0,
            pointBorderColor: "rgba(0,0,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: y_dtw_gt,
            spanGaps: false,
        },
        {
            label: "Exercise",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(255,0,0,1)",
            borderColor: "rgba(255,0,0,1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            borderWidth: 0,
            pointBorderColor: "rgba(255,0,0,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: y_dtw_ex,
            spanGaps: false,
        }

    ]
};

var data_chart3 = {
  labels: x_axis_amp,
  datasets: [
      {
          label: "Ground truth",
          fill: false,
          lineTension: 0.1,
          backgroundColor: "rgba(0,0,192,1)",
          borderColor: "rgba(0,0,192,1)",
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          borderWidth: 0,
          pointBorderColor: "rgba(0,0,192,1)",
          pointBackgroundColor: "#fff",
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgba(75,192,192,1)",
          pointHoverBorderColor: "rgba(220,220,220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: y_amp_gt,
          spanGaps: false,
      },
      {
          label: "Exercise",
          fill: false,
          lineTension: 0.1,
          backgroundColor: "rgba(255,0,0,1)",
          borderColor: "rgba(255,0,0,1)",
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          borderWidth: 0,
          pointBorderColor: "rgba(255,0,0,1)",
          pointBackgroundColor: "#fff",
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgba(75,192,192,1)",
          pointHoverBorderColor: "rgba(220,220,220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: y_amp_ex,
          spanGaps: false,
      }

  ]
};

//Draw the charts. If the charts have been drawn once, then just update the data instead of creating new charts objects

if(charts_already_exist == 0){

  chart1 = new Chart(chart1_ctx, {
    type: 'line',
    data: data_chart1,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animateScale: true,
        title: {
            display: true,
            text: 'DTW Path Comparison',
            fontSize: 25
        },
        scales: {
          scaleShowGridLines : false,
          xAxes: [{
              gridLines: {
                drawOnChartArea: false
              }
            }]
        }
    }
  });

  chart2 = new Chart(chart2_ctx, {
    type: 'radar',
    data: {
    labels: ["Speed", "Orientation", "Amplitude", "Lean Forward", "Lean Backward"],
    datasets: [
        {
            label: "Ground Truth",
            backgroundColor: "rgba(0,0,255,0.2)",
            borderColor: "rgba(0,0,255,1)",
            pointBackgroundColor: "rgba(0,0,255,1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(179,181,198,1)",
            data: [80, 80, 80, 80, 80]
        },
        {
            label: "Exercise",
            backgroundColor: "rgba(255,0,0,0.2)",
            borderColor: "rgba(255,0,0,1)",
            pointBackgroundColor: "rgba(255,0,0,1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(255,99,132,1)",
            data: [50, 75, 90, 60, 96]
        }
    ]
  },
  options: {
      responsive: true,
      maintainAspectRatio: false,
      title: {
            display: true,
            text: 'Scoring System',
            fontSize: 25
        },
        scale: {
                ticks: {
                    beginAtZero: true,
                    fontSize: 10
                },
                pointLabels: {
                  fontSize: 15
                }
            }
  }
  });
  chart3 = new Chart(chart3_ctx, {
    type: 'line',
    data: data_chart3,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animateScale: true,
        title: {
              display: true,
              text: 'Amplitude Comparison',
              fontSize: 25
          },
          scales: {
            scaleShowGridLines : false,
            xAxes: [{
                gridLines: {
                  drawOnChartArea: false
                }
              }]
          }
    }
  });
  }
  else{
    console.log("in here now!")
  // myLineChart.data.datasets[0].data[2] = 50; // Would update the first dataset's value of 'March' to be 50
  chart1.data.datasets[0].data = y_dtw_gt;
  chart1.data.datasets[1].data = y_dtw_ex;
  chart1.labels = x_axis_dtw;

  chart2.data.datasets[0].data = [Math.floor((Math.random() * 100) + 1), Math.floor((Math.random() * 100) + 1), 30, 40, Math.floor((Math.random() * 100) + 1)]
  chart2.data.datasets[1].data = [50, Math.floor((Math.random() * 100) + 1), 30, Math.floor((Math.random() * 100) + 1), 16]

  chart3.data.datasets[0].data = y_amp_gt;
  chart3.data.datasets[1].data = y_amp_ex;
  chart3.labels = x_axis_amp;

  console.log(y_amp_gt.length, y_amp_ex.length, x_axis_amp);
  chart1.update();
  chart2.update();
  chart3.update();
  }



// chart1.destroy();
// chart2.destroy();
// chart3.destroy();

  $('#graph').show("fast");
  $('#hidebutton').show("fast");

});
