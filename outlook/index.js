var server = require("./server");
var router = require("./router");
var authHelper = require("./authHelper");
var outlook = require("node-outlook");

var handle = {};
handle["/"] = home;
handle["/authorize"] = authorize;
handle["/createEvent"] = calendar;
handle["/getEvents"] = getEvents;

server.start(router.route, handle);

function home(response, request) {
  console.log("Request handler 'home' was called.");
  response.writeHead(200, {"Content-Type": "text/html"});
  response.write('<p>Please <a href="' + authHelper.getAuthUrl() + '">sign in</a> with your Office 365 or Outlook.com account.</p>');
  response.end();
}

var url = require("url");
function authorize(response, request) {
  console.log("Request handler 'authorize' was called.");
  
  // The authorization code is passed as a query parameter
  var url_parts = url.parse(request.url, true);
  var code = url_parts.query.code;
  console.log("Code: " + code);
  authHelper.getTokenFromCode(code, tokenReceived, response);
}

function tokenReceived(response, error, token) {
  if (error) {
    console.log("Access token error: ", error.message);
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<p>ERROR: ' + error + '</p>');
    response.end();
  }
  else {
    var cookies = ['node-tutorial-token=' + token.token.access_token + ';Max-Age=3600',
                   'node-tutorial-email=' + authHelper.getEmailFromIdToken(token.token.id_token) + ';Max-Age=3600'];
    response.setHeader('Set-Cookie', cookies);
    response.writeHead(302, {'Location': 'http://localhost:8000/getEvents'});
    response.end();
  }
}

function getValueFromCookie(valueName, cookie) {
  if (cookie.indexOf(valueName) !== -1) {
    var start = cookie.indexOf(valueName) + valueName.length + 1;
    var end = cookie.indexOf(';', start);
    end = end === -1 ? cookie.length : end;
    return cookie.substring(start, end);
  }
}

function getEvents(response, request){
	var token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
	console.log("Token found in cookie: ", token);
	var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);
	console.log("Email found in cookie: ", email);
	if (token) {
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write('<div><h1>Your calendar</h1></div>');
		
		var queryParams = {
		  '$select': 'Subject,Start,End',
		  '$orderby': 'Start/DateTime desc',
		  '$top': 10
		};
		
		// Set the API endpoint to use the v2.0 endpoint
		outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
		// Set the anchor mailbox to the user's SMTP address
		outlook.base.setAnchorMailbox(email);
		// Set the preferred time zone.
		// The API will return event date/times in this time zone.
		outlook.base.setPreferredTimeZone('Eastern Standard Time');
	}
	
	var userInfo = {
		email: 'lgptest@xiiiorg.onmicrosoft.com'
	};
	
	outlook.calendar.getEvents({token: token, odataParams: queryParams},
      function(error, result){
        if (error) {
          console.log('getEvents returned an error: ' + error);
          response.write("<p>ERROR: " + error + "</p>");
          response.end();
        }
        else if (result) {
          console.log('getEvents returned ' + result.value.length + ' events.');
          response.write('<table><tr><th>Subject</th><th>Start</th><th>End</th></tr>');
          result.value.forEach(function(event) {
            console.log('  Subject: ' + event.Subject);
            response.write('<tr><td>' + event.Subject + 
              '</td><td>' + event.Start.DateTime.toString() +
              '</td><td>' + event.End.DateTime.toString() + '</td></tr>');
          });
          
          response.write('</table>');
          response.end();
        }
      });
}

function createEvent(response, request) {
  var token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
  console.log("Token found in cookie: ", token);
  var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);
  console.log("Email found in cookie: ", email);
  if (token) {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<div><h1>Your calendar</h1></div>');
    
    var queryParams = {
      '$select': 'Subject,Start,End',
      '$orderby': 'Start/DateTime desc',
      '$top': 10
    };
	
    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the anchor mailbox to the user's SMTP address
    outlook.base.setAnchorMailbox(email);
    // Set the preferred time zone.
    // The API will return event date/times in this time zone.
    outlook.base.setPreferredTimeZone('Eastern Standard Time');
   
	var newEvent = {
	  "Subject": "Discuss the Calendar REST API",
	  "Body": {
		"ContentType": "HTML",
		"Content": "I think it will meet our requirements!"
	  },
	  "Start": {
		"DateTime": "2016-02-03T18:00:00",
		"TimeZone": "Eastern Standard Time"
	  },
	  "End": {
		"DateTime": "2016-02-03T19:00:00",
		"TimeZone": "Eastern Standard Time"
	  },
	  "Attendees": [
	  ]
	};
	
	var userInfo = {
		email: 'lgptest@xiiiorg.onmicrosoft.com'
	};
	
	outlook.calendar.createEvent({token: token, event: newEvent, user: userInfo},
	  function(error, result){
		if (error) {
		  console.log('createEvent returned an error: ' + error);
		}
		else if (result) {
		  console.log(JSON.stringify(result, null, 2));
		}
	  });
  }
  else {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<p> No token found in cookie!</p>');
    response.end();
  }
}