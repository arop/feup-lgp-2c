angular.module('itBirthday.profile', ['ngFileUpload'])

  .controller('SearchCtrl', ['$scope', '$http', function ($scope, $http) {
    $scope.serverUrl = serverUrl;
    $scope.defaultImageURL = serverUrl + "/images/employees/default.png";

    $scope.getAllEmployees = function () {
      $http.get(serverUrl + '/list_employees').success(function (response) {
        for(var i = 0; i < response.length; i++) {
          var pro = response[i];
          pro.imageURL = serverUrl + "/images/employees/" + pro.photoPath;
        }
        $scope.profiles = response;
      });
    };

    var searchLabel = $($("#search-label").find("> input")[0]);
    var statusFilter = $("#status-filter").find("> select")[0];

    $scope.filterResults = function (element) {
      var status = statusFilter.options[statusFilter.selectedIndex].value;
      if (status != undefined) {

        var exitDate = element["exitDate"];

        if (status == "now" && exitDate) {
          return false;
        }

        if (status == "old" && !exitDate) {
          return false;
        }
      }

      var searchTerm = searchLabel.val();
      if (searchTerm == undefined || searchTerm.length == 0) {
        return true;
      }

      searchTerm = searchTerm.toLowerCase().trim();

      if (element["name"].toLowerCase().search(searchTerm) >= 0) {
        return true;
      }

      var emailWithoutHost = element["email"].substring(0, Math.max(0, element["email"].search(/@/) - 1));

      return (emailWithoutHost.toLowerCase().indexOf(searchTerm) >= 0);
    };

    var cookie = localStorage.getItem('session');

    if (cookie != null) {
      var cookie2 = cookie.replace('\"', '');

      $http.get(serverUrl + '/Session/' + cookie2).success(function (data) {
        if (data.length == 0) {
          $scope.session = {username: undefined};
        } else {
          $scope.session = {username: "admin"};
        }
      }).error(function (data) {
      });
    }
  }])

  .controller('UpdateUserCtrl', function ($scope, $http, $state, $stateParams, $filter, $ionicPopup, Upload) {
    $scope.profile = {};
    $scope.isView = null;
    $scope.notCreating = null;
    $scope.serverUrl = serverUrl;
    $scope.changedPhoto = false;
    $scope.imageURL = null;
    $scope.defaultImageURL = serverUrl + "/images/employees/default.png";

    $scope.isChoosingExitDate = false;
    $scope.hasExited = false;

    $scope.toggleShowExitDate = function () {
      $scope.isChoosingExitDate = !$scope.isChoosingExitDate;
    };

    // A confirm dialog
    $scope.showConfirmRemove = function () {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Remover perfil',
        template: 'Tem a certeza que quer remover este perfil? (Esta ação é irreversível)',
        cancelText: 'Cancelar',
        okText: 'Sim',
        okType: 'button-assertive'
      });

      confirmPopup.then(function (res) {
        if (res) {
          console.log($scope.profile.email);
          $http.post(serverUrl + '/delete_employee', {
            email: $scope.profile.email
          }).success(function (data, status) {
            if (status == 200) {
              window.alert("Perfil não existe");
            } else if (status == 202) {
              window.alert("Perfil removido com sucesso");
            }
            $state.go('tabs.dash');
            return true;
          }).error(function (err) {
            console.log('Error while deleting new user: ' + err);
            console.log($scope.profile.email);
            return false;
          });
        } else {
          //console.log('You are not sure');
        }
      });
    };

    // Triggered on a button click, or some other target
    $scope.showPopupExitDate = function () {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Adicionar data de saída',
        template: 'Tem a certeza que quer adicionar uma data de saída? (Esta ação é irreversível)',
        cancelText: 'Cancelar',
        okText: 'Sim',
        okType: 'button-assertive'
      });

      confirmPopup.then(function (res) {
        if (res) {
          $scope.profile.sendMail = false;
          $scope.profile.sendPersonalizedMail = false;
          $scope.profile.mailText = "";
          $scope.profile.sendSMS = false;
          $scope.profile.sendPersonalizedSMS = false;
          $scope.profile.smsText = "";
          $scope.profile.facebookPost = false;

          $scope.update_profile_http_request();
        } else {
          return false;
        }
      });
    };

    $scope.getEmployee = function () {
      $scope.isView = true;
      $scope.notCreating = true;
      $http.get(serverUrl + '/employee_profile/' + $stateParams.id).success(function (response) {
        //console.log(response);
        $scope.profile = response;

        var birthDate = new Date(String($scope.profile.birthDate));
        var entryDate = new Date(String($scope.profile.entryDate));
        var dateNow = new Date();
        dateNow.setHours(12); // in the first hours of the day would count a day less without this
        var ageDate = new Date(dateNow - birthDate);
        var ageInEntry = new Date(entryDate - birthDate);

        $scope.profile.birthDate = birthDate.toISOString().slice(0, 10);
        $scope.profile.entryDate = entryDate.toISOString().slice(0, 10);
        $scope.profile.age = Math.abs(ageDate.getUTCFullYear() - 1970);

        $scope.imageURL = serverUrl + "/images/employees/" + $scope.profile.photoPath;

        if ($scope.profile.exitDate != undefined) {
          var exitDate = new Date(String($scope.profile.exitDate));
          exitDate.setHours(12); // default hour 1 a.m so the same problem

          $scope.profile.exitDate = exitDate.toISOString().slice(0, 10);
          $scope.profile.daysInCompany = Math.ceil(Math.abs(exitDate - entryDate) / (1000 * 3600 * 24));

          var ageInExit = new Date(exitDate - birthDate);
          $scope.profile.birthdaysInCompany = Math.abs(ageInExit.getUTCFullYear() - 1970) - Math.abs(ageInEntry.getUTCFullYear() - 1970);

          $scope.hasExited = true;

        } else {
          $scope.profile.daysInCompany = Math.ceil(Math.abs(dateNow - entryDate) / (1000 * 3600 * 24));
          $scope.profile.birthdaysInCompany = $scope.profile.age - Math.abs(ageInEntry.getUTCFullYear() - 1970);
        }
      });
    };

    //listen for the file selected event
    $("input[type=file]").on("change", function () {
      $scope.profile.photo = this.files[0];
      $scope.changedPhoto = true;
    });

    //post request to the server to update profile
    $scope.update_profile_http_request = function () {
      var date = ($scope.profile.exitDate == undefined) ? undefined : new Date($scope.profile.exitDate);

      $http.post(serverUrl + '/update_employee/' + $stateParams.id, {
        name: $scope.profile.name,
        birthDate: new Date($scope.profile.birthDate),
        phoneNumber: $scope.profile.phoneNumber,
        email: $scope.profile.email,
        entryDate: new Date($scope.profile.entryDate),
        sendMail: $scope.profile.sendMail,
        mailText: $scope.profile.mailText,
        sendPersonalizedMail: $scope.profile.sendPersonalizedMail,
        sendSMS: $scope.profile.sendSMS,
        smsText: $scope.profile.smsText,
        sendPersonalizedSMS: $scope.profile.sendPersonalizedSMS,
        facebookPost: $scope.profile.facebookPost,
        gender: $scope.profile.gender,
        exitDate: date
      }).success(function () {
        if ($scope.profile.photo != undefined && $scope.changedPhoto == true) {
          Upload.upload({
            url: serverUrl + '/save_image_employee/' + $stateParams.id,
            file: $scope.profile.photo,
            progress: function (e) {
            }
          }).then(function (data, status, headers, config) {
            // file is uploaded successfully
            console.log("Image upload successful.");
          }, function (err) {
            console.error("Image upload: Error: " + err);
          });
        }

        $state.go($state.current, {}, {reload: true});
      });
    };

    $scope.update_profile = function (profileData) {
      if (!VerifyProfileData(profileData)) {
        console.error("Profile data is wrong. Returning...");
        return false;
      }

      // if used so that if the user selects an exit date it has to confirm the update
      if ($scope.profile.exitDate != undefined && !$scope.hasExited) {
        $scope.showPopupExitDate();
      } else {
        $scope.update_profile_http_request();
      }
    };
  })

  .controller('NewUserCtrl', ['$scope', '$state', '$http', 'Upload', function ($scope, $state, $http, Upload) {
    $scope.profile = {};
    $scope.serverUrl = serverUrl;
    $scope.defaultImageURL = serverUrl + "/images/employees/default.png";

    $scope.getEmployee = function () {
      $scope.isView = false;
      $scope.isNewProfile = true;
    };

    //listen for the file selected event
    $("input[type=file]").on("change", function () {
      $scope.profile.photo = this.files[0];
    });

    $scope.newProfile = function (profileData) {

      if (!VerifyProfileData(profileData)) {
        console.error("Profile data is wrong. Returning...");
        return false;
      }

      $http.post(serverUrl + '/post_employee', {
        name: profileData.name,
        birthDate: new Date(profileData.birthDate),
        phoneNumber: profileData.phoneNumber,
        email: profileData.email,
        entryDate: new Date(profileData.entryDate),
        sendMail: profileData.sendMail,
        sendPersonalizedMail: profileData.sendPersonalizedMail,
        mailText: profileData.mailText,
        sendSMS: profileData.sendSMS,
        sendPersonalizedSMS: profileData.sendPersonalizedSMS,
        smsText: profileData.smsText,
        facebookPost: profileData.facebookPost,
        gender: profileData.gender
      }).success(function (data) {
        if (profileData != undefined) {
          Upload.upload({
            url: serverUrl + '/save_image_employee/' + data,
            file: profileData.photo,
            progress: function (e) {
            }
          }).then(function (data, status, headers, config) {
            // file is uploaded successfully
          });
        }

        $state.go('tabs.dash');
        return true;
      }).error(function (err) {
        console.log('Error while creating new user: ' + err);
        return false;
      });
    }
  }])

  /**
   * jquery date picker directive
   */
  .directive('datepicker', function () {
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ngModelCtrl) {
        $(function () {
          $(element).datepicker({
            changeYear: true,
            changeMonth: true,
            dateFormat: 'yy-mm-dd',
            yearRange: "-100:+1",
            onSelect: function (dateText, inst) {
              ngModelCtrl.$setViewValue(dateText);
              scope.$apply();
            }
          });
        });
      }
    }
  })

  .directive('errSrc', function () {
    return {
      link: function (scope, element, attrs) {
        element.bind('error', function () {
          if (attrs.src != attrs.errSrc) {
            attrs.$set('src', attrs.errSrc);
          }
        });
      }
    }
  });

