(
	function(
		tests: slime.fifty.test.tests,
		load: slime.fifty.test.load
	) {
		tests.suite = function() {
			load("grandchild.fifty.ts", "types.Object", { a: 1 });
		}
	}
//@ts-ignore
)(tests, load);
