angular.module('elements')
  .controller('PartNavbarCtrl', function($scope, $alert, $location, BaseUser, LoopBackAuth) {

    $scope.isAuthenticated = function () {
      return BaseUser.isAuthenticated();
    };

    $scope.logout = function () {
      BaseUser
        .logout()
        .$promise
        .then(function(res) {
          LoopBackAuth.clearUser();
          LoopBackAuth.save();
          $location.path('/')
          $alert({
            content: 'You have been logged out',
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        })
        .catch(function (err) {
          LoopBackAuth.clearUser();
          LoopBackAuth.save();
          localStorage.clear();
          $location.path('/');
        });
    };

  })
  .directive('partNavbar', function () {
    return {
      restrict: 'E',
      templateUrl: '/elements/part-navbar/part-navbar.html',
      controller: 'PartNavbarCtrl',
      replace: true
    }
  });