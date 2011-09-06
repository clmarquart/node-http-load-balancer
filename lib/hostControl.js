var 
	 fs = require('fs')
	,winston = require('winston')
	,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
  ,ping = config.pingInterval
	,routes = config.routes
	,logControl = require('../lib/logControl')
	,logger = logControl.createLogger()
	,sessions = {}
	,statusTimeout
	,servers = config.servers
  ,http = require('http')
;

exports.setupHosts = function(routes) {
	for(var route in routes) {
	  var 
			 routePath = routes[route]
			,host
		;

	  for(host in routePath.hosts){
	    servers[routePath.hosts[host]].serving = servers[routePath.hosts[host]].serving || {
	      active: 0,
	      total: 0,
	      failed: 0,
	      status: 1,
				bytes: 0,
	      check: ""
	    };

	    statusTimeout = setInterval(hostStatusCheck, ping, routePath.hosts[host], servers[routePath.hosts[host]]);
	  }
	}
}

exports.getAvailableHost = function(route, request) {
  var 
     lowest = -1
    ,host
		,backend = routes[route]
		,accessTime = Math.round(+new Date()/1000)
  	,session = sessions[request.client.remoteAddress] = sessions[request.client.remoteAddress] || {}
		,lastRoute = session[route] || {
			lastAccess : 0,
			lastServer : null
		}
	;
	
	session[route] = lastRoute; 
	
	if(session[route].lastServer && (accessTime - session[route].lastAccess)<=backend.sticky) {	
		logger.debug("Sticky session found: " + session[route].lastServer.route)
		
		if(backend.sticky) {
			session[route].lastAccess = accessTime;
		}
		
		host = session[route].lastServer;
	} else {
		var 
			 x
			,server
		;
	  for(x=0; x<backend.hosts.length; x++) {
			server = servers[backend.hosts[x]];
		
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
	hostStatusCheck(host, server);
};

function hostStatusCheck(host, server) {
	var 
		 options = {
		    host: server.host,
		    port: server.port,
		    path: '/',
		    method: 'HEAD'
		 }
		,httpRequest
	;
		
	httpRequest = http.request(options, function(httpResponse) {
   	httpResponse.on('end',function() {
      logger.debug("Pinging " + server.host+":"+server.port + " was successful");
      server.serving.status = 1;
    });
  });

  httpRequest.on('error', function(e) {
    if(server.serving.status==-1) {
      logger.error("HealthCheck: " + server.host+":"+server.port + " still failing!");
    } else {
      logger.error("HealthCheck: " + server.host+":"+server.port + " failed with message: " + e.message);
    }

    server.serving.status = -1;
  });

  httpRequest.end();
};