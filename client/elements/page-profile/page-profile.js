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
  .controller('PageProfileCtrl', function($scope, $route, $http, BaseUser) {

    var users = $route.current.locals.users;

    $scope.user = users.requested;
    $scope.current = users.current;
    $scope.isCurrentUser = users.requested.id === users.current.id;

  })
  .controller('PartProfileProjectsCtrl', function ($scope, Project) {

    $scope.projects = Project.find({ filter: { where: { ownerId: $scope.user.id } } });

  })
  .controller('FollowersCtrl', function ($scope, Follower) {

    $scope.getFollowers = function () {
      Follower
        .find({ filter: { where: { followingId: $scope.user.id } } })
        .$promise
        .then(function (users) {
          $scope.followers = users;
        });
    };

    $scope.getFollowers();
  })
  .controller('FollowingCtrl', function ($scope, Follower) {

    Follower
      .find({ filter: { where: { followerId: $scope.user.id } } })
      .$promise
      .then(function (users) {
        $scope.following = users
      });

  })
  .controller('FollowCtrl', function ($scope, Follower) {

    $scope.connection = null;

    $scope.getConnection = function () {
      Follower.find({ filter: { where: { followingId: $scope.user.id, followerId: $scope.current.id } } })
        .$promise
        .then(function (connections) {
          $scope.connection = connections[0];
        })
        .catch(function () {
          $scope.connection = null;
        });
    };

    $scope.canFollow = function () {
      return !$scope.isCurrentUser && !$scope.connection;
    };

    $scope.canUnfollow = function () {
      return $scope.connection;
    }

    $scope.follow = function () {
      Follower.create({
        followingId: $scope.user.id,
        followerId: $scope.current.id,
        created_at: Date.now()
      })
      .$promise
      .then(function () {
        $scope.getConnection();
        $scope.getFollowers();
      });
    };

    $scope.unfollow = function () {
      Follower
        .deleteById({ id: $scope.connection.id })
        .$promise
        .then(function () {
          $scope.connection = null;
          $scope.getFollowers();
        });
    };

    $scope.getConnection();

  })
  .filter('preview', function () {

    return function (value) {
      return value && value.substring(0, 50) + '...';
    };

  });