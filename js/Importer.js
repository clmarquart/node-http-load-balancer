/************************************************************************
Copyright (c) 2010, Cody L. Marquart

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted, provided that
the above copyright notice and this permission notice appear in all
copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS
ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING
ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN
NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE
USE OR PERFORMANCE OF THIS SOFTWARE.
************************************************************************/

(function(){
	var loggerOn = false
	
	/**
	 * Main PackagedJS Object	
	 *
	 * window.JS
	 */
  var JS = window.JS = new function() {
    this.imported={}; //,active=false;
    this.requests=[];
		this.lastResult=false;

		/**
		 * JS.Wait - Insure proper order of execution
		 *
		 */
    this.Wait=function(request,func){
      if(JS.requests[request.order-1].done==false){
        setTimeout("JS.Wait(JS.requests["+request.order+"],"+func+")",200);
      } else {
      	eval(request.response.responseText);
      	if(func){
      	  func.call(JS, request);
      	}
      	JS.requests[request.order].done = true;
      }
    };

		/**
		 * JS.Require - Load a Packaged JavaScript Library
		 * 
		 */
    this.Require=function(js,auto,callback) {
      var parentThis = this;
			log("Loading the ", js, " package.");
      var request = XHR.get({
        url:js,
        success:function(newRequest,res){
          JS.active = false;
          callback=(typeof auto==="function")?auto:callback;
          if(auto==true){
            JS.Store(newRequest.file, res.responseText);
          } else {
            JS.Save(res.responseText);
	        }
          var prev = (newRequest.order>0)?JS.requests[newRequest.order-1]:{done:true};
          if(prev.done) {
            JS.requests[newRequest.order].done = true;
            if(auto==true){
              eval(res.responseText);
            }
            if(callback){
              callback.call(JS, newRequest, res);
            }
          } else {
            JS.Wait(newRequest,callback);
	        }
        }
      });
      this.requests.push(request);
      return this;
    };

		/**
		 * JS.Save - Saves a packaged section for use later
		 *
		 */
    this.Save=function(js) {
      while(js.match(/^\/\*(.*)\n/)) {
        var executed = /^\/\*(.*)\n([\S|\s]*)\1\*\/$/m.exec(js);
        JS.imported[executed[1]]=executed[2];
        js = js.substr(executed[0].length).replace(/^\n/,"");
      }
    };
		

		/**
		 * JS.Store - Stores the required JS to avoid multiple downloads
		 *
		 */
    this.Store=function(file,js){
    	JS.imported[file] = js;
    };

		/**
		 * JS.Use - Call a previously saved section from the loaded JavaScript Package
		 *
		 */
    this.Use=function(p,func) {
      if (JS.active === true){
				log("JS is active, wait for ", p);
        setTimeout("JS.Use('"+p+"',"+func+")",5);
			} else if (typeof JS.imported[p] === "undefined") {
				log(p, " is ", typeof JS.imported[p]);
        setTimeout("JS.Use('"+p+"',"+func+")",5);
      } else {
				if (JS.imported[p]!==""){
					log("JS is loading ", p);
					eval(JS.imported[p]);
          JS.imported[p] = "";
					lastResult=true;
        } else {
					log("JS can't find ", p);
					lastResult=false;
        }
        if (func) {
					log("Calling the callback for ", p);
          func();
        }
      }

      return this;
    };
  };

	/**
	 * Handle XHR Requests
	 *
	 */
  var XHR = {
    requests : [],
    get : function(request) {
      XHR.requests.push({
        file:request.url,
        order:XHR.requests.length,
        response:null,
        complete:request.complete,
        success:request.success,
        done:false
      });

      var newRequest = XHR.requests[XHR.requests.length-1];
      var req = new XMLHttpRequest();
      req.open('GET', request.url, true);
      req.onreadystatechange = function (a) {
        JS.active = true;
        if (req.readyState == 4) {
      	  newRequest.response = req;
          request.success(newRequest, req);
        }
      }
      req.send(null);

      return newRequest;
    }
  };

	/**
	 * Once Importer.js has run its course, find its corresponding &lt;script/&gt; 
	 * element to start evaluation of the embedded JavaScript
	 *
	 */
  var scripts = parent.document.getElementsByTagName("script");
  for(var x=0;x<scripts.length;x++){
    if((scripts[x].src) && (/Importer\.js/.test(scripts[x].src))) {
      eval(scripts[x].innerHTML);
    }
  }

	function log(message) {
		if(loggerOn){
			console.log(message);
		}
	}
})();