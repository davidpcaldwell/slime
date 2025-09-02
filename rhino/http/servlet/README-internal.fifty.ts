//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The SLIME servlet, when deployed as a `WAR` file, is implemented by the `inonit.script.servlet.Servlet` Java class. When it is
 * embedded in `jsh`, the implementation uses an embedded Tomcat server and the embedded Tomcat server creates
 * `javax.servlet.http.HttpServlet` instances that are implemented as JavaScript objects.
 *
 * For `inonit.script.servlet.Servlet`, each JavaScript engine implements a `inonit.script.servlet.Servlet.ScriptContainer` that
 * configures how the engine initializes, creates an engine-specific host object, and executes a program consisting of a series
 * of scope bindings and a series of scripts.
 */
namespace slime.servlet.internal {
}
