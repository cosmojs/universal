angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/about', {
      templateUrl: '/elements/page-about/page-about.html',
      controller: 'PageAboutCtrl'
    })

  })
  .controller('PageAboutCtrl', function ($scope) {

  });
