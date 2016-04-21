var newProfile = angular.module('itBirthday.newProfile', []);

newProfile.controller('NewUserCtrl', function($scope, $state, $http) {

  $scope.new_user = function (profileData) {

    $http.post('/post_employee', {
      name: 'test',
      birthDate: Date.now(),
      phoneNumber : "123456789",
      email : "email@itgrow.com",
      entryDate : Date.now(),
      sendMail: true,
      sendSMS : false,
      facebookPost : false
    }).success(function (data) {
      console.log('New user POST successful');
    }).error(function (data) {
      console.log('ERROR: ' + data);
      return false;
    })
  };
});

