//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/io SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	Mime objects have the following properties:
//	type: the MIME type of the content
//	ONE OF:
//		$stream: a native java.io.InputStream or java.io.Reader
//		stream: a rhino/file InputStream or Reader
//		string: a JavaScript string containing data
//		$write: a method that can be used to write the data to an arbitrary java.io.OutputStream

//	TODO	find callers in case API needs to be changed
//	grep --exclude-dir=rhino/mime --exclude-dir=http/client --exclude-dir=google --exclude-dir=mail -R Multipart *

var _streams = ($context._streams) ? $context._streams : new Packages.inonit.script.runtime.io.Streams();

//	Old name for this variable
if ($context.gae) {
	$api.deprecate(function() {
		$context.nojavamail = true;
	})();
}

//	TODO	validate subtype and parts using new validation framework, and share the validation between these implementations
$exports.Multipart = function(p) {
	//	Defer the check for the MimeMultipart class until after this is invoked, which hopefully will be after all plugins load, due to Rhino bug(?) in
	//	LiveConnect only checking for Java classes once
	if ($context.nojavamail || typeof(Packages.javax.mail.internet.MimeMultipart) != "function") {
		var subtype = p.subtype;
		var parts = p.parts;
		var buffer = new $context.api.io.Buffer();
		var writer = buffer.writeText();
		var CRLF = "\r\n";
		if (arguments.callee.index) {
			arguments.callee.index++;
		} else {
			arguments.callee.index = 1;
		}
		var BOUNDARY = "----=_SLIME_MULTIPART_HACK_" + arguments.callee.index;
		parts.forEach( function(part) {
			if (arguments[1] != 0) {
				writer.write(CRLF);
			}
			writer.write("--" + BOUNDARY + CRLF);
			if (part.type) {
				writer.write("Content-Type: " + part.type + CRLF);
			}
			//	TODO	test filename present and absent
			if (part.disposition) {
				var filename = (part.filename) ? "; filename=" + part.filename : "";
				writer.write("Content-Disposition: " + part.disposition + filename + CRLF);
			}
			writer.write(CRLF);
			if (typeof(part.string) == "string") {
				writer.write(part.string);
			} else if (part.stream) {
				$context.api.io.Streams.binary.copy(part.stream,buffer.writeBinary());
			} else {
				throw new TypeError("Unimplemented: part = " + part + ((part && typeof(part) == "object") ? " keys=" + Object.keys(part) : ""));
			}
		});
		writer.write(CRLF);
		writer.write("--" + BOUNDARY + "--" + CRLF);
		writer.close();
		return new buffer.readBinary().Resource(new $context.api.mime.Type("multipart", subtype, { boundary: BOUNDARY }));
	} else {
		var subtype = p.subtype;
		var parts = p.parts;
		var $mail = Packages.javax.mail;
		var $multipart = new $mail.internet.MimeMultipart(subtype);

		var toDataHandler = function(part) {
			var bytes = new Packages.java.io.ByteArrayOutputStream();
			var characters = new Packages.java.io.OutputStreamWriter(bytes);
			if (false) {
			} else if (part.stream && part.stream.java && typeof(part.stream.java.adapt) == "function" && $context.api.java.isJavaType(Packages.java.io.InputStream)(part.stream.java.adapt())) {
				_streams.copy(part.stream.java.adapt(),bytes);
			} else if (part.string) {
				characters.write(part.string);
				characters.flush();
			}
			bytes.close();
			return new Packages.javax.activation.DataHandler(new JavaAdapter(Packages.javax.activation.DataSource, new function() {
				this.getInputStream = function() {
					return new Packages.java.io.ByteArrayInputStream(bytes.toByteArray());
				}
				this.getOutputStream = function() {
					throw "Inapplicable";
				}
				this.getName = function() {
					return "MIME part";
				}
				this.getContentType = function() {
					return (part.type) ? String(part.type) : null;
				}
			}));
		}
		parts.forEach( function(part) {
			var $part = new $mail.internet.MimeBodyPart();
			if (part.filename) {
				$part.setFileName(part.filename);
			}
			$part.setDataHandler(toDataHandler(part));
			if (part.disposition) {
				$part.setDisposition(part.disposition);
			}
			if (part.type) {
				$part.setHeader("Content-Type", part.type);
			}
			$multipart.addBodyPart($part);
		});

		return new $context.api.io.Resource({
			type: $context.api.mime.Type.parse(String($multipart.getContentType())),
			read: {
				binary: function() {
					var buffer = new $context.api.io.Buffer();
					$multipart.writeTo(buffer.writeBinary().java.adapt());
					buffer.close();
					return buffer.readBinary();
				}
			}
		});
	}
};

$exports.Type = $context.api.mime.Type;

$exports.Type.guess = function(p) {
	if (p.name) {
		var _rv = Packages.java.net.URLConnection.getFileNameMap().getContentTypeFor(p.name);
		if (!_rv) return function(){}();
		return $context.api.mime.Type.parse(String(_rv));
	} else {
		throw new TypeError("argument must be a string.");
	}
}