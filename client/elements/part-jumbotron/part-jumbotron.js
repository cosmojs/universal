angular.module('elements')
  .controller('partJumbotronCtrl', function ($scope) {

  })
  .directive('partJumbotron', function () { 
    return {
      restrict: 'E',
      templateUrl: '/elements/part-jumbotron/part-jumbotron.html',
      controller: 'partJumbotronCtrl',
      transclude: true,
      replace: true
    }
  });
