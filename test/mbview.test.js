var MBView = require('../mbview');
var request = require('supertest');
var test = require('tape').test;

var server = null;

test('MBView.loadTiles', function (t) {
  t.plan(6);

  var config = {};
  var tileset = __dirname + '/../examples/baja-highways.mbtiles';

  MBView.loadTiles(tileset, config, function (err, config) {
    var source = config.sources['baja-highways.mbtiles'];
    var center = [-117.037354, 32.537551];
    t.deepEqual(config.center, center, 'sets center');
    t.equal(config.maxzoom, 14, 'sets maxzoom');
    t.equal(source.layers[0].id, 'bajahighways', 'tileset has one layer');
  });

  tileset = __dirname + '/fixtures/twolayers.mbtiles';
  MBView.loadTiles(tileset, config, function (err, config) {
    var source = config.sources['twolayers.mbtiles'];
    t.true(source, 'loads tileset');
    t.equal(source.layers[0].id, 'hospitales', 'loads first layer');
    t.equal(source.layers[1].id, 'playas', 'loads second layer');
  });
});

test('MBView.serve', function (t) {
  t.plan(7);

  var params = {
    basemap: 'dark',
    mbtiles: [
      __dirname + '/../examples/baja-highways.mbtiles',
      __dirname + '/fixtures/twolayers.mbtiles'
    ],
    port: 9000
  };

  MBView.serve(params, function (err, config) {
    t.error(err, 'should start server with no error');
    server = config.server;

    request('localhost:9000')
      .get('/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(function (err, res) {
        var match = res.text.match(/bajahighways-lines/)[0];
        t.true(match, 'loads a map with lines from first tileset');
        match = res.text.match(/hospitales-pts/)[0];
        t.true(match, 'loads points from first layer in second tileset');
        match = res.text.match(/playas-pts/)[0];
        t.true(match, 'loads points from second layer in second tileset');
        match = res.text.match(/menu-container/)[0];
        t.true(match, 'should have a menu');
      });

    request('localhost:9000')
      .get('/#14/32.5376/-117.0374')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(function (err) {
        t.error(err, 'responds to Mapbox GL JS panning');
      });

    request('localhost:9000')
      .get('/baja-highways.mbtiles/14/2864/6624.pbf')
      .expect('Content-Type', 'application/x-protobuf')
      .end(function (err) {
        t.error(err, 'serves protobufs');
      });
  });
});

test('teardown', function (t) {
  server.close();
  t.end();
});
