//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.shell.internal.tsc.Context } $context
	 * @param { slime.loader.Export<slime.jsh.shell.internal.tsc.Exports> } $export
	 */
	function($api,$context,$export) {
		var manifest = $api.fp.world.now.question(
			$context.library.file.Location.file.read.string.world(),
			$context.library.file.Location.from.os($context.node + "/lib/node_modules/typescript/package.json")
		);
		if (!manifest.present) throw new Error("TypeScript package.json not found.");
		/** @type { { version: string } } */
		var metadata = JSON.parse(manifest.value);
		if (!/^[0-9]+\./.test(metadata.version)) throw new Error("Invalid TypeScript version: " + metadata.version);
		var majorVersion = Number(metadata.version.split(".")[0]);

		var compile = function(code) {
			var tmp = $api.fp.world.now.question(
				$context.library.file.Location.from.temporary($context.library.file.world.filesystems.os),
				{
					directory: true
				}
			);
			var ts = $context.library.file.Location.relative("code.ts")(tmp);
			$api.fp.world.now.action(
				$context.library.file.Location.file.write.old(ts).string,
				{ value: code }
			);

			var js = $context.library.file.Location.relative("code.js")(tmp);

			var getNodeBinPath = function() {
				return $context.node + $context.library.file.world.filesystems.os.separator.pathname + "bin";
			};

			var Packages = (function() { return this; })().Packages;

			var result = $api.fp.world.now.question(
				$context.library.shell.subprocess.question,
				{
					command: $context.tsc,
					arguments: $api.Array.build(function(rv) {
						rv.push("--outDir", tmp.pathname);
						rv.push("--target", "ES5");
						rv.push("--strict", "false");
						rv.push("--alwaysStrict", "false");
						rv.push("--module", "ES6");
						if (majorVersion >= 6) {
							rv.push("--moduleDetection", "legacy");
							rv.push("--ignoreDeprecations", "6.0");
						}
						rv.push(ts.pathname);
					}),
					directory: tmp.pathname,
					environment: function(existing) {
						return $api.Object.compose(
							existing,
							{
								PATH: getNodeBinPath() + $context.library.file.world.filesystems.os.separator.searchpath + existing.PATH
							}
						);
					},
					stdio: {
						output: "line",
						error: "line"
					}
				},
				{
					stdout: function(e) {
						//	TODO	can design an eventing solution starting here
					},
					stderr: function(e) {
						//	TODO	can design an eventing solution starting here
					}
				}
			);

			if (result.status != 0) {
				//	we ignore these errors; they often have to do with namespaces not being found, and so forth, but as long as the
				//	JavaScript is output we go with it.
			}

			var rv = $api.fp.world.now.question(
				$context.library.file.Location.file.read.string.world(),
				js
			);

			if (!rv.present) throw new Error("Error attempting to compile TypeScript.");

			var updated = rv.value.replace("export {};", "/* Removed by rhino/shell/tsc.js: export {}; */");

			return updated;
		};

		$export({
			compile: compile
		});
	}
//@ts-ignore
)($api,$context,$export);
