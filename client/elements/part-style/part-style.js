angular.module('elements')
  .directive('partStyle', function ($interpolate) {
    return {
      link: function($scope, $elm, $attrs) {
        var interpolateFn = $interpolate($elm.text(), true);
        if (interpolateFn) {
          $scope.$watch(interpolateFn, function(value) {
            $elm.text(value);
          });
        }
      }
    };
  });