var 
	 http = require('http')
	,agents = 10
	,count = agents
	,intervals = []
	,duration = 10000
	,interval = 50
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
  	host: "127.0.0.1",
	  port: 80,
	  path: '/test/index.html',
		method: 'GET'
	};

	var httpRequest = http.request(options, function(httpResponse) {
		if(httpResponse.statusCode!==200){
			intervals[agent].failures++;
			// console.log("FAILED!!!!!")
		} else {
			// httpResponse.on('end',function() {			
			  // console.log("Request #"+intervals[agent].count+" for agent "+agent+" was successful.");
			// });	
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