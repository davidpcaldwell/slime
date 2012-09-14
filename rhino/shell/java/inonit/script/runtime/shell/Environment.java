//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
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