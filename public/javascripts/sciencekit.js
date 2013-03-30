localStorage['host'] = 'http://10.109.88.159:3000';
localStorage['client_id'] = 'abc123';
localStorage['client_secret'] = 'ssh-secret';

// socket.io
// Real-time event-driven sockets, client-side code.

// Socket connection for data streaming
var socketio = null;

$(function() {
	socketio = io.connect();

	// Error
	socketio.socket.on('error', function(reason) {
		console.error('Unable to connect socket.io', reason);

		$('#timeline-list').append('<li>Unable to connect (not authorized)</li>');
	});

	// Listen for 'connect' event listener and define event handler.
	socketio.on('connect', function () {
		console.log('Socket connected');
		// $('#timeline-list').append($('<li>Connected</li>'));

		socketio.on('oauthrequesttoken', function(incomingMsg) {
			//$('#timeline-list').append($('<li>Authenticating with access token</li>'));
			console.log('Authenticating with access token.');
			//var message = JSON.stringify({ 'token': oauthAccessToken, 'message': messageText });
			//var oauthAccessToken = $('#token_response').text(); // Get access token
			var oauthAccessToken = localStorage['token'];
			socketio.emit('oauthtoken', oauthAccessToken);
		});

		socketio.on('oauthtokensuccess', function(incomingMsg) {
			//$('#timeline-list').append($('<li>Authentication successful</li>'));
			//$('#timeline-list').append($('<li></li>').append($('<div></div>').text('Authentication successful')));
			console.log('Socket authentication successful.');
			// TODO: If there's an error, then remove the token from localStorage, request refresh (if expired, eg.,)
			//var oauthAccessToken = localStorage['token'];
			//socketio.emit('oauthtoken', oauthAccessToken);
		});

		socketio.on('message', function(message) {
			// $('#timeline-list').append($('<li></li>').append($('<div></div>').text(message)));
			console.log(message);

			addQuestion(message);

			// TODO: Update this to use custom message
			// var stroke = JSON.parse(message);
			// var s = new createjs.Shape();
			// s.graphics.clear().setStrokeStyle(stroke['size'], 'round', 'round').beginStroke(stroke['color']).moveTo(stroke['from'].x, stroke['from'].y).curveTo(stroke['midpoint'].x, stroke['midpoint'].y, stroke['to'].x, stroke['to'].y);
			// stage.addChild(s);
		});

		socketio.on('thought', function(thought) {
			addThought(thought);
		});

		socketio.on('photo', function(photo) {
			addPhoto(photo);
		});

		socketio.on('thought', function(thought) {
			console.log('Received thought: ' + thought);
		});

		socketio.on('disconnect', function() {
			console.log('Socket disconnected');
			// $('#timeline-list').append('<li>Disconnected</li>');
		});
	});





	// Define interaction event listeners

	// Set up event listener
	$('#outgoingChatMessage').keypress(function(event) {
		if(event.which == 13) {
			event.preventDefault();

			// var oauthAccessToken = $('#token_response').text(); // Get access token
			var oauthAccessToken = localStorage['token'];
			var messageText = $('#outgoingChatMessage').val();
			var message = JSON.stringify({ 'token': oauthAccessToken, 'text': messageText });

			console.log('Sending message: ' + message);
			socketio.send(message);
			//$('#timeline-list').append($('<li></li>').text($('#outgoingChatMessage').val()));
			$('#timeline-list').append($('<li></li>').append($('<div class="view-port"></div>').text($('#outgoingChatMessage').val())));
			$('#outgoingChatMessage').val('');
		}
	});
});

function hide(element) {
	element.hide();
}





var UUID = 0;
function getUUID() {
	return UUID++;
}

function getThoughts() {
	console.log('Requesting protected timeline resources.');
	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: '/api/thought',
		dataType: 'json',
		success: function(data) {
			console.log('Received protected thoughts (success).');
			console.log(data);
			// var user = jQuery.parseJSON(data);
			// $('#resource_response').text(data);
			for(thought in data) {
				// Add thought to timeline
				addThought(data[thought]);
			}

			// Scroll to element
			// x = 0;  //horizontal coord
			// y = document.height; //vertical coord
			// window.scroll(x,y);
			$('html,body').animate({ scrollTop: $('#action-palette').offset().top }, 'slow');
		},
		error: function() {
			console.log('Failed to retreive protected resource.');
		}
	});
}

function addThought(message) {

	var thought_id = getUUID();
	
	var thoughtDiv = $('<div id="' +  thought_id + '" contenteditable="true" class="thought-view-port"></div>')
		.html(message.text);

	var e = $('<li style="display: none;" data-id="flah"></li>')
			.append(thoughtDiv);

	thoughtDiv.blur(function() { saveThought(e) });

	$('#timeline-list').append(e);
	e.slideDown();
	return e;
}

function addPhoto(message) {

	var widget_uuid = getUUID();

	console.log("adding photo: " + message.uri);
	
	var thoughtDiv = $('<div id="' +  widget_uuid + '" contenteditable="false" class="thought-view-port"></div>')
		.html('<img src="' + localStorage['host'] + '' + message.uri + '" width="200" height="200" />');

	var e = $('<li style="display: none;" data-id=""></li>')
			.append(thoughtDiv);

	// thoughtDiv.blur(function() { saveThought(e) });

	$('#timeline-list').append(e);
	e.show();
	return e;
}

