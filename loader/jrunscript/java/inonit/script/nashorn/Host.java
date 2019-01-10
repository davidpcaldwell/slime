//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.nashorn;

import inonit.script.engine.*;

public class Host {
	public static inonit.script.engine.Host create(Loader.Classes.Configuration configuration) {
		return inonit.script.engine.Host.create(configuration, "nashorn");
	}
	
	private Host() {
	}
}