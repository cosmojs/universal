var bodyParser = require('body-parser');
var boot = require('loopback-boot');
var loopback = require('loopback');
var path = require('path');
var satellizer = require('loopback-satellizer');
var config = require('./config');

var app = module.exports = loopback();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

boot(app, __dirname);

app.use(loopback.static(path.resolve(__dirname, '../client')));

satellizer(app, config);

var indexPath = path.resolve(__dirname, '../client/index.html');
app.get('*', function (req, res) { res.sendFile(indexPath); });

app.start = function() {
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

if (require.main === module) {
  app.start();
}
