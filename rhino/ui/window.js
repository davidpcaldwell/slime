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
})();
