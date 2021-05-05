(
	function(
		fifty: slime.fifty.test.kit
	) {
		const subject: slime.jrunscript.shell.Exports["invocation"] = fifty.$loader.module("invocation.js");

		fifty.tests.suite = function() {
			var verify = fifty.verify;
			run(function() {
				var sudoed = subject.sudo()({
					command: "ls"
				});

				verify(sudoed).command.evaluate(String).is("sudo");
				verify(sudoed).arguments[0].is("ls");
			});
		}
	}
//@ts-ignore
)(fifty);
