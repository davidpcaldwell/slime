package inonit.script.nashorn;

import java.util.*;

import javax.script.*;

import inonit.script.engine.*;

public class Host {
	public static Host create(Classes classes) {
		return new Host(classes);
	}
	
	private ScriptEngineManager factory;
	private ScriptEngine engine;
	private Classes classes;
	private List<Code.Source.File> scripts = new ArrayList<Code.Source.File>();
	
	private Host(Classes classes) {
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
