//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.jsh.test {
	export interface Exports {
	}

	export type Script = slime.loader.Script<void,Exports>;

	(
		function($export: slime.loader.Export<Exports>) {
			// const shells: {
			// 	unbuilt: slime.$api.fp.impure.Input<string>
			// 	built: slime.$api.fp.impure.Input<string>
			// 	packaged: slime.$api.fp.impure.Input<string>
			// 	remote: slime.$api.fp.impure.Input<string>
			// } = (
			// 	function() {
			// 		var getTemporaryLocationProperty: (name: string) => slime.$api.fp.impure.Input<string> = function() {

			// 		}

			// 		var inTemporaryLocation = function(p: {
			// 			propertyName: string
			// 			build: (destination: string) => void
			// 		}) {
			// 			var location =
			// 		}

			// 		return {
			// 			unbuilt: function() {
			// 				return fifty.jsh.file.relative("../../../");
			// 			},
			// 			built: function() {

			// 			}
			// 		}
			// 	}
			// )();

			$export({
			});
		}
	//@ts-ignore
	)($export);
}
