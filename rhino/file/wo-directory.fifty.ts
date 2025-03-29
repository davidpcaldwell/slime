//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.wo.directory.test {
	export const fixtures = (function(fifty: slime.fifty.test.Kit) {
		const code: slime.jrunscript.file.internal.test.fixtures.Script = fifty.$loader.script("fixtures.ts");
		return code({
			fifty: fifty
		});
	//@ts-ignore
	})(fifty);
}

namespace slime.jrunscript.file.exports.location {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.exports.Location = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Location.directory = fifty.test.Parent();

			fifty.tests.sandbox = fifty.test.Parent();
			fifty.tests.sandbox.locations = fifty.test.Parent();
			fifty.tests.sandbox.locations.directory = fifty.test.Parent();

			fifty.tests.sandbox.filesystem = fifty.test.Parent();
			fifty.tests.sandbox.filesystem.directory = fifty.test.Parent();

			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Directory {}

	export interface Directory {
		base: (base: slime.jrunscript.file.Location) => (relative: string) => slime.jrunscript.file.Location
		relativePath: (path: string) => (p: slime.jrunscript.file.Location) => slime.jrunscript.file.Location
		relativeTo: (location: slime.jrunscript.file.Location) => (p: slime.jrunscript.file.Location) => string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const subject = fifty.global.jsh.file;

			const filesystem = subject.world.filesystems.mock();

			const at = (path: string): slime.jrunscript.file.Location => {
				return {
					filesystem: filesystem,
					pathname: path
				}
			}

			//	TODO	these tests might not pass on Windows

			fifty.tests.exports.Location.directory.relativePath = function() {
				var d = subject.Location.directory.relativePath("d");
				var target = d(at("/a/b/c"));
				verify(target).pathname.is("/a/b/c/d");
			};

			fifty.tests.exports.Location.directory.base = function() {
				var directory = subject.Location.directory.base(at("/a/b/c"));

				var one = directory("d");
				verify(one).pathname.is("/a/b/c/d");
				var two = directory("./d");
				verify(two).pathname.is("/a/b/c/d");
				var three = directory("../d");
				verify(three).pathname.is("/a/b/d");
			};

			fifty.tests.exports.Location.directory.relativeTo = function() {
				var target = at("/a/b/c");
				var relativeOf = subject.Location.directory.relativeTo(target);
				var one = relativeOf(at("/a/b/d"));
				verify(one).is("../d");
				var oneA = relativeOf(at("/a/c"));
				verify(oneA).is("../../c");
				var two = relativeOf(at("/b"));
				verify(two).is("../../../b");
				var three = relativeOf(at("/a/b/c/d"));
				verify(three).is("d");
				var four = relativeOf(at("/a/b/c"));
				verify(four).is("");
			};

