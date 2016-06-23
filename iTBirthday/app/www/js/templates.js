angular.module('itBirthday.settings', ['ngFileUpload'])

  .controller('MsgTemplatesCtrl', function ($scope, $http, Upload, $ionicPopup, $ionicSlideBoxDelegate, ionicLoadingService) {
    $scope.index = 0;

    $scope.wrongFields = "";
    $scope.index_default_banner = 0;

    $scope.makeDefault = function () {
      $scope.index_default_banner = $scope.index;
    };

    $scope.next = function () {
      $ionicSlideBoxDelegate.next();
      $scope.index = $ionicSlideBoxDelegate.currentIndex();
    };
    $scope.previous = function () {
      $ionicSlideBoxDelegate.previous();
      $scope.index = $ionicSlideBoxDelegate.currentIndex();
    };

    // Called each time the slide changes
    $scope.slideHasChanged = function (index) {
      $scope.index = index;
    };

    $scope.showAlertProfile = function () {
      $ionicPopup.alert({
        title: 'Template: erros na atualização!',
        cssClass: "template-alert-popup",
        template: 'Os seguintes erros foram detetados:' + $scope.wrongFields
      });
    };

    $scope.showConfirmPopup = function () {
      $ionicPopup.alert({
        title: 'Template atualizados!',
        cssClass: "template-alert-popup"
      });
    };

    $scope.defaultMsg = {};

    //listen for the file selected event
    $("input[type=file]").on("change", function () {
      $scope.banner = this.files[0];
    });

    $scope.getDefaultMsg = function () {
      ionicLoadingService.showLoading();

      $scope.defaultMsg.email = "";
      $scope.defaultMsg.sms = "";
      $scope.defaultMsg.fb = "";
      $scope.banners = [];

      $scope.defaultMsgEmail_exists = false;
      var successCount = 0;

      $http.get(serverUrl + '/all_banners').success(function (response) {
        angular.forEach(response, function (value, key) {
          this.push(serverUrl + '/images/banners/' + value.path);
        }, $scope.banners);
        $ionicSlideBoxDelegate.update();
        successCount++;

        if (successCount > 3)
          ionicLoadingService.hideLoading();
      });

      $http.get(serverUrl + '/email_template').success(function (response) {
        if (response != "") {
          $scope.defaultMsgEmail_exists = true;
          $scope.defaultMsg.email = response[0].text;
        }
        successCount++;

        if (successCount > 3)
          ionicLoadingService.hideLoading();
      });

      $http.get(serverUrl + '/sms_template').success(function (response) {
        if (response != "") {
          $scope.defaultMsg.sms = response[0].text;
        }
        successCount++;

        if (successCount > 3)
          ionicLoadingService.hideLoading();
      });

      $http.get(serverUrl + '/facebook_template').success(function (response) {
        if (response != "") {
          $scope.defaultMsg.fb = response[0].text;
        }
        successCount++;

        if (successCount > 3)
          ionicLoadingService.hideLoading();
      });
    };

    $scope.saveChanges = function () {
      ionicLoadingService.showLoading();

      $scope.wrongFields = '';
      $("textarea").css("border", "none");

      var emailTemplate = $scope.defaultMsg.email.trim();
      var smsTemplate = $scope.defaultMsg.sms.trim();
      var fbTemplate = $scope.defaultMsg.fb.trim();
      var errCount = 0;

      // Update default banner
      if ($scope.banners.size > 0) {
        $http.get(serverUrl + '/all_banners').then(function (response) {

          var bannerIndex = 0;
          angular.forEach(response, function (value, key) {
            if (bannerIndex === $scope.index_default_banner) {
              $http.post(serverUrl + '/update_banner', {
                id: value._id
              }).then(function () {
                //console.log("Updated Banner template");
              }, function (err) {
                // Server error
              });
            }
            bannerIndex++;
          }, $scope.banners);
        }, function (err) {
          // Server error
        });
      }

      // Update email template
      if (emailTemplate != undefined && emailTemplate != '') {
        if ($scope.defaultMsgEmail_exists == false) {
          $http.post(serverUrl + '/post_email_template', {
            text: emailTemplate
          }).then(function (success) {
            // Success
          }, function (err) {
            // Server error
          });
        } else
          $http.post(serverUrl + '/update_email_template', {
            text: emailTemplate
          }).then(function (success) {
            // Success
          }, function (err) {
            // Server error
          });
      } else {
        errCount++;
        $scope.wrongFields += "<br>- Email template: campo vazio;";
        $("textarea#emailMsg").css("border", "1px solid #FF9A9A");
      }

      // Add new banner
      if ($scope.banner != undefined) {
        Upload.upload({
          url: serverUrl + '/post_banner_template/',
          file: $scope.banner,
          progress: function (e) {
          }
        }).then(function (data, status, headers, config) {
          // File is uploaded successfully
        }, function (err) {
          // Server error
        });
      }

      // Update SMS template
      if (smsTemplate != undefined && smsTemplate != '') {
        $http.post(serverUrl + '/update_sms_template', {
          text: smsTemplate
        }).then(function (success) {
          // Success
        }, function(err) {
          // Server error
        });
      } else {
        errCount++;
        $scope.wrongFields += "<br>- SMS template: campo vazio;";
        $("textarea#smsMsg").css("border", "1px solid #FF9A9A");
      }

      if (fbTemplate != undefined && fbTemplate != '') {
        $http.post(serverUrl + '/update_facebook_template', {
          text: fbTemplate
        }).then(function () {
          // Success
        }, function(err) {
          // Server error
        });
      } else {
        errCount++;
        $scope.wrongFields += "<br>- Facebook template: campo vazio;";
        $("textarea#fbMsg").css("border", "1px solid #FF9A9A");
      }

      ionicLoadingService.hideLoading();

      if(errCount > 0) {
        $scope.showAlertProfile();
      }
      else {
        $scope.showConfirmPopup();
      }
    }
  });
