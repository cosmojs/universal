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

    $routeProvider.when('/events/:eventId/edit', {
      templateUrl: '/elements/page-event-edit/page-event-edit.html',
      controller: 'PageEventEditCtrl',
      resolve: { authenticated: authenticated }
    });

  })
  .controller('PageEventEditCtrl', function($scope, $route, Event) {

    var eventId = $route.current.params.eventId;

    $scope.event = Event.findById({
      id: eventId
    });

    $scope.update = function () {
      Event.upsert($scope.event);
    };

  });