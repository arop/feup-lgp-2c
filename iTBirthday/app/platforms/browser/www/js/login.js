angular.module('itBirthday.login', [])

  .controller('LoginCtrl', function($scope,$state, $http) {

    $scope.user = {};

    //log out
    /*$scope.logout = function() {
      if ("session" in localStorage) localStorage.removeItem("session");
    };*/

    $scope.login = function(user) {
      //console.log("LOGIN user: " + user.username + " - PW: " + user.password);
      if ( user.username == undefined || user.password == undefined){
        alert("Erro nos valores inseridos.");
        return false;
      }else {
        $state.go('tabs.dash');
        $http.post(serverUrl + '/check_login', {
          username: user.username,
          password: user.password
        }).success(function (data) {
          console.log('[APP] Login Successful');

          //saves cookie in localstorage
          if ("session" in localStorage) localStorage.removeItem("session");
          localStorage.setItem("session", JSON.stringify(data));

          $state.go('tabs.dash');
          
        }).error(function (data) {
          console.log('ERROR: ' + data);
          return false;
        });
      }
    }
  });

//admin
//"password" : "68e656b251e67e8358bef8483ab0d51c6619f3e7a1a9f0e75838d41ff368f728"