function saveThought(e) {
	alert("save thought");

	console.log(e.data());

	var dataJSON = {
		"thought" : {
			"id": (e.data("id") !== undefined ? e.data("id") : null),
			"text": e.text()
		}
	};

	// if (dataJSON.thought.id === undefined) {
		// TODO: if there's no data-id attribute, then POST, else UPDATE with the data-id value and let server decide how to store content (i.e., update it or create a new one?)
		console.log('Exchanging authorization grant for access token.');
		// console.log(data);
		$.ajax({
			type: 'POST',
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
			},
			url: '/api/thought',
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			data: JSON.stringify(dataJSON),
			processData: false,
			success: function(data) {
				console.log('Saved thought: ' + data._id);

				// Update local copy of thought
				e.data('id', data._id);
				console.log('Set: ' + e.data('id'));
			},
			error: function() {
				console.log('Failed to save thought.');
			}
		});
	// } else {
	// 	alert("update");
	// }
}




function addQuestion(message) {
	
	var e = $('<li style="display: none;" class="timeline-list-item"></li>')
		.append($('<div contenteditable="false" class="view-port"></div>')
			.html('what do you wonder about?'))
		.append($('<div contenteditable="true" class="question-view-port"></div>')
			.html('touch here to ask your question'));
	// e.hide();

	$('#timeline-list').append(e);
	e.slideDown();

	// TODO: handle saving automatically

	// TODO: handle "focus" handler

	return e;
}

function addCauseAndEffect(message) {
	
	$('#timeline-list')
		.append($('<li></li>')
			.append($('<div contenteditable="true" class="cause-and-effect-view-port"></div>')
				.html('what did you notice?'))
			.append($('<div contenteditable="true" class="cause-and-effect-view-port"></div>')
				.html('why did it happen?')));
}

function addStepByStep(message) {
	
	$('#timeline-list')
		.append($('<li></li>')
			.append($('<div contenteditable="true" class="step-by-step-view-port"></div>')
				.html('what\'s the next step?')));
}

function addNote(message) {
	
	$('#timeline-list')
		.append($('<li></li>')
			.append($('<div contenteditable="true" class="note-view-port"></div>')
				.html('what\'s of note?')));
}








// OAuth2 Client (prior to authentication/authorization flow)

function requestAuthorizationGrant(options) {

	var uri = "/dialog/authorize?client_id=" + options['client_id'] + "&client_secret=" + options['client_secret'] + "&response_type=code&redirect_uri=/oauth/exchange";

	$('#authorize_link').attr('href', uri);
	alert($('#authorize_link').attr());
	//$('#authorize_link').click();
}


// OAuth2 Client-side Code

window.onload = function() {

	getThoughts();

	// Client
	$('#authorize_link').click(function() {

		requestAuthorizationGrant({
				'client_id': localStorage['client_id'],
				'client_secret': localStorage['client_secret'],
				'response_type': 'code',
				'redirect_uri': '/oauth/exchange'
			});
	});

	// Check if an OAuth authorization code was received


	if(window.location.search.indexOf("code=") !== -1) {

		var from = window.location.search.indexOf("code=") + 5;
		var to = window.location.search.indexOf("&", from);
		var code = null;
		if (to !== -1) {
			code = window.location.search.substring(from, to);
			localStorage['code'] = code;
		} else {
			code = window.location.search.substring(from);
			localStorage['code'] = code;
		}
	}


	// OAuth 2
	//var a_link = document.getElementById("auth_link");
	$("#auth_link").click(function() {
		exchangeGrantForAccessToken({ 
			'client_id': localStorage['client_id'],
			'client_secret': localStorage['client_secret'],
			'code': localStorage['code'],
			'grant_type': 'authorization_code',
			'redirect_uri': '/'
		});

		return false;
	});

	$('#account-list').click(function() {
		
		//var access_token = $('#token_response').text();

		apiGetUser({
				'access_token': localStorage['token']
			});

		return false;
	});




	// Set up interface
	// $('#create-question-button').click(function() {
	// 	$('#question-form').slideDown();
	// });
}

function exchangeGrantForAccessToken(options) {
	console.log('Exchanging authorization grant for access token.');
	// console.log(data);
	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		},
		url: '/oauth/token',
		data: 'client_id=' + options['client_id'] + '&client_secret=' + options['client_secret'] + '&code=' + options['code'] + '&grant_type=authorization_code&redirect_uri=/oauth/exchange',
		dataType: 'text',
		processData: false,
		success: function(data) {
			console.log('Received access token (success).');
			var token = jQuery.parseJSON(data);
			$('#token_response').text(token.access_token);
			localStorage['token'] = token.access_token;
		},
		error: function() {
			console.log('Failed to retreive access token.');
		}
	});
}

function apiGetUser(options) {
	console.log('Requesting protected resource user.');
	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + options['access_token']);
		},
		url: '/api/account/list',
		dataType: 'text',
		success: function(data) {
			console.log('Received protected resource (success).');
			var user = jQuery.parseJSON(data);
			$('#resource_response').text(data);
		},
		error: function() {
			console.log('Failed to retreive protected resource.');
		}
	});
}