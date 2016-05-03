angular.module('itBirthday.profile', [])

  .controller('SearchCtrl', function($scope, $http, $state) {

    // TODO tentar excluir o "@itgrow.com" da pesquisa
    //$scope.profiles = profilesGlobal;

    $scope.getAllEmployees = function () {
      $http.get('/list_employees').success( function(response) {
        $scope.profiles = response;
      });
    }

  })

  .controller('UpdateUserCtrl', function($scope, $http, $stateParams) {

    $scope.getEmployee = function () {
      $http.get('/employee_profile/'+$stateParams.id).success( function(response) {
        $scope.profile = response;
        console.log(response);
      });
    }

    /*    $scope.profile = {
     name: 'Ana Vieira',
     birthDate: '1992-07-12',
     phoneNumber: '942847256',
     email: 'anavi@itgrow.com',
     entryDate: '2015-03-12',
     sendMail: true,
     sendSMS: false,
     facebookPost: false
     };*/

    $scope.update_profile = function(){
      
      $http.post('/update_employee/'+$stateParams.id, {
        name: $scope.profile.name,
        birthDate: new Date($scope.profile.birthDate),
        phoneNumber: $scope.profile.phoneNumber,
        email: $scope.profile.email,
        entryDate: new Date($scope.profile.entryDate),
        sendMail: $scope.profile.sendMail,
        sendSMS: $scope.profile.sendSMS,
        facebookPost: $scope.profile.facebookPost
      }).success(function (data) {
        console.log("data");
      });
    };

  });


var johndoe = {employee: {
  name: 'John Doe',
  birthDate: '1990-01-30',
  phoneNumber: '965912228',
  email: 'johndoe@itgrow.com',
  entryDate: '2014-04-10',
  sendMail: true,
  sendSMS: false,
  facebookPost: false
}};

var maryjane = {employee: {
  name: 'Mary Jane',
  birthDate: '1990-01-30',
  phoneNumber: '965912228',
  email: 'maryjane@itgrow.com',
  entryDate: '2014-04-10',
  sendMail: true,
  sendSMS: false,
  facebookPost: false
}};

var zecarlos = {employee: {
  name: 'Zé Carlos',
  birthDate: '1990-01-30',
  phoneNumber: '965912228',
  email: 'zecarlos@itgrow.com',
  entryDate: '2014-04-10',
  sendMail: true,
  sendSMS: false,
  facebookPost: false
}};

var profilesGlobal = [johndoe, maryjane,zecarlos];


