angular.module('itBirthday.statistics', [])

  .controller('StatisticsCtrl', function ($scope, $http) {
    $scope.statistics = {};

    $scope.getStatistics = function () {
      $http.get(serverUrl + '/statistics').success(function (response) {
        $scope.statistics = response;
        console.log(response);
      });
    }

  });
