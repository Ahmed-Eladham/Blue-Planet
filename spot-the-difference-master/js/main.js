$(document).ready(function () {
  var TIMER_ID = "";
  var TIME_LEFT = 5000000000000; //TIme (علشان اعرف الغلط بس)
  var GAME_OVER = false;
  var CUR_IMG_IND = 0;
  var SCORE = 0;
  var ASSIST_TIME_CREDITS = 3;
  var ASSIST_CLUE_CREDITS = 3;

  // ديه الحلول مربوطه ب answers
  var IMAGES = [img1, img2, img3, img4, img5];
  var IMAGES_PLAYED = [];
  var CUR_IMG_IN_PLAY = gameplayRound("check");

  document
    .getElementById("canvas-left")
    .addEventListener("click", playTurn, false);
  document
    .getElementById("canvas-right")
    .addEventListener("click", playTurn, false);

  // /زرار مساعده
  $("#assist-clue img").on("click", useClue);
  $("#assist-time img").on("click", function () {
    if (ASSIST_TIME_CREDITS > 0) {
      document.getElementById("time-fx").play();
      timer("add");
      ASSIST_TIME_CREDITS--;
      $(this).fadeOut();
    }
  });

  // ديه الي بتعمل استارت للتايم
  timer("start");

  function playTurn(ev) {
    var isCorrect = false;
    var foundArr = [];
    var latestFind = [];

    if (Array.isArray(ev)) {
      latestFind = ev;
      isCorrect = true;
    } else if (typeof ev === "object" && !Array.isArray(ev)) {
      var position = getPosition(ev);
      isCorrect = isRight(position);
      var elementId = ev.target.id;
      foundArr = CUR_IMG_IN_PLAY["found"];
      latestFind = foundArr[foundArr.length - 1];
    }
    // ديه اما تعمل تختار صح
    if (isCorrect && !GAME_OVER) {
      var lowerX = latestFind[0];
      var upperX = latestFind[1];
      var lowerY = latestFind[2];
      var upperY = latestFind[3];
      var centerX = latestFind[4];
      var centerY = latestFind[5];
      var width = upperX - lowerX;
      var height = upperY - lowerY;

      drawEllipse("canvas-left", centerX, centerY, width, height);
      drawEllipse("canvas-right", centerX, centerY, width, height);
      incrementScore();
      document.getElementById("right-fx").play();
      if (isRoundOver()) {
        // بيتأكد لو هي اخر صوره
        if (isGameOver("final")) {
          isGameOver("won"); // اغنيه الفوز
        } else if (!isGameOver("final")) {
          timer("stop"); // اما تفوز بتوقف الوقت
          initiateCountdown();
          // لو عايز تبدأ من الاول
          setTimeout(function () {
            TIME_LEFT += 15;
            clearCanvas();
            gameplayRound("new");
            timer("start");
          }, 5000);
        }
      }
    }

    if (!isCorrect && !GAME_OVER) {
      timer("penalty");

      drawAndFadeCross(elementId, position[0], position[1]);
      document.getElementById("wrong-fx").play();
      $("#game-stage").animateCss("headShake");
    }
  }

  function incrementScore() {
    var amt = TIME_LEFT * 50; //ده من التايم
    SCORE += amt;
    $("#score-ui").text(SCORE);
  }

  function logAnswer(obj, areaArr) {
    var target = obj;
    target["found"].push(areaArr);
  }

  // بتتأكد لو الحته ديه ضغط عليها ولا
  function isUndiscovered(obj, clickX, clickY) {
    var arr = obj["found"];
    for (var i = 0; i < arr.length; i++) {
      if (
        clickX >= arr[i][0] &&
        clickX <= arr[i][1] &&
        clickY >= arr[i][2] &&
        clickY <= arr[i][3]
      ) {
        return false;
      }
    }
    return true;
  }

  function isRight(coords) {
    var clickX = coords[0];
    var clickY = coords[1];
    var coordsAnswerArr = CUR_IMG_IN_PLAY.ansCoords;
    var areaAnswerArr = CUR_IMG_IN_PLAY.ansArea;

    if (!isUndiscovered(CUR_IMG_IN_PLAY, clickX, clickY)) {
      return "already discovered";
    } else if (isUndiscovered(CUR_IMG_IN_PLAY, clickX, clickY)) {
      for (var i = 0; i < coordsAnswerArr.length; i++) {
        if (typeof coordsAnswerArr[i] !== "string") {
          var x1 = coordsAnswerArr[i][0] - areaAnswerArr[i][0];
          var x2 = coordsAnswerArr[i][0] + areaAnswerArr[i][0];
          var y1 = coordsAnswerArr[i][1] - areaAnswerArr[i][1];
          var y2 = coordsAnswerArr[i][1] + areaAnswerArr[i][1];

          if (clickX >= x1 && clickX <= x2 && clickY >= y1 && clickY <= y2) {
            var centerX = coordsAnswerArr[i][0];
            var centerY = coordsAnswerArr[i][1];
            CUR_IMG_IN_PLAY.ansCoords[i] = "found";

            logAnswer(CUR_IMG_IN_PLAY, [x1, x2, y1, y2, centerX, centerY]);
            return true;
          }
        }
      }
      return false;
    }
  }


  function isRoundOver() {
    var count = 0;
    for (var j = 0; j < CUR_IMG_IN_PLAY.ansCoords.length; j++) {
      if (CUR_IMG_IN_PLAY.ansCoords[j] === "found") {
        count++;
      }
    }
    if (count === 5) {
      return true;
    }
    return false;
  }


  function isGameOver(option) {
    if (option === "final") {

      if (IMAGES.length - 1 === 0) {

        var count = 0;
        CUR_IMG_IN_PLAY.ansCoords.forEach(function (el, ind, arr) {
          if (el === "found") {
            count++;
          }
        });
        if (count === CUR_IMG_IN_PLAY.ansCoords.length) {
          return true;
        }
      } else {
        return false;
      }
    } else if (option === "lost") {
      GAME_OVER = true;
    } else if (option === "won") {

      GAME_OVER = true;
      clearInterval(TIMER_ID);
      playVictoryVideo();
    }
  }


  function gameplayRound(option) {
    if (option === "new") {

      var oldImgObj = IMAGES[CUR_IMG_IND];
      IMAGES_PLAYED.push(oldImgObj); 
      IMAGES.splice(CUR_IMG_IND, 1); 

      CUR_IMG_IND = randomIntFromInterval(0, IMAGES.length - 1);

      var newImgObj = IMAGES[CUR_IMG_IND];
      CUR_IMG_IN_PLAY = newImgObj;
      serveNewImg(newImgObj); 
    }
    if (option === "check") {

      return IMAGES[CUR_IMG_IND];
    }
  }


  function serveNewImg(imgObject) {

    var leftPaneClassList = document.getElementById("left-pane").classList;
    var rightPaneClassList = document.getElementById("right-pane").classList;
    var leftOldImgClass = "";
    var rightOldImgClass = "";
 
    leftPaneClassList.forEach(function (element, index, array) {
      if (element.includes("img")) {
        leftOldImgClass = element;
      }
    });
    rightPaneClassList.forEach(function (element, index, array) {
      if (element.includes("img")) {
        rightOldImgClass = element;
      }
    });

    $("#left-pane").removeClass(leftOldImgClass);
    $("#right-pane").removeClass(rightOldImgClass);

    $("#left-pane").addClass(imgObject.cssClass + "a");
    $("#right-pane").addClass(imgObject.cssClass + "b");
  }


  function timer(option) {
    if (option === "start") {
      TIMER_ID = setInterval(function () {
        var percentage = TIME_LEFT + "%";
        $("#time-bar").css("width", percentage);
        TIME_LEFT--;
        if (TIME_LEFT < 0) {

          clearInterval(TIMER_ID);
          GAME_OVER = true;
          document.getElementById("ticking").pause();
          document.getElementById("gameover").play();
        } else if (TIME_LEFT < 20) {
          $("#time-bar").removeClass(
            "progress-bar-warning progress-bar-success"
          );
          $("#time-bar").addClass("progress-bar-danger");
          document.getElementById("ticking").play();
        } else if (TIME_LEFT === 50) {
          $("#time-bar").removeClass(
            "progress-bar-warning progress-bar-success"
          );
          $("#time-bar").addClass("progress-bar-warning");
        } else if (TIME_LEFT === 99) {
          $("#time-bar").removeClass(
            "progress-bar-warning progress-bar-success progress-bar-danger"
          );
          $("#time-bar").addClass("progress-bar-success");
        }
      }, 700);
    } else if (option === "stop") {
      clearInterval(TIMER_ID);
    } else if (option === "add") {

      TIME_LEFT += 10;
    } else if (option === "penalty") {

      TIME_LEFT -= 6;
    }
  }


  function useClue() {

    if (ASSIST_CLUE_CREDITS > 0) {
      ASSIST_CLUE_CREDITS--;
      $(this).fadeOut();
      document.getElementById("clue-fx").play();


      var coordsArray = CUR_IMG_IN_PLAY.ansCoords; 
      var areaArray = CUR_IMG_IN_PLAY.ansArea; 
      var choiceCoords = []; 
      var choiceArea = []; 
      var index = 0;
   
      for (var i = 0; i < coordsArray.length; i++) {
        if (coordsArray[i] !== "found") {
          choiceCoords = coordsArray[i];
          choiceArea = areaArray[i];
          index = i;
        }
      }

      var centerX = choiceCoords[0];
      var centerY = choiceCoords[1];
      var lowerX = centerX - choiceArea[0];
      var upperX = centerX + choiceArea[0];
      var lowerY = centerY - choiceArea[1];
      var upperY = centerY + choiceArea[1];

      var arr = [lowerX, upperX, lowerY, upperY, centerX, centerY];

      CUR_IMG_IN_PLAY["found"].push(arr); 
      CUR_IMG_IN_PLAY.ansCoords[index] = "found"; 

      playTurn(arr);
    }
  }


  function initiateCountdown() {
    var count = 5;
    var tempTimer = setInterval(function () {
      $("#countdown-timer").text(count.toString()); 
      count--;
      if (count < 0) {
        clearInterval(tempTimer);
        $("#countdown-timer").text("");
      }
    }, 1000);
  }


  function getPosition(ev) {
    var paneId = ev.target.id;
    var leftOffset;
    var topOffset;
   
    if (paneId.includes("left")) {
      leftOffset = document.getElementById("left-pane").offsetLeft;
      topOffset = document.getElementById("left-pane").offsetTop;
    } else if (paneId.includes("right")) {
      leftOffset = document.getElementById("right-pane").offsetLeft;
      topOffset = document.getElementById("right-pane").offsetTop;
    }
  
    if (document.body.scrollTop) {
      topOffset -= document.body.scrollTop;
    }

    var x = ev.x; 
    var y = ev.y; 
    x -= leftOffset;
    y -= topOffset;



    return [x, y];
  }




  function drawEllipse(id, centerX, centerY, width, height) {
    var canv = document.getElementById(id);
    var ctx = canv.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - height / 2); 

    ctx.bezierCurveTo(

      centerX + width / 2,
      centerY - height / 2, 
      centerX + width / 2,
      centerY + height / 2, 
      centerX,
      centerY + height / 2
    );

    ctx.bezierCurveTo(
  
      centerX - width / 2,
      centerY + height / 2, 
      centerX - width / 2,
      centerY - height / 2, 
      centerX,
      centerY - height / 2
    ); 

    ctx.lineWidth = 6;
    ctx.strokeStyle = "#74C374";
    ctx.stroke();
  }


  function drawAndFadeCross(id, x, y) {
    var can = document.getElementById(id);
    var ctx = can.getContext("2d");
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#E03A4A";

    ctx.beginPath();

    ctx.moveTo(x - 20, y - 20);
    ctx.lineTo(x + 20, y + 20);
    ctx.stroke();

    ctx.moveTo(x - 20, y + 20);
    ctx.lineTo(x + 20, y - 20);
    ctx.stroke();

  
    setTimeout(function () {
      ctx.clearRect(x - 21, y - 21, 42, 42);
    }, 1000);
  }

 
  function clearCanvas() {
    var canv = document.getElementById("canvas-left").getBoundingClientRect();
    var width = Math.round(canv.width);
    var height = Math.round(canv.height);
    var canvLeft = document.getElementById("canvas-left").getContext("2d");
    var canvRight = document.getElementById("canvas-right").getContext("2d");

    canvLeft.clearRect(0, 0, width, height);
    canvRight.clearRect(0, 0, width, height);
  }

 
  $.fn.extend({
    animateCss: function (animationName) {
      var animationEnd =
        "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";
      $(this)
        .addClass("animated " + animationName)
        .one(animationEnd, function () {
          $(this).removeClass("animated " + animationName);
        });
    },
  });

//سارق جزء اخير ده
  function playVictoryVideo() {
    $("#videoPopUp").modal("show");
    var vidUrl = "https://www.youtube.com/embed/JPBRbIvs5lc?autoplay=1";
    $("#videoPopUp").find("iframe").attr("src", vidUrl);
    $(".modal").each(function () {
      $(this).on("click", function () {
        $(this).find("iframe").attr("src", "");
      });
    });
  }


  function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
});
