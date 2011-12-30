//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME loader for rhino.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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