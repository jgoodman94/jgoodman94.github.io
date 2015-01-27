  var HEARTBEAT_TIME = 10000;

  $(function() {

    peer = new Peer({
      key: 'lwjd5qra8257b9'
      }); // this is me
    peer.on('open', function(id) {
      peerID = id;
      console.log('My peer ID is: ' + id);
    });


      // initialize with API key
      Parse.initialize("cLQ1TweezsDIp2ysSvYvXETLozVZIMdRfExqEg7u", "fgapofWIKhtAQfuToqAbRRlNHCAfBbFR6pusDzBk");

      initiateUser();



      //alert('it has been changed');
      vchatCheck();
      //set chat-output size to rest of screen
      window.addEventListener("resize", calcOutputHeight);

      function calcOutputHeight() {
        var h = $(window).height();
        var leftover = h - $('#header').height() - $('#localVid').height() - $('#chat-input-row').height();
          //console.log(leftover);
          $("#chat-output").height(leftover);
          $("#chat-output-row").height(leftover);
        };

      //TEXT FUNCTIONS
      $chatOutput = $('#chat-output');
      $chatInput = $('#chat-input');


      // for automatic scroll and disabling stuff
      chatOutput = document.getElementById('chat-output');
      chatInput = document.getElementById('chat-input');


      $chatInput.keyup(function(e) {
        if (e.keyCode != 13) return;
        $chatOutput.append('<span style="color:#4099FF"><b>Me</b>:</span> ' + this.value + '<br />');
        conn.send(this.value);
        chatOutput.scrollTop = chatOutput.scrollHeight;
        this.value = '';
      });


      //id = "undefined";
      looking = false;

      // webRTC object
      var webrtc = new SimpleWebRTC({
          // the id/element dom element that will hold "our" video
          localVideoEl: 'localVid',
          // the id/element dom element that will hold remote videos
          remoteVideosEl: 'remoteVid',
          autoRequestMedia: true
        });

      // wait until we get permission
      webrtc.on('localStream', function(stream) {
          //console.log('got permission');
          $("#wait").html("<p>You\'re all set! <i class='fa fa-check-circle'></i></p>");
          $('#start').show();
        });

      // click "go", aka 'I'm ready to chat!'
      $('#start').click(function() {



        looking = true;
        giveUpIn(10000);
        $('#childTop').html('');
        $('#childFoot').html('');
          // look for some frands, join if there
          searchRequest(webrtc);
        });

      // get rid of spinner when friend comes on
      webrtc.on('peerStreamAdded', function() {
        window.clearTimeout(giveUp);
        looking = false;
          //id = "undefined";
          $('#disconnected').hide();
          $('#doggy').hide();
          $('#smallShuffle').show();
          $('#smallShuffle').css('color', '#4099FF');
          $('.spinner').hide();

          //briefly delay text chat to make sure connection is open
          // temporary fix
          setTimeout(function() {
            $chatOutput.append('<span style="color:red"><b>Say hi!</b><br></span>');
            chatInput.disabled = false;
            $chatInput.focus();
          }, 1000);

        });

      // allow 'next' option when partner leaves
      webrtc.on('peerStreamRemoved', function() {
          // leave rooms when ur friend leaves
          webrtc.leaveRoom();
          $chatOutput.html('');
          chatInput.disabled = true;
          $('#disconnected').show();
          $('#doggy').show();
          $('#bigShuffle').show();
        });

      /* deal with color changes
      webrtc.on('sepia', function(data) {
          console.log('sepia sent?');
        })*/

      /*
    $('#localVid').click(function() {
        webrtc.sendToAll('chat', {data: '!!!some text!!!'});
        peer.send('chat', {data: '!!!!!!!!!!! sent via A'});
    });

    webrtc.on('message', function(message){
        if (message.type === 'offer') {
        } else if (message.type === 'chat') {
            console.log('>>>>> chat ');
            console.log(message); 
        }
    });
  */

  $('.next').click(function() {
    if (looking == true)
      return;
    $('#smallShuffle').css('color', 'lightgrey');
          // leave rooms when u click next
          webrtc.leaveRoom();
          $chatOutput.html('');

          looking = true;
          giveUpIn(10000);
          $('#disconnected').hide();
          $('#doggy').hide();
          // look for some frands, join if there
          $('#bigShuffle').hide();
          // reset text in disconnected
          $('#disconnected').html('Your partner has disconnected :(<br><br>');
            searchRequest(webrtc);
          });


      //add effects to video
      var index = 0;
      var filters = ['grayscale', 'sepia', 'blur', 'contrast', 'hue-rotate', 'saturate', 'invert', ''];

      //change the current effect
      function changeFilter(e) {
        var la = e.target;
        la.className = '';
        var effect = filters[index++ % filters.length];
          // loop through filters.
          if (effect) {
            la.classList.add(effect);
          }
        }

      //change filter on click
      //document.getElementById("localVid").addEventListener('click', changeFilter, false);


      /*send filters to other person
              $('#localVid').click(function(peer) {
                  peer.send('sepia');
                });*/

});

  // add request for chat to database
  function addRequest(webrtc) {
    var Request = Parse.Object.extend("Request");
    var request = new Request();
    request.set("peerID", peerID);
    request.save(null, {
      success: function(request) {
        myID = request.id;
        console.log("Request added under id: " + myID);
              //create webrtc room and text chat room
              webrtc.joinRoom(myID);

              // prepare to receive connection, after you added it to parse
              peer.on('connection', function(myConn) {
                console.log('PEERJS: someone finally answered!');

                conn = myConn;

                conn.on('open', function() {
                      // Receive messages
                      conn.on('data', function(data) {
                        console.log('Received', data);
                        $chatOutput.append('<span style="color:#ff8f00"><b>Stranger</b>:</span> ' + data + '<br />');
                        chatOutput.scrollTop = chatOutput.scrollHeight;
                      });
                    });
              });
            },
            error: function() {
              console.log("something's fucked up");
            }
          });
}

  // returns either request id or undefined
  function searchRequest(webrtc) {
    $('.spinner').show();
    var Request = Parse.Object.extend("Request");
    var requestQuery = new Parse.Query(Request);
    requestQuery.first({
      success: function(request) {
              // entry is in database
              // join room of other person, then destroy that persons
              if (request != undefined) {
                textID = request.id;
                console.log("matched to: " + request.id);


                  // join webrtc and text chat rooms
                  webrtc.joinRoom(request.id);
                  conn = peer.connect(request.attributes.peerID);

                  conn.on('open', function() {
                      // Receive messages
                      conn.on('data', function(data) {
                        console.log('Received', data);
                        $chatOutput.append('<span style="color:#ff8f00"><b>Stranger</b>:</span> ' + data + '<br />');
                        chatOutput.scrollTop = chatOutput.scrollHeight;
                      });

                    });




                  destroyPartner(request.id);
                  return;
                }
              // entry is not in database;
              console.log("search returned no matches");
              console.log('about to add request...');
              addRequest(webrtc);
              return;
            },
            error: function(error) {
              alert("Error: " + error.code + " " + error.message);
            }
          });
}


