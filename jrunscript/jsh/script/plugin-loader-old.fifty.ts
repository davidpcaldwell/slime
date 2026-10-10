//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Augments the top-level `jsh.loader` object (with `module`, `file`, `run`, and `value` methods) to accept strings and
 * {@link slime.web.Url} objects.
 */
namespace slime.jsh.script.internal.loader_old {
	export type Context = void

	export type Exports = (plugin: slime.jsh.plugin.Scope["plugin"], jsh: slime.jsh.plugin.Scope["jsh"]) => void

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				const script: Script = fifty.$loader.script("plugin-loader-old.js");
				const { jsh } = fifty.global;
				const { verify } = fifty;
				const testPlatform = function(separator: string, absolute: string[], relative: string[]) {
					var paths: string[] = [];
					var routes: string[] = [];
					const original = function(code?: string) { routes.push("original"); return code; };
					const scriptRelative = function() { routes.push("relative"); };
					const shell = {
						web: jsh.web,
						file: {
							world: { filesystems: { os: { separator: { pathname: separator } } } },
							Pathname: function(path: string) {
								paths.push(path);
								return { file: { pathname: {}, directory: false } };
							}
						},
						script: { loader: { module: scriptRelative, file: scriptRelative, value: scriptRelative, run: scriptRelative } },
						loader: { module: original, file: original, value: original, run: original },
						http: {
							Client: function() {
								this.Loader = function() {
									return { module: function() { routes.push("url"); } };
								};
							}
						}
					};
					script()(function(definition) {
						definition.load();
					}, shell as unknown as slime.jsh.plugin.Scope["jsh"]);
					["module", "file", "value", "run"].forEach(function(operation) {
						absolute.forEach(function(path) {
							var before = paths.length;
							shell.loader[operation](path);
							verify(paths.length).is(before + 1);
							verify(paths[paths.length - 1]).is(path);
							verify(routes[routes.length - 1]).is("original");
						});
						relative.forEach(function(path) {
							var before = paths.length;
							shell.loader[operation](path);
							verify(paths.length).is(before);
							verify(routes[routes.length - 1]).is("relative");
						});
					});
					var before = paths.length;
					shell.loader.module("https://example.com/module.js");
					verify(paths.length).is(before);
					verify(routes[routes.length - 1]).is("url");
				};
				testPlatform("/", ["/module.js", ""], ["module.js", "../module.js"]);
				testPlatform("\\", ["C:\\module.js", "C:/module.js", "C:module.js", "\\\\host\\module.js", "//host/module.js"], ["module.js", "..\\module.js", "", "\\module.js"]);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.runtime.loader.Scoped<Context,Exports>
}
