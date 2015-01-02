$(function() {
	//set chat-output size to rest of screen
	window.addEventListener("resize", calcOutputHeight);
	function calcOutputHeight () {
		var h = $( window ).height();
		var leftover = h - $('#header').height() - $('#localVid').height() - $('#chat-input-row').height();
		console.log(leftover);
		$("#chat-output").height(leftover);
		$("#chat-output-row").height(leftover);
	};
	
	// initialize with API key
	Parse.initialize("cLQ1TweezsDIp2ysSvYvXETLozVZIMdRfExqEg7u", "fgapofWIKhtAQfuToqAbRRlNHCAfBbFR6pusDzBk");

	//id = "undefined";
	looking = false;


	/*window.setInterval(function() {
		console.log(id);

	}, 1000);
*/
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
    	$('#childTop').html('');
    	$('#childFoot').html('');    	
        // look for some frands, join if there
        searchRequest(webrtc);       
    });

    // get rid of spinner when friend comes on
    webrtc.on('peerStreamAdded', function() {
    	looking = false;
    	//id = "undefined";
    	$('#disconnected').hide();
    	$('#responsive').hide();
    	$('#next').show();
    	$('.spinner').remove();
    });

    // allow 'next' option when partner leaves
    webrtc.on('peerStreamRemoved', function() {
    	$('#disconnected').show();
    	$('#responsive').show();
    	$('#next').show();
    });

    $('#next').click(function() {
    	webrtc.leaveRoom();
    	looking = true;
    	$('#disconnected').hide();
    	$('#responsive').hide();
    	// look for some frands, join if there
    	$('#next').hide();
    	searchRequest(webrtc);
    });



    //TEXT FUNCTIONS

    var channel = new DataChannel("channel1");
    channel.open("channel1");

    channel.onopen() {
    	
    }


    $("#localVid").click (function () {
		channel.open();
		alert("penis");
    });

    var chatOutput = $('#chat-output');
    var chatInput = $('#chat-input');
    chatInput.click(function () {
    	alert("hey");
    });

    chatInput.onkeypress = function (e) {
        if (e.keyCode != 13) return;
        channel.send(this.value);
        chatOutput.innerHTML = 'Me: ' + this.value + '<hr />' + chatOutput.innerHTML;
        this.value = '';
    };

   
    channel.onopen = function (userid) {
    	console.log("is open");
        chatInput.disabled = false;
        chatInput.focus();
    };


    channel.onmessage = function (message, userid) {
        chatOutput.innerHTML = userid + ': ' + message + '<hr />' + chatOutput.innerHTML;
    };

    channel.onleave = function (userid) {
        chatOutput.innerHTML = userid + ' Left.<hr />' + chatOutput.innerHTML;
    };

    // search for existing data channels
    channel.connect();


});

function addRequest(webrtc) {
	var Request = Parse.Object.extend("Request");
	var request = new Request();
	request.save(null, {
		success: function(request) {
			id = request.id;
			console.log("Request added under id: " + id);
			webrtc.joinRoom(id);
		},
		error: function() {
			console.log("something's fucked up");
		}
	});	
}

// returns either request id or undefined
function searchRequest(webrtc) {
	$('#remoteVid').prepend('<div class="spinner">\
		<div class="double-bounce1"></div>\
		<div class="double-bounce2"></div>\
		</div>');
	var Request = Parse.Object.extend("Request");
	var requestQuery = new Parse.Query(Request);
	requestQuery.first({
		success: function(request) {
			// entry is in database
			// join room of other person, then destroy that persons
			if (request != undefined) {
				console.log("matched to: " + request.id);
				console.log('never tried...');
				webrtc.joinRoom(request.id);
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
	var Request = Parse.Object.extend("Request") ;
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

function rageQuit()
{
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
	return "Are you sure you want to rage quit?";
}
    // reset things on leaving page
    window.onbeforeunload = function(e) {
    	if (looking == true)
    		return rageQuit();

    	return;
    };





