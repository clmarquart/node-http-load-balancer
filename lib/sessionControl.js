var 
	 fs = require('fs')
	,logControl = require('./logControl')
	,winston = require('winston')
	,config  = JSON.parse(fs.readFileSync('./config.js',"UTF-8"))
	,sessions = {}
	,logger = logControl.createLogger()
;