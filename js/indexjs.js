$(function() {
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
    channel = new DataChannel();

    //TEXT FUNCTIONS
    var $chatOutput = $('#chat-output');
    var $chatInput = $('#chat-input');

    // for automatic scroll
    var chatOutput = document.getElementById('chat-output');

    $chatInput.keyup(function(e) {
        if (e.keyCode != 13) return;
        channel.send(this.value);
        $chatOutput.append('<span style="color:#4099FF"><b>Me</b>:</span> ' + this.value + '<br />');
        chatOutput.scrollTop = chatOutput.scrollHeight;
        this.value = '';
    });

    channel.onopen = function() {
        $chatInput.disabled = false;
        // Tinder like prompting messages here
        $chatOutput.append('Say hi!<br>');
        $chatInput.focus();
    };

    channel.onmessage = function(message) {
        $chatOutput.append('<span style="color:#fac03b"><b>Stranger:</b></span> ' + message + '<br />');
        console.log('LOOK AT THIS MESSAGE: ' + message);
        chatOutput.scrollTop = chatOutput.scrollHeight;
    };

    channel.onleave = function(userid) {
        //$chatOutput.innerHTML = userid + ' Left.<hr />' + $chatOutput.innerHTML;
    };



    // initialize with API key
    Parse.initialize("cLQ1TweezsDIp2ysSvYvXETLozVZIMdRfExqEg7u", "fgapofWIKhtAQfuToqAbRRlNHCAfBbFR6pusDzBk");

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
        channel = new DataChannel();
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
        $('#next').show();
        $('.spinner').hide();
    });

    // allow 'next' option when partner leaves
    webrtc.on('peerStreamRemoved', function() {
        // leave rooms when ur friend leaves
        webrtc.leaveRoom();
        channel.leave();

        $('#disconnected').show();
        $('#doggy').show();
        $('#next').show();
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

    $('#next').click(function() {
        // leave rooms when u click next
        webrtc.leaveRoom();
        channel.leave();



        looking = true;
        giveUpIn(10000);
        $('#disconnected').hide();
        $('#doggy').hide();
        // look for some frands, join if there
        $('#next').hide();
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
    request.save(null, {
        success: function(request) {
            id = request.id;
            console.log("Request added under id: " + id);
            //create webrtc room and text chat room
            webrtc.joinRoom(id);
            channel.open(id);

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
                channel.connect(request.id);

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
        $('#next').show();
        destroyPartner(id);
    }, numMillis);
}

function rageQuit() {
        // if we're looking for a partner and then quit
        // search database for our id and delete the request
        var Request = Parse.Object.extend("Request");
        var query = new Parse.Query(Request);
        query.get(id, {
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
    if (looking == true)
        return rageQuit();

    return;
};




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