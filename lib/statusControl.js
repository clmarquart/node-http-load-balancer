var 
	 fs = require('fs')
	,logControl = require('./logControl')
	,hostControl = require('./hostControl')
	,winston = require('winston')
	,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
	,logger = logControl.createLogger()
	,http = require('http')
;

exports.getStatus = function(route) {
	return hostControl.getRouteStatus(route);
}

exports.bytesServed = function(route, host) {
	return hostControl.getRouteStatus(route).hosts[host.route].bytes
}

exports.start = function() {
	http.createServer(function (req, res) {
		if (!req.url.match(/\/status$/)) {
		  res.writeHead(404, {'Content-Type': 'text/plain'});
			res.write("Looking for /status?")
			res.end();
			return;
		}
		
	  res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write("Route \t\t Failures \t Successes\n");
	
		var status = hostControl.getStatus();
		var sessions = hostControl.getSessions();
	
		for(var route in status) {
			res.write(""+route+" \t\t "+status[route].failures+" \t\t "+status[route].successes + "\n") ;
			res.write("-----------------------------------------------\n");
			
			res.write("\n\tStats\n");
			res.write("\n\tHost\t\tSuccesses\tFailures\tBytes\n");
		
			for(var hostRoute in status[route].hosts) {
				res.write("\t"+hostRoute);
				res.write("\t\t"+status[route].hosts[hostRoute].successes);
				res.write("\t\t"+status[route].hosts[hostRoute].failures);
				res.write("\t\t"+status[route].hosts[hostRoute].bytes+"\t\n");
			}
			
			res.write("\n\tSessions\n");
			res.write("\n\tIP\t\tLast Access\tLast Route");
			for(var session in sessions[route]) {
				res.write("\n\t"+session+"\t"+sessions[route][session].lastAccess+"\t"+sessions[route][session].lastServer)
			}
		}
		res.end()
	}).listen(8000, "127.0.0.1");

	logger.info('Status Page running at http://127.0.0.1:8000/', { seriously: true });
	
}