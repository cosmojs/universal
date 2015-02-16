angular.module('elements')
  .config(function ($routeProvider) {

    $routeProvider.when('/events/:eventId', {
      templateUrl: '/elements/page-event/page-event.html',
      controller: 'PageEventCtrl'
    });

  })
  .controller('PageEventCtrl', function($scope, $location, $route, Event) {

    var eventId = $route.current.params.eventId;

    $scope.event = Event.findById({
      id: eventId
    });

  });