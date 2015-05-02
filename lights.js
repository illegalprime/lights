
Lights = new Mongo.Collection("lights");

Lights.upsert({ _id: 1 }, {
  sizex: 10,
  sizey: 10,
  padding: 2
})

if (Meteor.isClient) {

  Template.lightboard.onCreated(function() {
    this.width  = new ReactiveVar(500);
    this.height = new ReactiveVar(500);
    this.id     = new ReactiveVar(1);
  });

  Template.lightboard.helpers({
    dots: function() {
      var grid = Lights.find({ _id: Template.instance().id.get() }).fetch()[0];
      var padding = grid.padding;
      var dotsx = grid.sizex;
      var dotsy = grid.sizey;
      var xstep = Template.instance().width.get()  / dotsx;
      var ystep = Template.instance().height.get() / dotsy;
      var xbump = xstep / 2;
      var ybump = ystep / 2;
      var r = Math.min(xbump, ybump) - padding;
      var dots = [];

      for (key in grid.dots) {
        dots.push({
          x: (key % dotsx) * xstep + xbump,
          y: Math.floor(key / dotsx) * xstep + xbump,
          r: r
        });
      }

      return dots;
    },

    width: function() {
      return Template.instance().width.get();
    },

    height: function() {
      return Template.instance().height.get();
    }
  });

  Template.lightboard.onRendered(function() {
    var tmpl = this;

    function toggleDot(event) {
      var grid = Lights.find({ _id: tmpl.id.get() }).fetch()[0];
      var dotsx = grid.sizex;
      var dotsy = grid.sizey;
      var xstep = tmpl.width.get()  / dotsx;
      var ystep = tmpl.height.get() / dotsy;

      var bb = event.target.getBoundingClientRect();
      var x = Math.floor((event.center.x - bb.left) / xstep);
      var y = Math.floor((event.center.y - bb.top)  / ystep);

      var key = x + y * dotsx;
      var dot = {};
      dot['dots.' + key] = true;

      if (tmpl.lastkey != key) {
        Lights.update({ _id: tmpl.id.get() },
          grid.dots && grid.dots[key] ? { $unset: dot } : { $set: dot }
        );
      }

      tmpl.lastkey = key;
    }

    var hammertime = new Hammer(this.$('.lb-overlay')[0]);
    hammertime.get('pan').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 0
    });
    hammertime.on('pan', toggleDot);
    hammertime.on('tap', toggleDot);

    this.$('.lb-overlay')[0].addEventListener('touchmove', function(event) {
        event.preventDefault();
    }, false);

    function resizeToFit() {
      var bb = tmpl.$('.lb-overlay').offset();
      var width = Math.min($(this).width() - bb.left, $(this).height() - bb.top) - bb.left;
      console.log(width);
      tmpl.width.set(width);
      tmpl.height.set(width);
    }

    $(window).resize(resizeToFit);
    resizeToFit.bind(window)();
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
