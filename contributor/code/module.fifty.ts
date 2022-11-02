//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.code {
	export interface Context {
		library: {
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports
			git: slime.jrunscript.tools.git.Exports
			code: slime.tools.code.Exports
		}
	}

	export type on = {
		unknownFileType: (p: slime.tools.code.File) => void
		change: (p: { file: slime.tools.code.File, line: { number: number, content: string } } ) => void
		changed: (p: slime.tools.code.File) => void
		unchanged: (p: slime.tools.code.File) => void
	}

	export interface Exports {
		files: {
			isText: slime.tools.code.isText

			exclude: slime.tools.code.Excludes

			trailingWhitespace: (p: {
				base: slime.jrunscript.file.Directory
				nowrite?: boolean
			}) => slime.$api.fp.world.old.Tell<slime.tools.code.FileEvents & slime.tools.code.TrailingWhitespaceEvents>

			toHandler: (on: on) => slime.$api.events.Handler<slime.tools.code.FileEvents & slime.tools.code.TrailingWhitespaceEvents>
		}

		directory: {
			lastModified: <T>(p: {
				loader: slime.runtime.loader.Synchronous<T>
				map: (t: T) => slime.jrunscript.runtime.Resource
			}) => slime.$api.fp.Maybe<number>
		}

		git: {
			lastModified: (p: {
				base: string
			}) => slime.$api.fp.Maybe<number>
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			jsh.loader.plugins(fifty.jsh.file.object.getRelativePath(".").directory);

			var subject = jsh.project.code;

			fifty.tests.manual = {};

			fifty.tests.manual.lastModified = fifty.test.Parent();

			var fileLoader = jsh.file.world.Location.directory.loader.synchronous({ root: fifty.jsh.file.relative("../..") });

			var javaLoader = jsh.io.loader.from.java(
				Packages.inonit.script.engine.Code.Loader.create(
					fifty.jsh.file.object.getRelativePath("../..").java.adapt()
				)
			);

			fifty.tests.manual.lastModified.java = $api.fp.pipe(
				$api.fp.impure.Input.value(javaLoader),
				function(loader) {
					return {
						loader: loader,
						map: jsh.io.Resource.from.java
					}
				},
				subject.directory.lastModified,
				function(it) {
					if (it.present) {
						jsh.shell.console("Modified: " + it.value);
						// jsh.shell.console("Latest: " + ( (it.value.path.length) ? it.value.path.join("/") + "/" : "" ) + it.value.name + " at " + JSON.stringify(it.value.resource.modified()));
					} else {
						jsh.shell.console("Error.");
					}
				}
			);

			fifty.tests.manual.lastModified.file = $api.fp.pipe(
				$api.fp.impure.Input.value(fileLoader),
				function(loader): Parameters<slime.project.code.Exports["directory"]["lastModified"]>[0] {
					return {
						loader: loader,
						map: function(resource: slime.jrunscript.file.internal.loader.Resource) {
							return resource;
						}
					}
				},
				subject.directory.lastModified,
				function(it) {
					if (it.present) {
						jsh.shell.console("Modified: " + it.value);
						// jsh.shell.console("Latest: " + ( (it.value.path.length) ? it.value.path.join("/") + "/" : "" ) + it.value.name + " at " + JSON.stringify(it.value.resource.modified()));
					} else {
						jsh.shell.console("Error.");
					}
				}
			);

			fifty.tests.manual.lastModified.git = $api.fp.pipe(
				$api.fp.impure.Input.value( fifty.jsh.file.relative("../..").pathname ),
				function(src) {
					return { base: src }
				},
				subject.git.lastModified,
				function(it) {
					if (it.present) {
						jsh.shell.console("Modified: " + it.value);
					} else {
						jsh.shell.console("Error.");
					}
				}
			)
		}
	//@ts-ignore
	)(Packages,fifty);


	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
