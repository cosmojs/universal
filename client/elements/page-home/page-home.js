angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/home', {
      templateUrl: '/elements/page-home/page-home.html',
      controller: 'PageHomeCtrl'
    })

  })
  .controller('PageHomeCtrl', function($scope, $alert, $auth) {

    $scope.fullscreen = true;

    $scope.login = function() {
      $auth.login({ email: $scope.email, password: $scope.password })
        .then(function() {
          $alert({
            content: 'You have successfully logged in',
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        })
        .catch(function(response) {
          $alert({
            content: response.data.message,
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        });
    };
  });