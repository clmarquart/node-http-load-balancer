var 
	 fs = require('fs')
	,winston = require('winston')
	,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
;

exports.createLogger = function() {
	var logger = new (winston.Logger)({});
	
	if(config.log.appender==="file")
		logger.add(winston.transports.File, {filename: 'logs/access.log', level: config.log.level})
	else
	  logger.add(winston.transports.Console, {colorise: true, level: config.log.level})	
	
	return logger;
}