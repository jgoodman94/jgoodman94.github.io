Parse.initialize("cLQ1TweezsDIp2ysSvYvXETLozVZIMdRfExqEg7u", "fgapofWIKhtAQfuToqAbRRlNHCAfBbFR6pusDzBk");

$(function () {
partner = "bIZ8Daj9Z9";
destroyPartner();
});


function nextButton() {
	partner = searchRequest();
	console.log("partner: " + partner);
	if (partner == "undefined") {
		addRequest();
	}
	else {
		destroyPartner();
		console.log("room created with roomId: " + partner);
		//createRoom(partner);
	}
}

function addRequest() {
	var Request = Parse.Object.extend("Request");
	var request = new Request();
	request.save(null, {
		success: function(request) {
			id = request.id;
			console.log("Request added under id: " + id);
		},
		error: function() {
			console.log("something's fucked up");
		}
	});	
}

// returns either request id or undefined
function searchRequest() {
	var Request = Parse.Object.extend("Request");
	var requestQuery = new Parse.Query(Request);
	requestQuery.first({
	  success: function(request) {
	  	if (request != undefined) {
		  	console.log("matched to: " + request.id);
		  	return request.id;
	  	}
	  	else {
	  	return "undefined";
	  	console.log("search returned no matches")
	  	}
	  },
	  error: function(error) {
	    alert("Error: " + error.code + " " + error.message);
	  }
	});
}

function destroyPartner() {
	var Request = Parse.Object.extend("Request") ;
	var requestQuery = new Parse.Query(Request);
	requestQuery.equalTo("objectId", partner);
	requestQuery.first({
	  	success: function(partner) {
	  		if (partner != undefined) {
			  	partner.destroy({
		  			success: function(partner) {
		    			console.log("deleted request object with id: " + partner.id);
		  			},
		  			error: function(partner, error) {
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
/*
function createRoom(roomId) {
	var webrtc = new SimpleWebRTC({
		// the id/element dom element that will hold "our" video
		localVideoEl: 'localVideo',
		// the id/element dom element that will hold remote videos
		remoteVideosEl: 'remotesVideos',
		// immediately ask for camera access
		autoRequestMedia: true
	});

	// we have to wait until it's ready
	webrtc.on('readyToCall', function () {
	// you can name it anything
	webrtc.joinRoom(roomId);
	});
}
*/