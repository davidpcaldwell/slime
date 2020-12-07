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

			// fifty.tests.types.Url = {
			// 	resolve: function() {
			// 		var base = module.Url.parse("http://www.example.com/path/to/page.html?name=value&foo=bar#fragment");
			// 		(function() {
			// 			var relative = base.resolve("../foo.js");
			// 			var toString = function(p) { return p.toString(); };
			// 			fifty.verify(relative).evaluate(toString).is("http://www.example.com/path/foo.js");
			// 		})();
			// 	}
			// }
		}
	//@ts-ignore
	)(fifty);


	export namespace Url {
		export interface Argument {
			scheme?: string
			authority?: {
				host: string
				port: number
				userinfo?: string
			}
			path: string
			query: string | Form.Control[]
			fragment?: string
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {

		}
	//@ts-ignore
	)(fifty);

}

namespace slime.web {
	export interface Form {
		controls: Form.Control[]
		getUrlencoded: () => string
	}

	export namespace Form {
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
	function(fifty: slime.fifty.test.kit) {
		var verify = fifty.verify;

		var module: slime.web.Exports = (function() {
			if (fifty.global.jsh) return fifty.$loader.module("module.js", fifty.$loader.file("context.java.js"));
			if (fifty.global.window) return fifty.$loader.module("module.browser.js");
		})();

		fifty.tests.suite = function() {
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

			run(fifty.tests.types.Url);
		}
	}
//@ts-ignore
)(fifty)
