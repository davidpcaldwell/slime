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

			//	Got 1599187454916 from 2020-09-04T02:44:14.917Z
			var sample = "2020-09-04T02:44:14.917Z";
			var desired = 1599187454917;
			debugger;
			var decoded = subject.When.codec.rfc3339.decode(sample);
			verify(decoded).unix.is(desired);
		}
	}
//@ts-ignore
)($loader,verify,tests)
