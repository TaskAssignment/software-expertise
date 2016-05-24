'use strict';

// The Package is passed automatically as first parameter
module.exports = function(Theme, app, database) {
  app.get('/theme/example/render', function(req, res, next) {
    Theme.render('index', {
      package: 'theme'
    }, function(err, html) {
      //Rendering a view from the Package server/views
      res.send(html);
    });
  });
};
