angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/explore', {
      templateUrl: '/elements/page-explore/page-explore.html',
      controller: 'PageExploreCtrl'
    })

  })
  .controller('PageExploreCtrl', function($scope) {

  });