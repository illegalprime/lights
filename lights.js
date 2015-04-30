
Lights = new Mongo.Collection("lights");

Lights.upsert({ _id: 1 }, {
  sizex: 10,
  sizey: 10,
  padding: 2
})

if (Meteor.isClient) {

  Template.lightboard.helpers({
      dots: function() {
        var svgDom = document.createElement('svg');
        var svg = d3.select(svgDom);
        // TODO: To be generalized later
        var width = 300;
        var height = 300;
        svgDom.setAttribute('width',  width);
        svgDom.setAttribute('height', height);
        svgDom.className = 'dotmatrix';

        grid = Lights.find({ _id: 1 }).fetch()[0];

        // Crunch the numbers
        var dotsx = grid.sizex;
        var dotsy = grid.sizey;
        var padding = grid.padding; // Padding between circles
        var xstep = width / dotsx;
        var ystep = height / dotsy;
        var dots = [];

        if (grid.dots) {
          for (coor in grid.dots) {
            dots.push({
              x: (coor % dotsx ) * xstep + (xstep / 2),
              y: Math.floor(coor / dotsx) * ystep + (ystep / 2),
              color: grid.dots[coor]
            });
          }
        }

        var circle = svg.selectAll('circle').data(dots);
        var circles = circle.enter().append('circle');

        circles.attr('cx', function(d) { return d.x; });
        circles.attr('cy', function(d) { return d.y; });
        circles.style('fill', function(d) { return d.color });
        circles.attr('r', Math.min(xstep, ystep) / 2 - padding);
        return svgDom.outerHTML;
      }
  });

  Template.lightboard.events({
    'mousedown .dotmatrix': function(event) {
      // event.preventDefault();
    },
    'mousemove .dotmatrix': function(event) {

    }
  })


  Template.lightboard.onRendered(function() {

    var hammertime = new Hammer($('canvas').get(0))
    hammertime.get('pan').set({
        direction: Hammer.DIRECTION_ALL
    });
    hammertime.on('pan', function(event) {
        graphics = $('canvas').get(0).getContext("2d");
        var off = $('canvas').offset();
        var x = event.center.x - off.left;
        var y = event.center.y - off.top;
        graphics.fillRect(x, y, 10, 10);
    });

    var hammertime = new Hammer(this.$('.dotmatrix').get(0));
    hammertime.get('pan').set({
      direction: Hammer.DIRECTION_ALL
    });

    hammertime.on('pan', function(event) {
      event.preventDefault();
      console.log("event");
      // TODO: do not calculate every time
      var bb = $('.dotmatrix').offset();
      var x = event.center.x - bb.left;
      var y = event.center.y - bb.top;

      if (x >= 0 && y >= 0) {
        setTimeout(function() {
          drawLight(x, y);
        }, 0);
      }
    });
  });

  var drawLight = function(x, y) {
    // TODO: Generalize
    var xstep = 30;
    var ystep = 30;
    var dotsx = 10;

    x = Math.floor(x / xstep);
    y = Math.floor(y / ystep);
    var dot = {};
    var remove = {};

    var key = 'dots.' + (x + y * dotsx);
    dot[key] = 'white';
    remove[key] = {};

    Lights.update({ _id: 1 }, {
      $set: dot
    });

    setTimeout(function() {
      Lights.update({ _id: 1 }, {
        $set: remove
      });
    }, 800);
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
