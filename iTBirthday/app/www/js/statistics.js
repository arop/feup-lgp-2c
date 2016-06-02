angular.module('itBirthday.statistics', [])

  .controller('StatisticsCtrl', function($scope, $http) {
    $scope.statistics = {};

    $scope.getStatistics = function () {
      $http.get(serverUrl + '/statistics').success( function(response) {
        $scope.statistics = response;
        $scope.labels = ["Female", "Male"];
    	$scope.data = [$scope.statistics.MFTotal.Female,$scope.statistics.MFTotal.Male];
    	$scope.backgroundColor = ["#F1F1F2","#ECA04B"];
    	$scope.lineLabels = ["18-21","21-25","25-30","30-40","40+"];
    	$scope.lineData = [[$scope.statistics.AgeGroups['18to21'],$scope.statistics.AgeGroups['21to25'],$scope.statistics.AgeGroups['25to30'],$scope.statistics.AgeGroups['30to40'],$scope.statistics.AgeGroups['40+']]];
        $scope.lineBackgroundColor = ["#ECA04B"];
        console.log(response);
      });
    }
  });
