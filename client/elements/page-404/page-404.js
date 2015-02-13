angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/404', {
      templateUrl: '/elements/page-404/page-404.html',
      controller: 'Page404Ctrl'
    });

  })
  .controller('Page404Ctrl', function ($scope) {

  });