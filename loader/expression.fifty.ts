(
	function(
		$loader: slime.fifty.test.$loader,
		verify: slime.fifty.test.verify,
		tests: any
	) {
		tests.suite = function() {
			var closure: slime.Loader.Product<{ scale: number }, { convert: (input: number) => number }> = $loader.value("test/data/closure.js");
			var context = { scale: 2 };
			var module = closure(context);
			verify(module).convert(2).is(4);
		}
	}
//@ts-ignore
)($loader,verify,tests)
