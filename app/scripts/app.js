'use strict';

var floorplanApp = angular.module('floorplanApp', ['ui', 'ui.bootstrap'])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/abc', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
	.when('/', {
			templateUrl: 'views/floorplan.html',
			controller: 'FloorplanCtrl'
		});
      /*.otherwise({
        redirectTo: '/'
      });*/
	//$locationProvider.html5Mode(true);
  }]);
