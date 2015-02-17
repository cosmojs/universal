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
  .controller('PageEventEditCtrl', function($scope, $route, $alert, Event) {

    var eventId = $route.current.params.eventId;

    Event
      .findById({ id: eventId })
      .$promise
      .then(function (event) {
        event.startDate && (event.startDate = new Date(event.startDate));
        event.endDate && (event.endDate = new Date(event.endDate));
        $scope.event = event;
      });

    $scope.update = function () {
      Event
        .upsert($scope.event)
        .$promise
        .then(function () {
          $alert({
            content: 'Event has been updated',
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        })
    };

  });