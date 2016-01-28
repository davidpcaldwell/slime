$exports.Handler = function(p) {
	throw new Error("Reserved for future use.");
};
$exports.Handler.chain = function() {
	return function(request) {
		for (var i=0; i<arguments.length; i++) {
			var handler = (function(argument) {
				if (typeof(argument) == "object") {
					return new $exports.Handler(argument);
				} else if (typeof(argument) == "function") {
					return argument;
				}
			})(arguments[i]);
			var rv = handler(request);
			if (typeof(rv) != "undefined") return rv;
		}
	}
};
$exports.Handler.Child = function(p) {
	if (typeof(p.filter) == "object" && p.filter instanceof RegExp) {
		return function(request) {
			var match = p.filter.exec(request.path);
			if (match) {
				var req = request;
				for (var x in request) {
					req[x] = request[x];
				}
				req.path = match[1];
				return p.handle(req);
			}
		};
	}
}
