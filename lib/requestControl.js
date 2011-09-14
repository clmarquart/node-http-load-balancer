var 
	 fs = require('fs')
	,winston = require('winston')
	,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
  ,http = require('http')
	,logControl = require('../lib/logControl')
	,hostControl = require('../lib/hostControl')
	,logger = logControl.createLogger()
;

exports.request = function(host, route, options, response) {
	var httpRequest = http.request(options, function(httpResponse) {	
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
	
				hostControl.served(route, host, body.length, options.isSecure?443:80);
			
	      logger.debug(host.route+" served "+parseInt(body.length)+" bytes.");
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
}