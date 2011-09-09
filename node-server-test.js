var 
	 http = require('http')
	,agents = 20
	,count = agents
	,intervals = []
	,duration = 10000
	,interval = 20
;

for(var x=0; x<agents; x++) {
	console.log("Starting agent #"+ x);
	intervals.push({
		count: 0,
		interval: setInterval(runAgentRequest,interval,x),
		duration: duration,
		success:0,
		failures:0
	});
}

function runAgentRequest(agent){
	intervals[agent].count++;
	
	var options = {
  	host: "192.168.1.64",
	  port: 80,
	  path: '/test/index.html',
		method: 'GET'
	};

	var httpRequest = http.request(options, function(httpResponse) {
		if(httpResponse.statusCode!==200){
			intervals[agent].failures++;
		} else {
			intervals[agent].success++;
		}
	});	
	httpRequest.on('error', function(e) {
		console.log("FAILED!!!!!")
		intervals[agent].failures++;
	});
	
	httpRequest.end();
	
	intervals[agent].duration-=interval;	
	if(intervals[agent].duration<interval) {
		clearInterval(intervals[agent].interval)
		count--;
		if(count===0){
			doneRunning();
		}
	}
}

function doneRunning(){
	console.log("Agents are done running.")
	for(var x=0; x<agents; x++) {
		console.log("Agent: #"+(x+1));
		console.log("\tSuccesses: "+intervals[x].success+"\tFailures: "+intervals[x].failures)
	}
}