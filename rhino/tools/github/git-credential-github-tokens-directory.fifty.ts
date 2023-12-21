//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.github.credentials {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
		}
	}

	export interface Project {
		base: slime.jrunscript.file.Location
	}

	export interface Exports {
		update: slime.$api.fp.world.Means<
			{
				project: Project
				user: string
				token: string
			},
			{
				wrote: {
					user: string
					destination: slime.jrunscript.file.Location
				}
			}
		>
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("git-credential-github-tokens-directory.js");
			return script({
				library: {
					file: fifty.global.jsh.file
				}
			});
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.sandbox = fifty.test.Parent();

			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const { subject } = test;

			fifty.tests.sandbox.update = function() {
				verify(1).is(1);
				verify(subject).is.not(null);
				var base = fifty.jsh.file.temporary.directory();
				var wrote: { user: string, destination: slime.jrunscript.file.Location };
				$api.fp.world.now.action(
					subject.update,
					{
						project: {
							base: base
						},
						user: "foo",
						token: "bar"
					},
					{
						wrote: function(e) {
							wrote = e.detail;
						}
					}
				);
				verify(wrote).is.not(void(0));
				var dir = $api.fp.now.invoke(
					base,
					//	TODO	should be obtained from API
					jsh.file.Location.directory.relativePath("local/github/tokens")
				);
				var file = $api.fp.now.invoke(
					dir,
					jsh.file.Location.directory.relativePath("foo")
				);
				verify(dir).evaluate($api.fp.world.mapping(jsh.file.Location.directory.exists())).is(true);
				verify(file).evaluate($api.fp.world.mapping(jsh.file.Location.file.exists())).is(true);
				verify(file).evaluate(function(location) {
					return jsh.file.Location.file.read.string()(location);
				}).evaluate(function(question) {
					return $api.fp.world.now.ask(question);
				}).evaluate(function(r) {
					if (!r.present) throw new Error("!r.present");
					var value: string = r.value;
					verify(value).is("bar");
				})
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.sandbox);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
