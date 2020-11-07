declare type api = { convert: (input: number) => number };
declare type factory = slime.Loader.Product<{ scale: number }, api>;

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
		}
	}
//@ts-ignore
)($loader,verify,tests)
