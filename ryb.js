// from https://github.com/afriggeri/RYB
var ColorLibrary = (function() {
  var Points, RYB, display, generateColors, numberColors,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  RYB = {
    white: [1, 1, 1],
    red: [1, 0, 0],
    yellow: [1, 1, 0],
    blue: [0.163, 0.373, 0.6],
    violet: [0.5, 0, 0.5],
    green: [0, 0.66, 0.2],
    orange: [1, 0.5, 0],
    black: [0.2, 0.094, 0.0],
    rgb: function(r, y, b) {
      var i, _i, _results;
      _results = [];
      for (i = _i = 0; _i <= 2; i = ++_i) {
        _results.push(RYB.white[i] * (1 - r) * (1 - b) * (1 - y) + RYB.red[i] * r * (1 - b) * (1 - y) + RYB.blue[i] * (1 - r) * b * (1 - y) + RYB.violet[i] * r * b * (1 - y) + RYB.yellow[i] * (1 - r) * (1 - b) * y + RYB.orange[i] * r * (1 - b) * y + RYB.green[i] * (1 - r) * b * y + RYB.black[i] * r * b * y);
      }
      return _results;
    }
  };

  Points = (function(_super) {

    __extends(Points, _super);

    Points.name = 'Points';

    function Points(number) {
      var base, n, _i, _ref;
      base = Math.ceil(Math.pow(number, 1 / 3));
      for (n = _i = 0, _ref = Math.pow(base, 3); 0 <= _ref ? _i < _ref : _i > _ref; n = 0 <= _ref ? ++_i : --_i) {
        this.push([Math.floor(n / (base * base)) / (base - 1), Math.floor(n / base % base) / (base - 1), Math.floor(n % base) / (base - 1)]);
      }
      this.picked = null;
      this.plength = 0;
    }

    Points.prototype.distance = function(p1) {
      var _this = this;
      return [0, 1, 2].map(function(i) {
        return Math.pow(p1[i] - _this.picked[i], 2);
      }).reduce(function(a, b) {
        return a + b;
      });
    };

    Points.prototype.pick = function() {
      var index, pick, _, _ref,
        _this = this;
      if (this.picked == null) {
        pick = this.picked = this.shift();
        this.plength = 1;
      } else {
        _ref = this.reduce(function(_arg, p2, i2) {
          var d1, d2, i1;
          i1 = _arg[0], d1 = _arg[1];
          d2 = _this.distance(p2);
          if (d1 < d2) {
            return [i2, d2];
          } else {
            return [i1, d1];
          }
        }, [0, this.distance(this[0])]), index = _ref[0], _ = _ref[1];
        pick = this.splice(index, 1)[0];
        this.picked = [0, 1, 2].map(function(i) {
          return (_this.plength * _this.picked[i] + pick[i]) / (_this.plength + 1);
        });
        this.plength++;
      }
      return pick;
    };

    return Points;
  })(Array);

  return {
    Points: Points,
    RYB: RYB,
  };
})();

function ColorGenerator(ncolors) {
  this.points = new ColorLibrary.Points(ncolors + 1);
  this.ncolors = ncolors + 1;
  this.index = 0;

  // Skip white.
  this.next();
}

ColorGenerator.prototype.next = function () {
  if (this.index >= this.ncolors)
    return null;

  var p = this.points.pick(this.index);
  var color = ColorLibrary.RYB.rgb(p[0], p[1], p[2]);

  this.index++;
  return [Math.floor(255 * color[0]), Math.floor(255 * color[1]), Math.floor(255 * color[2])];
}
