var credentials = {
  clientID: "6b8183f7-0d61-4fa9-8909-6bc421331ce4",
  clientSecret: "ggMy0Y0HMjzUUZumTceGYDB",
  site: "https://login.microsoftonline.com/common",
  authorizationPath: "/oauth2/v2.0/authorize",
  tokenPath: "/oauth2/v2.0/token"
}
var oauth2 = require("simple-oauth2")(credentials)

var redirectUri = "http://localhost:8000/authorize";

var scopes = [ "openid",
               "https://outlook.office.com/calendars.readwrite",
               "profile" ];

function getAuthUrl() {
  var returnVal = oauth2.authCode.authorizeURL({
    redirect_uri: redirectUri,
    scope: scopes.join(" ")
  });
  console.log("Generated auth url: " + returnVal);
  return returnVal;
}

function getTokenFromCode(auth_code, callback, response) {
  var token;
  oauth2.authCode.getToken({
    code: auth_code,
    redirect_uri: redirectUri,
    scope: scopes.join(" ")
    }, function (error, result) {
      if (error) {
        console.log("Access token error: ", error.message);
        callback(response, error, null);
      }
      else {
        token = oauth2.accessToken.create(result);
        console.log("Token created: ", token.token);
        callback(response, null, token);
      }
    });
}

function getEmailFromIdToken(id_token) {
  // JWT is in three parts, separated by a '.'
  var token_parts = id_token.split('.');
  
  // Token content is in the second part, in urlsafe base64
  var encoded_token = new Buffer(token_parts[1].replace("-", "+").replace("_", "/"), 'base64');
  
  var decoded_token = encoded_token.toString();
  
  var jwt = JSON.parse(decoded_token);
  
  // Email is in the preferred_username field
  return jwt.preferred_username
}

exports.getAuthUrl = getAuthUrl;
exports.getEmailFromIdToken = getEmailFromIdToken;
exports.getTokenFromCode = getTokenFromCode; 