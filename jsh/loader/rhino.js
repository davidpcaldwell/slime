//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.native.inonit.script.jsh.Shell } $jsh
	 * @param { slime.jrunscript.native.inonit.script.jsh.Rhino.Interface } $rhino
	 */
	function($jsh,$rhino) {
		$jsh.setRuntime((function() {
			var rv = $rhino.script(
				"jrunscript/rhino.js",
				$jsh.getLoader().getLoaderCode("jrunscript/rhino.js"),
				{ $loader: $jsh.getLoader(), $rhino: $rhino },
				null
			);

			rv.exit = function(status) {
				return $rhino.exit(status);
			};

			rv.jsh = function(configuration,invocation) {
				return $rhino.jsh(configuration,invocation);
			};

			return rv;
		})());
	}
//@ts-ignore
)($jsh,$rhino);
