$exports.Url = function(o) {
	["scheme","host","port","path","query","fragment"].forEach(function(item) {
		if (o[item]) {
			this[item] = o[item];
		}
	},this);
	
	if (typeof(this.query) == "object" && typeof(this.query.length) == "number") {
		this.query = (function(array) {
			return array.map(function(item) {
				return $context.escaper.encode(item.name) + "=" + $context.escaper.encode(item.value);
			}).join("&");
		})(this.query);
	}
	
	this.scheme = o.scheme;
	this.server = o.server;
	
	this.toString = function() {
		var rv = "";
		if (this.scheme) {
			rv += this.scheme + "//";
		}
		//	TODO	userinfo
		if (this.server) {
			rv += this.server;
		}
		if (typeof(this.port) != "undefined") {
			rv += ":" + this.port;
		}
		rv += this.path;
		if (typeof(this.query) != "undefined" && this.query !== null) {
			rv += "?" + this.query;
		}
		if (typeof(this.fragment) != "undefined" && this.fragment !== null) {
			rv += "#" + this.fragment;
		}
		return rv;
	}
};
$exports.Url.parse = function(string) {
	var matcher = /(?:([^\:\/\?\#]+)\:\/\/)([\w\.]+)(?:\:(\d+))?(\/.*)\?(.*)\#(.*)/;
	var match = matcher.exec(string);
	return new $exports.Url({
		scheme: match[1],
		host: match[2],
		port: Number(match[3]),
		path: match[4],
		query: match[5],
		fragment: match[6]
	})
}