/**
 * @return {boolean}
 */
var VerifyProfileData = function (profileData) {
  if (profileData == undefined) {
    console.error('Profile Data is not valid.');
    return false;
  }

  if (profileData.name == undefined || profileData.name.length == 0) {
    console.error('Profile name is not valid.');
    return false;
  }

  if (profileData.gender == undefined) {
    console.error('Gender is not defined.');
    return false;
  }

  if (profileData.phoneNumber == undefined || !IsProperPhoneNumber(profileData.phoneNumber)) {
    console.error('Profile phone number is not valid.');
    return false;
  } else {
    profileData.phoneNumber = GetFormattedPhoneNumber(profileData.phoneNumber);
  }

  if (profileData.email == undefined || profileData.email.length == 0) {
    console.error('Profile email is not valid.');
    return false;
  }

  if (profileData.birthDate == undefined || profileData.birthDate.length == 0) {
    console.error('Profile birth date is not valid.');
    return false;
  }
  if (profileData.entryDate == undefined || profileData.entryDate.length == 0) {
    console.error('Profile entry date is not valid.');
    return false;
  }

  if (profileData.sendMail == undefined) {
    console.error('Send mail is not defined.');
    return false;
  } else if (profileData.sendMail == true) {
    if (profileData.sendPersonalizedMail == undefined) {
      console.error('Send personalized mail is not defined.');
      return false;
    } else if (profileData.sendPersonalizedMail == true) {
      if (profileData.mailText == undefined) {
        console.error('Send personalized mail is set to true, but the text is not.');
        return false;
      } else {
        var mailTextTrimmed = profileData.mailText.trim();
        if (mailTextTrimmed.length == 0) {
          console.error('Personalized Email text is empty. Discarding...');
          return false;
        } else {
          profileData.mailText = mailTextTrimmed;
        }
      }
    } else {
      profileData.mailText = "";
    }
  } else {
    profileData.sendPersonalizedMail = false;
    profileData.mailText = "";
  }

  if (profileData.sendSMS == undefined) {
    console.error('Send SMS is not defined.');
    return false;
  } else if (profileData.sendSMS == true) {
    if (profileData.sendPersonalizedSMS == undefined) {
      console.error('Send personalized SMS is not defined.');
      return false;
    } else if (profileData.sendPersonalizedSMS == true) {
      if (profileData.smsText == undefined) {
        console.error('Send personalized SMS is set to true, but the text is not.');
        return false;
      } else {
        var smsTextTrimmed = profileData.smsText.trim();
        if (smsTextTrimmed.length == 0) {
          console.error('Personalized SMS text is empty. Discarding...');
          return false;
        } else {
          profileData.smsText = smsTextTrimmed;
        }
      }
    } else {
      profileData.smsText = "";
    }
  } else {
    profileData.sendPersonalizedSMS = false;
    profileData.smsText = "";
  }

  if (profileData.facebookPost == undefined) {
    console.error('Facebook post is not defined.');
    return false;
  }

  return true;
};

/**
 * @return {string}
 */
var GetFormattedPhoneNumber = function (number) {
  var parcels = number.split(" ");

  var finalNumber = "";

  for (var i = 0; i < parcels.length; i++) {
    finalNumber += parcels[i];
  }

  return finalNumber;
};

/**
 * @return {boolean}
 */
var IsProperPhoneNumber = function (text) {
  var parcels = text.split(" ");
  var count = 0;

  for (var i = 0; i < parcels.length; i++) {
    count += parcels[i].length;

    for (var j = 0; j < parcels[i].length; j++) {

      if (!(parseInt(parcels[i][j]) >= 0 && parseInt(parcels[i][j]) <= 9)) {
        return false;
      }
    }
  }

  return (count == 9);
};

/**
 * @return {boolean}
 */
var isLeapYear = function (year) {
  return (new Date(year, 1, 29).getMonth() == 1);
};
