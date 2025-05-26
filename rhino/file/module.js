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
			/** @type { slime.jrunscript.file.internal.java.Script } */
			java: $loader.script("java.js"),
			/** @type { slime.jrunscript.file.internal.wo.Script } */
			wo: $loader.script("wo.js"),
			/** @type { slime.jrunscript.file.internal.mock.Script } */
			mock: $loader.script("mock.js"),
			/** @type { slime.jrunscript.file.internal.oo.Script } */
			oo: $loader.script("oo.js")
		}

		var world = code.java({
			api: {
				io: $context.api.io
			}
		});

		var mock = code.mock({
			library: {
				java: $context.api.java,
				io: $context.api.io
			}
		});

		var wo = code.wo({
			library: {
				java: $context.api.java,
				io: $context.api.io,
				loader: $context.api.loader
			},
			filesystem: {
				os: world.filesystems.os
			},
		})

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

		$export({
			world: {
				filesystems: {
					os: world.filesystems.os,
					mock: mock.filesystem
				},
				Location: wo.Location
			},
			mock: mock,
			Location: wo.Location,
			Filesystem: wo.Filesystem,
			os: wo.os,
			action: oo.action,
			filesystem: oo.filesystem,
			filesystems: oo.filesystems,
			list: oo.list,
			Loader: oo.Loader,
			navigate: oo.navigate,
			object: oo.object,
			Pathname: oo.Pathname,
			Searchpath: oo.Searchpath,
			state: oo.state,
			zip: oo.zip,
			unzip: oo.unzip,
			Streams: oo.Streams,
			java: oo.java
		});
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export)
