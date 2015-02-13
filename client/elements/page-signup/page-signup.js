angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/signup', {
      templateUrl: '/elements/page-signup/page-signup.html',
      controller: 'PageSignupCtrl'
    })

  })
  .controller('PageSignupCtrl', function($scope, $auth, $location, BaseUser, LoopBackAuth) {

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

    $scope.signup = function () {
      var credentials = {
        email: $scope.email,
        password: $scope.password
      };

      BaseUser
        .create(credentials)
        .$promise
        .then(function (res) {
          $location.path('/profile');
        });
    };
    
  });