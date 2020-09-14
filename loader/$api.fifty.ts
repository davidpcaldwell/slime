//@ts-check
(
	function(
		verify: slime.definition.verify.Verify,
		$api: $api,
		tests: any
	) {
		tests.exports = {};

		tests.exports.Error = function() {
			var Type = $api.Error.Type({
				name: "foo",
				extends: TypeError
			});

			try {
				throw new Type("bar");
			} catch (e) {
				//	Given that stack is non-standard, not adding this to suite and not really asserting on its format
				verify("stack").is(e.stack);
			}
		};

		tests.suite = function() {
			var CustomError = $api.Error.Type({
				name: "Custom"
			});

			var ParentError = $api.Error.Type({
				name: "Parent",
				extends: TypeError
			});

			var ChildError = $api.Error.Type({
				name: "Child",
				extends: ParentError
			});

			try {
				throw new CustomError("hey", { custom: true });
			} catch (e) {
				verify(e instanceof CustomError).is(true);
				verify(e instanceof ParentError).is(false);
				verify(e instanceof ChildError).is(false);
				verify(e instanceof TypeError).is(false);
				verify(Boolean(e.custom)).is(true);
				verify(String(e.message)).is("hey");
				verify(String(e.toString())).is("Custom: hey");
			}

			try {
				throw new ParentError("how", { custom: true });
			} catch (e) {
				verify(e instanceof CustomError).is(false);
				verify(e instanceof ParentError).is(true);
				verify(e instanceof ChildError).is(false);
				verify(e instanceof TypeError).is(true);
			}

			try {
				throw new ChildError("now", { custom: true });
			} catch (e) {
				verify(e instanceof CustomError).is(false);
				verify(e instanceof ParentError).is(true);
				verify(e instanceof ChildError).is(true);
				verify(e instanceof TypeError).is(true);
			}
		}
	}
//@ts-ignore
)(verify,$api,tests)
