//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api {
	export namespace mime {
		/**
		 * Provides APIs relating to MIME types.
		 */
		export interface Export {
			Type: {
				codec: {
					/**
					 * Translates MIME types to and from the standard MIME type declaration format. This translation may be
					 * lossy, discarding comments and changing formatting. See {@link https://tools.ietf.org/html/rfc2045#section-5}.
					 */
					declaration: slime.Codec<slime.mime.Type,string>
				}

				/**
				 * Attempts to determine the MIME type of a resource given its name.
				 *
				 * @param path A resource name.
				 * @returns The type determined from the name, or `undefined` if the type cannot be determined.
				 */
				fromName(path: string): slime.mime.Type

				/**
				 * @deprecated Operations on MIME {@link slime.mime.Type}s are now defined as functions rather than methods.
				 *
				 * Creates a MIME type from its parsed components.
				 *
				 * @param media The MIME media type: for `text/plain`, `"text"`.
				 * @param subtype The MIME subtype: for `text/plain`, `"plain"`.
				 * @param parameters Each property of the object represents a MIME parameter that
				 * will be appended to the MIME type; the name of the property is the name of the parameter, while the value of the property is the
				 * value of the parameter.
				 */
				(media: string, subtype: string, parameters?: { [x: string]: string }): slime.mime.Object

				/**
				 * @deprecated Use `codec.declaration.decode`, which returns a {@link slime.mime.Type} rather than `slime.mime.Object`.
				 *
				 * Parses the given string, returning the appropriate MIME type object.
				 *
				 * @param string A MIME type.
				 */
				parse(string: string): slime.mime.Object

				/**
				 * @deprecated Use `codec.declaration.encode`.
				 *
				 * Converts a MIME type to a string, suitable for a MIME type declaration.
				 */
				toDeclaration(mimeType: slime.mime.Type): string
			}
		}
	}

	export interface Global {
		mime: mime.Export
	}

	//	TODO	According to RFC 2045 section 5.1, matching is case-insensitive
	//			https://tools.ietf.org/html/rfc2045#section-5
	//
	//			types, subtypes, and parameter names are case-insensitive
	//			parameter values are "normally" case-sensitive
	//
	//			TODO	comments are apparently allowed as well, see 5.1
	//
	//			TODO	quotes are also apparently not part of parameter values

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				var subject: slime.$api.mime.Export = fifty.$loader.module("mime.js", {
					Function: fifty.$api.Function,
					deprecate: function(f) {
						return f;
					}
				});

				fifty.verify(subject).is.type("object");

				var verify = fifty.verify;

				fifty.run(function codec() {
					var type = {
						media: "text",
						subtype: "plain",
						parameters: {}
					};

					var encoded = subject.Type.codec.declaration.encode(type);

					verify(encoded).is("text/plain");

					var decoded = subject.Type.codec.declaration.decode(encoded);

					verify(decoded,"decoded", function(it) {
						it.media.is("text");
						it.subtype.is("plain");
						it.parameters.evaluate(function(p) { return Object.keys(p).length; }).is(0);
					});

					fifty.run(function withParameter() {
						var type = {
							media: "text",
							subtype: "plain",
							parameters: { charset: "us-ascii" }
						};

						var encoded = subject.Type.codec.declaration.encode(type);

						verify(encoded).is("text/plain; charset=\"us-ascii\"");
					});
				});

				fifty.run(function fromName() {
					 verify(subject).Type.fromName("foo.js").evaluate(function(p) { return p.toString() }).is("application/javascript");
					 verify(subject).Type.fromName("foo.f").is(void(0));
				});

				fifty.run(function deprecated() {
					fifty.run(function constructorArguments() {
						verify(subject).evaluate(function() {
							return subject.Type(void(0), "plain");
						}).threw.type(Error);

						verify(subject).evaluate(function() {
							return subject.Type(null, "plain");
						}).threw.type(Error);

						verify(subject).evaluate(function() {
							return subject.Type("text", void(0));
						}).threw.type(Error);

						verify(subject).evaluate(function() {
							return subject.Type("text", null);
						}).threw.type(Error);

						verify(subject).evaluate(function() {
							//@ts-expect-error
							return subject.Type("text", "plain", 2);
						}).threw.type(Error);

						verify(subject).evaluate(function() {
							return subject.Type("text", "plain");
						}).threw.nothing();

						verify(subject).evaluate(function() {
							return subject.Type("text", "plain").toString();
						}).is("text/plain");

						verify(subject).evaluate(function() {
							return subject.Type("text", "plain", { charset: "us-ascii" }).toString();
						}).is("text/plain; charset=\"us-ascii\"");
					});
				});
			}
		}
	//@ts-ignore
	)(fifty);
}
