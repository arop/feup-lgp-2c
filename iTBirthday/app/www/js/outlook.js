angular.module('itBirthday.outlook', [])
  .controller('OutlookCtrl', function ($scope, $http, ionicLoadingService) {
    $scope.outlookLink = {};
    $scope.email = undefined;
    $scope.expirationDate = undefined;

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
          $scope.expirationDate = new Date(data["expirationDate"]).toLocaleString();
          $scope.email = data["email"];
          console.log(success);
          console.log($scope.expirationDate);
          ionicLoadingService.hideLoading();
        }, function (err) {
          console.log(err);
          ionicLoadingService.hideLoading();
        });
    };

    $scope.updateOutlookCalendar = function() {
      $http.get(serverUrl + '/update_calendar').then(
        function (success) {
          console.log("success");
        }, function (err) {
          console.log(err);
        });
    };

    $scope.isAuthenticated = function() {
      if($scope.email == undefined) {
        return false;
      }

      if($scope.expirationDate == undefined) {
        return false;
      }

      if($scope.expirationDate <= new Date()) {
        return false;
      }

      return true;
    }
  });
