angular.module('itBirthday.settings', ['ngFileUpload'])

  .controller('MsgTemplatesCtrl', function ($scope, $http, Upload) {

    $scope.defaultMsg = {};

    //listen for the file selected event
    $("input[type=file]").on("change", function() {
      $scope.banner = this.files[0];
    });

    $scope.getDefaultMsg = function () {

      $scope.defaultMsg.email = "";
      $scope.defaultMsg.sms = "";
      $scope.defaultMsg.fb = "";
      $scope.banners = [];

      $scope.defaultMsgEmail_exists = false;

      $http.get(serverUrl + '/all_banners').success(function(response){
        console.log(response);
        $scope.banners = response;
      })

      $http.get(serverUrl + '/email_template').success(function (response) {
        if ( response != "") {
          $scope.defaultMsgEmail_exists = true;
          $scope.defaultMsg.email = response[0].text;
        }
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

      if ( $scope.defaultMsgEmail_exists == false ){
        $http.post(serverUrl + '/post_email_template', {
          text: emailTemplate
        }).success(function () {
          console.log("Updated email template");
        });
      }else
        $http.post(serverUrl + '/update_email_template', {
          text: emailTemplate
        }).success(function () {
          console.log("Updated email template");
        });

      if ( $scope.banner != undefined )
        Upload.upload({
          url: serverUrl + '/post_banner_template/',
          file: $scope.banner,
          progress: function(e) {}
        }).then(function(data, status, headers, config) {
          // file is uploaded successfully
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
