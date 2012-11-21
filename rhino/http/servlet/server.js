var Request = function(_request) {
}

$exports.Servlet = function(script) {
	this.service = function(_request,_response) {
		try {
			var response = script.handle(new Request(_request));
			if (typeof(response) == "undefined") {
				_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} else if (response === null) {
				_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_NOT_FOUND);
			} else if (typeof(response) == "object" && response.status && response.headers && response.body) {
				_response.setStatus(response.status.code);
				response.headers.forEach(function(header) {
					_response.addHeader(header.name, header.value);
				});
				if (response.body.type) {
					_response.setContentType(response.body.type);
				}
				if (response.body.string) {
					_response.getWriter().write(response.body.string);
				} else if (response.body.stream) {
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
