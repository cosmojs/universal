angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/dashboard', {
      templateUrl: '/elements/page-dashboard/page-dashboard.html',
      controller: 'PageDashboardCtrl'
    })

  })
  .controller('PageDashboardCtrl', function($scope) {

  });