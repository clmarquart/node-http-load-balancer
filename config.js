{
	"logLevel": "info",
	"pingInterval":2000,
	"backends" : {		
		"/test/" : {
			"hosts" : [
				{
					"route": "Tomcat1",
					"host": "127.0.0.1",
					"port": "8180"
				},
				{
					"route": "Tomcat2",
					"host": "127.0.0.1",
					"port": "8280"
				}
			]
		}
	}
}