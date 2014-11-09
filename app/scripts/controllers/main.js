/* global F */
/* global mocha */

/*jslint evil: true */

'use strict';

/**
 * @ngdoc function
 * @name fApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the fApp
 */
angular.module('fApp')
  .controller('MainCtrl', function ($scope, localStorageService) {

    var vm = this;

    var history = [];
    var historyPointer = -1;

    vm.starred = localStorageService.get('main.starred');
    //localStorageService.bind($scope, 'main.starred');

    $scope.$watch('main.starred', function() {
      localStorageService.set('main.starred', vm.starred);
    }, true);

    vm.input = '';
    var rpn = vm.rpn = new F();

    vm.submit = function(input) {
      event.preventDefault();
      rpn.eval(input);
      history.unshift(input);
      historyPointer = -1;
    };

    vm.keyup = function(e) {
      //console.log('keyup', e.keyCode);
      if (e.keyCode === 38) {
        historyPointer = Math.min(historyPointer + 1, history.length - 1);
        vm.input = history[historyPointer];
      } else if (e.keyCode === 40) {
        historyPointer = Math.max(historyPointer - 1, -1);
        vm.input = history[historyPointer];
      } //else if (e.keyCode === 8 && vm.input.length < 1) {
        //vm.submit('drop');
      //}
    };

    vm.keypress = function(e) {
      //console.log('keypress', e.keyCode);
      if (e.keyCode === 13 && vm.input.length < 1 && rpn.length > 0) {
        vm.submit('dup');
      }
    };

    vm.star = function(input) {
      if (!angular.isDefined(input) || input.length < 1) { return; }
      vm.starred.push(input);
    };

    vm.unstar = function(index) {
      vm.starred.splice(index,1);
    };

    vm.keys = Object.keys(vm.rpn.dict);

    mocha.run(function(failures){
      console.log('run mocha');
      $scope.$apply(function() {
        vm.state = (failures > 0) ? 2 : 0;
      });
    });

    vm.state = 0;

  });

  mocha.setup('bdd');
