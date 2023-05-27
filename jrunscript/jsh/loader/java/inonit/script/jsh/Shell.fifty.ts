//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native.inonit.script.jsh {
	export interface Shell {
		setRuntime: (value: slime.jsh.loader.internal.Runtime) => void
		runtime: () => slime.jsh.loader.internal.Runtime

		getLoader(): slime.jrunscript.native.inonit.script.engine.Loader
		getEnvironment(): Shell.Environment
		getInvocation(): Shell.Invocation
		getJshLoader: any
		getInterface(): Shell.Interface
		getLibrary(path: string): any
		getLibraryFile(path: string): slime.jrunscript.native.java.io.File
		getPackaged(): Shell.Packaged

		worker: any
		events: any
	}

	export namespace Shell {
		/**
		 * Methods related to packaged applications, currently used to provide access to packaged application resources
		 * and location so that they can be provided by the <code>jsh.script</code> API.
		 */
		export interface Packaged {
			getFile(): slime.jrunscript.native.java.io.File
			getCode(): slime.jrunscript.native.inonit.script.engine.Code.Loader
		}

		export interface Environment {
			getStdio(): Environment.Stdio
			getEnvironment(): slime.jrunscript.native.inonit.system.OperatingSystem.Environment
			getSystemProperties(): slime.jrunscript.native.java.util.Properties
		}

		export namespace Environment {
			export interface Stdio {
				getStandardInput(): slime.jrunscript.native.java.io.InputStream
				getStandardOutput(): slime.jrunscript.native.java.io.OutputStream
				getStandardError(): slime.jrunscript.native.java.io.OutputStream
			}
		}

		export interface Invocation {
			getScript: any
			getArguments(): slime.jrunscript.native.java.lang.String[]
		}

		export interface Interface {
			getPluginSources(): slime.jrunscript.native.inonit.script.engine.Code.Loader[]
			invocation: (script: slime.jrunscript.native.java.io.File, arguments: string[]) => Invocation
		}
	}
}
