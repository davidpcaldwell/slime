//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides APIs relating to the Apache Maven build tool, including the ability to install Maven.
 *
 * APIs are described by the {@link slime.jrunscript.tools.maven.Exports} object. In `jsh` shells, these APIs are available as the
 * `jsh.tools.maven` object.
 *
 * The module also provides a `mvnw.jsh.js` script that can be used to configure the Maven wrapper on a project, optionally first creating
 * the project using a Maven archetype. See {@link slime.jrunscript.tools.maven.script.mvnw}.
 */
namespace slime.jrunscript.tools.maven {
	export interface Context {
		HOME: slime.jrunscript.file.Directory
		java: slime.jrunscript.shell.Exports["java"]
		mvn: any

		library: {
			document: slime.runtime.document.Exports
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			install: slime.jrunscript.tools.install.Exports
		}

		jsh: {
			js: slime.$api.old.Exports & {
				document: any
			}
			io: slime.jrunscript.io.Exports
			shell: slime.jsh.Global["shell"]
			document: slime.jsh.Global["document"]
		}
	}

	export namespace test {
		export const subject = (
			function(fifty: slime.fifty.test.Kit) {
				const { jsh } = fifty.global;
				var script: Script = fifty.$loader.script("module.js");
				return script({
					library: {
						document: jsh.document,
						file: jsh.file,
						shell: jsh.shell,
						install: jsh.tools.install
					},
					HOME: jsh.shell.HOME,
					java: jsh.shell.java,
					mvn: jsh.shell.PATH.getCommand("mvn"),
					jsh: jsh
				})
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();

			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Installation {
		home: string
	}

	export namespace installation {
		export interface Exports {}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Installation = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		Installation: installation.Exports
	}

	export namespace installation {
		export interface Exports {
			require: {
				world: slime.$api.fp.world.Means<
					{
						installation: maven.Installation
						accept?: (version: string) => boolean
						version: string
					},
					{
						found: { version: string }
						installed: { version: string }
					}
				>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;
				const { subject } = test;

				fifty.tests.exports.Installation.require = function() {
					var tmp = fifty.jsh.file.temporary.location();

					fifty.run(
						function() {
							var captor = fifty.$api.Events.Captor({ found: void(0), installed: void(0) });
							$api.fp.world.Means.now({
								means: subject.Installation.require.world,
								order: {
									installation: {
										home: tmp.pathname
									},
									version: "3.9.6"
								},
								handlers: captor.handler
							});
							verify(captor).events.length.is(1);
							verify(captor).events[0].type.is("installed");
						}
					);

					fifty.run(
						function() {
							var captor = fifty.$api.Events.Captor({ found: void(0), installed: void(0) });
							$api.fp.world.Means.now({
								means: subject.Installation.require.world,
								order: {
									installation: {
										home: tmp.pathname
									},
									version: "3.9.6"
								},
								handlers: captor.handler
							});
							verify(captor).events.length.is(1);
							verify(captor).events[0].type.is("found");
						}
					);

					fifty.run(
						function() {
							var captor = fifty.$api.Events.Captor({ found: void(0), installed: void(0) });
							$api.fp.world.Means.now({
								means: subject.Installation.require.world,
								order: {
									installation: {
										home: tmp.pathname
									},
									accept: function(version) { return true; },
									version: "3.9.5"
								},
								handlers: captor.handler
							});
							verify(captor).events.length.is(1);
							verify(captor).events[0].type.is("found");
						}
					);

					fifty.run(
						function() {
							var captor = fifty.$api.Events.Captor({ found: void(0), installed: void(0) });
							$api.fp.world.Means.now({
								means: subject.Installation.require.world,
								order: {
									installation: {
										home: tmp.pathname
									},
									version: "3.9.5"
								},
								handlers: captor.handler
							});
							verify(captor).events.length.is(2);
							verify(captor).events[0].type.is("found");
							verify(captor).events[0].detail.evaluate.property("version").is("3.9.6");
							verify(captor).events[1].type.is("installed");
						}
					);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace installation {
		export interface Exports {
			exists: {
				world: slime.$api.fp.world.Sensor<maven.Installation, void, boolean>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Installation.exists = function() {

				}
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;
				const { subject } = test;

				fifty.tests.manual.exists = function() {
					var installation: maven.Installation = {
						home: jsh.shell.environment.MAVEN_HOME
					};

					var exists = $api.fp.world.Sensor.now({
						sensor: subject.Installation.exists.world,
						subject: installation
					});

					jsh.shell.console("Exists: " + installation.home + "?: " + exists);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace installation {
		export interface Exports {
			version: {
				world: slime.$api.fp.world.Sensor<maven.Installation, void, string>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;
				const { subject } = test;

				fifty.tests.manual.version = function() {
					var installation: maven.Installation = {
						home: jsh.shell.environment.MAVEN_HOME
					};

					var version = $api.fp.world.Sensor.now({
						sensor: subject.Installation.version.world,
						subject: installation
					});

					jsh.shell.console("Version: " + installation.home + ": " + version);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	/**
	 * A type representing a potential Maven invocation and providing the ability to specify some common options. This
	 * type can be used in conjunction with `toShellIntention()` to create a
	 * {@link slime.jrunscript.shell.run.Intention shell intention}. If less-common options
	 * need to be passed to Maven, they can be added by post-processing the shell intention.
	 */
	export interface Intention {
		project: string
		properties?: {
			[name: string]: string
		}
		repository?: string
		profiles?: string[]
		settings?: {
			user?: string
			global?: string
		}
		debug?: boolean
		batchMode?: boolean
		commands: string[]
	}

	export interface Exports {
		shell: {
			Intention: (p: {
				javaHome?: string
				installation: Installation
				intention: Intention
			}) => slime.jrunscript.shell.run.Intention
		}
	}

	export namespace xml {
		export interface Attribute {
			name: string
			value: string
		}

		export interface AnyElement {
			name: string
			attributes?: Attribute[]
		}

		export interface VoidElement extends AnyElement {
		}

		export interface ValueElement extends AnyElement {
			value: string
		}

		export interface ParentElement extends AnyElement {
			children: Element[]
		}

		export type Element = ParentElement | ValueElement | VoidElement

		export interface Indentation {
			position: string
			offset: string
		}
	}

	export interface Exports {
		xml: {
			edit: {
				insert: {
					element: (p: {
						parent: (document: slime.runtime.document.Document) => slime.runtime.document.Element
						after: (parent: slime.runtime.document.Element) => slime.runtime.document.Element
						lines?: number
						indent: string
						element: xml.Element
					}) => (pom: string) => string
				}

				replace: {
					with: {
						element: (p: {
							parent: (document: slime.runtime.document.Document) => slime.runtime.document.Element
							target: (parent: slime.runtime.document.Element) => slime.runtime.document.Element
							indent: string
							element: xml.Element
						}) => (pom: string) => string
					}
				}

				remove: {
					element: (p: {
						parent: (document: slime.runtime.document.Document) => slime.runtime.document.Element
						target: (parent: slime.runtime.document.Element) => slime.runtime.document.Element
					}) => (pom: string) => string
				}
			}

			Element: {
				/**
				 * Allows the access and manipulation of a Maven element's <dfn>value</dfn>. The "value" is the text enclosed in the element; for example, for
				 * `<artifactId>foo</artifactId>`, it is `"foo"`.
				 */
				value: {
					/**
					 * Returns the given element's value. If the element is not of the correct structure - it is empty, or has
					 * multiple children, or has a child other than a text node - this method throws an exception.
					 */
					get: (element: slime.runtime.document.Element) => string

					set: (value: string) => (element: slime.runtime.document.Element) => void
				}
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const { subject } = test;

			var getDependencies = function(parent: slime.runtime.document.Parent) {
				return parent.children.find(jsh.document.Node.isElementNamed("dependencies"));
			};

			var getVersion = function(parent: slime.runtime.document.Parent) {
				return parent.children.find(jsh.document.Node.isElementNamed("version"));
			}

			fifty.tests.exports.xml = fifty.test.Parent();

			fifty.tests.exports.Element = fifty.test.Parent();

			fifty.tests.exports.Element.value = function() {
				var project = $api.fp.now(
					fifty.jsh.file.relative("test/quickstart-pom.xml"),
					jsh.file.Location.file.read.string.simple,
					jsh.document.Document.codec.string.decode,
					jsh.document.Document.element
				);

				var version = getVersion(project);

				verify(version).evaluate(subject.xml.Element.value.get).is("1.0.0");
				$api.fp.now(version, subject.xml.Element.value.set("2.0.0"));
				verify(version).evaluate(subject.xml.Element.value.get).is("2.0.0");
			}

			fifty.tests.manual.xml = function() {
				var pom = $api.fp.now(
					fifty.jsh.file.relative("test/quickstart-pom.xml"),
					jsh.file.Location.file.read.string.simple
				);

				var child: slime.jrunscript.tools.maven.xml.Element = {
					name: "bar",
					value: "baz"
				};

				var descendants: slime.jrunscript.tools.maven.xml.Element = {
					name: "bizzy",
					children: [
						{
							name: "boom",
							value: "shaka-laka"
						}
					]
				};

				var foo: slime.jrunscript.tools.maven.xml.Element = {
					name: "foo",
					children: [
						child,
						descendants
					]
				};

				var getProperties = function(parent) {
					return parent.children.find(function(node) {
						return jsh.document.Node.isElement(node) && jsh.document.Element.isName("properties")(node);
					}) as slime.runtime.document.Element;
				};

				var after = subject.xml.edit.insert.element({
					parent: jsh.document.Document.element,
					after: getDependencies,
					lines: 1,
					indent: "  ",
					element: foo
				});

				var replaced = subject.xml.edit.replace.with.element({
					parent: jsh.document.Document.element,
					target: getProperties,
					indent: "  ",
					element: foo
				})

				var removed = subject.xml.edit.remove.element({
					parent: jsh.document.Document.element,
					target: getProperties
				});

				var atStart = subject.xml.edit.insert.element({
					parent: jsh.document.Document.element,
					after: $api.fp.Mapping.all(null),
					lines: 1,
					indent: "  ",
					element: foo
				});

				jsh.shell.console(pom);
				jsh.shell.console("=== inserted ");
				jsh.shell.console(after(pom));
				jsh.shell.console("=== replaced ");
				jsh.shell.console(replaced(pom));
				jsh.shell.console("=== removed");
				jsh.shell.console(removed(pom));
				jsh.shell.console("=== atStart");
				jsh.shell.console(atStart(pom));
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		mvn: any

		/**
		 * @deprecated
		 */
		Pom: new (file: slime.jrunscript.file.File) => {
			getModules: any
			getDependencies: any
			getVersion: any
			parent: {
				version: any
			}
		}

		Project: any
		Repository: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}

namespace slime.jsh {
	export interface Tools {
		maven: slime.jrunscript.tools.maven.Exports
	}
}
