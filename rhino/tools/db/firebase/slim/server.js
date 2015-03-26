var client = new httpd.slim.http.Client();

var loadForeignCode = function(url,exports) {
	var code = client.request({
		url: url,
		evaluate: function(response) {
			return response.body.stream.character().asString();
		}
	});
	var lines = [code];
	exports.forEach(function(name) {
		lines.push("$exports." + name + " = window." + name + ";");
		lines.push("delete window." + name + ";");
	});
	return {
		status: {
			code: 200
		},
		body: {
			type: "text/javascript",
			string: lines.join("\n")
		}
	};	
}

var $exports = {};
$exports.handle = function(request) {
	if (request.path == "slim/db/firebase/vendor/firebase.js") {
		return loadForeignCode("https://cdn.firebase.com/js/client/1.0.15/firebase.js", ["Firebase"]);
	} else if (request.path == "slim/db/firebase/vendor/firebase-simple-login.js") {
		return loadForeignCode("https://cdn.firebase.com/js/simple-login/1.6.0/firebase-simple-login.js", ["FirebaseSimpleLogin"]);
	}
};
$set($exports);

$exports.Service = function(references) {
	var client = new httpd.slim.http.Client();
	
	var evaluate = function(response) {
		if (response.status.code != 200) {
			throw new Error("Status: " + response.status.code);
		}
		return eval("(" + response.body.stream.character().asString() + ")");
	}
	
	var Location = function(url) {
		this.url = url;
		
		this.get = function(p) {
			Packages.java.lang.System.err.println("GET parameters: " + JSON.stringify(p));
			return client.request({
				method: "GET",
				url: url + ".json",
				parameters: p,
				evaluate: evaluate
			});
		}

		this.save = function(v,p) {
			if (v === null) {
				client.request({
					method: "DELETE",
					url: url + ".json",
					parameters: p
				});
			} else {
				return client.request({
					method: "PUT",
					url: url + ".json",
					parameters: p,
					body: {
						type: "application/json",
						string: JSON.stringify(v)
					},
					evaluate: evaluate
				});
			}
		};
		
		this.push = function(v,p) {
			return client.request({
				method: "POST",
				url: url + ".json",
				parameters: p,
				body: v,
				evaluate: evaluate
			});
		};
	};

	var toParameters = function(request) {
		var authorization = httpd.js.Object.pairs.create(request.headers).authorization;
		if (authorization) {
			var words = authorization.split(" ");
			if (words[0] == "Firebase") {
				return { auth: words[1] }
			}
		}
		return {};
	};
	
	var Value = function(url,p) {
		this.url = url;
		
		var location = new Location(url);
		var json = (function() {
			if (typeof(p) == "undefined") return (function() {})();
			if (p.parameters) return location.get(p.parameters);
			if (p.json) return p.json;
		})();
		if (typeof(json) == "undefined") {
			this.__defineGetter__("json", function() {
				throw new Error();
			});
		} else if (json) {
			this.data = {};
			for (var x in json) {
				//	TODO	if these are objects it might be ideal to treat them as Slim objects themselves but we will have to see
				this.data[x] = json[x];
			}
		} else {
			this.data = null;
		}
		
		this.toString = function() {
			return "Value: url=" + url + " data=" + this.data;
		}
		
		this.save = function(v,p) {
			location.save(v,p);
			this.data = v;
		};
	}
	
	var types = this;
	
	this.Location = rest.Type({
		remote: function(o) {			
			this.read = rest.Query(function(p) {
				Packages.java.lang.System.err.println("headers: " + JSON.stringify(arguments[1].headers));
				var parameters = httpd.js.Object.set({}, p, toParameters(arguments[1]));
				var data = this.get(parameters);
				if (data) {
					return new Value(this.url,{ json: data });
				} else {
					return null;
				}
			}, { returns: types.Reference });
			
			this.write = rest.Action(function(p) {
				Packages.java.lang.System.err.println("headers: " + JSON.stringify(arguments[1].headers));
//				var parameters = httpd.js.Object.set({}, p, toParameters(arguments[1]));
				this.save(p,toParameters(arguments[1]));
				var rv = new Value(this.url, { json: p });
				Packages.java.lang.System.err.println("Returning: " + rv);
				debugger;
				return rv;
			}, { returns: types.Reference });
			//	Add this.push
		},
		reference: rest.Type.Referencer.encodeSlashAs("~", {
			create: function(o) {
				return o.url.substring("https://".length);
			},
			resolve: function(s) {
				return new Location("https://" + s);
			}
		})		
	});
			
	this.Reference = rest.Type({
		remote: function(o) {
			//	Interesting modeling problem; there are operations like PUT and DELETE where we will not want to read these
			//	properties; yet an ordinary Slim object has these properties available when sent to the client or when a reference
			//	is resolved. Right now it is not clear there is an easy way to make these available on read but not on PUT/DELETE.
			for (var x in o.object.data) {
				//	TODO	if these are objects it might be ideal to treat them as Slim objects themselves but we will have to see
				this[x] = o.object.data[x];
			}				
			
			this.PUT = function(v) {
				this.save(v,toParameters(arguments[1]));
			};

			this.DELETE = function() {
				this.save(null,toParameters(arguments[1]));
			};
		},
		reference: rest.Type.Referencer.encodeSlashAs("~", {
			create: function(o) {
				return o.url.substring("https://".length);
			},
			resolve: function(s) {
				return new Value("https://" + s);
			}
		})
	});
	
	this.location = rest.Query(function(p) {
		return new Location(p.url);
	}, { returns: this.Location });
	
	this.reference = rest.Query(function(p) {
		var rv = new Value(p.url, { parameters: p });
		if (rv.data) return rv;
		return null;
	}, { returns: this.Reference });	
}

//(function() {
//	var Location = function(url) {
//		this.url = url;
//
//		this.save = function(v) {
//
//		}
//	};
//
//	this.Location = rest.Type({
//		remote: function(o) {
//			this.PUT = function(v) {
//				this.save(v);
//			};
//
//			this.DELETE = function() {
//				this.save(null);
//			};
//
//			this.push = function(v) {
//				throw new Error("Unimplemented");
//			}
//		},
//		references: rest.Type.Referencer.encodeSlashAs("~", {
//			create: function(o) {
//				return o.url;
//			},
//			resolve: function(s) {
//				return new Location(s);
//			}
//		})
//	});
//
//	this.connect = rest.Query(function(p) {
//
//	}, { returns: this.Location });	
//})
