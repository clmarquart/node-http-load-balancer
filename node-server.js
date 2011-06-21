var 
	 winston = require('winston')
	,http = require('http')
	,status = {}
	,backends = {
		"/test/" : {
			hosts : [
				{
					host: "127.0.0.1",
					port: "8180"
				},
				{
					host: "127.0.0.1",
					port: "8280"
				}
			]
		}
	};

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({colorize: true})
  ]
});

for(var backend in backends) {
	var backendPath = backends[backend];
	for(var host in backendPath.hosts){
		backendPath.hosts[host].serving = backendPath.hosts[host].serving || {
			active: 0,
			total: 0,
			failed: 0,
			status: setInterval(doHostStatusCheck,1500,backendPath.hosts[host]), //doHostStatusCheck(backendPath.hosts[host]),
			check: ""
		};
		// setTimeout(doHostStatusCheck(backendPath.hosts[host]),500)
	}
}

http.createServer(function (request, response) {
	for(var backend in backends) {
		if (request.url.match(new RegExp(backend))) {
			logger.debug("Matched request for " + request.url + " to " + backend);
			
			var host = getAvailableHost(backends[backend])
				 ,options={
						host:host.host, 
						port:host.port, 
						path:request.url
					};
			
			logger.debug("Sending request to "+host.host+":"+host.port+request.url);
			
			host.serving.active++;
			host.serving.total++;
			var httpRequest = http.request(options, function(httpResponse) {
				
				var body="";
				response.writeHead(httpResponse.statusCode, {
					'Server': 'Node JS',
					'Content-Type': httpResponse.headers['content-type'],
					'Date': new Date()
				});
				
			  httpResponse.on('data',function(chunk) {
						body+=chunk;
						response.write(chunk);
					}).on('end',function() {
						response.end();
						
						logger.debug("Received "+body.length+" bytes from backend server.");
						
						host.serving.active--;
					});
			});
			
			httpRequest.on('error', function(e) {
				host.serving.failed++;
				
			  logger.error('Problem with the request: ' + e.message);
			
				response.writeHead(503, {'Content-Type': 'text/html'});
				response.end();
				host.serving.status=-1;
				host.serving.active--;
			});

			httpRequest.end();
		} else response.end();
		
		break;
	}
}).listen(80, "127.0.0.1");

function getAvailableHost(backend) {
	var lowest = backend.hosts[0].serving.total, host= backend.hosts[0];
	for(var x=0; x<backend.hosts.length; x++) {
		if((parseInt(lowest)>parseInt(backend.hosts[x].serving.total)) && backend.hosts[x].serving.status===1){
			host = backend.hosts[x];
		}
	}
	return host;
}

function doHostStatusCheck(host) {	
	var options = {
	  host: host.host,
	  port: host.port,
	  path: '/',
		method: 'HEAD'
	};
	
	var httpRequest = http.request(options, function(httpResponse) {
		httpResponse.on('end',function() {
		  logger.debug("HealthCheck: " + host.host+":"+host.port + " is avaiable");
			host.serving.status = 1;
		});
	});
	
	httpRequest.on('error', function(e) {
	  logger.error("HealthCheck: " + host.host+":"+host.port + " failed with message: " + e.message);
		host.serving.status = -1;
	});
		
	httpRequest.end();
}