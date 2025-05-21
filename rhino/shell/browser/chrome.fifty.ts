//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.browser {
	export interface Chrome {
		/**
		 * The version of this browser, e.g., `"Google Chrome 99.0.4844.84"`.
		 */
		readonly version: string

		/**
		 * The pathname of the browser executable.
		 */
		readonly program: string
	}

	export namespace object {
		export interface RunArguments {
			incognito?: boolean
			profile?: string

			//	TODO	document environment variable
			disableGpu?: boolean

			debug?: {
				port?: number
			}

			arguments?: string[]

			app?: string

			position?: {
				x: number
				y: number
			}

			size?: {
				width: number
				height: number
			}

			newWindow?: boolean

			uri?: string
			uris?: string[]

			stdio?: slime.jrunscript.shell.invocation.old.Stdio

			exitOnClose?: boolean

			on?: {
				start?: (this: slime.jrunscript.shell.browser.object.RunArguments, p: slime.jrunscript.shell.run.old.events.Event & {
					pid: number;
					kill: () => void;
				}) => void

				close?: (this: slime.jrunscript.shell.browser.object.RunArguments) => void
			}
		}

		export interface DefaultInstance {
			open?: (p: RunArguments) => void
		}

		export interface CreatedInstance {
			launch?: (p: RunArguments) => void
			run?: (p: RunArguments) => void
		}

		export namespace instance {
			export interface CreatedConfiguration {
				location?: slime.jrunscript.file.Pathname
				directory?: slime.jrunscript.file.Directory
				proxy?: old.ProxyTools | ProxyConfigurationServer
				hostrules?: string[]

				/**
				 * Whether to open DevTools for each tab; in other words, whether to pass the `--auto-open-devtools-for-tabs` option
				 * to the Chrome command line.
				 */
				devtools?: boolean
			}
		}

		export interface Chrome extends slime.jrunscript.shell.browser.Chrome {
			Instance: new (u: instance.CreatedConfiguration) => CreatedInstance

			instance?: DefaultInstance
		}
	}
}

namespace slime.jrunscript.shell.browser.internal.chrome {
	export interface Context {
		os: Pick<slime.jrunscript.shell.Exports["os"],"name"|"process">
		run: slime.jrunscript.shell.internal.run.old.Exports["run"]
		api: {
			java: slime.jrunscript.java.Exports
			file: slime.jrunscript.file.Exports
		}
		HOME: slime.jrunscript.file.Directory
		TMPDIR: slime.jrunscript.file.Directory
		USER: string
		environment: any
	}

	export interface DefaultConfiguration {
		install: true
		directory?: slime.jrunscript.file.Directory
	}

	export interface InstanceConstructor {
		new (b: { program: slime.jrunscript.file.File, user?: slime.jrunscript.file.Directory }, u: DefaultConfiguration): object.DefaultInstance
		new (b: { program: slime.jrunscript.file.File, user?: slime.jrunscript.file.Directory }, u: object.instance.CreatedConfiguration): object.CreatedInstance
	}

	export interface Exports {
		getMajorVersion: (chrome: slime.jrunscript.shell.browser.Chrome) => number
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("chrome.js");
			return script({
				HOME: fifty.global.jsh.shell.HOME,
				TMPDIR: fifty.global.jsh.shell.TMPDIR,
				USER: fifty.global.jsh.shell.USER,
				api: {
					java: fifty.global.jsh.java,
					file: fifty.global.jsh.file
				},
				environment: fifty.global.jsh.shell.environment,
				//	TODO	these can't be right
				os: fifty.global.jsh.shell.os,
				run: fifty.global.jsh.shell.run
			});
		//@ts-ignore
		})(fifty);

		export type InstallationConstructor = (p: {
			/**
			 * The Chrome executable for this installation.
			 */
			program: string

			/**
			 * The default user data directory for this installation.
			 */
			user: string
		}) => object.Chrome
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { subject } = test;

			fifty.tests.getMajorVersion = function() {
				verify(subject).getMajorVersion({ version: "Google Chrome 96.0.4664.93", program: "/foo" }).is(96);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		installed: object.Chrome
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.getMajorVersion);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		test: {
			Installation: test.InstallationConstructor
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			const { subject } = test;

			fifty.tests.world = function() {
				fifty.global.jsh.shell.console("Chrome: " + subject.installed.program);
				var version = subject.installed.version;
				fifty.global.jsh.shell.console("Chrome version = [" + version + "]");
			}

			fifty.tests.manual = {};

			fifty.tests.manual.chrome = {};

			fifty.tests.manual.chrome.Installation = function() {
				//	macOS: env JSH_TEST_SHELL_CHROME_PROGRAM="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" JSH_TEST_SHELL_CHROME_USER="${HOME}/Library/Application Support/Google/Chrome"
				var chrome = subject.test.Installation({
					program: jsh.shell.environment.JSH_TEST_SHELL_CHROME_PROGRAM,
					user: jsh.shell.environment.JSH_TEST_SHELL_CHROME_USER
				});
				var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var instance = new chrome.Instance({
					location: TMP.pathname
				});
				var process;
				jsh.java.Thread.start(function() {
					Packages.java.lang.System.err.println("Starting ...");
					try {
						instance.run({
							uri: "https://google.com/",
							on: {
								start: function(p) {
									Packages.java.lang.System.err.println("Got start callback.");
									process = p;
								}
							}
						});
					} catch (e)  {
						jsh.shell.console(e);
						jsh.shell.console(e.stack);
					}
				});
				Packages.java.lang.Thread.sleep(5000);
				process.kill();
			};

			fifty.tests.manual.chrome.installed = function() {
				jsh.shell.console("version = " + subject.installed.version);
				jsh.shell.console("program = " + subject.installed.program);
			}
		}
	//@ts-ignore
	)(Packages,fifty);


	export type Script = slime.loader.Script<Context,Exports>
}
