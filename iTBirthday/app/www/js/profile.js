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
    // TODO tentar excluir o "@mail.com" da pesquisa

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
          $http.delete(serverUrl + '/delete_employee', {
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
      var templateDate = '<label class="item item-input">' +
        '<span class="input-label">Date</span>'+
        '<input type="date" ng-model="profile.exitDate">'+
        '</label>';

      // An elaborate, custom popup
      var myPopup = $ionicPopup.show({
        template: templateDate,
        title: 'Data de saída',
        subTitle: '(Esta ação é irreversível!)',
        scope: $scope,
        buttons: [
          { text: 'Cancelar' },
          {
            text: '<b>Guardar</b>',
            type: 'button-energized',
            onTap: function(e) {
              if (!$scope.profile.exitDate) {
                //don't allow the user to close unless he enters exit date
                e.preventDefault();
              } else {
                return $scope.profile.exitDate;
              }
            }
          }
        ]
      });

      myPopup.then(function(res) {
        console.log('Tapped!', res);
        if(res != undefined) {
          //TODO http request to update exitdate
        } else {}
      });
    };

    $scope.getEmployee = function () {
      $scope.isView = true;
      $http.get(serverUrl + '/employee_profile/' + $stateParams.id).success(function (response) {
        console.log(response);
        $scope.profile = response;
        $scope.profile.birthDate = new Date(String($scope.profile.birthDate));
        $scope.profile.entryDate = new Date(String($scope.profile.entryDate));
      });
    };

    //listen for the file selected event
    $("input[type=file]").on("changed", function () {
      $scope.profile.photo = this.files[0];
    });

    $scope.update_profile = function () {
      if ($scope.profile == undefined) {
        console.error('Profile Data is not valid.');
        return false;
      }

      if ($scope.profile.name == undefined || $scope.profile.name.length == 0) {
        console.error('Profile name is not valid.');
        return false;
      }

      if ($scope.profile.birthDate == undefined || !IsProperDate($scope.profile.birthDate)) {
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

      if ($scope.profile.entryDate == undefined || !IsProperDate($scope.profile.entryDate)) {
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

      $http.post(serverUrl + '/update_employee/' + $stateParams.id, {
        name: $scope.profile.name,
        birthDate: new Date($scope.profile.birthDate),
        phoneNumber: $scope.profile.phoneNumber,
        email: $scope.profile.email,
        entryDate: new Date($scope.profile.entryDate),
        sendMail: $scope.profile.sendMail,
        mailText: $scope.profile.mailText,
        sendSMS: $scope.profile.sendSMS,
        smsText: $scope.profile.smsText,
        facebookPost: $scope.profile.facebookPost,
        gender: $scope.profile.gender
      }).success(function () {
        if ($scope.profile.photo != undefined) {
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

    $scope.onDateKeyDown = function ($event) {
      var code = ($event.which || $event.keyCode);

      if (IsTab(code) || IsRefresh(code)) {
        return true;
      }

      if (!IsNumber(code) && !IsBackspace(code)) {
        $event.preventDefault();
        return false;
      }

      var inputElem = $($event.target);
      var text = String(inputElem.val());

      if (IsBackspace(code)) {
        $event.preventDefault();

        if (text.length == 5) {
          text = text.substr(0, 3);
        }
        else if (text.length == 8) {
          text = text.substr(0, 6);
        }
        else {
          text = text.substr(0, text.length - 1);
        }
      }

      var parcels = text.split("-");

      if (parcels == undefined || parcels.length == 0) {
        return false;
      }

      var finalText = "";
      if (parcels.length > 0) {
        if (parcels[0].length < 4) {
          finalText += parcels[0];
        }
        else {
          var year = ClampYear(parseInt(parcels[0]));
          finalText += year + "-";

          if (parcels.length > 1) {
            if (parcels[1].length < 2) {
              finalText += parcels[1];
            }
            else {
              var month = ClampMonth(parseInt(parcels[1]));
              if (month < 10) {
                finalText += "0";
              }
              finalText += month + "-";

              if (parcels.length > 2) {
                if (parcels[2].length < 2) {
                  finalText += parcels[2];
                }
                else {
                  var day = ClampDay(parseInt(parcels[2]), month, year);
                  if (day < 10) {
                    finalText += "0";
                  }
                  finalText += day;
                }
              }
            }
          }
        }
      }

      if (finalText.length > 9) {
        finalText = finalText.substr(0, 9);
      }

      inputElem.val(finalText);
      return true;
    };

    $scope.onDateEdited = function ($event) {
      var code = ($event.which || $event.keyCode);

      if (IsTab(code) || IsRefresh(code)) {
        return true;
      }

      if (!IsNumber(code) && IsBackspace(code)) {
        $event.preventDefault();
        return false;
      }

      var inputElem = $($event.target);
      var text = String(inputElem.val());

      if (text.length > 10) {
        text = text.substr(0, 10);
      }

      var parcels = text.split("-");

      if (parcels == undefined || parcels.length == 0) {
        return false;
      }

      var finalText = "";
      if (parcels.length > 0) {
        if (parcels[0].length < 4) {
          finalText += parcels[0];
        }
        else {
          var year = ClampYear(parseInt(parcels[0]));
          finalText += year + "-";

          if (parcels.length > 1) {
            if (parcels[1].length < 2) {
              finalText += parcels[1];
            }
            else {
              var month = ClampMonth(parseInt(parcels[1]));
              if (month < 10) {
                finalText += "0";
              }
              finalText += month + "-";

              if (parcels.length > 2) {
                if (parcels[2].length < 2) {
                  finalText += parcels[2];
                }
                else {
                  var day = ClampDay(parseInt(parcels[2]), month, year);
                  if (day < 10) {
                    finalText += "0";
                  }
                  finalText += day;
                }
              }
            }
          }
        }
      }

      inputElem.val(finalText);
      return true;
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

    $("select").each(function() {
      console.log(this);
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

      if (profileData.birthDate == undefined || !IsProperDate(profileData.birthDate)) {
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

      if (profileData.entryDate == undefined || !IsProperDate(profileData.entryDate)) {
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

    $scope.onDateKeyDown = function ($event) {
      var code = ($event.which || $event.keyCode);

      if (IsTab(code) || IsRefresh(code)) {
        return true;
      }

      if (!IsNumber(code) && !IsBackspace(code)) {
        $event.preventDefault();
        return false;
      }

      var inputElem = $($event.target);
      var text = String(inputElem.val());

      if (IsBackspace(code)) {
        $event.preventDefault();

        if (text.length == 5) {
          text = text.substr(0, 3);
        }
        else if (text.length == 8) {
          text = text.substr(0, 6);
        }
        else {
          text = text.substr(0, text.length - 1);
        }
      }

      var parcels = text.split("-");

      if (parcels == undefined || parcels.length == 0) {
        return false;
      }

      var finalText = "";
      if (parcels.length > 0) {
        if (parcels[0].length < 4) {
          finalText += parcels[0];
        }
        else {
          var year = ClampYear(parseInt(parcels[0]));
          finalText += year + "-";

          if (parcels.length > 1) {
            if (parcels[1].length < 2) {
              finalText += parcels[1];
            }
            else {
              var month = ClampMonth(parseInt(parcels[1]));
              if (month < 10) {
                finalText += "0";
              }
              finalText += month + "-";

              if (parcels.length > 2) {
                if (parcels[2].length < 2) {
                  finalText += parcels[2];
                }
                else {
                  var day = ClampDay(parseInt(parcels[2]), month, year);
                  if (day < 10) {
                    finalText += "0";
                  }
                  finalText += day;
                }
              }
            }
          }
        }
      }

      if (finalText.length > 9) {
        finalText = finalText.substr(0, 9);
      }

      inputElem.val(finalText);
      return true;
    };

    $scope.onDateEdited = function ($event) {
      var code = ($event.which || $event.keyCode);

      if (IsTab(code) || IsRefresh(code)) {
        return true;
      }

      if (!IsNumber(code) && IsBackspace(code)) {
        $event.preventDefault();
        return false;
      }

      var inputElem = $($event.target);
      var text = String(inputElem.val());

      if (text.length > 10) {
        text = text.substr(0, 10);
      }

      var parcels = text.split("-");

      if (parcels == undefined || parcels.length == 0) {
        return false;
      }

      var finalText = "";
      if (parcels.length > 0) {
        if (parcels[0].length < 4) {
          finalText += parcels[0];
        }
        else {
          var year = ClampYear(parseInt(parcels[0]));
          finalText += year + "-";

          if (parcels.length > 1) {
            if (parcels[1].length < 2) {
              finalText += parcels[1];
            }
            else {
              var month = ClampMonth(parseInt(parcels[1]));
              if (month < 10) {
                finalText += "0";
              }
              finalText += month + "-";

              if (parcels.length > 2) {
                if (parcels[2].length < 2) {
                  finalText += parcels[2];
                }
                else {
                  var day = ClampDay(parseInt(parcels[2]), month, year);
                  if (day < 10) {
                    finalText += "0";
                  }
                  finalText += day;
                }
              }
            }
          }
        }
      }

      inputElem.val(finalText);
      return true;
    };

    $scope.preventDefaultAction = function ($event) {
      $event.preventDefault();
      return false;
    }
  }]);

var ClampYear = function (numericYear) {
  if (numericYear < 1940) {
    numericYear = 1940;
  }
  else {
    var currentYear = new Date().getFullYear();
    if (numericYear > currentYear) {
      numericYear = currentYear;
    }
  }

  return numericYear;
};

var ClampMonth = function (numericMonth) {
  if (numericMonth <= 0) {
    numericMonth = 1;
  }
  else if (numericMonth > 12) {
    numericMonth = 12;
  }

  return numericMonth;
};

var ClampDay = function (numericDay, month, year) {
  if (numericDay <= 0) {
    numericDay = 1;
  }
  else if (numericDay > 28) {
    var numDays = new Date(year, month, 0).getDate();
    if (numericDay > numDays) {
      numericDay = numDays;
    }
  }

  return numericDay;
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
var IsProperDate = function (text) {
  if (text.length != 10) {
    return false;
  }

  var parcels = text.split("-");

  for (var i = 0; i < parcels.length; i++) {
    for (var j = 0; j < parcels[i].length; j++) {
      if (parseInt(parcels[i][j]) < 0 || parseInt(parcels[i][j]) > 9) {
        return false;
      }
    }
  }

  return true;
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

