//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var Request = function(_request) {
	this.path = String(_request.getPathInfo()).substring(1);
}

$exports.Servlet = function(script) {
	var _streams = new Packages.inonit.script.runtime.io.Streams();

	this.service = function(_request,_response) {
		try {
			var response = script.handle(new Request(_request));
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
					_response.setContentType(response.body.type);
				}
				if (response.body && response.body.string) {
					_response.getWriter().write(response.body.string);
				} else if (response.body && response.body.stream) {
					_streams.copy(response.body.stream.java.adapt(),_response.getOutputStream());
					response.body.stream.java.adapt().close();
				}
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