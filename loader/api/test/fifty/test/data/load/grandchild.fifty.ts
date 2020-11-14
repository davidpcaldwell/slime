(
	function(
		verify: slime.fifty.test.verify,
		tests: slime.fifty.test.tests
	) {
		tests.types.Object = function(object: { a: number }) {
			verify(object).a.is(1);
		}
	}
//@ts-ignore
)(verify, tests)