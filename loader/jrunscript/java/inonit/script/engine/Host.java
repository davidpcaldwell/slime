package inonit.script.engine;

import java.util.*;

import javax.script.*;

public class Host {
	public static Host create(Loader.Classes.Configuration configuration, String engineName) {
		Loader.Classes classes = Loader.Classes.create(configuration);
		Thread.currentThread().setContextClassLoader(classes.getApplicationClassLoader());
		return new Host(classes, engineName);
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