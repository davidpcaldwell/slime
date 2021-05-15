//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	Works in Rhino, not Nashorn
var _o = new Packages.java.lang.Object();
jsh.shell.console("apply = " + _o.hashCode.apply);
Packages.java.lang.System.err.println("hash code = " + _o.hashCode.apply(_o,[]));
