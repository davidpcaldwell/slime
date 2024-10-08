//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit.mock.web.github {
	export interface Context {
		jsh: slime.jsh.Global
	}

	export type Exports = (p: {
		src: slime.jsh.unit.mock.web.github.src
		private?: boolean
	}) => slime.jsh.unit.mock.handler;

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
