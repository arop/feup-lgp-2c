angular.module('itBirthday.profile', ['ngFileUpload'])

  .controller('SearchCtrl', function ($scope, $http) {

    $scope.serverUrl = serverUrl;

    var cookie = localStorage.getItem('session');

    if (cookie == null) {

    }
    else {
      //removes """ from cookie
      var cookie2 = cookie.replace('\"', '');

      $http.get(serverUrl + '/Session/' + cookie2).success(function (data) {
        if (data.length == 0) {
          $scope.session = {username: undefined};
        }
        else {
          $scope.session = {username: "admin"};
        }
      }).error(function (data) {
      });
    }

    $scope.getAllEmployees = function () {
      $http.get(serverUrl + '/list_employees').success(function (response) {
        $scope.profiles = response;
      });
    };

    var searchLabel = $($("#search-label").find("> input")[0]);
    var statusFilter = $("#status-filter").find("> select")[0];

    $scope.filterResults = function (element) {
      var status = statusFilter.options[statusFilter.selectedIndex].value;
      if(status != undefined) {

        var exitDate = element["exitDate"];

        if(status == "now" && exitDate) {
          return false;
        }

        if(status == "old" && !exitDate) {
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

  })

  // update and view controller
  .controller('UpdateUserCtrl', function ($scope, $http, $state, $stateParams, $filter, $ionicPopup, Upload) {
    $scope.profile = {};
    $scope.isView = null;
    $scope.serverUrl = serverUrl;
    $scope.changedPhoto = false;

    $scope.isChoosingExitDate = false;
    $scope.hasExited = false;

    $scope.toggleShowExitDate = function () {
      $scope.isChoosingExitDate = true;
    };

    // A confirm dialog
    $scope.showConfirmRemove = function() {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Remover perfil',
        template: 'Tem a certeza que quer remover este perfil? (Esta ação é irreversível)',
        cancelText: 'Cancelar',
        okText: 'Sim',
        okType: 'button-assertive'
      });

      confirmPopup.then(function(res) {
        if(res) {
          console.log($scope.profile.email);
          $http.post(serverUrl + '/delete_employee', {
            email: $scope.profile.email
          }).success(function (data,status) {
            if (status == 200){
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
    $scope.showPopupExitDate = function() {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Adicionar data de saída',
        template: 'Tem a certeza que quer adicionar uma data de saída? (Esta ação é irreversível)',
        cancelText: 'Cancelar',
        okText: 'Sim',
        okType: 'button-assertive'
      });

      confirmPopup.then(function(res) {
        if(res) $scope.update_profile_http_request();
        else return false;
      });
    };

    $scope.getEmployee = function () {
      $scope.isView = true;
      $http.get(serverUrl + '/employee_profile/' + $stateParams.id).success(function (response) {
        console.log(response);
        $scope.profile = response;
        $scope.profile.birthDate = new Date(String($scope.profile.birthDate)).toISOString().slice(0, 10);
        $scope.profile.entryDate = new Date(String($scope.profile.entryDate)).toISOString().slice(0, 10);
        if($scope.profile.exitDate != undefined) {
          $scope.profile.exitDate = new Date(String($scope.profile.exitDate)).toISOString().slice(0, 10);
          $scope.hasExited = true;
        }
      });
    };

    //listen for the file selected event
    $("input[type=file]").change(function () {
      $scope.profile.photo = this.files[0];
      $scope.changedPhoto = true;
    });

    //post request to the server to update profile
    $scope.update_profile_http_request = function () {
      //console.log("profile before request");
      //console.log($scope.profile);
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
        exitDate: new Date($scope.profile.exitDate)
      }).success(function () {
        if ($scope.profile.photo != undefined && $scope.changedPhoto == true) {
          Upload.upload({
            url: serverUrl + '/save_image_employee/' + $stateParams.id,
            file: $scope.profile.photo,
            progress: function (e) {
            }
          }).then(function (data, status, headers, config) {
            // file is uploaded successfully
          });
        }

        $state.go($state.current, {}, {reload: true});
      });
    };

    $scope.update_profile = function () {
      if ($scope.profile == undefined) {
        console.error('Profile Data is not valid.');
        return false;
      }

      if ($scope.profile.name == undefined || $scope.profile.name.length == 0) {
        console.error('Profile name is not valid.');
        return false;
      }

      if ($scope.profile.birthDate == undefined) {
        console.error('Profile birth date is not valid.');
        return false;
      }

      if ($scope.profile.phoneNumber == undefined || !IsProperPhoneNumber($scope.profile.phoneNumber)) {
        console.error('Profile phone number is not valid.');
        return false;
      }
      else {
        $scope.profile.phoneNumber = GetFormattedPhoneNumber($scope.profile.phoneNumber);
      }

      if ($scope.profile.email == undefined) {
        console.error('Profile email is not valid.');
        return false;
      }

      if ($scope.profile.entryDate == undefined) {
        console.error('Profile entry date is not valid.');
        return false;
      }

      if ($scope.profile.sendMail == undefined) {
        console.error('Send mail is not defined.');
        return false;
      }

      if ($scope.profile.sendSMS == undefined) {
        console.error('Send SMS is not defined.');
        return false;
      }

      if ($scope.profile.facebookPost == undefined) {
        console.error('Facebook post presence is not defined.');
        return false;
      }

      if ($scope.profile.gender == undefined) {
        console.error('Gender is not defined.');
        return false;
      }

      // if used so that if the user selects an exit date it has to confirm the update
      if($scope.profile.exitDate != undefined)
        $scope.showPopupExitDate();
      else $scope.update_profile_http_request();
    };

  })

  .controller('NewUserCtrl', ['$scope', '$state', '$http', 'Upload', function ($scope, $state, $http, Upload) {

    $scope.profile = {};
    $scope.serverUrl = serverUrl;

    $scope.getEmployee = function () {
      $scope.isView = false;
      $scope.isNewProfile = true;
    };

    //listen for the file selected event
    $("input[type=file]").on("change", function () {
      $scope.profile.photo = this.files[0];
    });

    $scope.newProfile = function (profileData) {

      if (profileData == undefined) {
        console.error('Profile Data is not valid.');
        return false;
      }

      if (profileData.name == undefined || profileData.name.length == 0) {
        console.error('Profile name is not valid.');
        return false;
      }

      if (profileData.birthDate == undefined) {
        console.error('Profile birth date is not valid.');
        return false;
      }

      if (profileData.phoneNumber == undefined || !IsProperPhoneNumber(profileData.phoneNumber)) {
        console.error('Profile phone number is not valid.');
        return false;
      }
      else {
        profileData.phoneNumber = GetFormattedPhoneNumber(profileData.phoneNumber);
      }

      if (profileData.email == undefined) {
        console.error('Profile email is not valid.');
        return false;
      }

      if (profileData.entryDate == undefined) {
        console.error('Profile entry date is not valid.');
        return false;
      }

      if (profileData.sendMail == undefined) {
        console.error('Send mail is not defined.');
        return false;
      }

      if (profileData.sendSMS == undefined) {
        console.error('Send SMS is not defined.');
        return false;
      }

      if (profileData.facebookPost == undefined) {
        console.error('Facebook post presence is not defined.');
        return false;
      }

      if ($scope.profile.gender == undefined) {
        console.error('Gender is not defined.');
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
        //console.log('New user POST successful');
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
    };
  }])

  /**
   * jquery date picker directive
   */
  .directive('datepicker', function () {
    return {
      require : 'ngModel',
      link : function (scope, element, attrs, ngModelCtrl) {
        $(function(){
          $(element).datepicker({
            changeYear:true,
            changeMonth:true,
            dateFormat:'yy-mm-dd',
            yearRange: "c-100:c+1",
            //maxDate: new Date(),
            onSelect:function (dateText, inst) {
              ngModelCtrl.$setViewValue(dateText);
              scope.$apply();
            }
          });
        });
      }
    }
  });


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
var IsBackspace = function (code) {
  return (code == 8);
};

/**
 * @return {boolean}
 */
var IsTab = function (code) {
  return (code == 9);
};

/**
 * @return {boolean}
 */
var IsSpace = function (code) {
  return (code == 32);
};

/**
 * @return {boolean}
 */
var IsRefresh = function (code) {
  return (code == 116);
};

/**
 * @return {boolean}
 */
var IsLetter = function (code) {
  return (code >= 65 && code <= 90);
};

/**
 * @return {boolean}
 */
var IsNumber = function (code) {
  return (code >= 48 && code <= 57) || (code >= 96 && code <= 105);
};

/**
 * @return {boolean}
 */
var IsCtrl = function (code) {
  return (code == 17);
};

/**
 * @return {boolean}
 */
var IsCopyPaste = function (code) {
  return (code == 67 || code == 86);
};
