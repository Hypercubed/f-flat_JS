/* global F */

'use strict';

/**
 * @ngdoc overview
 * @name fApp
 * @description
 * # fApp
 *
 * Main module of the application.
 */
angular

  .module('fApp', [
    'ngAnimate',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'LocalStorageModule'
  ])

  .config(function (localStorageServiceProvider) {
    localStorageServiceProvider
      .setPrefix('myApp');
  })

  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl as main'
      })
      .otherwise({
        redirectTo: '/'
      });
  })

  .filter('pprint', function() {

    //var d = 0;

    return function pp(value) {

      if (typeof value === 'function') {
        return value.toString();
      }
      /* if (typeof value === 'undefined') {
        return 'undefined';
      }
      if (value === NaN) {
        return 'NaN';
      } */
      if (value instanceof Array) {
        return '[ '+value.map(pp).join(' ')+' ]';
      }
      if (angular.isObject(value)) {
        return value.toString();
      }

      return JSON.stringify(value);
    };

  })

  .filter('typeof', function() {

    return function(d) {
      if (d instanceof Array) {
        return 'array';
      }
      if (d instanceof F.Command) {
        return 'command';
      }
      return typeof d;
    };
  });
