angular.module('itBirthday.outlook', [])
  .controller('OutlookCtrl', function ($scope, $http, ionicLoadingService) {
    $scope.outlookLink = {};
    $scope.email = undefined;
    $scope.expirationDate = undefined;
    $scope.isAuthenticated = false;

    $scope.getOutlookLink = function () {
      ionicLoadingService.showLoading();
      $http.get(serverUrl + '/authUrl').then(
        function (success) {
          $scope.outlookLink = success.data;
          $scope.getOutlookInfo();
        }, function (err) {
          console.log(err);
        });
    };

    $scope.getOutlookInfo = function () {
      $http.get(serverUrl + '/outlook_get_info').then(
        function (success) {
          var data = success.data;
          $scope.expirationDate = new Date(data["expirationDate"]);
          $scope.email = data["email"];
          console.log("Email: " + $scope.email);
          console.log("Expiration Date: " + $scope.expirationDate);
          $scope.updateAuthentication();
          ionicLoadingService.hideLoading();
        }, function (err) {
          console.log(err);
          $scope.updateAuthentication();
          ionicLoadingService.hideLoading();
        });
    };

    $scope.updateOutlookCalendar = function () {
      $http.get(serverUrl + '/update_calendar').then(
        function (success) {
          console.log("success");
        }, function (err) {
          console.log(err);
        });
    };

    $scope.updateAuthentication = function () {
      if ($scope.email == undefined) {
        $scope.isAuthenticated = false;
      }

      if ($scope.expirationDate == undefined) {
        $scope.isAuthenticated = false;
      }

      var date = new Date();
      $scope.isAuthenticated = ($scope.expirationDate.getTime() > date.getTime());
    }
  });
