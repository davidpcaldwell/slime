httpd.Handler = function(p) {
};
httpd.Handler.chain = function() {
	return function(request) {
		for (var i=0; i<arguments.length; i++) {
			var rv = arguments[i](request);
			if (typeof(rv) != "undefined") return rv;
		}
	}
};
