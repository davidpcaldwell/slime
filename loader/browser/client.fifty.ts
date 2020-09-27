(
	function(
		verify: slime.fifty.test.verify,
		tests: slime.fifty.test.tests
	) {
		tests.suite = function() {
			verify(1).is(1);
		}
	}
//@ts-ignore
)(verify, tests)