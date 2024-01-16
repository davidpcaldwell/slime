//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The launcher begins with the `jsh` program, which determines which Java needs to be used (installing the default JDK if
 * necessary). It then runs the `rhino/jrunscript/api.js` script with the `jsh` argument, which in turn calls
 * `jsh/launcher/main.js`.
 */
namespace slime.jsh.launcher {
}
