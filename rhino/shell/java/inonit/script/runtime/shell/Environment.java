//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/shell SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.script.runtime.shell;

import java.io.*;
import java.lang.reflect.*;
import java.util.*;

import inonit.system.*;

public class Environment {
	public static Map create() {
		return new Environment().get();
	}
	
	private Map jdk() {
		//	Use reflection to invoke JDK 1.5+ method, in case we are running on 1.4
		try {
			Method getenv = System.class.getMethod("getenv", new Class[0]);
			return (Map)getenv.invoke(null, new Object[0]);
		} catch (NoSuchMethodException e) {
			return null;
		} catch (IllegalAccessException e) {
			return null;
		} catch (InvocationTargetException e) {
			return null;
		}
	}
	
	public Map get() {
		Map jdk = jdk();
		if (jdk != null) return jdk;
		if (System.getProperty("jsh.os.env.unix") != null) {
			try {
				HashMap rv = new HashMap();
				String output = OperatingSystem.get().getCommandOutput(System.getProperty("jsh.os.env.unix"), new String[0]);
				String[] variables = output.split("\n");
				for (int i=0; i<variables.length; i++) {
					int split = variables[i].indexOf("=");
					String name = variables[i].substring(0, split);
					String value = variables[i].substring(split+1);
					rv.put(name, value);
				}
				return rv;
			} catch (IOException e) {
				return null;
			}
		}
		return null;
	}
}
