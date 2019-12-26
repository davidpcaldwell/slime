//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check

/**
 * @typedef { {
 * 		uri: any
 * } } slime.jrunscript.http.servlet.Request
 */

/**
 * @typedef { {
 * } } slime.jrunscript.http.servlet.Response
 */

/**
 * @typedef {{
 * 		name: string,
 * 		value: string
 * }} slime.jrunscript.http.servlet.Header
 */

/**
 * @typedef { ( request: slime.jrunscript.http.servlet.Request ) => slime.jrunscript.http.servlet.Response } slime.jrunscript.http.servlet.handler
 */

//	TODO	value property is not really optional but it's not clear how to declare the variable otherwise. May need to encapsulate
//			creation in a function or something.
/** @typedef { Array<slime.jrunscript.http.servlet.Header> & { value?: Function } } slime.jrunscript.http.servlet.Headers */

/**
 * @param {*} $context
 * @param {*} $exports
 * @param {*} $loader
 * @param {*} Packages
 */
function defineJrunscriptHttpServletServer($context,$exports,$loader,Packages) {
	var log = $context.api.java.log.named("rhino.http.servlet.server");

	var debug = function(message) {
		log.INFO(message);
	};

	var createMultipartParser = $loader.value("upload.js", { $context: $context });

	var multipartParser;

	/**
	 * @type { new (any) => slime.jrunscript.http.servlet.Request }
	 */
	var Request = function(_request) {
		log.INFO("Creating request peer for %s", _request);

		this.uri = $context.api.web.Url.parse(String(_request.getRequestURI()));

		this.source = new function() {
			this.ip = String(_request.getRemoteAddr());
		};

		this.scheme = String(_request.getScheme());
		this.method = String(_request.getMethod()).toUpperCase();
		this.path = String(_request.getPathInfo()).substring(1);

		var _query = _request.getQueryString();
		if (_query) {
			this.query = new function() {
				var string = String(_query);
				this.string = string;

				// TODO: how to migrate this to be Form object?
				this.form = function() {
					//	Temporarily use argument to help with transitional period from list of controls to full form object
					if (arguments[0] == Object) {
						return new $context.api.web.Form({ urlencoded: this.string });
					} else if (arguments[0] == Array) {
						return $api.deprecate(function() {
							return new $context.api.web.Form({ urlencoded: string }).controls;
						})();
					} else {
						//	may need transitional period in which this throws Error
						return $api.deprecate(function() {
							return new $context.api.web.Form({ urlencoded: string }).controls;
						})();
					}
				}
			}

			Object.defineProperty(this,"parameters",{
				get: $api.deprecate(function() {
					var parameters = [];
					var query = String(_query);
					var tokens = query.split("&");
					for (var i=0; i<tokens.length; i++) {
						var nv = tokens[i].split("=");
						var decode = function(s) {
							return String(Packages.java.net.URLDecoder.decode(s));
						}
						if (nv.length == 2) {
							parameters.push({ name: decode(nv[0]), value: decode(nv[1]) });
						}
					}
					if (parameters.length) {
						return parameters;
					}
				})
			});
		}

		/** @type { slime.jrunscript.http.servlet.Headers } */
		var headers = [];
		headers.value = function(name) {
			//	TODO	more robust check for multiple values, etc.
			var rv = [];
			for (var i=0; i<this.length; i++) {
				if (this[i].name.toLowerCase() == name.toLowerCase()) {
					rv.push(this[i].value);
				}
			}
			if (rv.length) return rv.join(",");
			return null;
		};
		var _names = _request.getHeaderNames();
		while(_names.hasMoreElements()) {
			var _name = _names.nextElement();
			var _values = _request.getHeaders(_name);
			while(_values.hasMoreElements()) {
				var _value = _values.nextElement();
				headers.push({ name: String(_name), value: String(_value) });
			}
		}
		this.headers = headers;

		var user = (function() {
			var _principal = _request.getUserPrincipal();
			if (!_principal) return void(0);
			var _name = _principal.getName();
			return {
				name: String(_name)
			}
		})();

		this.user = user;

		//	TODO	it would make more sense for this property to be absent if there is no content
		this.body = new function() {
			//	TODO	what happens if there is no content? Presumably type is null, and is stream empty?
			log.CONFIG("Request body content type: " + String(_request.getContentType()));
			try {
				this.type = (_request.getContentType()) ? $context.api.io.mime.Type.parse(String(_request.getContentType())) : null;
			} catch (e) {
				log.SEVERE("Error creating request type.");
				throw e;
			}
			log.FINE("Created request type: " + this.type);

			if (this.type && this.type.is("multipart/form-data")) {
				if (!multipartParser) {
					multipartParser = createMultipartParser(_request);
				}
				this.parts = multipartParser(_request,this);
			} else {
				this.stream = $context.api.io.Streams.java.adapt(_request.getInputStream());
			}

			this.form = function() {
				return new $context.api.web.Form({ urlencoded: this.stream.character().asString() });
			}
		}
		log.FINE("Created request body.");
	}

	$exports.Servlet = function(script) {
		this.reload = function(reloaded) {
			script = reloaded;
		};

		this.service = function(_request,_response) {
			debug("Received Java request: method=" + _request.getMethod() + " path=" + _request.getPathInfo());
			try {
				var request = new Request(_request);
				debug("Received request: " + request);
				var response = script.handle(request);
				if (typeof(response) == "undefined") {
					//	TODO	What would it take to write our own error page? Should we try to throw ServletException, for example?
					//			Should we use setStatus and write some sort of error page normally?
					//	TODO	log something
					debugger;
					_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Script returned undefined");
				} else if (response === null) {
					//	TODO	log something
					debugger;
					_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_NOT_FOUND);
				} else if (typeof(response) == "object" && response.status && typeof(response.status.code) == "number") {
					_response.setStatus(response.status.code);
					if (response.headers) {
						response.headers.forEach(function(header) {
							_response.addHeader(header.name, header.value);
						});
					}
					if (response.body && response.body.type) {
						//	Documented to accept loader/mime.api.html Type and string
						_response.setContentType(String(response.body.type));
					}
					if (response.body && typeof(response.body.length) == "number") {
						_response.setContentLength(String(response.body.length));
					}
					if (response.body && response.body.modified instanceof Date) {
						//	TODO	basically untested
						_response.setDateHeader("Last-Modified", response.body.modified.getTime());
						var ifModifiedSince = _request.getDateHeader("If-Modified-Since");
						if (ifModifiedSince != -1) {
							if (response.body.modified.getTime() <= ifModifiedSince) {
								_response.setStatus(Packages.javax.servlet.http.HttpServletResponse.SC_NOT_MODIFIED);
								return;
							}
						}
					}
					//	TODO	implement more intelligent caching
					//	For now, be conservative; force re-validation of every request
					_response.addHeader("Cache-Control", "max-age=0");
					if (response.body && response.body.read && response.body.read.binary) {
						$context.api.io.Streams.binary.copy(response.body.read.binary(),_response.getOutputStream());
					// } else if (response.body && response.body.read && response.body.read.text) {
					// 	var _stream = response.body.read.text().java.adapt();
					// 	_streams.copy(_stream, _response.getWriter());
					// 	_stream.close();
					//	TODO	Not sure whether this if-else chain could open stream multiple times
					} else if (response.body && !response.body.stream && response.body.string) {
						//	Wrap in java.lang.String because Nashorn string type does not unambiguously match .write() signature
						_response.getWriter().write(new Packages.java.lang.String(response.body.string));
					} else if (response.body && response.body.stream) {
						$context.api.io.Streams.binary.copy(response.body.stream,_response.getOutputStream());
					}
				} else {
					throw new TypeError("Servlet response is not of a known type.");
				}
			} catch (e) {
				debug("Error creating request peer: " + e + " stack " + e.stack);
				_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			}
		}

		this.destroy = function() {
			if (script.destroy) {
				script.destroy();
			}
		}
	}
};

//@ts-ignore
defineJrunscriptHttpServletServer($context,$exports,$loader,Packages);
