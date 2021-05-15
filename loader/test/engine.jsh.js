//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

jsh.shell.console(Object);
if (jsh.java.getClass("org.mozilla.javascript.Context")) {
	jsh.shell.console(Packages.org.mozilla.javascript.Context.getCurrentContext());
}
jsh.shell.console(Object.assign);
