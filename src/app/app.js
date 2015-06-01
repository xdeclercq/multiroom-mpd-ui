angular.module('multiroom', ['multiroom.zones', 'ui.router', 'mm.foundation', 'angular-hal'])
.config(['$urlRouterProvider', function($urlRouterProvider) {
  $urlRouterProvider.otherwise('/zones');
}])

.run(['$rootScope', 'halClient', function($rootScope, halClient) {
  $rootScope.apiRoot = halClient.$get('multiroom-mpd/api/');

  // $rootScope.websockets = [];

  // $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) { 
  //   console.log('state change start: ' + $rootScope.websockets.length);
  //   $rootScope.websockets.forEach(function(websocket) {
  //     websocket.close();
  //   });
  // });
}])

.directive('onResize', ['$window', '$document', function($window, $document) {
  function link(scope, element, attrs) {
    function onResize() {
      var w = Math.max(document.documentElement.clientWidth, $window.innerWidth || 0);
      var h = Math.max(document.documentElement.clientHeight, $window.innerHeight || 0);
      scope.onResize({w: w, h: h});
    }
    onResize();
    return angular.element($window).bind('resize', function() {
      onResize();
      return scope.$apply();
    });
  }

  return {
    link: link,
    scope: {
      onResize: '&'
    }
  };
}])
;