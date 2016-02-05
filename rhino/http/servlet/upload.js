var createMultipartParser = function(_request) {
	//	TODO	_request.getParts only works if servlet is annotated with javax.servlet.annotation.MultipartConfig, and we have
	//			no easy way to do that
	var USE_MULTIPARTCONFIG_ANNOTATION = false;
	if (USE_MULTIPARTCONFIG_ANNOTATION && _request.getParts) {
		return function(_request,body) {
			throw new Error("Not compatible currently; see MimeMultipart implementation");
			var rv = [];
			var i = _request.getParts().iterator();
			while(i.hasNext()) {
				var _part = i.next();
				rv.push({
					name: String(_part.getName()),
					//	filename
					type: String(_part.getContentType()),
					//	disposition
					//	description
					stream: $context.api.io.java.adapt(_part.getInputStream()),
					//	headers
					size: Number(_part.getSize())
				});
			}
			return rv;
		};
	} else if ($context.api.java.getClass("javax.mail.internet.MimeMultipart")) {
		return function(_request,body) {
			var _ds = new Packages.javax.mail.util.ByteArrayDataSource(_request.getInputStream(), body.type.toString());
			var _message = new Packages.javax.mail.internet.MimeMultipart(_ds);
			var parts = [];
			for (var i=0; i<_message.getCount(); i++) {
				var _part = _message.getBodyPart(i);
				var headers = (function() {
					var rv = [];
					var _h = _part.getAllHeaders();
					while(_h.hasMoreElements()) {
						var _header = _h.nextElement();
						rv.push( { name: String(_header.getName()), value: String(_header.getValue()) } );
					}
					return rv;
				})();
				var name = (function() {
					for (var i=0; i<headers.length; i++) {
						if (headers[i].name.toLowerCase() == "content-disposition") {
							var parsed = headers[i].value.split("; ");
							for (var j=0; j<parsed.length; j++) {
								var tokens = parsed[j].split("=");
								if (tokens[0] == "name") {
									if (tokens[1].substring(0,1) == "\"") {
										tokens[1] = tokens[1].substring(1,tokens[1].length-1);
									}
									return tokens[1];
								}
							}
						}
					}
				})();
				var stream = $context.api.io.java.adapt(_part.getInputStream());
				var _type = _part.getContentType();
				var type = (_type) ? $context.api.io.mime.Type.parse(String(_type)) : null;
				var part = {
					name: name,
					filename: String(_part.getFileName()),
					resource: new stream.Resource(type),
					headers: headers
				};
				parts.push(part);
			}
			return parts;
		}
	}
}

$set(createMultipartParser);
