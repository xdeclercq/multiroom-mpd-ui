angular.module('multiroom.zones', ['ui.router', 'multiroom.zones.new'])
.config(['$stateProvider', function($stateProvider) {
  $stateProvider.state('zones', {
    url: '/zones',
    templateUrl: 'app/zones/zones.tpl.html',
    controller: 'ZonesCtrl',
    onExit: function() {
      console.log('on exit');
    }
  });
}])


.factory('Zones', ['$rootScope', '$log', function($rootScope, $log) {
  var zones;
  var players = {};

  var getAll = function() {
    if (zones !== undefined) {
      return zones;
    }
    return $rootScope.apiRoot.then(function(root) {
      return root.$get('mr:zones');
    }).then(function(zones) {
      if (zones.$has('mr:zone')) {
        return zones.$get('mr:zone');
      }
      return [];
    }).then(function(zones) {
      if (zones.constructor !== Array) {
        return [zones];
      }
      return zones;
    });
  };

  var getZoneByName = function(zoneName) {
    return getAll().then(function(theZones) {
      var theZone;
      theZones.forEach(function(zone) {
        if (zone.name === zoneName) {
          theZone = zone;
        }
      });
      return theZone;
    });
  };

  // var getPlaylist = function(zoneName) {
  //   return getZoneByName(zoneName).then(function(zone) {
  //     return zone.$get('playlist').then(function (playlists) {
  //       return playlists[0].$get('song').then(function (songs) {
  //         return { zone: zone, songs: songs };
  //       });
  //     });
  //   });
  // };

  var getPlayer = function(zoneName) {

    if (players[zoneName] !== undefined) {
      return players[zoneName];
    }

    var playerPromise;

    var refresh = function() {
      playerPromise = getZoneByName(zoneName).then(function(zone) {
        return zone.$get('mr:player');
      }).then(function(player) {
        return player;
      });
    };

    var ws = new WebSocket('ws://localhost:8080/multiroom-mpd/ws/zones/' + zoneName + '/player/status');

    ws.onopen = function(response) {
      $log.info('Atmosphere connected using ' + response.transport);
    };

    var onUpdateStatus;

    ws.onmessage = function (message) {
      try {
        var newStatus = JSON.parse(message.data).status;
        onUpdateStatus(newStatus);
        $log.debug('[' + zoneName + '] new status: ' + newStatus);
      } catch (e) {
        $log.error('Error: ' + message.data);
        return;
      }

    };

    ws.onerror = function(response) {
      $log.error('Error: ' + response);
    };

    refresh();

    players[zoneName] = {
      play: function(newPosition) {
        playerPromise.then(function(player) {
          if (newPosition !== undefined) {
            player.$post('mr:play', {position: newPosition});
          }
          else {
            player.$post('mr:play');
          }
        });
      },

      pause: function() {
        playerPromise.then(function(player) {
          player.$post('mr:pause');
        });
      },

      stop: function() {
        playerPromise.then(function(player) {
          player.$post('mr:stop');
        });
      },

      // prev: function() {
      //   playerPromise.then(function(player) {
      //     player.$post('mr:prev');
      //   });
      // },

      // next: function() {
      //   playerPromise.then(function(player) {
      //     player.$post('mr:next');
      //   });
      // },

      // volume: function(newVolume) {
      //   playerPromise.then(function(player) {
      //     player.$post('mr:volume', {volume: newVolume});
      //   });
      // },

      status: function(callback) {
        onUpdateStatus = callback;
      }
    };

    return players[zoneName];
  };

  return {  
    getAll: getAll,
    // getPlaylist: getPlaylist,
    getPlayer: getPlayer
  };
}])

.controller('ZonesCtrl', ['$scope', '$state', 'Zones', '$log', function($scope, $state, Zones, $log) {

  $scope.zones = [];

  $scope.playerStatuses = {};
  
  Zones.getAll().then(function(zones) {
    if (zones.length === 0) {
      $state.go('zones.new');
      return;
    }
    zones.forEach(function(zone) {
      Zones.getPlayer(zone.name).status(function(newStatus) {
        $scope.playerStatuses[zone.name] = newStatus;
        $scope.$apply();
      });
    });
    $scope.zones = zones;

  });

  $scope.$on('zone-created', function(e, data) {
    $scope.apiRoot.then(function(root) {
      var port = 6600 + $scope.zones.length;
      return root.$post('mr:zones', {},{ name: data.name, mpdInstancePort: port });
    }).then(function(zone) {
      $scope.zones.push(zone);
    });
  });

  $scope.resizeZone = function(w, h) {
    $scope.zoneClass = h > w ? 'zone-horizontal' : 'zone-vertical';
  };

  $scope.play = function(zone) {
    Zones.getPlayer(zone.name).play();
  };

  $scope.pause = function(zone) {
    Zones.getPlayer(zone.name).pause();
  };

  $scope.stop = function(zone) {
    Zones.getPlayer(zone.name).stop();
  };

  $scope.status = function(zone) {
    return Zones.getPlayer(zone.name).status();
  };

}])
;