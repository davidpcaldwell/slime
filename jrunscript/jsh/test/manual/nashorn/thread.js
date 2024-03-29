//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

load("nashorn:mozilla_compat.js");
var thread = new JavaAdapter(
	Packages.java.lang.Runnable,
	{
		run: function() {
			for (var i=0; i<10; i++) {
				Packages.java.lang.System.err.println("i = " + i);
				Packages.java.lang.Thread.sleep(500);
			}
		}
	}
);
new Packages.java.lang.Thread(thread).start();
Packages.java.lang.System.err.println("Started.");
