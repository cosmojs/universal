var bodyParser = require('body-parser');
var boot = require('loopback-boot');
var loopback = require('loopback');
var path = require('path');
var satellizer = require('./satellizer');

var app = module.exports = loopback();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

boot(app, __dirname);

var indexpath = path.resolve(__dirname, '../client/index.html');
app.use(loopback.static(path.resolve(__dirname, '../client')));

app.get('/auth/me', function (req, res) {
  res.send(req.params.token);
});

satellizer(app);

app.get('*', function (req, res) {
  res.sendFile(indexpath);
});

app.start = function() {
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

if (require.main === module) {
  app.start();
}
