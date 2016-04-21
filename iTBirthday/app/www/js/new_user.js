var newProfile = angular.module('itBirthday.newProfile', []);

newProfile.controller('NewUserCtrl', function($scope, $state, $http) {

  $scope.new_profile = function(profileData) {
    if(profileData == undefined) {
      console.error('Profile Data is not valid.');
      return false;
    }

    if(profileData.name == undefined || profileData.name.length == 0) {
      console.error('Profile name is not valid.');
      return false;
    }

    if(profileData.birthDate == undefined || !IsProperDate(profileData.birthDate)) {
      console.error('Profile birth date is not valid.');
      return false;
    }

    if(profileData.phoneNumber == undefined || !IsProperPhoneNumber(profileData.phoneNumber)) {
      console.error('Profile phone number is not valid.');
      return false;
    }
    else {
      profileData.phoneNumber = GetFormattedPhoneNumber(profileData.phoneNumber);
    }

    if(profileData.email == undefined) {
      console.error('Profile email is not valid.');
      return false;
    }

    if(profileData.entryDate == undefined || !IsProperDate(profileData.entryDate)) {
      console.error('Profile entry date is not valid.');
      return false;
    }

    if(profileData.sendMail == undefined) {
      console.error('Send mail is not defined.');
      return false;
    }

    if(profileData.sendSMS == undefined) {
      console.error('Send SMS is not defined.');
      return false;
    }

    if(profileData.facebookPost == undefined) {
      console.error('Facebook post presence is not defined.');
      return false;
    }

    $http.post('/post_employee', {
      name: profileData.name,
      birthDate: new Date(profileData.birthDate),
      phoneNumber : profileData.phoneNumber,
      email : profileData.email,
      entryDate : new Date(profileData.entryDate),
      sendMail: profileData.sendMail,
      sendSMS : profileData.sendSMS,
      facebookPost : profileData.facebookPost
    }).success(function () {
      //console.log('New user POST successful');
      return true;
    }).error(function (err) {
      console.log('Error while creating new user: ' + err);
      return false;
    });

    $state.go('tabs.dash');
  };

  $scope.on_name_edit_start = function($event) {
    var code = ($event.which || $event.keyCode);

    if(IsTab(code) || IsRefresh(code) || IsBackspace(code) || IsSpace(code) || IsLetter(code)) {
      return true;
    }

    $event.preventDefault();
    return true;
  };

  $scope.on_date_edit_start = function($event) {
    var code = ($event.which || $event.keyCode);

    if(IsTab(code) || IsRefresh(code)) {
      return true;
    }

    if(!IsNumber(code) && !IsBackspace(code)) {
      $event.preventDefault();
      return false;
    }

    var inputElem = $($event.target);
    var text = String(inputElem.val());

    if(IsBackspace(code)) {
      $event.preventDefault();

      if(text.length == 5) {
        text = text.substr(0, 3);
      }
      else if(text.length == 8) {
        text = text.substr(0, 6);
      }
      else {
        text = text.substr(0, text.length - 1);
      }
    }

    var parcels = text.split("-");

    if(parcels == undefined || parcels.length == 0) {
      return false;
    }

    var finalText = "";
    if(parcels.length > 0) {
      if(parcels[0].length < 4) {
        finalText += parcels[0];
      }
      else {
        var year = ClampYear(parseInt(parcels[0]));
        finalText += year + "-";

        if(parcels.length > 1) {
          if(parcels[1].length < 2) {
            finalText += parcels[1];
          }
          else {
            var month = ClampMonth(parseInt(parcels[1]));
            if (month < 10) {
              finalText += "0";
            }
            finalText += month + "-";

            if(parcels.length > 2) {
              if(parcels[2].length < 2) {
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

    if(finalText.length > 9) {
      finalText = finalText.substr(0, 9);
    }

    inputElem.val(finalText);
    return true;
  };

  $scope.on_date_edit_end = function($event) {
    var code = ($event.which || $event.keyCode);

    if(IsTab(code) || IsRefresh(code)) {
      return true;
    }

    if(!IsNumber(code) && IsBackspace(code)) {
      $event.preventDefault();
      return false;
    }

    var inputElem = $($event.target);
    var text = String(inputElem.val());

    if(text.length > 10) {
      text = text.substr(0, 10);
    }

    var parcels = text.split("-");

    if(parcels == undefined || parcels.length == 0) {
      return false;
    }

    var finalText = "";
    if(parcels.length > 0) {
      if(parcels[0].length < 4) {
        finalText += parcels[0];
      }
      else {
        var year = ClampYear(parseInt(parcels[0]));
        finalText += year + "-";

        if(parcels.length > 1) {
          if(parcels[1].length < 2) {
            finalText += parcels[1];
          }
          else {
            var month = ClampMonth(parseInt(parcels[1]));
            if (month < 10) {
              finalText += "0";
            }
            finalText += month + "-";

            if(parcels.length > 2) {
              if(parcels[2].length < 2) {
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

  $scope.on_phone_number_edit_start = function($event) {
    var code = ($event.which || $event.keyCode);

    if(IsTab(code) || IsRefresh(code)) {
      return true;
    }

    if(!IsNumber(code) && !IsBackspace(code)) {
      $event.preventDefault();
      return false;
    }

    var inputElem = $($event.target);
    var text = inputElem.val();

    if(IsBackspace(code)) {
      $event.preventDefault();

      if(text.length == 4) {
        text = text.substr(0, 2);
      }
      else if(text.length == 8) {
        text = text.substr(0, 6);
      }
      else {
        text = text.substr(0, text.length - 1);
      }
    }

    if(text == undefined) {
      $event.preventDefault();
      return false;
    }

    if(IsNumber(code) && text.length == 11) {
      $event.preventDefault();
      return false;
    }

    if(text.length > 11) {
      text = text.substr(0, 11);
    }

    var finalText = "";
    if(text.length > 0) {
      finalText += text.substr(0, Math.min(3, text.length));

      if (text.length >= 3) {
        finalText += " ";

        if(text.length > 3) {
          finalText += text.substr(4, Math.min(3, text.length - 4));

          if (text.length >= 7) {
            finalText += " ";

            if (text.length > 7) {
              finalText += text.substr(8, Math.min(3, text.length - 8));
            }
          }
        }
      }
    }

    inputElem.val(finalText);
    return true;
  };

  var ClampYear = function (numericYear) {
    if(numericYear < 1940) {
      numericYear = 1940;
    }
    else {
      var currentYear = new Date().getFullYear();
      if(numericYear > currentYear) {
        numericYear = currentYear;
      }
    }

    return numericYear;
  };

  var ClampMonth = function (numericMonth) {
    if(numericMonth <= 0) {
      numericMonth = 1;
    }
    else if(numericMonth > 12) {
      numericMonth = 12;
    }

    return numericMonth;
  };

  var ClampDay = function (numericDay, month, year) {
    if(numericDay <= 0) {
      numericDay = 1;
    }
    else if(numericDay > 28){
      var numDays = new Date(year, month, 0).getDate();
      if(numericDay > numDays) {
        numericDay = numDays;
      }
    }

    return numericDay;
  };

  /**
   * @return {string}
   */
  var GetFormattedPhoneNumber = function(number) {
    var parcels = number.split(" ");

    var finalNumber = "";

    for(var i = 0; i < parcels.length; i++) {
      finalNumber += parcels[i];
    }

    return finalNumber;
  };

  /**
   * @return {boolean}
   */
  var IsProperDate = function(text) {
    if (text.length != 10) {
      return false;
    }

    var parcels = text.split("-");

    for(var i = 0; i < parcels.length; i++) {
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
    if (text.length != 11) {
      return false;
    }

    var parcels = text.split(" ");

    for(var i = 0; i < parcels.length; i++) {
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
  var IsBackspace = function(code) {
    return (code == 8);
  };

  /**
   * @return {boolean}
   */
  var IsTab = function(code) {
    return (code == 9);
  };

  /**
   * @return {boolean}
   */
  var IsSpace = function(code) {
    return (code == 32);
  };

  /**
   * @return {boolean}
   */
  var IsRefresh = function(code) {
    return (code == 116);
  };

  /**
   * @return {boolean}
   */
  var IsLetter = function(code) {
    return (code >= 65 && code <= 90);
  };

  /**
   * @return {boolean}
   */
  var IsNumber = function(code) {
    return (code >= 48 && code <= 57) || (code >= 96 && code <= 105);
  };
});

