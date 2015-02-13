angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/projects/:projectId', {
      templateUrl: '/elements/page-project/page-project.html',
      controller: 'PageProjectCtrl'
    });

  })
  .controller('PageProjectCtrl', function($scope, $location, $route, Project) {

    var projectId = $route.current.params.projectId;

    $scope.project = Project.findById({
      id: projectId
    });

  });