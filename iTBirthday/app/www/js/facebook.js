angular.module('itBirthday.facebook', [])

  .controller('FacebookCtrl', function ($scope, $http) {

    $scope.login = function () {
    };

    $scope.post = function() {
      console.log("Posting on facebook");
    };

    $scope.checkLoginState = function () {
      FB.getLoginStatus(function(response) {

        statusChangeCallback(response, $scope);

        console.log($scope.facebookUser);
      });
    };

    $scope.updateFacebookData = function() {

      if($scope.facebookUser.token == undefined) {
        console.log("Token is undefined!");
        return;
      }

      if($scope.facebookUser.expiresIn == undefined) {
        console.log("ExpiresIn is undefined!");
        return;
      }

      $http.post('/update_facebook_data', {
        token: $scope.facebookUser.token,
        expiresIn: $scope.facebookUser.expiresIn
      }).success(function (data) {

        console.log("Facebook data successfully updated!");
        return true;
      }).error(function (err) {

        console.log('Error while udapting facebook data: ' + err);
        return false;
      });

      console.log("Update Facebook Data terminated");
    };
  })

  .run(['$rootScope', '$window',
    function ($rootScope, $window) {

      $rootScope.facebookUser = {};

      $window.fbAsyncInit = function() {
        // Executed when the SDK is loaded

        FB.init({
          appId: '1046778285368752',
          channelUrl: 'app/www/channel.html',
          status: true,
          cookie: true,
          xfbml: true
        });

        FB.getLoginStatus(function(response) {

          statusChangeCallback(response, $rootScope);

          console.log($rootScope.facebookUser);
        });
      };

      (function(d){
        // load the Facebook javascript SDK
        var js,
          id = 'facebook-jssdk',
          ref = d.getElementsByTagName('script')[0];

        if (d.getElementById(id)) {return;}

        js = d.createElement('script');
        js.id = id;
        js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";

        ref.parentNode.insertBefore(js, ref);
      }(document));
  }]);

var statusChangeCallback = function(response, $scope) {

  // The response object is returned with a status field that lets the
  // app know the current login status of the person.
  // Full docs on the response object can be found in the documentation
  // for FB.getLoginStatus().
  if (response.status === 'connected') {
    // Logged into your app and Facebook.

    $scope.facebookUser.token = response.authResponse.accessToken;
    $scope.facebookUser.expiresIn = response.authResponse.expiresIn;

  } else if (response.status === 'not_authorized') {

    // The person is logged into Facebook, but not your app.
    document.getElementById('status').innerHTML = 'Please log into this app.';
  } else {

    // The person is not logged into Facebook, so we're not sure if
    // they are logged into this app or not.
    document.getElementById('status').innerHTML = 'Please log into Facebook.';
  }
};

var checkLoginState = function () {
  FB.getLoginStatus(function(response) {

    statusChangeCallback(response);
  });
};
