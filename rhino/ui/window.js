(function() {
	window.alert.jsh = true;
	
	window.jsh = {
		message: new function() {
			var server;

			var next = 1;

			var pending = {};

			this.initialize = function() {
				server = arguments[0];
			}

			//	TODO	what if server call throws error?
			this.asynchronous = function(payload,callback) {
				var current = next++;
				pending[current] = callback;
				server.call(JSON.stringify({ asynchronous: current, payload: payload }));
			};

			this.synchronous = function(payload) {
				return JSON.parse(server.call(JSON.stringify({ payload: payload })));
			}
			
			this.navigate = function(href) {
				server.call(JSON.stringify({ navigate: href }));
			};
			
			this.console = new function() {
				this.log = function() {
					server.call(JSON.stringify({ console: { log: Array.prototype.slice.call(arguments) }}));
				};
			};
	
			window.addEventListener("message", function(e) {
				if (e.origin === "null") {
					var data = JSON.parse(e.data);
					if (data.asynchronous) {
						console.log("Received asynchronous response: " + JSON.stringify(data, void(0), "    "));
						pending[data.asynchronous](data.payload);
						delete pending[data.asynchronous];
					} else {
						console.log("Received message: " + JSON.stringify(data, void(0), "    "));				
					}
				}
			});
		}
	};
	
	window.alert("window.jsh.message.initialize");
	
	window.console = window.jsh.message.console;
	
	window.addEventListener("click", function(e) {
		console.log("clicked something");
		if (e.target.tagName.toLowerCase() == "a" && (true || e.target.getAttribute("webview")) ) {
			console.log("Clicked link: " + e.target.href);
			window.jsh.message.navigate(e.target.href);
		}
	})
})();
