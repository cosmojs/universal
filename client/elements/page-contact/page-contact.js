angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/contact', {
      templateUrl: '/elements/page-contact/page-contact.html',
      controller: 'PageContactCtrl'
    })

  })
  .controller('PageContactCtrl', function ($scope) {

  });