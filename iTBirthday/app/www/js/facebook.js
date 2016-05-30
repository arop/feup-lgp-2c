// The code below is the asynchronous loading of the facebook API
(function (d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

window.fbAsyncInit = function () {
  FB.init({
    appId: '1046778285368752',
    xfbml: true,
    version: 'v2.4'
  });
};

// Below we create the service for OAuth authentication
var appModule = angular.module('itBirthday');
appModule.service('FBAuth', function ($q, $http, $ionicLoading) {

  this.getLoginStatus = function () {
    var defer = $q.defer();

    if(FB == undefined) {
      return false;
    }

    FB.getLoginStatus(function (response) {
      return (response.status === "connected");
    });

    return defer.promise;
  };

  this.loginFacebook = function () {
    var defer = $q.defer();

    FB.login(function (response) {

      if (response.status === "connected") {
        var userID = response["authResponse"]["userID"];
        var token = response["authResponse"]["accessToken"];

        $http.post(serverUrl + '/post_facebook_info/', {
          userID: userID,
          token: token
        }).success(function () {
          console.log("FB: success logging in");
        });
      } else {
        console.error("FB: error logging in");
      }
    }, {
      scope: 'public_profile, email, publish_actions, publish_pages',
      return_scopes: true
    });

    return defer.promise;
  };

  this.logoutFacebook = function () {
    var defer = $q.defer();

    FB.logout(function (response) {
      console.log('FB: logged out');
    });

    return defer.promise;
  };

  this.postOnFacebook = function () {
    var defer = $q.defer();

    FB.api('/me/feed', 'post',
      {
        message: "This month's birthdays! (Don't forget to congratulate your co-workers)\n" +
        "John Silver (Wednesday 24th)\n" +
        "Anne Marie (Thursday 32nd)\n\n" +
        "Let them know you care :)"
      }, function(response) {
      if (!response || response.error) {
        alert('Error occured');
      } else {
        alert('Post ID: ' + response.id);
      }
    });

    return defer.promise;
  };
});

angular.module('itBirthday.facebook', [])

  .controller('FacebookCtrl', function ($scope, $http, FBAuth, $ionicLoading) {

    $scope.loggedIn = {};
    $scope.expirationDate = {};

    $scope.getFacebookInfo = function() {
      //$scope.loggedIn = ($scope.checkLoginStatus() == true);

      // $scope.loggedIn = true;
      //
      // if($scope.loggedIn) {
      //   $scope.getExpirationDate();
      // }
    };

    $scope.getExpirationDate = function() {
      $http.get(serverUrl + '/get_facebook_expiration_date').success(function (response) {
        $scope.expirationDate = new Date(response).toLocaleString();
      });
    };

    $scope.checkLoginStatus = function () {
      return getLoginUserStatus();
    };

    $scope.loginFacebook = function (userData) {
      loginFacebookUser();
    };

    $scope.logoutFacebook = function () {
      logoutFacebookUser();
    };

    $scope.postFacebook = function () {
      postOnFacebook();
    };

    function loginFacebookUser() {
      return FBAuth.loginFacebook();
    }

    function logoutFacebookUser() {
      return FBAuth.logoutFacebook();
    }

    function getLoginUserStatus() {

      console.log("WOT");

      return FBAuth.getLoginStatus();
    }

    function postOnFacebook() {
      return FBAuth.postOnFacebook();
    }
  });
