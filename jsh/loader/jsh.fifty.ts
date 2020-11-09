(
	function(
		jsh: jsh,
		tests: slime.fifty.test.tests,
		verify: slime.fifty.test.verify
	) {
		tests.suite = function() {
			verify(jsh).io.evaluate.property("Loader").is.type("function");
			var tools: { [x: string]: any } = jsh.io.Loader.tools;
			verify(tools).is.type("object");
			verify(tools).evaluate.property("toExportScope").is.type("function");

			verify(jsh.loader).evaluate.property("factory").is.type("function");
		}
	}
//@ts-ignore
)(jsh,tests,verify);