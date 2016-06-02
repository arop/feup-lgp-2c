angular.module('itBirthday.settings', ['ngFileUpload'])

  .controller('MsgTemplatesCtrl', function ($scope, $http, Upload) {
    $scope.slideIndex = 0;

    $scope.next = function() {
      $ionicSlideBoxDelegate.next();
    };
    $scope.previous = function() {
      $ionicSlideBoxDelegate.previous();
    };

    // Called each time the slide changes
    $scope.slideHasChanged = function(index) {
      $scope.slideIndex = index;
    };

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
        angular.forEach(response, function(value, key) {
          this.push( serverUrl + '/images/banners/' +  value.path);
        }, $scope.banners);
      });

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
      
      var count = 0;
      $http.get(serverUrl + '/all_banners').success(function(response){
        angular.forEach(response, function(value, key) {
          if( count  === $scope.slideIndex){
            $http.post(serverUrl + '/update_banner', {
              id: value._id
            }).success(function () {
              console.log("Updated Banner template");
            });
          }
          count++;
        }, $scope.banners);
      });

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
