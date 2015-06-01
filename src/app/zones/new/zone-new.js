angular.module('multiroom.zones.new', ['ui.router'])
.config(['$stateProvider', function($stateProvider) {
  $stateProvider.state('zones.new', {
    url: '/new',
    controller: 'NewZoneCtrl'
  });
}])

.controller('NewZoneCtrl', ['$scope', '$modal', '$state', function($scope, $modal, $state) {
  var modalInstance = $modal.open({
    templateUrl: 'app/zones/new/zone-edit.tpl.html',
    controller: 'EditZoneCtrl',
    windowClass: 'small'
  });
  
  modalInstance.result.then(function(zoneName) {
    $scope.$emit('zone-created', {name: zoneName});
    $state.go('zones');
  }, function() {
    $state.go('zones');
  });
}])

.controller('EditZoneCtrl', ['$scope', '$modalInstance', function($scope, $modalInstance) {
  $scope.ok = function(zoneName) {
    $modalInstance.close(zoneName);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };
}])
;