//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	function() {
		var ToObject = function(v) {
			//	https://www.ecma-international.org/ecma-262/6.0/#sec-toobject
			if (typeof(v) == "undefined" || v === null) throw new TypeError("ToObject() cannot be invoked with argument " + v);
			if (typeof(v) == "boolean") return Boolean(v);
			if (typeof(v) == "number") return Number(v);
			if (typeof(v) == "string") return String(v);
			return v;
		}

		if (!Object.assign) {
			//	https://www.ecma-international.org/ecma-262/6.0/#sec-object.assign
			//	TODO	currently the basics can be tested manually with loader/test/test262.jsh.js -file local/test262/test/built-ins/Object/assign/Target-Object.js
			Object.defineProperty(Object, "assign", {
				value: function assign(target,firstSource /* to set function .length properly*/) {
					var rv = ToObject(target);
					if (arguments.length == 1) return rv;
					for (var i=1; i<arguments.length; i++) {
						var source = (typeof(arguments[i]) == "undefined" || arguments[i] === null) ? {} : ToObject(arguments[i]);
						for (var x in source) {
							rv[x] = source[x];
						}
					}
					return rv;
				},
				writable: true,
				configurable: true
			});
		}

		if (!Object.fromEntries) {
			Object.defineProperty(Object, "fromEntries", {
				value: function(iterable) {
					if (iterable instanceof Array) {
						var rv = {};
						iterable.forEach(function(item) {
							rv[item[0]] = item[1];
						});
						return rv;
					} else {
						throw new TypeError("'iterable' must currently be an array");
					}
				}
			});
		}

		if (!Object.entries) {
			Object.defineProperty(Object, "entries", {
				value: function(object) {
					var rv = [];
					for (var x in object) {
						rv.push([x, object[x]]);
					}
					return rv;
				}
			});
		}

		if (!Object.values) {
			Object.defineProperty(Object, "values", {
				value: function(object) {
					var rv = [];
					for (var x in object) {
						rv.push(object[x]);
					}
					return rv;
				}
			});
		}

		//	Copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
		if (!String.prototype.endsWith) {
			String.prototype.endsWith = function(search, this_len) {
				if (this_len === undefined || this_len > this.length) {
					this_len = this.length;
				}
				return this.substring(this_len - search.length, this_len) === search;
			};
		}

		if (!Array.prototype.find) {
			Object.defineProperty(Array.prototype, "find", {
				value: function(f, target) {
					for (var i=0; i<this.length; i++) {
						var match = f.call(target, this[i], i, this);
						if (match) return this[i];
					}
				},
				configurable: true,
				writable: true
			});
		}

		if (!Array.prototype.findIndex) {
			Object.defineProperty(Array.prototype, "findIndex", {
				value: function(f, target) {
					for (var i=0; i<this.length; i++) {
						var match = f.call(target, this[i], i, this);
						if (match) return i;
					}
					return -1;
				},
				configurable: true,
				writable: true
			});
		}

		var global = (function() { return this; })();
		if (!global.Map) {
			function Map() {
				this._keys = [];
				this._values = [];
			}

			Map.prototype.set = function(key, value) {
				var index = this._keys.indexOf(key);
				if (index === -1) {
					this._keys.push(key);
					this._values.push(value);
				} else {
					this._values[index] = value;
				}
				return this;
			};

			Map.prototype.get = function(key) {
				var index = this._keys.indexOf(key);
				return index === -1 ? undefined : this._values[index];
			};

			Map.prototype.has = function(key) {
				return this._keys.indexOf(key) !== -1;
			};

			Map.prototype.delete = function(key) {
				var index = this._keys.indexOf(key);
				if (index !== -1) {
					this._keys.splice(index, 1);
					this._values.splice(index, 1);
					return true;
				}
				return false;
			};

			Map.prototype.clear = function() {
				this._keys = [];
				this._values = [];
			};

			Map.prototype.size = function() {
				return this._keys.length;
			};

			Map.prototype.forEach = function(callbackFn, thisArg) {
				for (var i = 0; i < this._keys.length; i++) {
					callbackFn.call(thisArg, this._values[i], this._keys[i], this);
				}
			};

			Map.prototype.keys = function() {
				return this._keys.slice();
			};

			Map.prototype.values = function() {
				return this._values.slice();
			};

			Map.prototype.entries = function() {
				var entries = [];
				for (var i = 0; i < this._keys.length; i++) {
					entries.push([this._keys[i], this._values[i]]);
				}
				return entries;
			};

			global.Map = Map;
		}

		if (!global.URL) {
			//	A minimal polyfill for the `URL` interface defined by the WHATWG URL Standard
			//	(https://url.spec.whatwg.org/#url). See issue #2403.
			//
			//	Intentional limitations, to keep this polyfill small (see issue #2403 for rationale):
			//	*	Parsing uses a single regular expression based on the generic URI syntax in RFC 3986, rather than the
			//		specification's state-machine algorithm. It does not implement special-casing for "special schemes" (http,
			//		https, file, etc.), IDNA/percent-encoding normalization, or validation of most malformed input; it will
			//		accept many strings the specification would reject, and will not encode/normalize most inputs the way a
			//		native implementation would.
			//	*	`searchParams` (the live `URLSearchParams` view of `search`) is not implemented.
			//	*	Dot-segment (`.` / `..`) removal in paths uses a simple segment-based algorithm, adapted from the one in
			//		`js/web/module.js`, rather than the specification's buffer-based algorithm, and may disagree with it on
			//		edge cases (e.g., trailing slashes).

			var URL_PATTERN = /^(?:([a-zA-Z][a-zA-Z0-9+.-]*):)?(\/\/(?:([^:@\/?#]*)(?::([^@\/?#]*))?@)?([^:\/?#]*)(?::(\d*))?)?([^?#]*)(\?[^#]*)?(#.*)?$/;

			var parseUrl = function(string) {
				var match = URL_PATTERN.exec(string);
				return {
					scheme: match[1] || "",
					hasAuthority: Boolean(match[2]),
					username: match[3] || "",
					password: match[4] || "",
					hostname: match[5] || "",
					port: match[6] || "",
					pathname: match[7] || "",
					search: match[8] || "",
					hash: match[9] || ""
				};
			};

			//	Adapted from the algorithm of the same name in js/web/module.js
			var removeDotSegments = function(path) {
				var tokens = path.split("/");
				var rv = [];
				for (var i=0; i<tokens.length; i++) {
					if (tokens[i] == ".") {
						//	no replacement, just remove
					} else if (tokens[i] == "..") {
						rv.splice(rv.length-1,1);
					} else {
						rv.push(tokens[i]);
					}
				}
				return rv.join("/");
			};

			var mergePaths = function(base,relativePath) {
				if (base.hasAuthority && base.pathname == "") return "/" + relativePath;
				var dir = base.pathname.substring(0,base.pathname.lastIndexOf("/")+1);
				return dir + relativePath;
			};

			//	See https://tools.ietf.org/html/rfc3986#section-5.2.2, adapted to this file's property names
			var resolveUrl = function(base,reference) {
				var rv = {};
				if (reference.scheme) {
					rv.scheme = reference.scheme;
					rv.hasAuthority = reference.hasAuthority;
					rv.username = reference.username;
					rv.password = reference.password;
					rv.hostname = reference.hostname;
					rv.port = reference.port;
					rv.pathname = removeDotSegments(reference.pathname);
					rv.search = reference.search;
				} else if (reference.hasAuthority) {
					rv.scheme = base.scheme;
					rv.hasAuthority = true;
					rv.username = reference.username;
					rv.password = reference.password;
					rv.hostname = reference.hostname;
					rv.port = reference.port;
					rv.pathname = removeDotSegments(reference.pathname);
					rv.search = reference.search;
				} else {
					rv.scheme = base.scheme;
					rv.hasAuthority = base.hasAuthority;
					rv.username = base.username;
					rv.password = base.password;
					rv.hostname = base.hostname;
					rv.port = base.port;
					if (reference.pathname == "") {
						rv.pathname = base.pathname;
						rv.search = reference.search || base.search;
					} else if (reference.pathname.charAt(0) == "/") {
						rv.pathname = removeDotSegments(reference.pathname);
						rv.search = reference.search;
					} else {
						rv.pathname = removeDotSegments(mergePaths(base,reference.pathname));
						rv.search = reference.search;
					}
				}
				rv.hash = reference.hash;
				return rv;
			};

			var normalizeUrl = function(components) {
				if (components.hasAuthority && components.pathname == "") {
					components.pathname = "/";
				}
				return components;
			};

			var serializeUrl = function(components) {
				var rv = components.scheme + ":";
				if (components.hasAuthority) {
					rv += "//";
					if (components.username) {
						rv += components.username;
						if (components.password) rv += ":" + components.password;
						rv += "@";
					}
					rv += components.hostname;
					if (components.port) rv += ":" + components.port;
				}
				rv += components.pathname + components.search + components.hash;
				return rv;
			};

			function URL(url,base) {
				var reference = parseUrl(String(url));
				var resolved;
				if (typeof(base) != "undefined") {
					var baseComponents = parseUrl(String(base));
					if (!baseComponents.scheme) throw new TypeError("Invalid base URL: " + base);
					resolved = resolveUrl(normalizeUrl(baseComponents),reference);
				} else {
					if (!reference.scheme) throw new TypeError("Invalid URL: " + url);
					resolved = reference;
				}
				this._url = normalizeUrl(resolved);
			}

			Object.defineProperty(URL.prototype, "href", {
				get: function() {
					return serializeUrl(this._url);
				},
				set: function(value) {
					var reference = parseUrl(String(value));
					if (!reference.scheme) throw new TypeError("Invalid URL: " + value);
					this._url = normalizeUrl(reference);
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "protocol", {
				get: function() {
					return this._url.scheme + ":";
				},
				set: function(value) {
					var string = String(value);
					var scheme = (string.charAt(string.length-1) == ":") ? string.substring(0,string.length-1) : string;
					if (/^[a-zA-Z][a-zA-Z0-9+.-]*$/.test(scheme)) this._url.scheme = scheme;
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "username", {
				get: function() {
					return this._url.username;
				},
				set: function(value) {
					this._url.username = String(value);
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "password", {
				get: function() {
					return this._url.password;
				},
				set: function(value) {
					this._url.password = String(value);
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "host", {
				get: function() {
					return this._url.hostname + ((this._url.port) ? ":" + this._url.port : "");
				},
				set: function(value) {
					//	Matches observed native behavior: the hostname portion is always applied; the port portion (if any)
					//	is applied only if it consists entirely of digits, and is otherwise left unchanged (an absent or
					//	empty port portion, e.g. "host" or "host:", also leaves the existing port unchanged).
					var string = String(value);
					var index = string.lastIndexOf(":");
					if (index == -1) {
						this._url.hostname = string;
					} else {
						this._url.hostname = string.substring(0,index);
						var port = string.substring(index+1);
						if (/^\d+$/.test(port)) this._url.port = port;
					}
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "hostname", {
				get: function() {
					return this._url.hostname;
				},
				set: function(value) {
					this._url.hostname = String(value);
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "port", {
				get: function() {
					return this._url.port;
				},
				set: function(value) {
					var string = String(value);
					if (/^\d*$/.test(string)) this._url.port = string;
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "pathname", {
				get: function() {
					return this._url.pathname;
				},
				set: function(value) {
					var string = String(value);
					this._url.pathname = (this._url.hasAuthority && string.charAt(0) != "/") ? "/" + string : string;
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "search", {
				get: function() {
					return this._url.search;
				},
				set: function(value) {
					var string = String(value);
					this._url.search = (string == "" || string.charAt(0) == "?") ? string : "?" + string;
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "hash", {
				get: function() {
					return this._url.hash;
				},
				set: function(value) {
					var string = String(value);
					this._url.hash = (string == "" || string.charAt(0) == "#") ? string : "#" + string;
				},
				configurable: true,
				enumerable: true
			});

			Object.defineProperty(URL.prototype, "origin", {
				get: function() {
					if (!this._url.hasAuthority) return "null";
					return this._url.scheme + "://" + this._url.hostname + ((this._url.port) ? ":" + this._url.port : "");
				},
				configurable: true,
				enumerable: true
			});

			URL.prototype.toString = function() {
				return this.href;
			};

			URL.prototype.toJSON = function() {
				return this.href;
			};

			if (Object.defineProperty) {
				Object.defineProperty(global, "URL", {
					value: URL,
					writable: true,
					configurable: true,
					enumerable: false
				});
			} else {
				global.URL = URL;
			}
		}
	}
//@ts-ignore
)();
