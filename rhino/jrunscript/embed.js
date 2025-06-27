//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.jrunscript.Global } $api
	 * @param { slime.jrunscript.bootstrap.Context } $context
	 * @param { slime.runtime.loader.Store } $loader
	 * @param { slime.loader.Export<slime.jrunscript.bootstrap.Exports> } $export
	 */
	function(Packages,JavaAdapter,$api,$context,$loader,$export) {
		/** @type { slime.js.Cast<slime.jrunscript.bootstrap.Exports> } */
		var after = $api.fp.cast.unsafe;

		var jrunscript = {
			$api: {
				debug: ($context.debug) ? function(message) {
					Packages.java.lang.System.err.println("SLIME JRUNSCRIPT BOOTSTRAP EMBED: " + message);
				} : false,
				script: $context.script,
				arguments: ["api"]
			},
			load: function(script) {
				if (script == "nashorn:mozilla_compat.js") return;
				//	for unbuilt / built, script is an absolute path to a file
				var _file = new Packages.java.io.File(script);
				if (_file.exists()) {
					$api.engine.execute(
						{
							name: script,
							js: new Packages.java.lang.String(Packages.java.nio.file.Files.readAllBytes(_file.toPath()))
						},
						{},
						jrunscript
					)
				} else if (typeof(script) == "object" && script && script.name && script.script) {
					$api.engine.execute(
						{
							name: script.name,
							js: script.script
						},
						{},
						jrunscript
					)
				} else if (true) {
					var _url = new Packages.java.net.URL(script);
					var _connection = _url.openConnection();
					/** @type { slime.jrunscript.native.java.io.InputStream } */
					var _stream = _connection.getInputStream();
					var input = $api.jrunscript.io.InputStream.java(_stream);
					var code = input.content.string.simple($api.jrunscript.io.Charset.default);
					$api.engine.execute(
						{
							name: script,
							js: code
						},
						{},
						jrunscript
					);
				} else {
					throw new Error("No implementation to load script [" + script + "]");
				}
			},
			Packages: Packages,
			JavaAdapter: JavaAdapter,
			readFile: void(0),
			readUrl: void(0),
			Java: void(0)
		};

		$loader.run("api.js", {}, jrunscript);
		$export(after(jrunscript.$api));
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$loader,$export);
