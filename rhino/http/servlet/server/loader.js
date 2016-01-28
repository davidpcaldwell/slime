$exports.Handler = function(p) {
};
$exports.Handler.chain = function() {
	return function(request) {
		for (var i=0; i<arguments.length; i++) {
			var rv = arguments[i](request);
			if (typeof(rv) != "undefined") return rv;
		}
	}
};
//$exports.Handler.Child = function(p) {
//	if (typeof(p.filter) == "object" && p.filter instanceof RegExp) {
//		return function(request) {
//			
//		};
//	}
//}
