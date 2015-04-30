
Lights = new Mongo.Collection("lights");

Lights.upsert({ _id: 1 }, {
  sizex: 10,
  sizey: 10,
  padding: 2
})

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });

  Template.lightboard.helpers({
      board: function() {
          // TODO: Multiple boards?
          return "not-implemented";
      }
  });

  Template.lightboard.events({
    'mousemove .lb-draw': function(event) {
      if (event.which == 1) {
        var xstep = Template.instance().xstep;
        var ystep = Template.instance().ystep;
        var dotsx = Template.instance().dotsx;

        var bb = event.target.getBoundingClientRect();
        var x = Math.floor((event.clientX - bb.left) / xstep);
        var y = Math.floor((event.clientY - bb.top)  / ystep);
        var dot = {};
        dot[x + y * dotsx] = 'white';

        Lights.update({ _id: 1 }, {
          $set: dot
        });
      }
    },
  });

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

      // TODO: Make reactive
      // Set vars for the event handling
      Template.instance().dotsx = dotsx;
      Template.instance().dotsy = dotsy;
      Template.instance().xstep = xstep;
      Template.instance().ystep = ystep;

      // Draw the grid!
      // for (var x = xstep / 2, i = 0; x < width; x += xstep, ++i) {
      //     for (var y = ystep / 2, j = 0; y < height; y += ystep, ++j) {
      //       color = grid[i + j * dotsx] || 'green';
      //       graphics.circle(x, y, r, color);
      //     }
      // }

      clearDot = function(x, y) {
        graphics.clearRect(x, y, xstep, ystep);
      }

      updateDot = function(x, y, color) {
        clearDot(x, y);

        if (!color) {
          return;
        }
        graphics.circle(x + xstep / 2, y + ystep / 2, r, color);

        setTimeout(function() {
          var position = Math.floor(x / xstep) + Math.floor(y / ystep) * dotsx;
          var dot = {};
          dot[position] = 0;

          Lights.update({ _id: 1 }, {
            $set: dot
          });
        }, 1000);
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
      })
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
