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

  this.loginFacebook = function (callback) {
    var defer = $q.defer();

    FB.login(function (response) {

      if (response.status === "connected") {
        var userID = response["authResponse"]["userID"];
        var token = response["authResponse"]["accessToken"];

        $http.post(serverUrl + '/post_facebook_info/', {
          userID: userID,
          token: token
        }).success(function () {
          callback();
        });
      } else {
        callback();
      }
    }, {
      scope: 'public_profile, email, publish_actions, publish_pages',
      return_scopes: true
    });

    return defer.promise;
  };

  this.getLoginStatus = function () {
    var defer = $q.defer();

    $http.get(serverUrl + '/get_facebook_login_status').then(
      function (success) {
        defer.resolve(success.data);
      }, function (err) {
        defer.resolve(undefined);
      });

    return defer.promise;
  };
});

angular.module('itBirthday.facebook', [])
  .controller('FacebookCtrl', function ($scope, $http, FBAuth, $ionicLoading) {

    $scope.loggedIn = false;
    $scope.fbName = "";
    $scope.expirationDate = "";
    $scope.updating = false;

    $scope.updateFacebookInfo = function () {
      $scope.updating = true;
      var state = getLoginUserStatus();

      state.then(function (data) {
        $scope.updating = false;

        if (data == undefined) {
          $scope.loggedIn = false;
        } else {
          $scope.loggedIn = true;
          $scope.fbName = data.name;
          $scope.updateExpirationDate();
          console.log("Updated fb info");
        }
      });
    };

    $scope.updateExpirationDate = function () {
      $http.get(serverUrl + '/get_facebook_expiration_date').then(
        function (success) {
          $scope.expirationDate = new Date(success.data).toLocaleString();
        }, function (err) {
          $scope.expirationDate = "";
        });
    };

    $scope.loginFacebook = function () {
      loginFacebookUser();
    };

    function loginFacebookUser() {
      return FBAuth.loginFacebook($scope.updateFacebookInfo);
    }

    function getLoginUserStatus() {
      return FBAuth.getLoginStatus();
    }

    angular.element(document).ready(function () {
      $scope.updateFacebookInfo();
    });
  });
