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

    $routeProvider.when('/projects/:projectId/edit', {
      templateUrl: '/elements/page-project-edit/page-project-edit.html',
      controller: 'PageProjectEditCtrl',
      resolve: { authenticated: authenticated }
    });

  })
  .controller('PageProjectEditCtrl', function($scope, $route, Project) {

    var projectId = $route.current.params.projectId;

    $scope.project = Project.findById({
      id: projectId
    });

    $scope.updateProject = function () {
      Project.upsert($scope.project);
    };

  });