var floorplanApp = angular.module('floorplanApp', ['ui', 'ui.bootstrap', 'ngRoute'])
        .config(function ($routeProvider, $locationProvider) {
            'use strict';
            $locationProvider.html5Mode(true);
            $routeProvider
                .when('/', {
                    templateUrl: 'views/floorplan.html',
                    controller: 'FloorplanCtrl'
                });
        });
