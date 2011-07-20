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

exports.getAvailableHost = function(backend) {
  var 
     lowest = -1
    ,host
  ;
  
  for(var x=0; x<backend.hosts.length; x++) {
    if(backend.hosts[x].serving.status===1) {
      if(lowest>backend.hosts[x].serving.total || lowest===-1) {
        lowest = backend.hosts[x].serving.total;
        host = backend.hosts[x];
      }
    }
  } 

  return host;
};

exports.doHostStatusCheck = function(host) {
	var options = {
    host: host.host,
    port: host.port,
    path: '/',
    method: 'HEAD'
  };
  var httpRequest = http.request(options, function(httpResponse) {
    httpResponse.on('end',function() {
      logger.debug("Pinging " + host.host+":"+host.port + " was successful");
      host.serving.status = 1;
    });
  });

  httpRequest.on('error', function(e) {
    if(host.serving.status==-1){
      logger.error("HealthCheck: " + host.host+":"+host.port + " still failing!");
    }else{ 
      logger.error("HealthCheck: " + host.host+":"+host.port + " failed with message: " + e.message);
    }

    host.serving.status = -1;
  });

  httpRequest.end();
}