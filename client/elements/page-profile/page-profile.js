angular.module('elements')
  .config(function ($routeProvider) {

    function authenticated ($q, $location, BaseUser) {
      var deferred = $q.defer();
      var isAuthenticated = BaseUser.getCurrentId();
      if (!isAuthenticated) {
        $location.path('/login');
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    }

    $routeProvider.when('/profile', {
      templateUrl: '/elements/page-profile/page-profile.html',
      controller: 'PageProfileCtrl',
      resolve: { authenticated: authenticated }
    });

  })
  .controller('PageProfileCtrl', function($scope, $http, BaseUser, Project) {

    $scope.user = BaseUser.getCurrent();

    $scope.projects = Project.find({
      ownerId: $scope.user.id
    });

  })
  .filter('preview', function () {

    return function (value) {
      return value && value.substring(0, 50) + '...';
    };

  });