
Lights = new Mongo.Collection("lights");

Lights.upsert({ _id: 1 }, {
  sizex: 10,
  sizey: 10,
  padding: 2
})

if (Meteor.isClient) {

  Template.lightboard.onRendered(function() {
      var canvas = Template.instance().$(".lb-draw").get(0);
      var graphics = canvas.getContext("2d");

      graphics.circle = function(x, y, r, color) {
        this.fillStyle = color;
        this.beginPath();
        this.arc(x, y, r, 0, Math.PI * 2, false);
        this.closePath();
        this.fill();
      };

      // Create the initial grid properties
      var cursor = Lights.find({ _id: 1 });
      var grid = cursor.fetch()[0];
      var dotsx = grid.sizex;
      var dotsy = grid.sizey;

      var width  = graphics.canvas.width;
      var height = graphics.canvas.height;

      // Circle information
      var padding = grid.padding; // Padding between circles
      var xstep = width / dotsx;
      var ystep = height / dotsy;
      var r     = Math.min(xstep, ystep) / 2 - padding;

      var hammertime = new Hammer(canvas);
      hammertime.get('pan').set({
        direction: Hammer.DIRECTION_ALL,
        threshold: 0
      });
      hammertime.on('pan', insertDot);
      hammertime.on('tap', insertDot);

      canvas.addEventListener('touchmove', function(event) {
          event.preventDefault();
      }, false);

      function insertDot(event) {
        var bb = event.target.getBoundingClientRect();
        var x = Math.floor((event.center.x - bb.left) / xstep);
        var y = Math.floor((event.center.y - bb.top)  / ystep);
        var key = x + y * dotsx;
        var dot = {};
        var remove  = {};
        dot[key] = 'white';
        remove[key] = {};

        Lights.update({ _id: 1 }, {
          $set: dot
        });

        setTimeout(function() {
          Lights.update({ _id: 1 }, {
            $unset: remove
          });
        }, 800);
      }

      function clearDot(x, y) {
        graphics.clearRect(x, y, xstep, ystep);
      }

      function updateDot(x, y, color) {
        if (x < 0 || y < 0 || x >= width || y >= width) {
            return;
        }

        clearDot(x, y);

        if (!color) {
          return;
        }
        graphics.circle(x + xstep / 2, y + ystep / 2, r, color);
      }

      // Listen for update changes
      cursor.observeChanges({
        changed: function(id, fields) {
          for (key in fields) {
            var i = key % dotsx;
            var j = Math.floor(key / dotsx);
            updateDot(i * xstep, j * ystep, fields[key]);
          }
        }
      });
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
