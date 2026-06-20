//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		const { verify } = fifty;

		fifty.tests.suite = function() {
			const jsh = fifty.jsh.file.relative("../jsh").pathname.toString();

			const engines = fifty.global.jsh.shell.run({
				command: "bash",
				arguments: [jsh, "-engines"],
				stdio: {
					output: String
				},
				evaluate: function(result) {
					verify(result).status.is(0);
					return JSON.parse(result.stdio.output);
				}
			});

			verify(engines).evaluate(Array.isArray).is(true);
			engines.forEach(function(engine) {
				verify(engine).evaluate(function(value) {
					return typeof(value);
				}).is("string");
			});

		}
	}
//@ts-ignore
)(fifty);