			fifty.tests.exports.Location.directory.harvested = function() {
				//	TODO	Not a very good test for Windows filesystem
				var prefix = "/";
				var base = prefix + "foo" + filesystem.separator.pathname + "bar";
				var relative = "baz";
				var b: slime.jrunscript.file.Location = {
					filesystem: filesystem,
					pathname: base
				};
				var bb = subject.Location.directory.base(b);
				verify(bb(relative)).pathname.is(prefix + ["foo", "bar", "baz"].join(filesystem.separator.pathname));
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Directory {
		exists: {
			simple: slime.$api.fp.Mapping<slime.jrunscript.file.Location,boolean>
			world: () => slime.$api.fp.world.Sensor<slime.jrunscript.file.Location, {}, boolean>
		}

		require: (p?: { recursive?: boolean }) => slime.$api.fp.world.Means<world.Location, {
			created: world.Location
			found: world.Location
		}>
	}


	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const subject = jsh.file.world;

			fifty.tests.sandbox.locations.directory.exists = function() {
				var at = fifty.jsh.file.temporary.location();

				var exists = Object.assign($api.fp.world.mapping(subject.Location.directory.exists.world()), { toString: function() { return "exists()"; }});

				verify(at).evaluate(exists).is(false);

				$api.fp.world.process(subject.Location.directory.require()(at))();
				verify(at).evaluate(exists).is(true);

				$api.fp.world.process(subject.Location.directory.require()(at))();
				verify(at).evaluate(exists).is(true);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Directory {
		remove: {
			simple: slime.$api.fp.impure.Output<slime.jrunscript.file.Location>
			world: () => slime.$api.fp.world.Means<slime.jrunscript.file.Location,void>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const exists = {
				directory: $api.fp.world.mapping(jsh.file.world.Location.directory.exists.world())
			};

			fifty.tests.sandbox.locations.directory.remove = function() {
				var tmp = fifty.jsh.file.temporary.directory();

				verify(tmp).evaluate(exists.directory).is(true);

				$api.fp.world.now.action(jsh.file.world.Location.directory.remove.world(), tmp);

				verify(tmp).evaluate(exists.directory).is(false);
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace list {
		export interface Events {
			failed: slime.jrunscript.file.Location
		}
	}

	export interface Directory {
		list: {
			//	TODO	how do errors manifest?
			world: slime.$api.fp.world.Sensor<
				{
					target: slime.jrunscript.file.Location
					descend: slime.$api.fp.Predicate<slime.jrunscript.file.Location>
				},
				list.Events,
				slime.$api.fp.Stream<slime.jrunscript.file.Location>
			>

			iterate: {
				simple: slime.$api.fp.Mapping<slime.jrunscript.file.Location,slime.$api.fp.Stream<slime.jrunscript.file.Location>>
			}

			stream: {
				world: (p?: {
					/**
					 * If provided, is invoked to decide whether the listing will descend into the given directory. By default,
					 * no subdirectories will be traversed.
					 */
					descend: slime.$api.fp.Predicate<slime.jrunscript.file.Location>
				}) => slime.$api.fp.world.Sensor<
					slime.jrunscript.file.Location,
					list.Events,
					slime.$api.fp.Stream<slime.jrunscript.file.Location>
				>,
				simple: (p?: Parameters<Directory["list"]["stream"]["world"]>[0])
					=> slime.$api.fp.world.Simple<ReturnType<Directory["list"]["stream"]["world"]>>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const subject = fifty.global.jsh.file;
			const { fixtures } = slime.jrunscript.file.internal.wo.directory.test;

			fifty.tests.exports.Location.directory.list = function() {
				var fs = fixtures.Filesystem.from.descriptor({
					contents: {
						a: {
							text: ""
						},
						b: {
							text: ""
						},
						c: {
							text: ""
						},
						d: {
							contents: {
								dd: {
									text: ""
								}
							}
						}
					}
				});

				var target = {
					filesystem: fs,
					pathname: ""
				};

				var stream_iterate = $api.fp.Stream.collect(
					$api.fp.world.Sensor.now({
						sensor: subject.Location.directory.list.stream.world(),
						subject: target
					})
				);

				var stream_traverse = $api.fp.Stream.collect(
					$api.fp.world.Sensor.now({
						sensor: subject.Location.directory.list.stream.world({
							descend: function(into) {
								return true;
							}
						}),
						subject: target
					})
				);

				var worldIterator = $api.fp.now(
					target,
					function(location) {
						return {
							target: location,
							descend: $api.fp.Mapping.all(false)
						}
					},
					$api.fp.world.Sensor.mapping({ sensor: subject.Location.directory.list.world }),
					$api.fp.Stream.collect
				);

				var worldTree = $api.fp.now(
					target,
					function(location) {
						return {
							target: location,
							descend: $api.fp.Mapping.all(true)
						}
					},
					$api.fp.world.Sensor.mapping({ sensor: subject.Location.directory.list.world }),
					$api.fp.Stream.collect
				);

				verify(stream_iterate).length.is(4);
				verify(stream_iterate)[0].pathname.is("/a");
				verify(stream_iterate)[1].pathname.is("/b");
				verify(stream_iterate)[2].pathname.is("/c");
				verify(stream_iterate)[3].pathname.is("/d");

				verify(stream_traverse).length.is(5);

				verify(worldIterator).length.is(4);

				verify(worldTree).length.is(5);
			};

			fifty.tests.manual.issue1181 = function() {
				var location = fifty.jsh.file.temporary.location();
				var listing = $api.fp.world.now.question(
					subject.Location.directory.list.stream.world(),
					location,
					{
						failed: function(e) {
							jsh.shell.console("Failed: " + e.detail.pathname);
						}
					}
				);
				var array = $api.fp.Stream.collect(listing);
				jsh.shell.console(array.join(" "));
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Directory {
		loader: {
			synchronous: (p: {
				root: slime.jrunscript.file.Location
			}) => slime.runtime.loader.Synchronous<slime.jrunscript.runtime.Resource>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.sandbox.filesystem.directory.loader = fifty.test.Parent();
			fifty.tests.sandbox.filesystem.directory.loader.synchronous = function() {
				var dir = fifty.jsh.file.temporary.directory();
				var loader = jsh.file.Location.directory.loader.synchronous({ root: dir });

				var resource = loader.get(["a"]);
				verify(resource).present.is(false);

				$api.fp.now.invoke(
					dir,
					jsh.file.Location.directory.relativePath("a"),
					jsh.file.Location.file.write,
					$api.fp.property("string"),
					function(means) {
						$api.fp.world.now.action(
							means,
							{
								value: "foo"
							}
						)
					}
				);

				var resource = loader.get(["a"]);
				verify(resource).present.is(true);
				if (resource.present) {
					var value = resource.value;
					var stream = value.read();
					var string = $api.fp.world.now.ask(jsh.io.InputStream.string(stream));
					verify(string).is("foo");
				}

			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.sandbox.filesystem.directory.move = function() {
				const exists = {
					file: $api.fp.world.mapping(jsh.file.world.Location.file.exists.world()),
					directory: $api.fp.world.mapping(jsh.file.world.Location.directory.exists.world())
				};

				const atFilepath = jsh.file.world.Location.relative("filepath");

				const createDirectoryToMove = $api.fp.impure.Input.map(
					fifty.jsh.file.temporary.location,
					$api.fp.pipe(
						//	TODO	Output.compose?
						$api.fp.impure.tap(
							$api.fp.world.output(jsh.file.world.Location.directory.require())
						),
						$api.fp.impure.tap(
							$api.fp.pipe(
								atFilepath,
								function(location: slime.jrunscript.file.world.Location) {
									var write = jsh.file.world.Location.file.write(location);
									$api.fp.world.now.action(write.string, { value: "contents" })
								}
							)
						)
					)
				)

				fifty.run(function basic() {
					var from = createDirectoryToMove();

					var to = fifty.jsh.file.temporary.location();

					(function before() {
						verify(from).evaluate(exists.directory).is(true);
						verify(from).evaluate(atFilepath).evaluate(exists.file).is(true);
						verify(to).evaluate(exists.directory).is(false);
						verify(to).evaluate(atFilepath).evaluate(exists.file).is(false);
					})();

					$api.fp.world.now.action(
						jsh.file.Filesystem.move,
						{
							filesystem: jsh.file.world.filesystems.os,
							from: from.pathname,
							to: to.pathname
						}
					);

					(function after() {
						verify(from).evaluate(exists.directory).is(false);
						verify(from).evaluate(atFilepath).evaluate(exists.file).is(false);
						verify(to).evaluate(exists.directory).is(true);
						verify(to).evaluate(atFilepath).evaluate(exists.file).is(true);
					})();
				});

				fifty.run(function recursive() {
					var from = createDirectoryToMove();

					var parent = fifty.jsh.file.temporary.location();

					var to = $api.fp.result(parent, jsh.file.world.Location.relative("child"));

					var captor = fifty.$api.Events.Captor({
						created: void(0)
					});

					(function before() {
						verify(from).evaluate(exists.directory).is(true);
						verify(from).evaluate(atFilepath).evaluate(exists.file).is(true);
						verify(to).evaluate(exists.directory).is(false);
						verify(to).evaluate(atFilepath).evaluate(exists.file).is(false);
						verify(captor).events.length.is(0);
					})();

					$api.fp.world.now.action(
						jsh.file.Filesystem.move,
						{
							filesystem: jsh.file.world.filesystems.os,
							from: from.pathname,
							to: to.pathname
						},
						captor.handler
					);

					(function after() {
						verify(from).evaluate(exists.directory).is(false);
						verify(from).evaluate(atFilepath).evaluate(exists.file).is(false);
						verify(to).evaluate(exists.directory).is(true);
						verify(to).evaluate(atFilepath).evaluate(exists.file).is(true);
						verify(captor).events.length.is(1);
					})();
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Directory {
		content: (root: slime.jrunscript.file.Location) => slime.runtime.content.Store<slime.jrunscript.file.Location>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const subject = fifty.global.jsh.file.Location.directory;

			fifty.tests.exports.content = fifty.test.Parent();

			fifty.tests.exports.content.wip = function() {
				var root = fifty.jsh.file.relative(".");
				var content = subject.content(root);

				verify(content).get(["loader.js"]).present.is(true);
				verify(content).get(["foo"]).present.is(false);

				var listing = content.list([]);
				if (!listing.present) {
					verify(true).is(false);
				} else {
					debugger;
					var script = listing.value.find(function(entry) { return entry.name == "loader.js" });
					var absent = listing.value.find(function(entry) { return entry.name == "foo" });
					var folder = listing.value.find(function(entry) { return entry.name == "oo" });

					verify(script).evaluate.property("value").is.type("object");
					verify(script).evaluate.property("value").evaluate.property("pathname").is.type("string");
					verify(script).evaluate.property("value").evaluate.property("get").is.type("undefined");

					verify(absent).is(void(0));

					verify(folder).evaluate.property("store").is.type("object");
					verify(folder).evaluate.property("store").evaluate.property("pathname").is.type("undefined");
					verify(folder).evaluate.property("store").evaluate.property("get").is.type("function");
				}
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.file.internal.wo.directory {
	export interface Context {
		Location: slime.jrunscript.file.internal.loader.Context["library"]["Location"]
		Location_basename: slime.jrunscript.file.Exports["Location"]["basename"]
		Location_relative: slime.jrunscript.file.exports.Location["directory"]["relativePath"]
		Location_directory_exists: ReturnType<slime.jrunscript.file.Exports["Location"]["directory"]["exists"]["world"]>
		ensureParent: slime.$api.fp.world.Means<slime.jrunscript.file.Location, { created: string }>
		remove: slime.$api.fp.world.Means<slime.jrunscript.file.Location,void>
	}

	export type Exports = slime.jrunscript.file.exports.location.Directory

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				fifty.run(fifty.tests.sandbox);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
