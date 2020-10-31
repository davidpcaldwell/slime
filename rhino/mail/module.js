//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JavaMail interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check
(
	/**
	 * @param { any } JavaAdapter
	 * @param { slime.jrunscript.mail.Context } $context
	 * @param { slime.jrunscript.mail.Exports } $exports
	 */
	function(JavaAdapter,$context,$exports) {
		var _Address = function(value) {
			var rv = new Packages.javax.mail.internet.InternetAddress();
			if (typeof(value) == "string") {
				rv.setAddress(value);
			} else if (typeof(value) == "object") {
				if (value.name) {
					rv.setPersonal(value.name);
				}
				rv.setAddress(value.email);
			}
			return rv;
		};
		_Address.toJava = function(addresses) {
			return $context.api.java.toJavaArray(addresses.map(_Address), Packages.javax.mail.Address );
		}

		var Message_toPeer = function(_session) {
			var _rv = new Packages.javax.mail.internet.MimeMessage(_session);

			_rv.setFrom(_Address(this.from));
			_rv.setSubject(this.subject);
			//	TODO	Reply-To: address?
			["to","cc","bcc"].forEach(function(kind) {
				var array = (this[kind]) ? this[kind] : [];
				_rv.setRecipients(Packages.javax.mail.Message.RecipientType[kind.toUpperCase()], _Address.toJava(array));
			}, this);

			var bodyparts = [];
			if (this.text) {
				bodyparts.push({
					type: new $context.api.mime.Type("text", "plain"),
					string: this.text
				});
			}
			if (this.html) {
				bodyparts.push({
					type: new $context.api.mime.Type("text", "html"),
					string: this.html.toString()
				});
			}
			if (bodyparts.length == 0) {
				bodyparts.push({
					type: new $context.api.mime.Type("text", "plain"),
					string: ""
				});
			}
			var attachments = (this.attachments) ? this.attachments : [];

			var DataSource = function(p) {
				return new JavaAdapter(
					Packages.javax.activation.DataSource,
					new function() {
						this.getInputStream = function() {
							return p.resource.read.binary().java.adapt();
						};

						this.getOutputStream = function() {
							//	TODO	In JavaMail, this is appropriate, although perhaps this should be made a Java peer of Resource that should be easily
							//			available from that object
							throw new Error();
						};

						this.getContentType = function() {
							jsh.shell.echo("Content type: " + p.resource.type.toString());
							return p.resource.type.toString();
						};

						this.getName = function() {
							return (p.name) ? p.name : null;
						};
					}
				);
			};

			var Part = function(resource) {
				this.resource = resource;
				this.type = resource.type;
				this.stream = resource.read.binary();
			};

			var DataHandler = Packages.javax.activation.DataHandler;
			jsh.shell.echo("Packages.javax.mail.Session = " + Packages.javax.mail.Session);
			var MimeMultipart = Packages.javax.mail.internet.MimeMultipart;

			var body = (function() {
				if (bodyparts.length == 1) {
					//	TODO	probably, for consistency, should use the DataSource mechanism used below
					return bodyparts[0];
				} else {
					var alternative = new $context.api.mime.Multipart({
						subtype: "alternative",
						parts: bodyparts
					});
					return new Part(alternative);
				}
			})();

			if (!attachments.length) {
				throw new Error("Unimplemented; type checking below failed.");
				// 		if (body.resource) {
				// 			jsh.shell.echo("body.resource with no attachments");
				// //			_rv.setDataHandler(new DataHandler(DataSource({ resource: body.resource })));
				// 			_rv.setContent(new MimeMultipart(DataSource({ resource: body.resource })));
				// 		} else {
				// 			jsh.shell.echo("no body.resource with no attachments");
				// 			//	TODO	probably, for consistency, should use the DataSource mechanism
				// 			_rv.setContent(body.string,body.type.toString());
				// 		}
			} else {
				//	TODO	the below is confusing. We know that if attachments.length is 0, this is a multipart
				jsh.shell.echo("attachments: body=" + body + " attachments=" + attachments);
				var content = new $context.api.mime.Multipart({
					subtype: "mixed",
					parts: [body].concat(attachments)
				});
				_rv.setDataHandler(new DataHandler(DataSource({ resource: content })));
			}
			return _rv;
		};

		var Message = function() {
		};

		/**
		 *
		 * @param { Parameters<slime.jrunscript.mail.Exports["Session"]>[0] } p
		 */
		function Session(p) {
			if (!p) p = {
				properties: void(0)
			};
			var properties = (function() {
				if (p.properties) return p.properties;
				if (p["_properties"]) return $api.jrunscript.Properties.codec.object.decode(p["_properties"]);
				return {};
			})();

			var _session = Packages.javax.mail.Session.getInstance(
				$api.jrunscript.Properties.codec.object.encode(properties)
			);

			var _transport;

			/** @type { slime.jrunscript.mail.Session } */
			var rv = {
				send: (p.credentials) ? function(message) {
					var _message = Message_toPeer.call(message,_session);
					if (true) {
						//	gmail
						if (!_transport) {
							_transport = _session.getTransport();
							_transport.connect(p.credentials.user, p.credentials.password);
						}
						var before = Packages.java.lang.Thread.currentThread().getContextClassLoader();
						Packages.java.lang.Thread.currentThread().setContextClassLoader(_session.getClass().getClassLoader());
						_transport.sendMessage(_message,_message.getAllRecipients());
						Packages.java.lang.Thread.currentThread().setContextClassLoader(before);
					} else {
						//	GAE (untested)
						//	Packages.javax.mail.Transport.send(_message);
					}
				} : void(0),
				Message: function(o) {
					var _message = new Packages.javax.mail.internet.MimeMessage(_session);

					_message.setFrom(_Address(o.from));

					if (o.to) {
						if (typeof(o.to) == "object" && (!(o.to instanceof Array))) {
							o.to = [o.to];
						}
						o.to.forEach(function(recipient) {
							var _address = (function() {
								if (recipient.address && recipient.name) {
									return new Packages.javax.mail.internet.InternetAddress(
										recipient.address,
										recipient.name
									)
								} else if (recipient.address) {
									return new Packages.javax.mail.internet.InternetAddress(
										recipient.address
									)
								}
								throw new Error();
							})();
							_message.setRecipients(Packages.javax.mail.Message.RecipientType.TO, jsh.java.Array.create({
								type: Packages.javax.mail.Address,
								array: [
									_address
								]
							}))
						});
					}

					if (o.subject) {
						_message.setSubject(o.subject);
					}

					if (o.multipart) {
						Packages.java.lang.System.err.println("_message = " + Object.keys(_message) + " class=" + _message.getClass().getName());
						Packages.java.lang.System.err.println("o.multipart.java.adapt() = " + o.multipart.java.adapt());
						_message.setContent(o.multipart.java.adapt());
					}

					return {
						resource: (function() {
							jsh.shell.console("context class loader: " + Packages.java.lang.Thread.currentThread().getContextClassLoader());
							var _baos = new Packages.java.io.ByteArrayOutputStream();
							var before = Packages.java.lang.Thread.currentThread().getContextClassLoader();
							Packages.java.lang.Thread.currentThread().setContextClassLoader(_message.getClass().getClassLoader());
							_message.writeTo(_baos);
							Packages.java.lang.Thread.currentThread().setContextClassLoader(before);
							_baos.close();
							var _bytes = _baos.toByteArray();
							return new jsh.io.Resource({
								type: "message/rfc822",
								read: {
									binary: function() {
										return jsh.io.java.adapt(new Packages.java.io.ByteArrayInputStream(_bytes));
									}
								}
							});
						})()
					}
				},
				java: {
					adapt: function() {
						return _session;
					}
				}
			};
			return rv;
		};
		Session.properties = {
			GMAIL: {
				"mail.store.protocol": "imaps",
				"mail.imaps.host": "imap.gmail.com",
				"mail.transport.protocol": "smtps",
				"mail.smtps.host": "smtp.gmail.com",
				"mail.smtps.port": "465",
				"mail.smtps.auth": "true"
			}
		};

		$exports.Session = Session;
	}
//@ts-ignore
)(JavaAdapter,$context,$exports);
