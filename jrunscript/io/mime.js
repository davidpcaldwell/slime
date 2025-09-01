//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.io.mime.Context } $context
	 * @param { slime.jrunscript.io.mime.Exports } $exports
	 */
	function(Packages,JavaAdapter,$api,$context,$exports) {
		//	Mime objects have the following properties:
		//	type: the MIME type of the content
		//	ONE OF:
		//		$stream: a java.io.InputStream or java.io.Reader
		//		stream: a rhino/file InputStream or Reader
		//		string: a JavaScript string containing data
		//		$write: a method that can be used to write the data to an arbitrary java.io.OutputStream

		//	TODO	find callers in case API needs to be changed
		//	grep --exclude-dir=rhino/mime --exclude-dir=http/client --exclude-dir=google --exclude-dir=mail -R Multipart *

		//	Old name for this variable
		if ($context.gae) {
			$api.deprecate(function() {
				$context.nojavamail = true;
			})();
		}

		var index = 0;

		//	TODO	this should not be jsh-specific, but should move to SLIME Java runtime.
		//	TODO	validate subtype and parts using new validation framework, and share the validation between these implementations
		$exports.Multipart = function(p) {
			//	Defer the check for the MimeMultipart class until after this is invoked, which hopefully will be after all plugins load, due to Rhino bug(?) in
			//	LiveConnect only checking for Java classes once

			var getDisposition = function(part) {
				if (!part.disposition && subtype == "form-data") {
					part.disposition = "form-data";
				}
				if (part.disposition) {
					var attributes = [];
					if (part.name) {
						attributes.push({ name: "name", value: part.name });
					}
					if (part.filename) {
						attributes.push({ name: "filename", value: part.filename });
					}
					if (attributes.length) {
						attributes.unshift({});
					}
					var attributesString = attributes.map(function(attribute) { if (!attribute.name) return ""; return attribute.name + "=" + "\"" + attribute.value + "\"" }).join("; ");
					return part.disposition + attributesString;
				}
			};

			/**
			 *
			 * @param { slime.jrunscript.io.mime.Part } part
			 * @returns { slime.jrunscript.runtime.old.Resource }
			 */
			function getResource(part) {
				if (part.resource) return part.resource;
				return $api.deprecate(function() {
					if (part.string) {
						var buffer = new $context.api.io.Buffer();
						var stream = buffer.writeText();
						stream.write(part.string);
						stream.close();
						return new $context.api.io.Resource({
							type: part.type,
							stream: {
								binary: buffer.readBinary()
							}
						});
					} else if (part.stream) {
						return new $context.api.io.Resource({
							type: part.type,
							stream: {
								binary: part.stream
							}
						})
					}
				})();
			}

			var subtype = p.subtype;
			var parts = p.parts;

			if ($context.nojavamail || typeof(Packages.javax.mail.internet.MimeMultipart) != "function") {
				Packages.java.lang.System.err.println("Creating inonit multipart");
				var buffer = new $context.api.io.Buffer();
				var writer = buffer.writeText();
				var CRLF = "\r\n";
				index++;
				var BOUNDARY = "----=_SLIME_MULTIPART_HACK_" + index;
				parts.forEach( function(part) {

					/** @type { slime.jrunscript.runtime.old.Resource } */
					var resource = getResource(part);

					if (arguments[1] != 0) {
						writer.write(CRLF);
					}
					writer.write("--" + BOUNDARY + CRLF);
					//	TODO	test filename present and absent
					var disposition = getDisposition(part);
					if (disposition) {
						writer.write("Content-Disposition: " + disposition + CRLF);
					}
					if (resource.type) {
						writer.write("Content-Type: " + resource.type + CRLF);
					}
					writer.write(CRLF);
					$context.api.io.Streams.binary.copy(resource.read.binary(), buffer.writeBinary());
				});
				writer.write(CRLF);
				writer.write("--" + BOUNDARY + "--" + CRLF);
				writer.close();
				var stream = buffer.readBinary();
				return Object.assign(
					new $context.$slime.Resource({
						stream: {
							binary: stream
						},
						type: $api.mime.Type("multipart", subtype, { boundary: BOUNDARY })
					}),
					{
						java: {
							adapt: function() {
								//	in this case, cannot adapt to native type
								return void(0);
							}
						}
					}
				);
			} else {
				var $mail = Packages.javax.mail;
				var $multipart = new $mail.internet.MimeMultipart(subtype);

				/**
				 *
				 * @param { slime.jrunscript.io.mime.Part } part
				 */
				var toDataHandler = function(part) {
					var bytes = new Packages.java.io.ByteArrayOutputStream();
					var resource = getResource(part);
					$context.api.io.Streams.binary.copy(resource.read.binary(),bytes);
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
				};

				parts.forEach( function(part) {
					var $part = new $mail.internet.MimeBodyPart();
					if (part.filename) {
						$part.setFileName(part.filename);
					}
					$part.setDataHandler(toDataHandler(part));
					var disposition = getDisposition(part);
					if (disposition) {
						$part.setDisposition(disposition);
					}
					if (part.type) {
						$part.setHeader("Content-Type", part.type);
					}
					$multipart.addBodyPart($part);
				});

				/** @type { slime.jrunscript.io.mime.Multipart } */
				var rv = Object.assign(
					new $context.api.io.Resource({
						type: $api.mime.Type.parse(String($multipart.getContentType())),
						read: {
							binary: function() {
								var buffer = new $context.api.io.Buffer();
								$multipart.writeTo(buffer.writeBinary().java.adapt());
								buffer.close();
								return buffer.readBinary();
							}
						}
					}),
					{
						java: {
							adapt: function() {
								return $multipart;
							}
						}
					}
				);
				return rv;
			}
		};

		$exports.Type = Object.assign(
			$api.mime.Type,
			{
				guess: $api.deprecate(
					function(p) {
						if (!p.name) throw new TypeError("argument must be a string.");
						var _rv = Packages.java.net.URLConnection.getFileNameMap().getContentTypeFor(p.name);
						if (!_rv) return void(0);
						return $api.mime.Type.parse(String(_rv));
					}
				)
			}
		)
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$exports);
