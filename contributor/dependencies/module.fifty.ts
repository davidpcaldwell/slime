//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.dependencies {
	export interface Context {
		java: {
			version: string
		}

		library: {
			file: slime.jrunscript.file.Exports
		}
	}

	export interface Exports {
		data: {
			rhino: {
				/**
				 * Returns the preferred version of Rhino for the running version of Java.
				 */
				version: slime.$api.fp.Thunk<{
					number: string
					id: string
				}>

				versions: {
					jdk8: string
					default: string
				}

				sources: {
					[version: string]: {
						url: string
						format: string
					}
				}
			}

			nashorn: {
				standalone: {
					version: string
				}
			}

			typescript: {
				version: string
			}

			typedoc: {
				version: string
			}
		}
	}

	export interface Exports {
		typedoc: {
			/**
			 * Write the geneerated Markdown file for use in Typedoc `@include`s to the given location.
			 */
			generate: slime.$api.fp.impure.Effector<slime.jrunscript.file.Location>
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const code: Script = fifty.$loader.script("module.js");
			const subject = code({
				java: {
					version: String(Packages.java.lang.System.getProperty("java.version"))
				},
				library: {
					file: fifty.global.jsh.file
				}
			});

			fifty.tests.suite = function() {
				const verify = fifty.verify;
				const forJava = function(version: string) {
					return code({
						java: { version: version },
						library: { file: fifty.global.jsh.file }
					}).data.rhino.version();
				};
				verify(forJava("1.8.0_412").number).is("1.7.15");
				["11.0", "16.0", "17.0.1"].forEach(function(version) {
					verify(forJava(version).number).is("1.9.1");
				});
			}

			fifty.tests.manual = function() {
				subject.typedoc.generate( fifty.jsh.file.relative("../../local/typedoc/dependencies.md") );
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export type Script = slime.runtime.loader.Scoped<Context,Exports>
}
