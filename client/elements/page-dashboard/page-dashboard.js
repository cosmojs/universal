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

    $routeProvider.when('/dashboard', {
      templateUrl: '/elements/page-dashboard/page-dashboard.html',
      controller: 'PageDashboardCtrl',
      resolve: { authenticated: authenticated }
    });

  })
  .controller('PageDashboardCtrl', function($scope, $location, BaseUser, Project, Event) {

    $scope.user = BaseUser.getCurrent();

    $scope.projects = Project.find({ filter: { where: { ownerId: $scope.user.id } } });

    $scope.events = Event.find({ filter: { where: { ownerId: $scope.user.id } } });

    $scope.createProject = function () {
      Project.create({
        ownerId: $scope.user.id,
        created_at: Date.now()
      })
      .$promise
      .then(function (project) {
        $location.path('/projects/' + project.id + '/edit');
      })
    };

    $scope.createEvent = function () {
      Event.create({
        ownerId: $scope.user.id,
        created_at: Date.now(),
        title: 'event'
      })
      .$promise
      .then(function (event) {
        $location.path('/events/' + event.id + '/edit')
      })
    };

  })
  .filter('preview', function () {

    return function (value) {
      return value && value.substring(0, 100) + '...';
    };

  });