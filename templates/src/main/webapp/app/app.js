(function () {
	'use strict';

	angular.module('app', [
		// routing
		'app.route',

		// http interceptors
		'app.error',
		'app.login',

		//common dependencies
		'app.common',
		'app.components',

		// top-level state
		'app.root'

	]);

}());
