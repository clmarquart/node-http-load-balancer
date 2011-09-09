var
   fs = require('fs')
	,hostControl = require('./lib/hostControl')
	,logControl = require('./lib/logControl')
	,statusControl = require('./lib/statusControl')
  ,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
  ,winston = require('winston')
  ,http = require('http')
  ,routes = config.routes
	,logger = logControl.createLogger()
	,hoster = hostControl.setupHosts(routes)
	,stats = statusControl.start()
;

http.createServer(function (request, response) {
	var 
		 route
		,host
		,options
		,httpRequest
	;
	
  for(route in routes) {
    if (request.url.match(new RegExp(route))) {
      logger.debug("Matched request for " + request.url + " to " + route);

      host = hostControl.getAvailableHost(route, request)
			
			if(host) {
				options={
           host:host.host, 
           port:host.port, 
           path:request.url
         };
      
      	logger.debug("Sending request to "+host.host+":"+host.port+request.url);
      
	      host.serving.active++;
	      host.serving.total++;
	      httpRequest = http.request(options, function(httpResponse) {
	        var 
						 body = ""
						,header = {
	          	'Server': 'Node JS',
		          'Content-Type': httpResponse.headers['content-type'],
		          'Date': new Date()
						}
					;
					
					if(httpResponse.headers["set-cookie"]) {
						header["set-cookie"] = httpResponse.headers["set-cookie"]
					}
					
	        response.writeHead(httpResponse.statusCode, header);
        
	        httpResponse
						.on('data',function(chunk) {
	            body+=chunk;
	            response.write(chunk);
	          })
						.on('end',function() {
	            response.end();
	
	            host.serving.bytes += body.length;
	            host.serving.active--;
	
							hostControl.served(route, host, body.length);
							
	            logger.debug(host.route+" served "+parseInt(body.length)+" bytes.");
	          });
	      });
	
				// TODO This should send the request to the another server
	      httpRequest.on('error', function(e) {
	        host.serving.failed++;
        
	        logger.error('Problem with the request: ' + e.message);
      
	        response.writeHead(503, {'Content-Type': 'text/html'});
	        response.end();
	
	        host.serving.status=-1;
	        host.serving.active--;
	      });

	      httpRequest.end();
			} else {
				hostControl.failed(route);
				
				logger.error('No available hosts! Check for failpage on route: ' + route)
				
				if(routes[route].failpage) {
					fs.readFile("."+routes[route].failpage, function (err, data) {
					  if (err) throw err;
					
					  response.write(data);
						response.end();
					});
				}
			}
    } else response.end();

    break;
  }
}).listen(config.port, config.host);