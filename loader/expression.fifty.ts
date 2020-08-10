(
	function(
		verify: slime.definition.verify.Verify,
		tests: any
	) {
		tests.suite = function() {
			verify(1).is(1);
		}
	}
//@ts-ignore
)(verify,tests)
