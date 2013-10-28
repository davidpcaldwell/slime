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

var log = function(message) {
	Packages.java.lang.System.out.println(message);
};

var debug = function(message) {
	//	log(message);
}

var Request = function(_request) {
	debug("Creating request peer for " + _request);
	this.method = String(_request.getMethod()).toUpperCase();
	this.path = String(_request.getPathInfo()).substring(1);

	var _query = _request.getQueryString();
	var parameters = [];
	if (_query) {
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
			this.parameters = parameters;
		}
	}

	var headers = [];
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

	//	TODO	it would make more sense for this property to be absent if there is no content
	debug("Creating request body.");
	this.body = new function() {
		//	TODO	what happens if there is no content? Presumably type is null, and is stream empty?
		debug("Creating request type.");
		debug("Content type: " + String(_request.getContentType()));
		debug("mime module: " + $context.api.io.mime);
		try {
			this.type = (_request.getContentType()) ? $context.api.io.mime.Type.parse(String(_request.getContentType())) : null;
		} catch (e) {
			log("Error creating request type.");
			throw e;
		}
		debug("Created request type.");
		this.stream = $context.api.io.java.adapt(_request.getInputStream());
	}
	debug("Created request body.");
}

$exports.Servlet = function(delegate) {
	var script = delegate;
	var _streams = new Packages.inonit.script.runtime.io.Streams();

	this.reload = function(reloaded) {
		script = reloaded;
	};

	this.service = function(_request,_response) {
		log("Received request: method=" + _request.getMethod() + " path=" + _request.getPathInfo());
		try {
			var request = new Request(_request);
			debug("Received request: " + request);
			var response = script.handle(request);
			if (typeof(response) == "undefined") {
				//	TODO	What would it take to write our own error page? Should we try to throw ServletException, for example?
				//			Should we use setStatus and write some sort of error page normally?
				debugger;
				_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Script returned undefined");
			} else if (response === null) {
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
					//	Documented to accept js/mime Type and string
					_response.setContentType(String(response.body.type));
				}
				if (response.body && response.body.string) {
					_response.getWriter().write(response.body.string);
//				} else if (response.body && response.body.read && response.body.read.text) {
//					var _stream = response.body.read.text().java.adapt();
//					_streams.copy(_stream, _response.getWriter());
//					_stream.close();
				} else if (response.body && response.body.stream) {
					_streams.copy(response.body.stream.java.adapt(),_response.getOutputStream());
					//	TODO	next line may be redundant; should check Java API
					response.body.stream.java.adapt().close();
				} else if (response.body && response.body.read && response.body.read.binary) {
					var _stream = response.body.read.binary().java.adapt();
					_streams.copy(_stream,_response.getOutputStream());
					_stream.close();
				}
			} else {
				throw new TypeError("Servlet response is not of a known type.");
			}
		} catch (e) {
			_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		}
	}

	this.destroy = function() {
		if (script.destroy) {
			script.destroy();
		}
	}
}