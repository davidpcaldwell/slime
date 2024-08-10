//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime {
	/**
	 * The type returned by `loader/jrunscript/rhino.js` for use in embedding Rhino.
	 */
	export interface Rhino extends Exports {
		java: MultithreadedJava
	}
}

namespace slime.jrunscript.runtime.internal.rhino {
	/**
	 * An object providing the scope variables for running `loader/jrunscript/rhino.js`.
	 */
	export interface Scope {
		/**
		 * This is likely an instance of the Java class `inonit.script.rhino.Engine`.
		 */
		$rhino: Pick<slime.jrunscript.native.inonit.script.rhino.Engine,"script"|"canAccessEnvironment"|"getDebugger">

		$loader: slime.jrunscript.native.inonit.script.engine.Loader
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);
}
