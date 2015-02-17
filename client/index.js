angular.module('universal', [
    'ngResource', 
    'ngMessages', 
    'ngRoute', 
    'mgcrea.ngStrap', 
    'elements',
    'satellizer',
    'lbServices',
    'ngAutocomplete'
  ])
  .config(function ($locationProvider, $routeProvider) {

    $locationProvider
      .html5Mode({
        enabled: true,
        requireBase: false
      });

    $routeProvider
      .when('/', {
        templateUrl: '/elements/page-home/page-home.html',
        controller: 'PageHomeCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });

  })
  .config(['satellizer.config', '$authProvider', function (config, $authProvider) {

    config.authHeader = 'Satellizer';
    config.httpInterceptor = false;

    $authProvider.facebook({
      clientId: '652372928198212'
    });

    $authProvider.google({
      clientId: '989154659952-r3lfvshi4s0fcbesie408bm5iip1occg.apps.googleusercontent.com'
    });

  }]);