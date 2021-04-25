namespace slime.web {
	export interface Context {
		/**
		 * An object capable of handling the [percent-encoding](http://tools.ietf.org/html/rfc3986#section-2.1)
		 * (or "URL-encoding") algorithm.
		 */
		escaper: slime.Codec<string,string>
		window?: Window
	}

	export interface Exports {
		Url: {
			/**
			 * See [RFC 3986](http://tools.ietf.org/html/rfc3986). The `toString()` supplied for the
			 * {@link Url} object is the string form of the URL.
			 */
			new (argument: Url.Argument): Url
			parse: (string: string) => Url
			query: {
				(array: Form.Control[]): string
				parse: (string: string) => Form.Control[]
			}
		}
		Form: new (p: Form.Argument) => Form
		/**
		 * An object representing the current browser window; provides browser-specific APIs.
		 * Present if $context.window supplied.
		 */
		window?: {
			url: () => Url
			query: {
				controls: () => Form.Control[]
				object: () => { [name: string]: string }
			}
		}
	}
}

(
	function(
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.exports = {};
	}
//@ts-ignore
)(fifty);

(
	function(
		fifty: slime.fifty.test.kit
	) {
		var module: slime.web.Exports = (function() {
			if (fifty.global.jsh) return fifty.$loader.module("module.js", fifty.$loader.file("context.java.js"));
			if (fifty.global.window) return fifty.$loader.module("module.browser.js");
		})();

		const { verify } = fifty;

		fifty.tests.exports.Url = {
			parse: function() {
				var one = module.Url.parse("scheme://server.com:999/path?q=query#section");
				verify(one).scheme.is("scheme");
				verify(one).host.is("server.com");
				verify(one).port.is(999);
				verify(one).path.is("/path");
				verify(one).query.is("q=query");
				verify(one).fragment.is("section");

				(function() {
					var url = module.Url.parse("scheme://server.com/path?q=query#section");
					//	TODO	test optional port, since it is a number
					verify(url).scheme.is("scheme");
					verify(url).host.is("server.com");
					verify(url).evaluate.property("port").is(void(0));
					//	TODO	should port be null or undefined
					verify(url).path.is("/path");
					verify(url).query.is("q=query");
					verify(url).fragment.is("section");
				})();

				(function() {
					var url = module.Url.parse("scheme://user@server.com/path?q=query#section");
					//	TODO	test optional port, since it is a number
					verify(url).scheme.is("scheme");
					verify(url).userinfo.is("user");
					verify(url).host.is("server.com");
					//	TODO	should port be null or undefined
					verify(url).path.is("/path");
					verify(url).query.is("q=query");
					verify(url).fragment.is("section");
					verify(url).evaluate(function(p) { return p.toString() }).is("scheme://user@server.com/path?q=query#section");
				})();

				(function() {
					var url = module.Url.parse("hello.html");
					verify(url).path.is("hello.html");
					verify(url).evaluate.property("query").is(void(0));
				})();

				(function emptyQuery() {
					var url = module.Url.parse("scheme://server.tld/page?");
					verify(url).query.is("");
				})();

				(function noQuery() {
					var url = module.Url.parse("scheme://server.tld/page");
					verify(url).evaluate.property("query").is(void(0));
				})();
			},
			query: function() {
				var array = [ { name: "foo", value: "bar" }, { name: "foo", value: "baz" } ];
				verify(module.Url.query(array)).is("foo=bar&foo=baz");
			}
		}

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
			}
		}
	}
//@ts-ignore
)(fifty);



namespace slime.web {

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

		form: () => Form

		/**
		 *
		 * @param reference A reference.
		 */
		resolve(reference: string): Url
	}

	export namespace Url {
		export interface Argument {
			//	TODO	should authority.host and path also be optional? Check RFC
			scheme?: string
			authority?: {
				host: string
				port?: number
				userinfo?: string
			}
			path: string
			query?: string | Form.Control[]
			fragment?: string
		}
	}
}

(
	function(
		fifty: slime.fifty.test.kit
	) {
		var toString = function(p) { return p.toString(); };

		var module: slime.web.Exports = (function() {
			if (fifty.global.jsh) return fifty.$loader.module("module.js", fifty.$loader.file("context.java.js"));
			if (fifty.global.window) return fifty.$loader.module("module.browser.js");
		})();

		fifty.tests.types.Url = Object.assign(
			function() {
				run(function liveQueryProperty() {
					var url = module.Url.parse("http://www.example.com/path/to/page.html");
					fifty.verify(url).evaluate(toString).is("http://www.example.com/path/to/page.html");
					url.query = module.Url.query([
						{ name: "foo", value: "bar" },
						{ name: "foo", value: "baz" }
					]);
					fifty.verify(url).evaluate(toString).is("http://www.example.com/path/to/page.html?foo=bar&foo=baz");
				});

				run(function constructor() {
					var one = new module.Url({
						path: "path",
						query: [
							{ name: "foo", value: "bar" }
						]
					});
					fifty.verify(one).evaluate(function(p) { return p.toString(); }).is("path?foo=bar");
				})

				run(fifty.tests.types.Url.resolve);
			},
			{
				resolve: function() {
					var base = module.Url.parse("http://www.example.com/path/to/page.html?name=value&foo=bar#fragment");
					(function() {
						var relative = base.resolve("../foo.js");
						var toString = function(p) { return p.toString(); };
						fifty.verify(relative).evaluate(toString).is("http://www.example.com/path/foo.js");
					})();
				}
			}
		)
	}
//@ts-ignore
)(fifty);

namespace slime.web {
	export interface Form {
		controls: Form.Control[]
		getUrlencoded: () => string
	}

	export namespace Form {
		/**
		 * An object representing a name-value pair.
		 */
		export interface Control {
			name: string
			value: string
		}

		export type Argument = Argument.UrlEncoded | Argument.Controls

		export namespace Argument {
			export interface UrlEncoded {
				urlencoded: string
			}

			export interface Controls {
				controls: Control[]
			}
		}
	}
}

(
	function(
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.exports.Form = function() {
			const { verify } = fifty
			var module: slime.web.Exports = (function() {
				if (fifty.global.jsh) return fifty.$loader.module("module.js", fifty.$loader.file("context.java.js"));
				if (fifty.global.window) return fifty.$loader.module("module.browser.js");
			})();

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

(
	function(fifty: slime.fifty.test.kit) {
		fifty.tests.suite = function() {
			run(fifty.tests.exports.Form);
			run(fifty.tests.exports.Url.parse);
			run(fifty.tests.exports.Url.query);
			run(fifty.tests.exports.window);
			run(fifty.tests.types.Url);
		}
	}
//@ts-ignore
)(fifty)
