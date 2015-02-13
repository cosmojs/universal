angular.module('elements')
  .config(function ($routeProvider) {

    function resolveProfile ($q, $location, $route, BaseUser) {
      var deferred = $q.defer();

      BaseUser
        .getCurrent()
        .$promise
        .then(function (user) {
          var username = user.username || user.id;
          $location.path('/@' + username);
        })
        .catch(function () {
          $location.path('/login');
        });

      return deferred.promise;
    }

    function resolveUser ($q, $location, $route, BaseUser) {
      var username = $route.current.params.username;
      var deferred = $q.defer();

      BaseUser
        .findOne({ filter: { where: { or: [{ username: username }, { id: username }] } } })
        .$promise
        .then(function (user) {

          BaseUser
            .getCurrent()
            .$promise
            .then(function (current) {
              deferred.resolve({
                requested: user,
                current: current
              });
            })
            .catch(function () {
              deferred.resolve({
                requested: user,
                current: current
              })
            })
        })
        .catch(function () {
          $location.path('/404');
        });

      return deferred.promise;
    }

    $routeProvider
      .when('/profile', {
        templateUrl: '/elements/page-profile/page-profile.html',
        controller: 'PageProfileCtrl',
        resolve: { users: resolveProfile }
      })
      .when('/@:username', {
        templateUrl: '/elements/page-profile/page-profile.html',
        controller: 'PageProfileCtrl',
        resolve: { users: resolveUser }
      });

  })
  .controller('PageProfileCtrl', function($scope, $route, $http, BaseUser, Project, Follower) {

    var users = $route.current.locals.users;
    var requested = users.requested;
    var current = users.current;
    var isCurrentUser = requested.id === current.id;

    $scope.user = requested;
    $scope.isCurrentUser = isCurrentUser;

    $scope.projects = Project.find({ filter: { where: { ownerId: $scope.user.id } } });

    // $scope.followers = Follower.find({ filter: { where: { followingId: $scope.user.id } } });
    // $scope.following = Follower.find({ filter: { where: { followerId: $scope.user.id } } });
  })
  .filter('preview', function () {

    return function (value) {
      return value && value.substring(0, 50) + '...';
    };

  });