// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'itBirthday' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('itBirthday', ['ionic', 'itBirthday.login', 'itBirthday.newProfile', 'itBirthday.search', 'itBirthday.updateProfile'])

  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      if(window.cordova && window.cordova.plugins.Keyboard) {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

        // Don't remove this line unless you know what you are doing. It stops the viewport
        // from snapping when text inputs are focused. Ionic handles this internally for
        // a much nicer keyboard experience.
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if(window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })

  .config(function($stateProvider, $urlRouterProvider,$ionicConfigProvider) {
    $ionicConfigProvider.tabs.position('top'); //bottom - comment to put default

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // login page before showing tabs
      .state('login', {
        url: '/login',
        templateUrl: '/app/www/templates/login.html',
        controller: 'LoginCtrl'
      })

      // setup an abstract state for the tabs directive
      .state('tabs', {
        url: '/tabs',
        abstract: true,
        templateUrl: '/app/www/templates/tabs.html'
      })

      // Each tab has its own nav history stack:

      .state('tabs.dash', {
        url: '/dash',
        views: {
          'tab-dash': {
            templateUrl: '/app/www/templates/tab-dash.html'
          }
        }
      })

      // setup an abstract state for the profile tab
      .state('tabs.profile', {
        url: '/profile',
        abstract: true,
        views: {
          'tab-profile': {
            templateUrl: '/app/www/templates/tab-profile.html'
          }
        }
      })

      .state('tabs.profile.main', {
        url: '/main',
        views: {
          'inside-profile-tab@tabs.profile': {
            templateUrl: '/app/www/templates/default-profile.html'
          }
        }
      })

      .state('tabs.profile.new', {
        url: '/new',
        views: {
          'inside-profile-tab@tabs.profile': {
            templateUrl: '/app/www/templates/new-profile.html',
            controller: 'NewUserCtrl'
          }
        }
      })

      .state('tabs.profile.update', {
        url: '/update',
        views: {
          'inside-profile-tab@tabs.profile': {
            templateUrl: '/app/www/templates/update-profile.html',
            controller: 'UpdateUserCtrl'
          }
        }
      })

      .state('tabs.profile.search', {
        url: '/search',
        views: {
          'inside-profile-tab@tabs.profile': {
            templateUrl: '/app/www/templates/search-profile.html',
            controller: 'SearchCtrl'
          }
        }
      })

      .state('tabs.settings', {
        url: '/settings',
        views: {
          'tab-settings': {
            templateUrl: '/app/www/templates/tab-settings.html',
            //controller: 'AccountCtrl'
          }
        }
      });

    // if none of the above states are matched, use this as the fallback

    $urlRouterProvider.otherwise('/login');
  })

