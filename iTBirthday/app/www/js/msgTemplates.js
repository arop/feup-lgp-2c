angular.module('itBirthday.settings', ['ngFileUpload'])

  .controller('MsgTemplatesCtrl', function ($scope, $http) {

    $scope.defaultMsg = {};

    $scope.getDefaultMsg = function () {

      $scope.defaultMsg.email = "";
      $scope.defaultMsg.sms = "";
      $scope.defaultMsg.fb = "";

      $http.get(serverUrl + '/email_template').success(function (response) {
        $scope.defaultMsg.email = response[0].text;
      });

      $http.get(serverUrl + '/sms_template').success(function (response) {
        $scope.defaultMsg.sms = response[0].text;
      });

      $http.get(serverUrl + '/facebook_template').success(function (response) {
        $scope.defaultMsg.fb = response[0].text;
      });
    };

    $scope.saveChanges = function () {
      var emailTemplate = $scope.defaultMsg.email.trim();
      var smsTemplate = $scope.defaultMsg.sms.trim();
      var fbTemplate = $scope.defaultMsg.fb.trim();

      $http.post(serverUrl + '/update_email_template', {
        text: emailTemplate
      }).success(function () {
        console.log("Updated email template");
      });

      $http.post(serverUrl + '/update_sms_template', {
        text: smsTemplate
      }).success(function () {
        console.log("Updated sms template");
      });

      $http.post(serverUrl + '/update_facebook_template', {
        text: fbTemplate
      }).success(function () {
        console.log("Updated facebook template");
      });
    }

  });
