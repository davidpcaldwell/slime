declare type api = { convert: (input: number) => number };
declare type factory = slime.Loader.Product<{ scale: number }, api>;

(
	function(fifty: slime.fifty.test.kit) {
		fifty.tests.runtime = {};
		fifty.tests.runtime.exports = {};
	}
//@ts-ignore
)(fifty);

(
	function(
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.runtime.exports.mime = function() {
			var code = fifty.$loader.get("expression.js");
			var js = code.read(String);
			fifty.verify(js).is.type("string");

			var subject: slime.runtime.Exports = (function() {
				var $slime = {
					getRuntimeScript: function(path) {
						var resource = fifty.$loader.get(path);
						return { name: resource.name, js: resource.read(String) }
					}
				};
				var $engine = void(0);
				return eval(js);
			})();

			fifty.verify(subject).mime.is.type("object");

			var verify = fifty.verify;

			run(function parse() {
				var string = "text/plain";
				var type = subject.mime.Type.parse(string);
				verify(type).media.is("text");
				verify(type).subtype.is("plain");
				verify(type).parameters.is.type("object");
				verify(type).parameters.evaluate(function(p) { return Object.keys(p); }).length.is(0);
			});

			run(function fromName() {
			 	verify(subject.mime).Type.fromName("foo.js").evaluate(function(p) { return p.toString() }).is("application/javascript");
			 	verify(subject.mime).Type.fromName("foo.f").is(void(0));
			});

			//	TODO	According to RFC 2045 section 5.1, matching is case-insensitive
			//			https://tools.ietf.org/html/rfc2045#section-5
			//
			//			types, subtypes, and parameter names are case-insensitive
			//			parameter values are "normally" case-sensitive
			//
			//			TODO	comments are apparently allowed as well, see 5.1
			//
			//			TODO	quotes are also apparently not part of parameter values

			run(function constructorArguments() {
				verify(subject.mime).evaluate(function() {
					return subject.mime.Type(void(0), "plain");
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type(null, "plain");
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", void(0));
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", null);
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					//@ts-expect-error
					return subject.mime.Type("text", "plain", 2);
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", "plain");
				}).threw.nothing();

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", "plain").toString();
				}).is("text/plain");

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", "plain", { charset: "us-ascii" }).toString();
				}).is("text/plain; charset=\"us-ascii\"");
			});
		}
	}
//@ts-ignore
)(fifty);

(
	function(
		$loader: slime.fifty.test.$loader,
		verify: slime.fifty.test.verify,
		tests: any
	) {
		tests.loader = {};

		tests.loader.closure = function() {
			var closure: factory = $loader.value("test/data/closure.js");
			var context = { scale: 2 };
			var module = closure(context);
			verify(module).convert(2).is(4);
		};

		tests.loader.$export = function() {
			var file: factory = $loader.factory("test/data/module-export.js");
			var api = file({ scale: 2 });
			verify(api).convert(3).is(6);
		}

		tests.suite = function() {
			run(tests.loader.closure);
			run(tests.runtime.exports.mime);
		}
	}
//@ts-ignore
)($loader,verify,tests)
