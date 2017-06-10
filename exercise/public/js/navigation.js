$(document).ready(function () {
  //state button
  $("#command").click(function () {
    switch ($("#command")[0].value){
      case "Start":
        $("#command")[0].value = "Stop";
        $("#command")[0].style.backgroundColor = 'red';
        //$("#text").text("Stopped Recording");
      break;

      case "Stop":
        $("#command")[0].value = "Live";
        $("#command")[0].style.backgroundColor = '';
      break;

      case "Live":
        $("#command")[0].value = "Start";
        $("#command")[0].style.backgroundColor = '';
      break

      default:
    }
    socket.emit('command');
  });

  $("#gt").click(function () {
    socket.emit('choose', 1);
    document.getElementById("display").style.display = 'none';
  });

  $("#ex").click(function () {
    socket.emit('choose', 2);
    document.getElementById("display").style.display = 'none';
  });

  $("#re").click(function () {
    socket.emit('choose', 3);
    document.getElementById("display").style.display = 'none';
  });

  $("#report").click(function () {
    console.log('report button pressed!');
    location.href = "report.html";
    location.target = "_blank";
  });

});
//hide button
