angular.module('itBirthday.login', [])

.controller('LoginCtrl', function($scope,$state) {
 
    $scope.login = function(user) {
        console.log("LOGIN user: " + user.username + " - PW: " + user.password);
        $state.go('tabs.dash');
    }
})