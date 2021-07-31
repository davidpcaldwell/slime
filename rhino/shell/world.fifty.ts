//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	export interface Exports {
		world: {
			run: (invocation: Invocation) => slime.$api.fp.impure.Tell<{
				exit: number
			}>
		}
	}

	(
		function(
			$api: slime.$api.Global,
			fifty: slime.fifty.test.kit
		) {
			const subject = fifty.global.jsh.shell;

			fifty.tests.suite = function() {
				var bogus: Invocation = subject.Invocation({
					command: "foobarbaz"
				});

				(function() {
					var tell = subject.world.run(bogus);
					fifty.verify(tell).evaluate(function(f) { return f(); }).threw.type(Error);
					fifty.verify(tell).evaluate(function(f) { return f(); }).threw.name.is("JavaException");
				})();

				var directory = fifty.$loader.getRelativePath(".").directory;

				if (fifty.global.jsh.shell.PATH.getCommand("ls")) {
					var ls = subject.Invocation({
						command: "ls",
						directory: directory
					});
					var status: number;
					subject.world.run(ls)({
						exit: function(e) {
							status = e.detail;
						}
					});
					fifty.verify(status).is(0);

					fifty.run(function checkErrorOnNonZero() {
						var lserror = $api.Object.compose(ls, {
							arguments: ["--foo"]
						});
						var status: number;
						subject.world.run(lserror)({
							exit: function(e) {
								status = e.detail;
							}
						});
						fifty.verify(status).is(1);
					});
				}
			}
		}
	//@ts-ignore
	)($api,fifty);

}