//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jrunscript/host SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.runtime;

import org.mozilla.javascript.*;

public class Threads {
	public static Function createSynchronizedFunction(final Object lock, final Function callable) {
		return new Function() {
			public Object call(Context cntxt, Scriptable s, Scriptable s1, Object[] os) {
				synchronized(lock) {
					return callable.call(cntxt, s, s1, os);
				}
			}

			//	TODO	probably not a good idea to stub out all of these methods

			public Scriptable construct(Context cntxt, Scriptable s, Object[] os) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public String getClassName() {
				return callable.getClassName();
			}

			public Object get(String string, Scriptable s) {
				return callable.get(string, s);
			}

			public Object get(int i, Scriptable s) {
				return callable.get(i, s);
			}

			public boolean has(String string, Scriptable s) {
				return callable.has(string, s);
			}

			public boolean has(int i, Scriptable s) {
				return callable.has(i, s);
			}

			public void put(String string, Scriptable s, Object o) {
				callable.put(string, s, o);
			}

			public void put(int i, Scriptable s, Object o) {
				callable.put(i, s, o);
			}

			public void delete(String string) {
				callable.delete(string);
			}

			public void delete(int i) {
				callable.delete(i);
			}

			public Scriptable getPrototype() {
				return callable.getPrototype();
			}

			public void setPrototype(Scriptable s) {
				callable.setPrototype(s);
			}

//			private Scriptable parentScope;

			public Scriptable getParentScope() {
				return callable.getParentScope();
//				return parentScope;
			}

			public void setParentScope(Scriptable s) {
				callable.setParentScope(s);
//				this.parentScope = s;
			}

			public Object[] getIds() {
				return callable.getIds();
			}

			public Object getDefaultValue(Class<?> type) {
				return callable.getDefaultValue(type);
			}

			public boolean hasInstance(Scriptable s) {
				return callable.hasInstance(s);
			}
		};
	}
}