var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

angular.module('itBirthday.statistics', ['chart.js'])
  .config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all line charts
    ChartJsProvider.setOptions('Line', {
      showLines: false,
      lineTension: 0,
      pointBackgroundColor: "#ECA04B",
      pointRadius: "5"
    });
  }])

  .controller('StatisticsCtrl', function ($scope, $http, ionicLoadingService) {
    $scope.data = {
      MFData: [0, 0],
      MFRatio: {},
      MFLabels: ["Mulheres", "Homens"],
      MFBackgroundColors: ["#F1F1F2", "#ECA04B"],
      AgeLabels: ["18-21", "21-25", "25-30", "30-40", "40+"],
      AgeColors: [{
        fillColor: "transparent",
        strokeColor: "#ECA04B"
      }],
      AgeGroups: [[0, 0, 0, 0, 0]],
      AverageTime: 0,
      BirthsByMonthRatio: [],
      BirthsByMonthTotal: []
    };

    $scope.getStatistics = function () {
      ionicLoadingService.showLoading();
      //
      $http.get(serverUrl + '/statistics').then(
        function (success) {
          var data = success.data;

          $scope.data.AverageTime = data.AverageTime;
          $scope.data.MFData = [data.MFTotal.Female, data.MFTotal.Male];
          $scope.data.MFRatio = data.MFRatio;
          $scope.data.AgeGroups = [[
            data.AgeGroups['18to21'],
            data.AgeGroups['21to25'],
            data.AgeGroups['25to30'],
            data.AgeGroups['30to40'],
            data.AgeGroups['40+']]];

          $scope.data.BirthsByMonthTotal = data.BirthsByMonthTotal;
          $scope.data.BirthsByMonthRatio = data.BirthsByMonthRatio;

          normalizeBirthsByMonthRatios();

          ionicLoadingService.hideLoading();
        }, function (err) {
          console.log(err);
          ionicLoadingService.hideLoading();
        });
    };

    function normalizeBirthsByMonthRatios() {

      var size = ($.map($scope.data.BirthsByMonthTotal, function(elem) { return elem; })).length;

      var max = -1.0;
      var i = 0;
      for(i = 0; i < size; i++) {
        var val = $scope.data.BirthsByMonthTotal[months[i]];
        if(val >= max) {
          max = val;
        }
      }

      $scope.data.BirthsByMonthRatio = [];

      for(i = 0; i < size; i++) {
        var month = months[i];
        $scope.data.BirthsByMonthRatio[month] = (($scope.data.BirthsByMonthTotal[month] / max) * 100) + "%";
      }

    }

    angular.element(document).ready(function () {
      $scope.getStatistics();
    });
  });
