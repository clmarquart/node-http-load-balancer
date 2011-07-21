var 
	 fs = require('fs')
	,winston = require('winston')
	,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
  ,http = require('http')
;

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({colorize: true, level: config.logLevel})
  ]
});

exports.getAvailableHost = function(backend, servers) {
  var 
     lowest = -1
    ,host
  ;

	  for(var x=0; x<backend.hosts.length; x++) {
			var server = servers[backend.hosts[x]];
	    if(server.serving.status===1) {
				if(backend.method === "response") {
		      if(lowest>server.serving.total || lowest===-1) {
		        lowest = server.serving.total;
		        host = server;
		      }
				} else if(backend.method === "byte") {
		      if(lowest>server.serving.bytes || lowest===-1) {
		        lowest = server.serving.bytes;
		        host = server;
		      }
				} 
	    }
	  }

  return host;
};

exports.doHostStatusCheck = function(host, server) {
	var options = {
    host: server.host,
    port: server.port,
    path: '/',
    method: 'HEAD'
  };
  var httpRequest = http.request(options, function(httpResponse) {
    httpResponse.on('end',function() {
      logger.debug("Pinging " + server.host+":"+server.port + " was successful");
      server.serving.status = 1;
    });
  });

  httpRequest.on('error', function(e) {
    if(server.serving.status==-1){
      logger.error("HealthCheck: " + server.host+":"+server.port + " still failing!");
    }else{ 
      logger.error("HealthCheck: " + server.host+":"+server.port + " failed with message: " + e.message);
    }

    server.serving.status = -1;
  });

  httpRequest.end();
}