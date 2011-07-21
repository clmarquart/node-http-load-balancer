var
   fs = require('fs')
	,hostControl = require('./lib/hostControl')
  ,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
  ,winston = require('winston')
  ,http = require('http')
  ,ping = config.pingInterval
  ,routes = config.routes
  ;

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({colorize: true, level: config.logLevel})
  ]
});

for(var route in routes) {
  var routePath = routes[route];

  for(var host in routePath.hosts){
    config.servers[routePath.hosts[host]].serving = config.servers[routePath.hosts[host]].serving || {
      active: 0,
      total: 0,
      failed: 0,
      status: 1,
			bytes: 0,
      check: ""
    };

    setInterval(hostControl.doHostStatusCheck,ping,routePath.hosts[host],config.servers[routePath.hosts[host]]);
  }
}

http.createServer(function (request, response) {
  for(var route in routes) {
    if (request.url.match(new RegExp(route))) {
      logger.debug("Matched request for " + request.url + " to " + route);

      var host = hostControl.getAvailableHost(routes[route], config.servers)
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
				// console.log('HEADERS: ' + JSON.stringify(httpResponse.headers));
			  
				var header = {
          'Server': 'Node JS',
          'Content-Type': httpResponse.headers['content-type'],
          'Date': new Date()
				};
				if(httpResponse.headers["set-cookie"])
					header["set-cookie"] = httpResponse.headers["set-cookie"]
					
        response.writeHead(httpResponse.statusCode, header);
        
        httpResponse
					.on('data',function(chunk) {
            body+=chunk;
            response.write(chunk);
          })
					.on('end',function() {
            response.end();
            
            logger.debug("Received "+parseInt(body.length)+" bytes from backend server.");
            host.serving.bytes += body.length;
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