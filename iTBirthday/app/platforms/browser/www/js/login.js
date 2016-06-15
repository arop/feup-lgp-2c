angular.module('itBirthday.login', [])

  .controller('LoginCtrl', function ($scope, $state, $http, ionicLoadingService) {

    $scope.user = {};

    $scope.errorMessage = '';

    //log out
    $scope.logout = function () {
      if ("session" in localStorage) localStorage.removeItem("session");
      $state.go('login');
    };

    $scope.login = function () {

      var user = $scope.user;

      $scope.errorMessage = '';
      //console.log("LOGIN user: " + user.username + " - PW: " + user.password);
      if (user.username == undefined || user.password == undefined) {
        $scope.errorMessage = 'Erro nos valores inseridos.';
        return false;
      } else {
        ionicLoadingService.showLoading();

        $http.post(serverUrl + '/check_login', {
          username: user.username,
          password: CryptoJS.SHA256(user.password).toString()
        }).success(function (data) {
          console.log('[APP] Login Successful');

          //saves cookie in localstorage
          if ("session" in localStorage) localStorage.removeItem("session");
          localStorage.setItem("session", JSON.stringify(data));

          ionicLoadingService.hideLoading();
          $state.go('tabs.dash');
          user.password = '';
        }).error(function (data) {
          $scope.errorMessage = 'Erro nos valores inseridos.';
          user.password = '';
          console.log('ERROR: ' + data);
          ionicLoadingService.hideLoading();
          return false;
        });
      }
    }
  })

  .directive('ngEnter', function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.ngEnter, {'event': event});
          });

          event.preventDefault();
        }
      });
    }
  });

//admin
//"password" : "68e656b251e67e8358bef8483ab0d51c6619f3e7a1a9f0e75838d41ff368f728"
