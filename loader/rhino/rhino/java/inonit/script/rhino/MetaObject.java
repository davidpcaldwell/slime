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

public class MetaObject implements Scriptable {
	//	TODO	there are a lot of untested cases; for example, there are many methods that will bomb if target is null
	//	TODO	But see ES2.0 proposal, with get/set/has/delete/invoke
	public static Scriptable create(Scriptable delegate, Function getter, Function setter) {
		if (delegate == null) throw new NullPointerException("'delegate' must not be null.");
		if (getter == null) throw new NullPointerException("'getter' must not be null.");
		if (setter == null) throw new NullPointerException("'setter' must not be null.");
		return new MetaObject(delegate, getter, setter);
	}

	private Scriptable delegate;
	private Function getter;
	private Function setter;

	private java.util.HashSet<String> properties = new java.util.HashSet<String>();

	private MetaObject(Scriptable delegate, Function getter, Function setter) {
		this.delegate = delegate;
		this.getter = getter;
		this.setter = setter;
	}

	public void setParentScope(Scriptable arg0) {
		delegate.setParentScope(arg0);
	}

	public Scriptable getParentScope() {
		return delegate.getParentScope();
	}

	public void setPrototype(Scriptable arg0) {
		delegate.setPrototype(arg0);
	}

	public Scriptable getPrototype() {
		return delegate.getPrototype();
	}

	private Scriptable getScope() {
		return delegate.getParentScope();
	}

	public Object getDefaultValue(Class arg0) {
		return delegate.getDefaultValue(arg0);
	}

	public void delete(String arg0) {
		delegate.delete(arg0);
		properties.remove(arg0);
	}

	public String getClassName() {
		return delegate.getClassName();
	}

	public Object get(String arg0, Scriptable arg1) {
		Object rv = getter.call(Context.getCurrentContext(), getScope(), delegate, new java.lang.Object[] {
			arg0
		});
		if (rv instanceof org.mozilla.javascript.Undefined) {
			rv = ScriptableObject.NOT_FOUND;
		}
		return rv;
	}

	public Object[] getIds() {
		java.util.ArrayList<String> ids = new java.util.ArrayList<String>();
		java.util.Iterator<String> i = properties.iterator();
		while(i.hasNext()) {
			ids.add(i.next());
		}
		String[] rv = ids.toArray(new String[0]);
		return rv;
	}

	public boolean has(String arg0, Scriptable arg1) {
		return properties.contains(arg0);
	}

	public boolean hasInstance(Scriptable arg0) {
		return delegate.hasInstance(arg0);
	}

	public void put(String arg0, Scriptable arg1, Object arg2) {
		setter.call(Context.getCurrentContext(), getScope(), delegate, new java.lang.Object[] {
			arg0, arg2
		});
		properties.add(arg0);
	}

	//
	//	Integer versions of functions that simply call String versions
	//

	public boolean has(int arg0, Scriptable arg1) {
		return this.has(String.valueOf(arg0), arg1);
	}

	public void delete(int arg0) {
		this.delete(String.valueOf(arg0));
	}

	public void put(int arg0, Scriptable arg1, Object arg2) {
		this.put(String.valueOf(arg0), arg1, arg2);
	}

	public Object get(int arg0, Scriptable arg1) {
		return this.get(String.valueOf(arg0), arg1);
	}
}