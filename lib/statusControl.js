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
		successes : 0,
		bytes : 0,
		hosts: {}
	}
	
	return status[route]
}

exports.failed = function(route) {	
	var routeStatus = getRouteStatus(route);
	
	routeStatus.failures++
}

exports.served = function(route, host, bytes) {	
	var routeStatus = getRouteStatus(route);
	
	routeStatus.hosts[host.route] = (routeStatus.hosts[host.route])?routeStatus.hosts[host.route]:{
		successes : 0,
		failures : 0,
		bytes : 0
	}
	
	routeStatus.hosts[host.route].successes++
	routeStatus.hosts[host.route].bytes += bytes
	
	routeStatus.bytes += bytes
	routeStatus.successes++;
}

exports.getStatus = function(route) {
	return getRouteStatus(route);
}

exports.bytesServed = function(route, host) {
	return getRouteStatus(route).hosts[host.route].bytes
}

var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write("Route \t\t Failures \t Successes\n");
	
	for(var route in status) {
		res.write(""+route+" \t\t "+status[route].failures+" \t\t "+status[route].successes + "\n") ;
		res.write("-----------------------------------------------\n");
		res.write("\n\tHost\t\tSuccesses\tFailures\tBytes\n");
		
		for(var hostRoute in status[route].hosts) {
			res.write("\t"+hostRoute);
			res.write("\t\t"+status[route].hosts[hostRoute].successes);
			res.write("\t\t"+status[route].hosts[hostRoute].failures);
			res.write("\t\t"+status[route].hosts[hostRoute].bytes+"\t\n");
		}
	}
	res.end()
}).listen(8000, "127.0.0.1");

logger.info('Status Page running at http://127.0.0.1:8000/', { seriously: true });