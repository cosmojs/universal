angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/policy', {
      templateUrl: '/elements/page-policy/page-policy.html',
      controller: 'PagePolicyCtrl'
    })

  })
  .controller('PagePolicyCtrl', function ($scope) {
  
  });
