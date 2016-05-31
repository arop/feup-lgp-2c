angular.module('itBirthday.settings', ['ngFileUpload'])

  .controller('MsgTemplatesCtrl', function ($scope, $http) {

    $scope.defaultMsg = {};

    $scope.getDefaultMsg = function () {
      console.log("entrou");
      /*$scope.defaultMsg.email = "email";
      $scope.defaultMsg.sms = "sms";*/


      $scope.defaultMsg.email = "Parabéns!!!" +
        "A iTGrow deseja-lhe um feliz aniversário! Esperamos poder festejar consigo este dia e aproveitar para" +
        " agradecer o seu contributo na equipa da iTGrow. Que os próximos anos continuem a ser prósperos e felizes " +
        "e que que possamos continuar a festejar consigo." +
        "\nCom os melhores votos de felicidades,"+
        "\niTGrow";

      $scope.defaultMsg.sms = "A iTGrow deseja-lhe um feliz aniversário! Esperamos que tenha um ótimo dia" +
        " e que celebre muitos mais anos connosco.";
        
    };

  })
