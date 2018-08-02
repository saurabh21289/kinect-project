function voice_commands(){
  if (annyang) {
    // Let's define our first command. First the text we expect, and then the function it should call
    var commands = {
      'start': function() {
        $("#text").text("Say record for ground truth");
      },
      'record': function() {
        console.log("Recording ground truth now");
        // var draw = ctx2.drawImage(canvas1, 0, 0);
        $("#text").text("Recording ground truth now");
        // socket.emit('draw', draw);
        record = 1;
        selector = 0;
      },
      'stop': function() {
        console.log("Stopped recording!");
        ctx2.drawImage(canvas1, 0, 0);
        var draw = canvas1;
        $("#text").text("Stopped recording.");
        socket.emit('draw', draw);
        // socket.emit('db', { x: body_list.depthX, y: body_list.depthY });
        // socket.emit('db', body_list);
        if(selector == 0){
          body_list_gt = body_list;
          body_list = [];
          // socket.emit('db', {handX: joint_hand.depthX * width, handY: joint_hand.depthY * height, elbowX: joint_elbow.depthX * width, elbowY: joint_elbow.depthY * height, shoulderX: joint_shoulder.depthX * width, shoulderY: joint_shoulder.depthY * height })
          socket.emit('gt', body_list_gt);
          console.log(body_list_gt.length);
          console.log("Saved ground truth to body_list_gt");
        }
        else if(selector == 1){
          body_list_ex1 = body_list;
          body_list = [];
          socket.emit('ex1', body_list_ex1);
          console.log(body_list_ex1.length);
          console.log("Saved ex1 to body_list_ex1");
          // console.log(body_list_ex1);
        }

        record = 0;
      },
      'one': function() {
        $("#text").text("Do exercise #1");
        var draw = ctx2.drawImage(canvas1, 0, 0);
        // socket.emit('draw', draw);
        record = 1;
        selector = 1;
        // console.log(body_list.length);
        // ctx2.drawImage(canvas1, 0, 0);
        // var draw = canvas1;
        // $("#text").text("Stopped recording.");
        // socket.emit('draw', draw);
        // // socket.emit('db', { x: body_list.depthX, y: body_list.depthY });
        // // socket.emit('db', body_list);
        // console.log(body_list.length)
        // record = 0;
      }
    };

    // Add our commands to annyang
    annyang.addCommands(commands);

    // Start listening. You can call this here, or attach this call to an event, button, etc.
    annyang.start();
  }
}
