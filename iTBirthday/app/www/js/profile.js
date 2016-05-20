angular.module('itBirthday.profile', ['ngFileUpload'])

  .controller('SearchCtrl', function ($scope, $http) {
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

      if (emailWithoutHost.toLowerCase().indexOf(searchTerm) >= 0) {
        return true;
      }

      return false;
    };

  })

  .controller('UpdateUserCtrl', function ($scope, $http, $state, $stateParams, $filter, Upload) {
    $scope.profile = {};
    $scope.isView = null;

    $scope.getEmployee = function () {
      $scope.isView = true;
      $http.get(serverUrl + '/employee_profile/' + $stateParams.id).success(function (response) {
        $scope.profile = response;
        $scope.profile.birthDate = $filter('date')($scope.profile.birthDate, 'yyyy-MM-dd');
        $scope.profile.entryDate = $filter('date')($scope.profile.entryDate, 'yyyy-MM-dd');
      });
    };

    //listen for the file selected event
    $("input[type=file]").change(function () {
      console.log("CHANGED");
      var file = this.files[0];
      $scope.profile.photo = file;
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
        sendSMS: $scope.profile.sendSMS,
        facebookPost: $scope.profile.facebookPost,
        gender: $scope.profile.gender
      }).success(function () {
        console.log($scope.profile.photo);
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

    $scope.on_date_key_down = function ($event) {
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

    $scope.on_date_edited = function ($event) {
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

    $scope.getEmployee = function () {
      $scope.isView = false;
      $scope.isNewProfile = true;
    }

    //listen for the file selected event
    $("input[type=file]").change(function () {
      var file = this.files[0];
      $scope.profile.photo = file;
    });


    $scope.new_profile = function (profileData) {

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
        sendSMS: profileData.sendSMS,
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

    $scope.on_date_key_down = function ($event) {
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

    $scope.on_date_edited = function ($event) {
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

