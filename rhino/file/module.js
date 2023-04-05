//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.file.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.file.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
		if (!$context.api) throw new Error("Missing 'api' member of context");
		if ($context.$pwd && typeof($context.$pwd) != "string") {
			throw new Error("$pwd is " + typeof($context.$pwd) + ".");
		}

		var code = {
			/** @type { slime.jrunscript.file.internal.world.Script } */
			world: $loader.script("world.js"),
			/** @type { slime.jrunscript.file.internal.mock.Script } */
			mock: $loader.script("mock.js"),
			/** @type { slime.jrunscript.file.internal.oo.Script } */
			oo: $loader.script("oo.js")
		}

		var world = code.world({
			library: {
				io: $context.api.io
			}
		});

		var mock = code.mock({
			library: {
				java: $context.api.java,
				io: $context.api.io
			}
		});

		var oo = code.oo({
			api: {
				java: $context.api.java,
				io: $context.api.io
			},
			library: {
				world: world
			},
			pathext: $context.pathext,
			cygwin: $context.cygwin,
			addFinalizer: $context.addFinalizer
		});

		$export(
			$api.Object.compose(
				{
					world: world,
					mock: mock
				},
				oo
			)
		);
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export)
