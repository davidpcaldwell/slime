//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.jrunscript.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.Scope["plugins"] } plugins
	 * @param { slime.runtime.loader.Store } $loader
	 * @param { slime.jsh.plugin.Scope["plugin"] } plugin
	 */
	function(Packages,$api,jsh,plugins,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(plugins.launcher);
			},
			load: function() {
				var target = {
					$api: plugins.launcher,
					Packages: Packages
				};

				$loader.run("main.js", {}, target);

				jsh.internal = {
					bootstrap: target.$api,
					api: void(0)
				};
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.internal && jsh.internal.bootstrap && jsh.file);
			},
			load: function() {
				var Library = function(bootstrap) {
					var javaUrlToLocation = $api.fp.pipe(
						function(/** @type { slime.jrunscript.native.java.net.URL }*/_url) { return new Packages.java.io.File(_url.toURI() )},
						jsh.file.Location.from.java.File
					);

					return {
						version: bootstrap.version,
						download: $api.fp.pipe(
							jsh.file.Location.java.File.simple,
							bootstrap.download,
							$api.fp.Array.map(javaUrlToLocation)
						),
						local: $api.fp.pipe(
							jsh.file.Location.java.File.simple,
							bootstrap.local,
							$api.fp.now(
								$api.fp.Partial.match({
									if: function(/** @type { slime.jrunscript.native.java.net.URL[] } */t) { return t === null; },
									then: function(t) { return /** @type { slime.jrunscript.file.Location[] }*/(null); }
								}),
								$api.fp.Partial.else($api.fp.Array.map(javaUrlToLocation))
							)
						)
					}
				};

				jsh.internal.api = {
					Library: Library,
					rhino: {
						forCurrentJava: $api.fp.Thunk.map(
							jsh.internal.bootstrap.java.getMajorVersion,
							jsh.internal.bootstrap.rhino.forJava,
							Library
						)
					}
				}
			}
		});
	}
//@ts-ignore
)(Packages,$api,jsh,plugins,$loader,plugin);
