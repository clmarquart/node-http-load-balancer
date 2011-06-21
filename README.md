# Example config.js

{
	"pingInterval":2000,
	"backends" : {		
		"/test/" : {
			"hosts" : [
				{
					"host": "127.0.0.1",
					"port": "8180"
				},
				{
					"host": "127.0.0.1",
					"port": "8280"
				}
			]
		}
	}
}