var express = require('express');
var mongodb = require('mongodb');

run = function(client) {
  var app = express();

  app.engine('.ejs', require('ejs').__express);
  
  //app.register( '.ejs', require('ejs') );
  app.use( express.static(__dirname + '/public') );
  app.use( express.bodyParser() );
  app.use( express.cookieParser() );
  app.use( app.router );

  app.use(function(err, req, res, next){
    res.render('error.ejs', { err: err });
  });
  
  var data = new mongodb.Collection(client, 'data');

  app.get('/',function(req,res){
      res.header('Cache-Control','private');
      res.render('index.ejs');
  });

  app.post('/',function(req,res){
    var to_insert = { name: req.body.name, status: req.body.status, user_id: req.body.user_id};
    data.insert( to_insert, { safe: true }, function(err,objects) {
      if ( err ) { throw new Error(err); }
      res.redirect("/");
    });
  });

  app.get('/list',function(req,res){
    data.find( {}, {} ).sort({_id:-1}).limit(20).toArray( function(err,docs) {
      if ( err ) { throw new Error(err); }
      res.header('Cache-Control','private');
      res.render( 'list.ejs', { data: docs } );
    });
  });

  var port = 80;
  app.listen(port);
  console.log('Server listing on port '+ port);
};

if ( process.env.VCAP_SERVICES ) {
  var service_type = "mongodb-1.8";
  var json = JSON.parse(process.env.VCAP_SERVICES);
  var credentials = json[service_type][0]["credentials"];
  var server = new mongodb.Server( credentials["host"], credentials["port"]);
  new mongodb.Db( credentials["db"], server, {} ).open( function(err,client) {
    client.authenticate( credentials["username"], credentials["password"], function(err,replies) { 
      run(client);
    });
  });
} else {
  var server = new mongodb.Server("127.0.0.1",27017,{});
  new mongodb.Db( "mongo_survey", server, {} ).open( function(err,client) {
    if ( err ) { throw err; }
    run(client);
  });
}
