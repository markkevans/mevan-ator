var express = require('express');
var mongodb = require('mongodb');

run = function(client) {
  var app = express();

  app.engine('.ejs', require('ejs').__express);
  app.use( express.static(__dirname + '/public') );
  app.use( express.bodyParser() );
  app.use( express.cookieParser() );
  app.use( app.router );

  app.use(function(err, req, res, next){
    res.render('error.ejs', { err: err });
  });
  
  var requests = new mongodb.Collection(client, 'requests');
  var responses = new mongodb.Collection(client, 'responses');

  app.get('/',function(req,res){
      res.header('Cache-Control','private');
      res.render('index.ejs');
  });

  app.post('/requests',function(req,res){
    var data = JSON.parse(req.body.data);
    var request = { user_id: data.user_id, expected: data.expected, date_time: new Date()};
    requests.insert( request, { safe: true }, function(err,objects) {
      if ( err ) { throw new Error(err); }
      res.send(201, 'Created');
    });
  });

  app.post('/responses',function(req,res){
    var response = { name: req.body.name, status: req.body.status, user_id: req.body.user_id, date_time: new Date()};
    responses.insert( response, { safe: true }, function(err,objects) {
      if ( err ) { throw new Error(err); }
      res.redirect("/");
    });
  });

  app.get('/list',function(req,res){
    requests.find( {}, {} ).sort({_id:-1}).limit(20).toArray( function(err,docs) {
      if ( err ) { throw new Error(err); }
      res.header('Cache-Control','private');
      res.render( 'list.ejs', { requests: docs } );
    });
  });

  app.get('/responses/:id',function(req,res){
    var id = req.params.id;
    responses.findAll( { user_id: id }, function(err,doc) {
      if ( err ) { throw new Error(err); }
      cons
      res.render('responses.ejs', { responses: doc } );
    });
  });

  var port = 443;
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
