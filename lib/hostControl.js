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
	,status = {}
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
		,sessionRoute = sessions[route] = sessions[route] || {}
  	,session = sessionRoute[request.client.remoteAddress||request.client.socket.remoteAddress] = sessionRoute[request.client.remoteAddress||request.client.socket.remoteAddress] || {
			lastAccess : 0,
			lastServer : null
		}
	;
	
	if(session.lastServer && (accessTime - session.lastAccess)<=backend.sticky) {	
		logger.debug("Sticky session found: " + session.lastServer)
		
		if(backend.sticky) {
			session.lastAccess = accessTime;
		}
		
		host = servers[session.lastServer];
	} else {
		var 
			 x
			,server
		;
		
	  for(x=0; x<backend.hosts.length; x++) {
			server = servers[backend.hosts[x]];
	    if(server.serving.status === 1) {
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
	  }	
	
		if(host && backend.sticky) {
			session.lastAccess = accessTime;
			session.lastServer = host.route;
		}
	}

  return host;
};

exports.doHostStatusCheck = function(host, server) {
	hostStatusCheck(host, server);
};

exports.failed = function(route) {	
	var routeStatus = getRouteStatus(route);
	
	routeStatus.failures++
};

exports.served = function(route, host, bytes, port) {	
	var thisRoute = getRouteStatus(route);
	
	thisRoute.hosts[host.route+":"+port] = (thisRoute.hosts[host.route+":"+port])?thisRoute.hosts[host.route+":"+port]:{
		successes : 0,
		failures : 0,
		bytes : 0
	}
	
	thisRoute.hosts[host.route+":"+port].successes++
	thisRoute.hosts[host.route+":"+port].bytes += bytes
	
	thisRoute.bytes += bytes
	thisRoute.successes++;
};

exports.getSessions = function() {
	return sessions;
}

exports.getStatus = function() {
	return status;
};

exports.getRouteStatus = function(route) {
	return getRouteStatus(route);
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

function getRouteStatus(route){
	status[route] = status[route]||{
		failures  : 0,
		successes : 0,
		bytes : 0,
		hosts: {}
	};

	return status[route];
}