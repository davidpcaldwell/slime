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

			run(function parse() {
				var verify = fifty.verify;
				var string = "text/plain";
				var type = subject.mime.Type.parse(string);
				verify(type).getMedia().is("text");
				verify(type).getSubtype().is("plain");
				verify(type).getParameters().is.type("object");
				verify(type).getParameters().evaluate(function(p) { return Object.keys(p); }).length.is(0);
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
