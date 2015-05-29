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
		return new Host(classes);
	}

	private ScriptEngineManager factory;
	private ScriptEngine engine;
	private Loader.Classes classes;
	private List<Code.Source.File> scripts = new ArrayList<Code.Source.File>();

	private Host(Loader.Classes classes) {
		this.factory = new ScriptEngineManager();
		this.engine = factory.getEngineByName("nashorn");
		this.classes = classes;
	}

	public void set(String name, Object value) {
		factory.getBindings().put(name, value);
	}

	public void add(Code.Source.File script) {
		scripts.add(script);
	}

	public Loader.Classpath getClasspath() {
		return classes.getInterface();
	}

	public Object run() throws ScriptException {
		Object rv = null;
		for (Code.Source.File file : scripts) {
			ScriptContext c = engine.getContext();
			c.setAttribute(ScriptEngine.FILENAME, file.getSourceName(), ScriptContext.ENGINE_SCOPE);
			rv = engine.eval(file.getReader(), c);
		}
		return rv;
	}
}