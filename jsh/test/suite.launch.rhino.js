//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	assumes jsh/launcher/rhino/api.rhino.js has been run; provides context that originally was provided by jsh/etc/build.rhino.js
//	but this file allows the tests to be run from outside the build process

//	Built shell location
var JSH_HOME = new Packages.java.io.File(env.JSH_HOME);

//	Source base
var SLIME_SRC = new Packages.java.io.File(env.SLIME_SRC);
