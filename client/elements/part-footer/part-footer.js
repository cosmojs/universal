angular.module('elements')
  .controller('partFooterCtrl', function ($scope) {

  })
  .directive('partFooter', function () { 
    return {
      restrict: 'E',
      templateUrl: '/elements/part-footer/part-footer.html',
      controller: 'partFooterCtrl',
      replace: true
    }
  });