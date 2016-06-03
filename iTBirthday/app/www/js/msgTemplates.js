angular.module('itBirthday.settings', ['ngFileUpload'])

  .controller('MsgTemplatesCtrl', function($scope, $http, Upload, $ionicPopup, $ionicSlideBoxDelegate, ionicLoadingService) {
    $scope.index = 0;

    $scope.wrongFields = "";
    $scope.index_default_banner = 0;

    $scope.makeDefault = function(){
      $scope.index_default_banner = $scope.index;
    };

    $scope.next = function() {
      $ionicSlideBoxDelegate.next();
      $scope.index = $ionicSlideBoxDelegate.currentIndex();
    };
    $scope.previous = function() {
      $ionicSlideBoxDelegate.previous();
      $scope.index = $ionicSlideBoxDelegate.currentIndex();
    };

    // Called each time the slide changes
    $scope.slideHasChanged = function(index) {
      $scope.index = index;
    };

    $scope.showAlertProfile = function() {
      $ionicPopup.alert({
        title: 'Template não alterado!',
        template: 'Os seguintes templates estão vazios:' + $scope.wrongFields
      });
    };

    $scope.defaultMsg = {};

    //listen for the file selected event
    $("input[type=file]").on("change", function() {
      $scope.banner = this.files[0];
    });

    $scope.getDefaultMsg = function() {
      ionicLoadingService.showLoading();

      $scope.defaultMsg.email = "";
      $scope.defaultMsg.sms = "";
      $scope.defaultMsg.fb = "";
      $scope.banners = [];

      $scope.defaultMsgEmail_exists = false;
      var successCount = 0;

      $http.get(serverUrl + '/all_banners').success(function(response) {
        angular.forEach(response, function(value, key) {
          this.push(serverUrl + '/images/banners/' + value.path);
        }, $scope.banners);
        $ionicSlideBoxDelegate.update();
        successCount++;

        if(successCount > 3)
          ionicLoadingService.hideLoading();
      });

      $http.get(serverUrl + '/email_template').success(function(response) {
        if (response != "") {
          $scope.defaultMsgEmail_exists = true;
          $scope.defaultMsg.email = response[0].text;
        }
        successCount++;

        if(successCount > 3)
          ionicLoadingService.hideLoading();
      });

      $http.get(serverUrl + '/sms_template').success(function(response) {
        if (response != "") {
          $scope.defaultMsg.sms = response[0].text;
        }
        successCount++;

        if(successCount > 3)
          ionicLoadingService.hideLoading();
      });

      $http.get(serverUrl + '/facebook_template').success(function(response) {
        if (response != "") {
          $scope.defaultMsg.fb = response[0].text;
        }
        successCount++;

        if(successCount > 3)
          ionicLoadingService.hideLoading();
      });
    };

    $scope.saveChanges = function() {
      ionicLoadingService.showLoading();

      $scope.wrongFields = '';
      $("textarea").css("border", "none");

      var emailTemplate = $scope.defaultMsg.email.trim();
      var smsTemplate = $scope.defaultMsg.sms.trim();
      var fbTemplate = $scope.defaultMsg.fb.trim();
      var fieldEmpty = false;

      var count = 0;
      $http.get(serverUrl + '/all_banners').success(function(response) {
        angular.forEach(response, function(value, key) {
          if (count === $scope.index_default_banner ) {
            $http.post(serverUrl + '/update_banner', {
              id: value._id
            }).success(function() {
              console.log("Updated Banner template");
            });
          }
          count++;
        }, $scope.banners);
      });

      if (emailTemplate != '') {
        if ($scope.defaultMsgEmail_exists == false) {
          $http.post(serverUrl + '/post_email_template', {
            text: emailTemplate
          }).success(function() {
            console.log("Updated email template");
          });
        } else
          $http.post(serverUrl + '/update_email_template', {
            text: emailTemplate
          }).success(function() {
            console.log("Updated email template");
          });
      } else {
        $scope.wrongFields += "<br>- Template Email;"
        fieldEmpty = true;
        $("textarea#emailMsg").css("border", "1px solid #FF9A9A");
        console.log("email template can't be empty");
      }

      if ($scope.banner != undefined)
        Upload.upload({
          url: serverUrl + '/post_banner_template/',
          file: $scope.banner,
          progress: function(e) {}
        }).then(function(data, status, headers, config) {
          // file is uploaded successfully
        });

      if (smsTemplate != '') {
        $http.post(serverUrl + '/update_sms_template', {
          text: smsTemplate
        }).success(function() {
          console.log("Updated sms template");
        });
      } else {
        $scope.wrongFields += "<br>- Template SMS;"
        fieldEmpty = true;
        $("textarea#smsMsg").css("border", "1px solid #FF9A9A");
        console.log("sms template can't be empty");
      }

      if (fbTemplate != '') {
        $http.post(serverUrl + '/update_facebook_template', {
          text: fbTemplate
        }).success(function() {
          console.log("Updated facebook template");
        });
      } else {
        $scope.wrongFields += "<br>- Template Facebook;"
        fieldEmpty = true;
        $("textarea#fbMsg").css("border", "1px solid #FF9A9A");
        console.log("fb template can't be empty");
      }

      if (fieldEmpty) {
        ionicLoadingService.hideLoading();
        $scope.showAlertProfile();
      } else {
        ionicLoadingService.hideLoading();
      }

    }

  });