function destroyPartner(searchResult) {
  var Request = Parse.Object.extend("Request");
  var requestQuery = new Parse.Query(Request);
  requestQuery.equalTo("objectId", searchResult);
  requestQuery.first({
    success: function(searchResult) {
      if (searchResult != undefined) {
        searchResult.destroy({
          success: function(searchResult) {
            console.log("deleted request object with id: " + searchResult.id);
          },
          error: function(searchResult, error) {
            alert("Error. Object could not be deleted: " + error.code + " " + error.message);
          }
        });
      }
    },
    error: function(error) {
      alert("Error. Request not found: " + error.code + " " + error.message);
    }
  });
}

function giveUpIn(numMillis) {
  giveUp = window.setTimeout(function() {
    looking = false;
    $('.spinner').hide();
    $('#disconnected').html('Everyone\'s busy in their chats,<br> or very few people are online at the moment.');
    $('#disconnected').show();
    $('#doggy').show();
    $('#bigShuffle').show();
          //$('#smallShuffle').show();
          $('#smallShuffle').css('color', '#4099FF');
          destroyPartner(myID);
        }, numMillis);
}

function rageQuit() {
          // if we're looking for a partner and then quit
          // search database for our id and delete the request
          var Request = Parse.Object.extend("Request");
          var query = new Parse.Query(Request);
          query.get(myID, {
            success: function(myObj) {
              myObj.destroy({});
            },
            error: function() {
                  // parse error with error code
                }
              });
          return "There'll be more people on later, we promise.";
        }
      // reset things on leaving page
      window.onbeforeunload = function(e) {
        window.open("http://www.w3schools.com");

        if (looking == true)
          return rageQuit();

        return;
      };

  //calculate and display users online
  function getUsersOnline() {
          // if taking too long or if this is too intense on the
          // server, change this code to work with a forever lasting
          // row that keeps a count of users online. then, just
          // retrieve this value instead of counting up the whole table.
          // increment and decrement this value on page load and
          // when we find a user that has a dead heartbeat, respectively.

          var Online = Parse.Object.extend("Online");
          var query = new Parse.Query(Online);

          query.count({
            success: function(number) {
              if (number == 1)
                $('#usersOnline').text(number + " user online");
              else
                $('#usersOnline').text(number + " users online");
            },
            error: function(object, error) {
                  //error somehow
                  $('#usersOnline').text("Unlimited users online");
                }
              });

        }
      /*
          function decrementUsers() {
            //decrease users online
            // Create a pointer to an object of class Point with id dlkj83d
            var Point = Parse.Object.extend("Online");
            var point = new Point();
            point.id = "sNus417KBq";

            // decrement onleave
            point.increment("usersOnline", -1);

            // Save
            point.save(null, {
                success: function(point) {
                    // Saved successfully.
                },
                error: function(point, error) {
                    // The save failed.
                    // error is a Parse.Error with an error code and description.
                }
            });

}*/

  //add user to database, give him a heartbeat
  // and check/delete any users whose heartbeat
  // has not been updated in the past 10 minutes
  function initiateUser() {

    var User = Parse.Object.extend("Online");
    var user = new User();
    user.save(null, {
      success: function(request) {
        heartbeat(request.id);
              //this function will also get users online
              deleteDeadUsers();
            },
            error: function() {
              console.log("something's fucked up");
            }
          });

  }

  // set heartbeat for current user
  // aka, ping user's row in parse every HEARTBEAT_TIME millisecs
  function heartbeat(userID) {
      // pointer to current user's row in database
      var userPoint = Parse.Object.extend("Online");
      var myPoint = new userPoint();
      myPoint.id = userID;

      // tell my row that I'm still online every 10 minutes
      // user's "heartbeat"
      setInterval(function() {

        myPoint.save(null, {
          success: function() {},
          error: function() {}
        });
      }, HEARTBEAT_TIME);
    }

  //deletes inactive users from database
  function deleteDeadUsers() {
    var usersOnline = Parse.Object.extend("Online");
    var query = new Parse.Query(usersOnline);


    query.find({
      success: function(results) {
        currentDate = new Date();
        resultLength = results.length;

        for (var i = 0; i < resultLength; i++) {
          var updatedTime = results[i].updatedAt.getTime();
          var timeSinceUpdate = Math.floor((currentDate.getTime() - updatedTime) / 1000);

          if (timeSinceUpdate > (HEARTBEAT_TIME / 1000))
            results[i].destroy({});
        }

        getUsersOnline();
      },
      error: function(error) {
              // some error
            }
          });


  }


  // check if browser will support vchat
  function vchatCheck() {
    var alertMessage = 'This is a pretty cool site.<br>';

    if (bowser.name == 'Chrome') {
      if (bowser.version < 23) {
        alertMessage += '<span style=color:white>Please update Chrome if you want to experience it.</span><br><br>Then we\'ll let you in.';
        $('#modal').html(alertMessage);
        $('#overlay').show();
        $('#modal').show();
      }
    } else if (bowser.name == 'Firefox') {
      if (bowser.version < 22) {

        alertMessage += '<span style="color:white">Please update Firefox if you want to experience it.</span><br><br>Then we\'ll let you in.';
        $('#modal').html(alertMessage);
        $('#overlay').show();
        $('#modal').show();
      }
    } else if (bowser.name == 'Opera') {
      if (bowser.version < 18) {
        alertMessage += '<span style="color:white">Please update Opera if you want to experience it.</span><br><br>Then we\'ll let you in.';
        $('#modal').html(alertMessage);
        $('#overlay').show();
        $('#modal').show();
      }
    } else {
      alertMessage += '<span style="color:white">Please download Chrome or Firefox if you want to experience it.</span><br><br>Then we\'ll let you in.';
      $('#modal').html(alertMessage);
      $('#overlay').show();
      $('#modal').show();
    }
  }