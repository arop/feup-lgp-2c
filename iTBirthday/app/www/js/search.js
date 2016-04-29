angular.module('itBirthday.search', [])

  .controller('SearchCtrl', function($scope, $http) {
    $scope.profiles = profilesGlobal;
    // TODO ao ir buscar os employees apenas ir buscar o nome e email, senao vai pesquisar por tudo
    // TODO tentar excluir o "@itgrow.com" da pesquisa
  })

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
