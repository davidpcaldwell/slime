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

import java.util.*;

import javax.script.*;

import inonit.script.engine.*;

public class Host {
	public static Host create(Loader.Classes.Configuration configuration) {
		Loader.Classes classes = Loader.Classes.create(configuration);
		Thread.currentThread().setContextClassLoader(classes.getApplicationClassLoader());
		return new Host(classes, "nashorn");
	}

	public static Host graal(Loader.Classes.Configuration configuration) {
		Loader.Classes classes = Loader.Classes.create(configuration);
		Thread.currentThread().setContextClassLoader(classes.getApplicationClassLoader());
		return new Host(classes, "Graal.js");
	}

	private ScriptEngineManager factory;
	private ScriptEngine engine;
	private Loader.Classes classes;
	private List<Code.Loader.Resource> scripts = new ArrayList<Code.Loader.Resource>();

	private Host(Loader.Classes classes, String engineName) {
		this.factory = new ScriptEngineManager();
		this.engine = factory.getEngineByName(engineName);
		this.classes = classes;
	}

	public void set(String name, Object value) {
		factory.getBindings().put(name, value);
	}

	public void add(Code.Loader.Resource script) {
		scripts.add(script);
	}

	public Loader.Classes.Interface getClasspath() {
		return classes.getInterface();
	}

	public Object run() throws ScriptException {
		Object rv = null;
		for (Code.Loader.Resource file : scripts) {
			ScriptContext c = engine.getContext();
			c.setAttribute(ScriptEngine.FILENAME, file.getSourceName(), ScriptContext.ENGINE_SCOPE);
			rv = engine.eval(file.getReader(), c);
		}
		return rv;
	}
}