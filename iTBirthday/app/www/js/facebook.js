// The code below is the asynchronous loading of the facebook API
window.fbAsyncInit = function () {
  FB.init({
    appId: '1046778285368752',
    xfbml: true,
    version: 'v2.4'
  });
};

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

// Below we create the service for OAuth authentication
var appModule = angular.module('itBirthday');
appModule.service('FBAuth', function ($q, $ionicLoading) {

  this.getLoginStatus = function () {
    var defer = $q.defer();

    FB.getLoginStatus(function (response) {

      if (response.status === "connected") {
        console.log(JSON.stringify(response));
      } else {
        console.log("FB: Not logged in");
      }
    });

    return defer.promise;
  };

  this.loginFacebook = function ($scope) {
    var defer = $q.defer();

    FB.login(function (response) {

      if (response.status === "connected") {
        $scope.activeToken = response["authResponse"]["accessToken"];
        console.log("Acess Token: " + $scope.activeToken);
      } else {
        console.log("FB: Not logged in");
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

  this.postOnFacebook = function ($scope) {
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

  this.getFacebookAPI = function ($scope) {
    var defer = $q.defer();


    FB.api("me/?fields = id,email", ['publish_actions'], function (response) {

      if (response.error) {
        console.log(JSON.stringify(response.error));
      } else {
        //console.log(JSON.stringify(response));
        $scope.post_id = response["id"];
      }
    });

    return defer.promise;
  };
});

angular.module('itBirthday.facebook', [])

  .controller('FacebookCtrl', function ($scope, FBAuth, $ionicLoading) {

    $scope.activeToken = {};

    $scope.checkLoginStatus = function () {
      getLoginUserStatus();
    };

    $scope.loginFacebook = function (userData) {
      loginFacebookUser();
    };

    $scope.facebookAPI = function () {
      getFacebookUserApi();
    };

    $scope.logoutFacebook = function () {
      logoutFacebookUser();
    };

    $scope.postFacebook = function () {
      postOnFacebook();
    };

    function loginFacebookUser() {
      return FBAuth.loginFacebook($scope);
    }

    function logoutFacebookUser() {
      return FBAuth.logoutFacebook();
    }

    function getFacebookUserApi() {
      return FBAuth.getFacebookAPI($scope);
    }

    function getLoginUserStatus() {
      return FBAuth.getLoginStatus();
    }

    function postOnFacebook() {
      return FBAuth.postOnFacebook($scope);
    }
  });
