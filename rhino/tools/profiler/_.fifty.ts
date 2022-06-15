//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.profiler.rhino {
	//	TODO	look at list of related scripts (copied from old documentation):
	//			*	jsh/tools/profile.jsh.js
	//			*	jsh/tools/install/profiler.jsh.js
	//			*	rhino/tools/profiler/build.jsh.js

	export namespace listener {
		export interface Scope {
			/**
			 * A loader from which the profiler listener can load associated code via its relative path.
			 */
			$loader: slime.Loader

			/**
			 * An array containing a profile for each thread.
			 */
			profiles: Profile[]
		}
	}

	/**
	 * Profiler parameters, which are specified as name-value pairs in a system property.
	 */
	export interface Options {
		/**
		 * A filesystem path for a JavaScript file that will be executed when the program terminates. The script will have the
		 * following variables in scope, in addition to `jsh`.
		 */
		listener: string

		/**
		 * Specifies the path in the filesystem to an HTML page that will allow browsing the data collected by the profiler.
		 */
		html: string

		json: string

		//	TODO	allow filtering of scripts?
		//	TODO	allow filtering other than via literal prefix?
		/**
		 * Specifies a prefix describing Java classes to exclude. This path is used literally; if a class name starts with the value
		 * given, its profiling data will not be collected and will be excluded from the output. This value can be specified
		 * multiple times to exclude multiple patterns.
		 */
		exclude: string[]
	}

	/**
	 * An object describing a Java method.
	 */
	export interface JavaCode {
		/**
		 * The name of the class containing the method.
		 */
		className: string

		/**
		 * The name of the method.
		 */
		methodName: string

		/**
		 * The Java signature of the method; currently the format is undefined.
		 */
		signature: string
	}

	/**
	 * An object describing a JavaScript function.
	 */
	export interface JavascriptCode {
		/**
		 * A string describing the source file from which the function was loaded.
		 */
		sourceName: string

		lineNumber?: number

		/**
		 * @experimental
		 * The line numbers of the source included in the function.
		 */
		lineNumbers?: number[]

		/**
		 * (if defined by the source) The name of the JavaScript function.
		 */
		functionName?: string
	}

	export interface SelfCode {
		self: Code
	}

	export type Code = JavaCode | JavascriptCode | SelfCode

	export interface Statistics {
		/**
		 * The number of times this call stack was reached.
		 */
		count: number

		/**
		 * The total elapsed time spent within this call stack.
		 */
		elapsed: number
	}

	/**
	 * An object representing a call stack within an application and data surrounding its execution.
	 */
	export interface Node {
		/**
		 * The unit of code on top of the stack at this point in the call tree.
		 */
		code: Code

		/**
		 * The numbers collected for this node during execution.
		 */
		statistics: Statistics

		/**
		 * The set of nodes representing invocations from this point on the call stack.
		 */
		children: Node[]

		self: SelfCode
	}

	/**
	 * An execution profile for a particular thread.
	 */
	export interface Profile {
		/**
		 * An execution thread.
		 */
		thread: {
			/**
			 * The name of this thread.
			 */
			name: string
		}
		/**
		 * An object representing timing data about the given thread.
		 */
		timing: {
			/**
			 * A node representing an empty call stack within the given thread.
			 */
			root: Node
		}
	}
}
