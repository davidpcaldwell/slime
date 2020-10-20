(
	function(
		verify: slime.fifty.test.verify,
		tests: slime.fifty.test.tests
	) {
		tests.suite = function() {
			var values = {
				a: "1"
			};

			var encoded = $api.jrunscript.Properties.codec.object.encode(values);
			jsh.shell.console(String(encoded));
			verify(encoded).getProperty("a").evaluate(String).is("1");
			verify(encoded).getProperty("foo").is(null);

			var decoded = $api.jrunscript.Properties.codec.object.decode(encoded);
			verify(decoded).a.is("1");
			verify(decoded).evaluate.property("foo").is(void(0));
		}
	}
//@ts-ignore
)(verify, tests);
