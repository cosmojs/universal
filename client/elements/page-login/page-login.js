angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/login', {
      templateUrl: '/elements/page-login/page-login.html',
      controller: 'PageLoginCtrl'
    })

  })
  .controller('PageLoginCtrl', function($scope, $alert, $location, $auth, BaseUser, LoopBackAuth) {

    $scope.authenticate = function (provider) {
      $auth
        .authenticate(provider)
        .then(function (response) {
          var accessToken = response.data;
          LoopBackAuth.setUser(accessToken.id, accessToken.userId, accessToken.user);
          LoopBackAuth.rememberMe = true;
          LoopBackAuth.save();
          return response.resource;
        });
    };

    $scope.login = function () {
      var credentials = {
        email: $scope.email,
        password: $scope.password
      };

      BaseUser
        .login(credentials)
        .$promise
        .then(function (res) {
          $location.path('/profile');
        });
    };

  });