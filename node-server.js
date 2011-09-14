var
   fs = require('fs')
	,hostControl = require('./lib/hostControl')
	,logControl = require('./lib/logControl')
	,statusControl = require('./lib/statusControl')
	,requestControl = require('./lib/requestControl')
  ,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
  ,winston = require('winston')
  ,http = require('http')
  ,https = require('https')
  ,routes = config.routes
	,logger = logControl.createLogger()
	,hoster = hostControl.setupHosts(routes)
	,stats = statusControl.start()
;

if(config.ssl){
	var ssloptions = {
	  key: fs.readFileSync(config.ssl.key),
	  cert: fs.readFileSync(config.ssl.crt)
	};

	https.createServer(ssloptions, function (request, response) {
		doRequest(request, response, true);
	}).listen(config.ssl.port);	
}

http.createServer(function (request, response) {
	doRequest(request, response, false);
}).listen(config.port, config.host);

function doRequest(request, response, isSecure) {
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
	        path:request.url,
					isSecure: isSecure
	      };
    
	    	logger.debug("Sending request to "+host.host+":"+host.port+request.url);
    
	      host.serving.active++;
	      host.serving.total++;
				requestControl.request(host, route, options, response);
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
}