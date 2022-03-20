var Coordinates = function (c) {
  if (!(this instanceof Coordinates)) return new Coordinates(c);
  this.latitude = c.latitude;
  this.longitude = c.longitude;
  this.accuracy = c.accuracy;
  this.distance = function (c) {
    var C = Math.PI / 180,
      dlat = this.latitude - c.latitude,
      dlon = this.longitude - c.longitude,
      a =
        Math.pow(Math.sin((C * dlat) / 2), 2) +
        Math.cos(C * this.latitude) *
          Math.cos(C * c.latitude) *
          Math.pow(Math.sin((C * dlon) / 2), 2);
    return 12756274 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  this.distanceAccuracy = function (c) {
    return this.accuracy + c.accurracy;
  };
};

var Position = function (l) {
  if (!(this instanceof Position)) return new Position(l);
  this.timestamp = l.timestamp;
  this.coords = new Coordinates(l.coords);
  this.distance = function (p) {
    return this.coords.distance(p.coords);
  };
  this.distanceAccuracy = function (p) {
    return this.coords.distanceAccuracy(p.coords);
  };
  this.speed = function (p) {
    return this.distance(p) / Math.abs(this.timestamp - p.timestamp);
  };
  this.positionTowardAtTimestamp = function (p, timestamp) {
    var $t = this,
      $tc = $t.coords,
      pc = p.coords,
      r = (timestamp - $t.timestamp) / (p.timestamp - $t.timestamp),
      r_ = 1 - r;
    return new Position({
      timestamp: timestamp,
      coords: {
        latitude: pc.latitude * r + r_ * $tc.latitude,
        longitude: pc.longitude * r + r_ * $tc.longitude,
        accuracy: pc.accuracy * r + r_ * $tc.accuracy,
      },
    });
  };
};

var PositionArchive = function () {
  if (!(this instanceof PositionArchive)) return new PositionArchive();
  var positions = [],
    _locationOf = function (element, start, end) {
      start = typeof start !== "undefined" ? start : 0;
      end = typeof end !== "undefined" ? end : positions.length - 1;
      var pivot = Math.floor(start + (end - start) / 2);
      if (end - start < 0) {
        return start;
      }
      if (positions[start].timestamp >= element.timestamp) {
        return start;
      }
      if (positions[end].timestamp <= element.timestamp) {
        return end + 1;
      }
      if (positions[pivot].timestamp === element.timestamp) {
        return pivot;
      }
      if (end - start <= 1) {
        return start + 1;
      }
      if (element.timestamp > positions[pivot].timestamp) {
        return _locationOf(element, pivot, end);
      } else {
        return _locationOf(element, start, pivot - 1);
      }
    };
  this.add = function (pos) {
    if (pos.timestamp === null) {
      return;
    }
    var index = _locationOf(pos);
    if (
      positions.length > 0 &&
      index < positions.length &&
      positions[index].timestamp === pos.timestamp
    ) {
      positions[index] = pos;
    } else if (
      positions.length > 0 &&
      index >= positions.length &&
      positions[positions.length - 1].timestamp === pos.timestamp
    ) {
      positions[positions.length - 1] = pos;
    } else {
      positions.splice(index, 0, pos);
    }
    return this;
  };
  this.eraseInterval = function (start, end) {
    var index_s = _locationOf({ timestamp: start }),
      index_e = _locationOf({ timestamp: end });
    while (index_s > 0 && positions[index_s - 1].timestamp >= start) {
      index_s--;
    }
    while (
      index_e < positions.length - 1 &&
      positions[index_e].timestamp <= end
    ) {
      index_e++;
    }
    positions.splice(index_s, index_e - index_s + 1);
    return this;
  };
  this.getByIndex = function (i) {
    return positions[i];
  };
  this.getPositionsCount = function () {
    return positions.length;
  };
  this.getArray = function () {
    return positions;
  };
  this.getByTime = function (t) {
    var index = _locationOf({ timestamp: t });
    if (index === 0) {
      return positions[0];
    }
    if (index > positions.length - 1) {
      return positions[positions.length - 1];
    }
    if (positions[index].timestamp === t) {
      return positions[index];
    } else {
      return positions[index - 1].positionTowardAtTimestamp(
        positions[index],
        t
      );
    }
  };
  this.extractInterval = function (t1, t2) {
    var index = _locationOf({ timestamp: t1 }),
      i1,
      i2,
      result = new PositionArchive();
    if (index === 0) {
      i1 = 0;
    } else if (index > positions.length - 1) {
      i1 = positions.length - 1;
    } else if (positions[index].timestamp === t1) {
      i1 = index;
    } else {
      result.add(
        positions[index - 1].positionTowardAtTimestamp(positions[index], t1)
      );
      i1 = index;
    }
    index = _locationOf({ timestamp: t2 });
    if (index === 0) {
      i2 = 0;
    } else if (index > positions.length - 1) {
      i2 = positions.length - 1;
    } else if (positions[index].timestamp === t2) {
      i2 = index;
    } else {
      result.add(
        positions[index - 1].positionTowardAtTimestamp(positions[index], t2)
      );
      i2 = index - 1;
    }
    for (var i = i1; i <= i2; i++) {
      result.add(positions[i]);
    }
    return result;
  };
  this.hasPointInInterval = function (t1, t2) {
    var i1 = _locationOf({ timestamp: t1 }),
      i2 = _locationOf({ timestamp: t2 });
    return i1 !== i2;
  };
  this.getDuration = function () {
    if (positions.length <= 1) {
      return 0;
    } else {
      return positions[positions.length - 1].timestamp - positions[0].timestamp;
    }
  };
  this.getAge = function (now) {
    now = now === null ? +new Date() : now;
    if (positions.length === 0) {
      return 0;
    } else {
      return now - positions[0].timestamp;
    }
  };
};

exports.Coordinates = Coordinates;
exports.Position = Position;
exports.PositionArchive = PositionArchive;
