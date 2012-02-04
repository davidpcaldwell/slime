//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/host SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.script.runtime;

import java.util.*;

import org.mozilla.javascript.*;

public class Properties {
	public static Scriptable create(java.util.Properties jdk) {
		Property rv = new Property();
		rv.jdk = jdk;
		rv.name = null;
		return rv;
	}

	private static class Property implements Scriptable {
		private java.util.Properties jdk;
		private String name;

		private Scriptable scope;
		private Scriptable prototype;

		private String prefix() {
			if (name == null) {
				return "";
			} else {
				return name + ".";
			}
		}

		public String getClassName() {
			return "Properties";
		}

		public Scriptable getParentScope() {
			return scope;
		}

		public void setParentScope(Scriptable scope) {
			this.scope = scope;
		}

		public Scriptable getPrototype() {
			return prototype;
		}

		public void setPrototype(Scriptable prototype) {
			this.prototype = prototype;
		}

		private String[] getPropertiesStartingWith(String prefix) {
			Iterator i = jdk.keySet().iterator();
			ArrayList rv = new ArrayList();
			while(i.hasNext()) {
				String name = (String)i.next();
				if (name.startsWith(prefix)) {
					String propertyName = name.substring(prefix.length());
					String propertyFamily = propertyName;
					if (propertyName.indexOf(".") != -1) {
						propertyFamily = propertyName.substring(0,propertyName.indexOf("."));
					}
					if (!rv.contains(propertyFamily)) {
						rv.add(propertyFamily);
					}
				}
			}
			return (String[])rv.toArray(new String[0]);
		}

		public Object[] getIds() {
			return getPropertiesStartingWith(prefix());
		}

		private Property getChild(String name) {
			if (name.equals("__iterator__")) return null;
			Property rv = new Property();
			rv.jdk = jdk;
			rv.name = prefix() + name;
			rv.scope = scope;
			rv.prototype = prototype;
			return rv;
		}

		public Object get(String string, Scriptable scriptable) {
			Object rv = getChild(string);
			if (rv == null) return Scriptable.NOT_FOUND;
			return rv;
		}

		public Object get(int i, Scriptable scriptable) {
			return get(String.valueOf(i), scriptable);
		}

		public boolean has(String string, Scriptable scriptable) {
			return get(string,scriptable) != null && get(string,scriptable) != Scriptable.NOT_FOUND;
		}

		public boolean has(int i, Scriptable scriptable) {
			return has(String.valueOf(i), scriptable);
		}

		public void put(String string, Scriptable start, Object object) {
			if (object instanceof String) {
				jdk.setProperty(prefix() + string, ((String)object));
			} else if (object instanceof Scriptable) {
				Property target = getChild(string);
				Scriptable value = (Scriptable)object;
				Object[] ids = value.getIds();
				for (int i=0; i<ids.length; i++) {
					if (ids[i] instanceof String) {
						String key = (String)ids[i];
						target.put(key, start, value.get(key, start));
					} else if (ids[i] instanceof Integer) {
						int key = ((Integer)ids[i]).intValue();
						target.put(key, start, value.get(key, start));
					}
				}
			} else {
				throw new RuntimeException("Unsupported property value: " + object);
			}
		}

		public void put(int i, Scriptable scriptable, Object object) {
			put(String.valueOf(i), scriptable, object);
		}

		public void delete(String string) {
			Iterator i = jdk.keySet().iterator();
			ArrayList toDelete = new ArrayList();
			while(i.hasNext()) {
				String name = (String)i.next();
				if (name.equals(this.prefix() + string)) {
					toDelete.add(name);
				} else if (name.startsWith(this.prefix() + string + ".")) {
					toDelete.add(name);
				}
			}
			i = toDelete.iterator();
			while(i.hasNext()) {
				jdk.remove(i.next());
			}
		}

		public void delete(int i) {
			delete(String.valueOf(i));
		}

		public Object getDefaultValue(Class hint) {
			if (hint == String.class || hint == null) {
				String value = jdk.getProperty(name);
				if (value != null) {
					return value;
				}
				if (getIds().length > 0) {
					return null;
				} else {
					return Context.getUndefinedValue();
				}
			}
			String arg = (hint == null) ? "undefined" : hint.getName();
			throw ScriptRuntime.typeError1("msg.default.value", arg);
		}

		public boolean hasInstance(Scriptable scriptable) {
			return scriptable instanceof Property;
		}

		public java.util.Properties getJdk() {
			return jdk;
		}
	}
}