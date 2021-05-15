//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { { module: slime.jrunscript.git.Exports }} $context
	 * @param { { init: slime.jrunscript.git.Exports["init"] }} $exports
	 */
	function($context,$exports) {
		var module = $context.module;

		$exports.init = function(p) {
			var rv = module.init(p);
			rv.execute({
				command: "config",
				arguments: [
					"user.email", "slime@davidpcaldwell.com"
				]
			});
			rv.execute({
				command: "config",
				arguments: [
					"user.name", "David P. Caldwell"
				]
			});
			return rv;
		};
	}
//@ts-ignore
)($context,$exports);
