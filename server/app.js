var express = require('express');
var mongodb = require('mongodb');

run = function(client) {
  var app = express();
  
  app.register( '.ejs', require('ejs') );
  app.use( express.static(__dirname + '/public') );
  app.use( express.bodyParser() );
  app.use( express.cookieParser() );
  app.use( app.router );
  
  var data = new mongodb.Collection(client, 'data');

  app.get('/',function(req,res){
      res.header('Cache-Control','private');
      res.render('index.ejs');
    });
  });

  app.error(function(err,req,res,next){
    res.render('error.ejs', { err: err });
  });

  var port = process.env.VCAP_APP_PORT || process.env.PORT || 443;
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