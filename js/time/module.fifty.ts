(
	function(
		$loader: slime.fifty.test.$loader,
		verify: slime.fifty.test.verify,
		tests: slime.fifty.test.tests
	) {
		tests.suite = function() {
			var subject: slime.time.Exports = $loader.module("module.js");

			var when = new subject.When({ unix: 1599143670821 });

			(function(when) {
				var rfc3339 = subject.When.codec.rfc3339.encode(when);
				var decoded = subject.When.codec.rfc3339.decode(rfc3339);
				verify(when).unix.is(decoded.unix);
			})(when);
		}
	}
//@ts-ignore
)($loader,verify,tests)
