//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.rhino;

import org.mozilla.javascript.*;

public class Objects {
	/** @deprecated */
	public static final Objects INSTANCE = new Objects();

	private void setAttribute(Scriptable object, String name, int mask, boolean value) {
		if (!(object instanceof ScriptableObject)) {
			return;
		}
		int now = ((ScriptableObject)object).getAttributes(name);
		if (value) {
			now = (now | mask);
		} else {
			now = (now & (~mask));
		}
		((ScriptableObject)object).setAttributes(name, now);
	}

	public void setDontEnum(Scriptable object, String name, boolean value) {
		setAttribute(object, name, ScriptableObject.DONTENUM, value);
	}

	public void setPermanent(Scriptable object, String name, boolean value) {
		setAttribute(object, name, ScriptableObject.PERMANENT, value);
	}

	public void setReadOnly(Scriptable object, String name, boolean value) {
		setAttribute(object, name, ScriptableObject.READONLY, value);
	}
}