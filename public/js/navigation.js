$(document).ready(function () {
//Exercise button
$("#exercise").click(function () {
  console.log("Exercise Button pressed!");
  $("#text").text("Recording now!"); //Updates the span on the page
  total_distance_hand_speed = 0;
  initial_date = new Date().getTime()/1000;
  console.log("initializing total distance hand speed: ", total_distance_hand_speed);
    switch(selector){
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
          socket.emit('record', 1); // We could have simply set the var record as 1, but making the change event based allows remote clients to control the application
          // record = 1;
          break;
    }
  }
);

//Stop button
$("#stop").click(function () {
    var current_date = new Date().getTime()/1000;
    console.log("Total time: ", current_date - initial_date, "Total speed: ", total_distance_hand_speed/(current_date-initial_date), "m/s");
    main_counter++;
    if(main_counter >= 4)
      main_counter = 4;
    console.log("Stopped recording. " + main_counter + " exercise(s) recorded so far.");

    if(selector == '1' || selector == '2' || selector == '3' || selector == '4'){
      ctx2.drawImage(canvas1, 0, 0);
      temp = canvas1;
      gt_background = 1;
      console.log("Drawing maximas on ctx");
    }
    else if(selector == '5' || selector == '6' || selector == '7' || selector == '8'){
      temp = canvas1;
      ctx3.drawImage(temp, 0, 0);
    }

    var draw = canvas1;
    $("#text").text("Stopped recording.");
    socket.emit('draw', draw);

    switch(selector){
      case '1':
        body_list_gt1 = body_list;
        body_list = [];
        socket.emit('gt1', body_list_gt1);
        // console.log("Send Button pressed!");
        console.log(orientation_list);
        socket.emit('send', orientation_list);
        console.log(body_list_gt1.length);
        console.log("Saved ground truth to body_list_gt1");
        break;
      case '2':
        body_list_gt2 = body_list;
        body_list = [];
        socket.emit('gt2', body_list_gt2);
        console.log(body_list_gt2.length);
        console.log("Saved ground truth to body_list_gt2");
        break;

      case '5':
        body_list_ex1 = body_list;
        body_list = [];
        socket.emit('ex1', body_list_ex1);
        console.log("Send Button pressed!");
        console.log(orientation_list);
        socket.emit('send', orientation_list);
        console.log(body_list_ex1.length);
        console.log("Saved exercise to body_list_ex1");
        break;

      case '6':
        body_list_ex2 = body_list;
        body_list = [];
        socket.emit('ex2', body_list_ex2);
        console.log(body_list_ex2.length);
        console.log("Saved exercise to body_list_ex2");
        break;

      case '7':
        body_list_ex3 = body_list;
        body_list = [];
        socket.emit('ex3', body_list_ex3);
        console.log(body_list_ex3 .length);
        console.log("Saved exercise to body_list_ex3");
        break;

      case '8':
        body_list_ex4 = body_list;
        body_list = [];
        socket.emit('ex4', body_list_ex4);
        console.log(body_list_ex4.length);
        console.log("Saved exercise to body_list_ex4");
        break;
    }
    socket.emit('stop', 0); // Event-driven record start/stop
    // record = 0;

  });

//Compare button
$("#compare").click(function () {
  console.log("Compare Button pressed!");
  // hand_squat_selector = hand or squat
  socket.emit('compare', {mode: hand_squat_selector, gt_num: selector_gt, ex_num: selector_ex});
    }
);

//Hide button
$('#hidebutton').click(function() {
    $('#graph').slideToggle("fast");
    $('#graph2').slideToggle("fast");
  });

//Save data to files on server-side
$("#save").click(function () {
  console.log("Save Button pressed!");
  console.log(orientation_list); //for debugging
  socket.emit('save', {mode: hand_squat_selector, gt_num: selector_gt, ex_num: selector_ex} )
    });
});
