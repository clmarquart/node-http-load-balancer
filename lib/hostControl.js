var 
	 fs = require('fs')
	,winston = require('winston')
	,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
	,routes = config.routes
	,logControl = require('../lib/logControl')
	,sessions = {}
  ,http = require('http')
;

var logger = logControl.createLogger();
exports.getAvailableHost = function(route, servers, request) {
  var 
     lowest = -1
    ,host
		,backend = routes[route]
  	,session = sessions[request.client.remoteAddress] = sessions[request.client.remoteAddress] || {}
		,lastRoute = session[route] || {
			lastAccess : 0,
			lastServer : null
		}
		,accessTime = Math.round(+new Date()/1000)
	;
	session[route] = lastRoute; 
	
	if(session[route].lastServer && (accessTime - session[route].lastAccess)<=backend.sticky) {	
		logger.debug("Sticky session found: " + session[route].lastServer.route)
		
		if(backend.sticky) {
			session[route].lastAccess = accessTime;
		}
		
		host = session[route].lastServer;
	} else {
	  for(var x=0; x<backend.hosts.length; x++) {
			var server = servers[backend.hosts[x]];
		
	    if(server.serving.status===1) {
				if(backend.method === "response") {
		      if(lowest>server.serving.total || lowest===-1) {
		        lowest = server.serving.total;
		        host = server;
						hostName = server;
		      }
				} else if(backend.method === "byte") {
		      if(lowest>server.serving.bytes || lowest===-1) {
		        lowest = server.serving.bytes;
		        host = server;
		      }
				}
	    }

			if(backend.sticky) {
				session[route].lastAccess = accessTime;
				session[route].lastServer = host;
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
};