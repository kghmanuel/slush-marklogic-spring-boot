/* global MLSearchController */
(function () {
  'use strict';

  angular.module('app.search')
		.config(["MLRestProvider", function (MLRestProvider) {
			// Make MLRestProvider target url start with the page's base href (proxy)
			MLRestProvider.setPrefix(angular.element(document.querySelector('base')).attr('href')+'v1');
		}])
    .controller('SearchCtrl', SearchCtrl);

  SearchCtrl.$inject = ['$scope', '$location', 'MLSearchFactory'];

  // inherit from MLSearchController
  var superCtrl = MLSearchController.prototype;
  SearchCtrl.prototype = Object.create(superCtrl);

  function SearchCtrl($scope, $location, searchFactory) {
    var ctrl = this;

    superCtrl.constructor.call(ctrl, $scope, $location, searchFactory.newContext());

    ctrl.init();

    ctrl.setSnippet = function(type) {
      ctrl.mlSearch.setSnippet(type);
      ctrl.search();
    };
  }
}());
