package inonit.script.engine;

import java.util.*;

import javax.script.*;

public abstract class Host {
	public static abstract class Factory {
		public abstract Host create();
		
		public static Factory engine(final String name) {
			return new Factory() {
				public Host create() {
					return new HostImpl(name);
				}
			};
		}
	}
	
	public static Host create(Factory factory, Loader.Classes.Configuration configuration) {
		Loader.Classes classes = Loader.Classes.create(configuration);
		Thread.currentThread().setContextClassLoader(classes.getApplicationClassLoader());
		Host rv = factory.create();
		rv.initialize(classes);
		return rv;
	}

	@Deprecated public static Host create(Loader.Classes.Configuration configuration, String engineName) {
		return create(Factory.engine(engineName), configuration);
	}

	private Loader.Classes classes;
	private List<Code.Loader.Resource> scripts = new ArrayList<Code.Loader.Resource>();

	private Host() {
	}
	
	final void initialize(Loader.Classes classes) {
		this.classes = classes;
	}

	public void add(Code.Loader.Resource script) {
		scripts.add(script);
	}

	public Loader.Classes.Interface getClasspath() {
		return classes.getInterface();
	}
	
	public abstract void set(String name, Object value);
	
	protected abstract Object eval(Code.Loader.Resource file) throws ScriptException;

	public Object run() throws ScriptException {
		Object rv = null;
		for (Code.Loader.Resource file : scripts) {
			rv = eval(file);
		}
		return rv;
	}
	
	private static class HostImpl extends Host {
		private ScriptEngineManager factory;
		private ScriptEngine engine;
		
		private HostImpl(String engineName) {
			this.factory = new ScriptEngineManager();
			this.engine = factory.getEngineByName(engineName);			
		}
		
		public void set(String name, Object value) {
			factory.getBindings().put(name, value);
		}
		
		protected Object eval(Code.Loader.Resource file) throws ScriptException {
			ScriptContext c = engine.getContext();
			c.setAttribute(ScriptEngine.FILENAME, file.getSourceName(), ScriptContext.ENGINE_SCOPE);
			return engine.eval(file.getReader(), c);			
		}
	}
}