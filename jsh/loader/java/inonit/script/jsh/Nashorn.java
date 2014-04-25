package inonit.script.jsh;

import java.io.*;

import javax.script.*;

import inonit.script.engine.*;
import java.util.List;

public class Nashorn {
	public static abstract class Host {
		public abstract Loader.Classpath getClasspath();
		public abstract String[] getArguments();
	}
	
	private static Object eval(ScriptEngine engine, Code.Source.File file) throws ScriptException {
//		ScriptContext c = new SimpleScriptContext();
		ScriptContext c = engine.getContext();
		c.setAttribute(ScriptEngine.FILENAME, file.getSourceName(), ScriptContext.ENGINE_SCOPE);
		return engine.eval(file.getReader(), c);
	}
	
	public static void main(final String[] args) {
		final Classes classes = Classes.create(new Classes.Configuration() {
			@Override public boolean canCreateClassLoaders() {
				return true;
			}

			@Override public ClassLoader getApplicationClassLoader() {
				return Nashorn.class.getClassLoader();
			}
		});
		Thread.currentThread().setContextClassLoader(classes.getApplicationClassLoader());
		ScriptEngineManager factory = new ScriptEngineManager();
		factory.getBindings().put("$nashorn", new Host() {
			@Override public Loader.Classpath getClasspath() {
				return classes.getScriptClasses().toScriptClasspath();
			}
			
			@Override public String[] getArguments() {
				return args;
			}
		});
		ScriptEngine engine = factory.getEngineByName("nashorn");
		Installation installation = Installation.unpackaged();
		try {
			Object host = eval(engine, installation.getJshLoader("nashorn-host.js"));
			eval(engine, installation.getJshLoader("jsh.js"));
			eval(engine, Code.Source.File.create(new File(args[0])));
		} catch (ScriptException e) {
			throw new RuntimeException(e);
		}
	}
}
