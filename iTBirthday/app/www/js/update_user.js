var updateProfile = angular.module('itBirthday.updateProfile', []);

updateProfile.controller('UpdateUserCtrl', function ($scope, $state, $http) {

  $scope.profile = {
    name: 'Ana Vieira',
    birthDate: '1992-07-12',
    phoneNumber: '942847256',
    email: 'anavi@itgrow.com',
    entryDate: '2015-03-12',
    sendMail: true,
    sendSMS: false,
    facebookPost: false
  };

  $scope.update_profile = function(updatedProfile){

    if(updatedProfile.name != "" && updatedProfile.name != undefined)
      $scope.profile.name = updatedProfile.name;
    if(updatedProfile.birthDate != "" && updatedProfile.birthDate != undefined)
      $scope.profile.birthDate = updatedProfile.birthDate;
    if(updatedProfile.phoneNumber != "" && updatedProfile.phoneNumber != undefined)
      $scope.profile.phoneNumber = updatedProfile.phoneNumber;
    if(updatedProfile.email != "" && updatedProfile.email != undefined)
      $scope.profile.email = updatedProfile.email;
    if(updatedProfile.entryDate != "" && updatedProfile.entryDate != undefined)
      $scope.profile.entryDate = updatedProfile.entryDate;
    if(updatedProfile.sendMail != "" && updatedProfile.sendMail != undefined)
      $scope.profile.sendMail = updatedProfile.sendMail;
    if(updatedProfile.sendSMS != "" && updatedProfile.sendSMS != undefined)
      $scope.profile.sendSMS = updatedProfile.sendSMS;
    if(updatedProfile.facebookPost != "" && updatedProfile.facebookPost != undefined)
      $scope.profile.facebookPost = updatedProfile.facebookPost;

  };

});

