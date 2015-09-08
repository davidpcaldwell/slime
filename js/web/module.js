//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the js/web SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parse = function(string) {
	var matcher = /(?:([^\:\/\?\#]+)\:)?(?:\/\/([^\:\/\?\#]+))?(?:\:(\d+))?([^\?\#]*)(?:\?([^#]*))?(?:\#(.*))?/;
	var match = matcher.exec(string);
	var authority = (match[2] || match[3]) ? { host: match[2], port: Number(match[3]) } : (function(){})();
	if (authority && authority.host) {
		var tokens = authority.host.split("@");
		if (tokens.length == 2) {
			authority.host = tokens[1];
			authority.userinfo = tokens[0];
		}
	}
	return {
		scheme: match[1],
		authority: authority,
		path: match[4],
		query: match[5],
		fragment: match[6]
	};
}

$exports.Url = function(o) {
	["scheme","path","query","fragment"].forEach(function(item) {
		if (o[item]) {
			this[item] = o[item];
		}
	},this);
	if (o.authority) {
		["userinfo","host","port"].forEach(function(name) {
			if (o.authority[name]) {
				this[name] = o.authority[name];
			}
		}, this);
	}

	if (typeof(this.query) == "object" && typeof(this.query.length) == "number") {
		this.query = $exports.Url.query(this.query);
	}

	this.resolve = function(reference) {
		//	See http://tools.ietf.org/html/rfc3986#section-5.2
		//	particularly 5.2.2 for this pseudocode
		var R = parse(reference);
		var T = {};
		var Base = o;

		var defined = function(v) {
			return typeof(v) != "undefined";
		};

		var remove_dot_segments = function(s) {
			var tokens = s.split("/");
			var rv = [];
			for (var i=0; i<tokens.length; i++) {
				if (tokens[i] == ".") {
				} else if (tokens[i] == "..") {
					rv.splice(rv.length-1,1);
				} else {
					rv.push(tokens[i]);
				}
			}
			return rv.join("/");
		};

		var merge = function(base,relative) {
			if (base == "") return "/" + relative;
			var dir = base.substring(0,base.lastIndexOf("/")+1);
			return dir + relative;
		}

		if (defined(R.scheme)) {
			T.scheme = R.scheme;
			T.authority = R.authority;
			T.path = remove_dot_segments(R.path);
			T.query = R.query;
		} else {
			if (defined(R.authority)) {
				T.authority = R.authority;
				T.path = remove_dot_segments(R.path);
				T.query = R.query;
			} else {
				if (R.path == "") {
					T.path = Base.path;
					if (defined(R.query)) {
						T.query = R.query;
					} else {
						T.query = Base.query;
					}
				} else {
					if (R.path.substring(0,1) == "/") {
						T.path = remove_dot_segments(R.path);
					} else {
						T.path = merge(Base.path,R.path);
						T.path = remove_dot_segments(T.path);
					}
					T.query = R.query;
				}
				T.authority = Base.authority;
			}
			T.scheme = Base.scheme;
		}
		T.fragment = R.fragment;
		return new $exports.Url(T);
	}

	this.toString = function() {
		var rv = "";
		if (this.scheme) {
			rv += this.scheme + "://";
		}
		//	TODO	userinfo
		if (this.host) {
			rv += this.host;
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
	return new $exports.Url(parse(string))
}
$exports.Url.query = function(array) {
	return array.map(function(item) {
		return $context.escaper.encode(item.name) + "=" + $context.escaper.encode(item.value);
	}).join("&");
};
$exports.Url.query.parse = function(string) {
	return (function(string) {
		var decode = function(string) {
			return $context.escaper.decode(string);
		}

		if (!string) return null;
		var tokens = string.split("&");
		//jsh.shell.echo("tokens: " + tokens.length + " " + tokens);
		return tokens.map(function(pair) {
			var split = pair.split("=");
			//jsh.shell.echo("split = " + split);
			if (split.length != 2) throw new Error();
			return { name: decode(split[0]), value: decode(split[1]) }
		});
	})(string);
};
