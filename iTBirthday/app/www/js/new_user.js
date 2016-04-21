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

    CreateNewUser(profileData);
  };

  $scope.on_date_start_edit = function($event) {

    var eventNum = ($event.keyCode >= 48 && $event.key <= 57);

    if(eventNum || $event.key == "-" || $event.key == "Backspace") {
      var inputElem = $($event.target);
      var text = String(inputElem.val());

      if(eventNum && text.length == 10) {
        $event.preventDefault();
        return false;
      }

      return true;
    }

    if($event.key == "Tab" || $event.key == "F5") {
      return true;
    }

    $event.preventDefault();
    return false;
  };

  $scope.on_date_edited = function($event) {
    var inputElem = $($event.target);
    var text = String(inputElem.val());

    if(text == undefined || text.length <= 0) {
      return;
    }

    if(text.length > 10) {
      text = text.substr(0, 10);
    }

    if($event.key == "Backspace") {
      if(text.length == 4) {
        text = text.substr(0, 3);
      }
      else if(text.length == 7) {
        text = text.substr(0, 6);
      }
    }

    var values = text.split("-");

    if(values == undefined || values.length == 0) {
      return;
    }

    var year = parseInt(values[0]);
    var finalText = "";
    if(year < 1000) {
      finalText += year;
    }
    else {
      year = ClampYear(year);
      finalText += year;
      finalText += "-";
    }

    if (values.length > 1 && values[1].length > 0) {
      var month = values[1];
      var numericMonth = ClampMonth(parseInt(values[1]));

      if(month.length == 1) {

        if($event.key == "-") {
          if(numericMonth > 0 && numericMonth < 10) {
            finalText += "0";
          }
          finalText += numericMonth;
          finalText += "-";
        }
        else {
          finalText += month;
        }
      }
      else {
        if(numericMonth < 10) {
          finalText += "0";
        }
        finalText += numericMonth;
        finalText += "-";
      }
    }

    if(values.length > 2 && values[2].length > 0) {
      var day = values[2];
      var numericDay = ClampDay(parseInt(values[2]), month, year);

      if(day.length == 1) {
        finalText += day;
      }
      else {
        if(numericDay < 10) {
          finalText += "0";
        }
        finalText += numericDay;
      }
    }

    inputElem.val(finalText);
  };

  $scope.on_date_end_edit = function($event) {
    var inputElem = $($event.target);
    var text = String(inputElem.val());

    if(text == undefined || text.length <= 0) {
      return;
    }

    if(text.length > 10) {
      text = text.substr(0, 10);
    }

    if($event.key == "Backspace") {
      if(text.length == 4) {
        text = text.substr(0, 3);
      }
      else if(text.length == 7) {
        text = text.substr(0, 6);
      }
    }

    var values = text.split("-");

    if(values == undefined || values.length == 0) {
      return;
    }

    var finalText = "";

    var year = "", month = "", day = "";
    if(values.length > 0) {
      year = values[0];
      if(year.length == 4) {
        finalText += year + "-";
      }
      else {
        finalText = "";
      }
    }
    if(finalText.length > 0 && values.length > 1) {
      month = values[1];
      if(month.length == 2) {
        finalText += month + "-";
      }
      else {
        finalText = "";
      }
    }
    if(finalText.length > 0 && values.length > 2) {
      day = values[2];
      if(day.length == 2) {
        finalText += day;
      }
      else {
        finalText = "";
      }
    }

    inputElem.val(finalText);
  };

  $scope.on_phone_number_start_edit = function($event) {

  };

  $scope.on_phone_number_edited = function($event) {

  };

  var ClampYear = function (year) {
    if(year < 1940) {
      year = 1940;
    }
    else {
      var currentYear = new Date().getFullYear();
      if(year > currentYear) {
        year = currentYear;
      }
    }

    return year;
  };

  var ClampMonth = function (month) {
    if(month <= 0) {
      month = 1;
    }
    else if(month > 12) {
      month = 12;
    }

    return month;
  };

  var ClampDay = function (day, month, year) {
    if(day <= 0) {
      day = 1;
    }
    else if(day > 28){
      var numDays = new Date(year, month, 0).getDate();
      if(day > numDays) {
        day = numDays;
      }
    }

    return day;
  };

  var CreateNewUser = function (profileData) {

    console.log(profileData);

    // $http.post('/post_employee', {
    //   name: 'test',
    //   birthDate: Date.now(),
    //   phoneNumber : "123456789",
    //   email : "email@itgrow.com",
    //   entryDate : Date.now(),
    //   sendMail: true,
    //   sendSMS : false,
    //   facebookPost : false
    // }).success(function (data) {
    //   console.log('New user POST successful');
    // }).error(function (data) {
    //   console.log('ERROR: ' + data);
    //   return false;
    // });
  };

  /**
   * @return {string}
   */
  var ParseNumberDate = function(text) {
    var parsedText = '';

    for(var i = 0; i < text.length; i++) {
      if(text[i] >= 0 && text[i] <= 9 || text[i] == '-') {
        parsedText += text[i];
      }
    }

    return parsedText;
  };

  /**
   * @return {boolean}
   */
  var IsProperDate = function(text) {
    if (text.length != 7) {
      return false;
    }

    for (var i = 0; i < text.length; i++) {
      if (i == 2) {
        if (text[i] != "/") {
          return false;
        }
      }
      else {
        if (text[i] < 0 || text[i] > 9) {
          return false;
        }
      }
    }

    return true;
  };

  /**
   * @return {boolean}
   */
  var IsProperPhoneNumber = function(text) {
    if(text.length != 9) {
      return false;
    }

    for(var i = 0; i < text.length; i++) {
      if(text[i] < 0 || text[i] > 9) {
        return false;
      }
    }

    return true;
  }
});

