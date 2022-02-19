//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.web {
	export interface Context {
		/**
		 * An object capable of handling the [percent-encoding](http://tools.ietf.org/html/rfc3986#section-2.1)
		 * (or "URL-encoding") algorithm.
		 */
		escaper: slime.Codec<string,string>
		window?: Window
	}

	export namespace test {
		export const subject: slime.web.Exports = (function(fifty: slime.fifty.test.kit) {
			if (fifty.global.jsh) return fifty.$loader.module("module.js", fifty.$loader.file("context.java.js"));
			if (fifty.global.window) return fifty.$loader.module("module.browser.js");
		//@ts-ignore
		})(fifty);

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				fifty.tests.exports = {};
			}
		//@ts-ignore
		)(fifty);
	}

	/**
	 * An object having several properties representing parts of the URL. These properties are "live" -- they can be
	 * changed, and the URL will reflect the changes.
	 */
	export interface Url {
		scheme: string
		userinfo: string
		host: string

		/**
		 * If a port number is specified in the URL, the port number; otherwise, `undefined`.
		 */
		port: number

		path: string

		/**
		 * The query portion of this URL (with no preceding `?`).
		 */
		query: string
		fragment: string
	}

	export namespace url {
		export interface Api {
			codec: {
				string: slime.Codec<Url,string>
			}
			resolve: (url: Url, reference: string) => Url
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.Url = {};
		}
	//@ts-ignore
	)(fifty);


	export interface Exports {
		Url: url.Api
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const subject = test.subject;
			const { verify, run } = fifty;

			fifty.tests.Url.codec = function() {
				var codec = function(url: string) {
					var parsed = subject.Url.codec.string.decode(url);
					var encoded = subject.Url.codec.string.encode(parsed);
					verify(encoded).is(url);
				}

				run(function full() {
					var url = "scheme://user@server.com:999/path?q=query#section";
					var parsed = subject.Url.codec.string.decode(url);
					verify(parsed,url,function(it) {
						it.scheme.is("scheme");
						it.userinfo.is("user");
						it.host.is("server.com");
						it.port.is(999);
						it.path.is("/path");
						it.query.is("q=query");
						it.fragment.is("section");

					});
					codec(url);
				});

				run(function noUserInfo() {
					var url = "scheme://server.com:999/path?q=query#section";
					var parsed = subject.Url.codec.string.decode(url);
					verify(parsed,url,function(it) {
						it.scheme.is("scheme");
						it.userinfo.is(void(0));
						it.host.is("server.com");
						it.port.is(999);
						it.path.is("/path");
						it.query.is("q=query");
						it.fragment.is("section");
					});
					codec(url);
				});

				run(function noPort() {
					var url = "scheme://server.com/path?q=query#section";
					var parsed = subject.Url.codec.string.decode(url);
					verify(parsed,url,function(it) {
						it.scheme.is("scheme");
						it.userinfo.is(void(0));
						it.host.is("server.com");
						it.port.is(void(0));
						it.path.is("/path");
						it.query.is("q=query");
						it.fragment.is("section");
					});
					codec(url);
				});

				run(function pathOnly() {
					var url = "hello.html";
					var parsed = subject.Url.codec.string.decode(url);
					verify(parsed,url,function(it) {
						verify(parsed).path.is("hello.html");
					});
					codec(url);
				});

				run(function emptyQuery() {
					var url = "scheme://server.tld/page?";
					var parsed = subject.Url.codec.string.decode(url);
					verify(parsed).query.is("");
				});

				run(function noQuery() {
					var url = "scheme://server.tld/page";
					var parsed = subject.Url.codec.string.decode(url);
					verify(parsed).query.is(void(0));
				});

				run(function noScheme() {
					var url = "//www.google.com/path?query#fragment";
					var parsed = subject.Url.codec.string.decode(url);
					verify(parsed,url,function(it) {
						it.scheme.is(void(0));
						it.host.is("www.google.com");
						it.path.is("/path");
						it.query.is("query");
						it.fragment.is("fragment");
					});
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Form {
		controls: form.Control[]
	}

	export namespace form {
		/**
		 * An object representing a name-value pair.
		 */
		export interface Control {
			name: string
			value: string
		}
	}
}

namespace slime.web {
	export namespace object {
		export interface Url extends slime.web.Url {
			form: () => Form

			/**
			 *
			 * @param reference A reference.
			 */
			resolve(reference: string): Url
		}

		export namespace url {
			export interface Argument {
				//	TODO	should authority.host and path also be optional? Check RFC
				scheme?: string
				authority?: {
					host: string
					port?: number
					userinfo?: string
				}
				path: string
				query?: string | form.Control[]
				fragment?: string
			}
		}
	}

	export namespace url {
		export interface Api {
			/**
			 * See [RFC 3986](http://tools.ietf.org/html/rfc3986). The `toString()` supplied for the
			 * {@link Url} object is the string form of the URL.
			 */
			 new (argument: object.url.Argument): object.Url
			 parse: (string: string) => object.Url
			 query: {
				 (array: form.Control[]): string
				 parse: (string: string) => form.Control[]
			 }
		}
	}

	export interface Exports {
		Url: url.Api
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const module = test.subject;
			const { verify } = fifty;

			fifty.tests.exports.Url = {
				query: function() {
					var array = [ { name: "foo", value: "bar" }, { name: "foo", value: "baz" } ];
					verify(module.Url.query(array)).is("foo=bar&foo=baz");
				}
			};

			fifty.tests.object = {};

			fifty.tests.object.Url = Object.assign(
				function() {
					fifty.run(function liveQueryProperty() {
						var url = module.Url.parse("http://www.example.com/path/to/page.html");
						var toString = function(p): string { return p.toString(); };
						fifty.verify(url).evaluate(toString).is("http://www.example.com/path/to/page.html");
						url.query = module.Url.query([
							{ name: "foo", value: "bar" },
							{ name: "foo", value: "baz" }
						]);
						fifty.verify(url).evaluate(toString).is("http://www.example.com/path/to/page.html?foo=bar&foo=baz");
					});

					fifty.run(fifty.tests.object.Url.constructor);
					fifty.run(fifty.tests.object.Url.resolve);
				},
				{
					constructor: function() {
						var one = new module.Url({
							path: "path",
							query: [
								{ name: "foo", value: "bar" }
							]
						});
						fifty.verify(one).evaluate(function(p) { return p.toString(); }).is("path?foo=bar");
					},
					resolve: function() {
						var base = module.Url.parse("http://www.example.com/path/to/page.html?name=value&foo=bar#fragment");
						fifty.run(function() {
							var relative = base.resolve("../foo.js");
							var toString = function(p): string { return p.toString(); };
							fifty.verify(relative).evaluate(toString).is("http://www.example.com/path/foo.js");
						});
						fifty.run(function() {
							var relative = base.resolve("./");
							var toString = function(p): string { return p.toString(); };
							fifty.verify(relative).evaluate(toString).is("http://www.example.com/path/to/");
						});
					}
				}
			)
		}
	//@ts-ignore
	)(fifty);

}

namespace slime.web {
	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.exports.form = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface Form {
			codec: {
				urlencoded: slime.Codec<slime.web.Form,string>
			}
		}

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				fifty.tests.exports.form.codec = function() {
					fifty.verify(1).is(1);
					var form: slime.web.Form = {
						controls: [
							{ name: "foo", value: "bar" }
						]
					};
					var encoded = test.subject.Form.codec.urlencoded.encode(form);
					fifty.verify(encoded).is("foo=bar");

					var decoded = test.subject.Form.codec.urlencoded.decode("foo=bar");
					fifty.verify(decoded).controls.length.is(1);
					fifty.verify(decoded).controls[0].name.is("foo");
					fifty.verify(decoded).controls[0].value.is("bar");
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Form {
			object: () => (form: slime.web.Form) => {
				[x: string]: string
			}
		}

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				fifty.tests.exports.form.object = function() {
					var form: slime.web.Form = {
						controls: [
							{ name: "foo", value: "bar" },
							{ name: "baz", value: "bizzy" }
						]
					}
					var x = test.subject.Form.object()(form);
					fifty.verify(x).foo.is("bar");
					fifty.verify(x).baz.is("bizzy");
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Form {
			Control: {
				isNamed: (name: string) => (control: form.Control) => boolean
			}
		}
	}

	export namespace form {
		export type Argument = argument.UrlEncoded | argument.Controls

		export namespace argument {
			export interface UrlEncoded {
				urlencoded: string
			}

			export interface Controls {
				controls: Control[]
			}
		}

		export interface Object extends Form {
			getUrlencoded: () => string
			getEntityBody: () => {
				type: slime.mime.Type
				string: string
			}
		}
	}

	export namespace exports {
		export interface Form {
			//	TODO	is this the right place for this? Present for jrunscript, not present in browser implementation.
			Multipart?: any

			/**
			 * The MIME type for forms: `application/x-www-form-urlencoded`.
			 */
			type: slime.mime.Type

			/**
			 * Creates a {@link form.Object} that can be used to operate on {@link Form}s in an object-oriented style.
			 */
			construct: (p: form.Argument) => form.Object
		}
	}

	export interface Exports {
		Form: exports.Form & {
			/** @deprecated { Replaced by `construct` function. } */
			new (p: form.Argument): form.Object
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.exports.Form = function() {
				const { verify } = fifty
				const module = test.subject;
				// var module: slime.web.Exports = (function() {
				// 	if (fifty.global.jsh) return fifty.$loader.module("module.js", fifty.$loader.file("context.java.js"));
				// 	if (fifty.global.window) return fifty.$loader.module("module.browser.js");
				// })();

				var one = new module.Form({
					urlencoded: "foo=bar&a=b"
				});
				verify(one).controls[0].name.is("foo");
				verify(one).controls[0].value.is("bar");
				verify(one).controls[1].name.is("a");
				verify(one).controls[1].value.is("b");

				var controls = [{ name: "foo", value: "baz" }, { name: "c", value: "d" }];
				var two = new module.Form({
					controls: controls
				});
				verify(two).getUrlencoded().is("foo=baz&c=d");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * An object representing the current browser window; provides browser-specific APIs.
		 * Present if $context.window supplied.
		 */
		 window?: {
			url: () => object.Url
			query: {
				controls: () => form.Control[]
				object: () => { [name: string]: string }
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const module = test.subject;

			var verify = fifty.verify;

			fifty.tests.exports.window = function() {
				if (fifty.global.window) {
					var module: slime.web.Exports = fifty.$loader.module("module.js", {
						window: {
							location: {
								href: "http://name.tld/page?one=1&two=2"
							}
						},
						escaper: {
							encode: fifty.global.window["escape"],
							decode: fifty.global.window["unescape"]
						}
					});
					var url = module.window.url();
					var form = url.form();
					verify(form).controls.length.is(2);
					verify(form).controls[0].name.is("one");
					verify(form).controls[0].value.is("1");
					verify(form).controls[1].name.is("two");
					verify(form).controls[1].value.is("2");

					//	TODO	add test coverage for module.window.query.controls and module.window.query.object
				}
			}
		}
	//@ts-ignore
	)(fifty);
}

(
	function(fifty: slime.fifty.test.kit) {
		fifty.tests.suite = function() {
			fifty.run(fifty.tests.Url.codec);

			fifty.run(fifty.tests.exports.Url.query);
			fifty.run(fifty.tests.object.Url);

			fifty.run(fifty.tests.exports.Form);
			fifty.run(fifty.tests.exports.form.codec);
			fifty.run(fifty.tests.exports.form.object);
			fifty.run(fifty.tests.exports.window);
		}
	}
//@ts-ignore
)(fifty);

namespace slime.web {
	export type Script = slime.loader.Script<Context,Exports>
}

