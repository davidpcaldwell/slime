(
	function(
		tests: slime.fifty.test.tests,
		verify: slime.fifty.test.tests
	) {
		tests.suite = function() {
			verify(1).is(1);
		}
	}
//@ts-ignore
)(tests, verify)
