var 
	 fs = require('fs')
	,logControl = require('./logControl')
	,winston = require('winston')
	,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
	,status = {}
	,logger = logControl.createLogger()
;

function getRouteStatus(route) {
	status[route] = status[route]||{
		failures  : 0,
		successes : 0
	}
	
	return status[route]
}

exports.failed = function(route) {	
	var routeStatus = getRouteStatus(route);
	
	routeStatus.failures++
}

exports.getStatus = function(route) {
	return getRouteStatus(route);
}

var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write("Route \t Failures\n");
	for(var route in status) {
		res.write(""+route+" \t "+status[route].failures);
	}
	res.end()
}).listen(8000, "127.0.0.1");

logger.info('Status Page running at http://127.0.0.1:8000/', { seriously: true });