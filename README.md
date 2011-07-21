# Example config.js

```
{
	"logLevel": "info",
	"pingInterval":2000,
	
	"servers" : {
		"Tomcat1" : {
			"name": "Tomcat1",
			"host": "127.0.0.1",
			"port": "8180"
		},
		"Tomcat2" : {
			"route": "Tomcat2",
			"host": "127.0.0.1",
			"port": "8280"
		}
	},
	
	"routes" : {
		"/test/" : {
			"method" : "response",
			"hosts" : ["Tomcat1","Tomcat2"]
		}
	}
}
```