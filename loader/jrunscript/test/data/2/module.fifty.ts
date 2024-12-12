//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime.test.javac {
	export interface Context {
		echo: slime.$api.fp.impure.Effect<string>
	}

	export interface Exports {
		multiply: (a: number, b: number) => number
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.suite = function() {
				jsh.loader.java.add({
					//	TODO	#1816
					//	@ts-ignore
					src: {
						loader: {
							get: function(path) {
								var file = fifty.jsh.file.object.getRelativePath(path);
								if (!file.directory && !file.file) return null;
								return {
									java: {
										adapt: function() {
											return Packages.inonit.script.engine.Code.Loader.Resource.create(file.java.adapt());
										}
									}
								}
							}
						}
					}
				});

				var script: Script = fifty.$loader.script("module.js");

				var module = script(
					new function() {
						this.echo = function(message) {
							Packages.java.lang.System.err.println(message);
						}
					}
				);

				verify(module).multiply(2,3).is(6);
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
