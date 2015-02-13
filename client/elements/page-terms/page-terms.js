angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/terms', {
      templateUrl: '/elements/page-terms/page-terms.html',
      controller: 'PageTermsCtrl'
    })

  })
  .controller('PageTermsCtrl', function ($scope) {

  });