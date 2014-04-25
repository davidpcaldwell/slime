package inonit.script.jsh;

import java.util.*;

import javax.script.*;

import inonit.script.engine.*;
import java.util.List;

public class Nashorn {
	public static abstract class Host {
		public abstract Loader.Classpath getClasspath();
	}
	
	private static class ExecutionImpl extends Shell.Execution {
		private Code.Source.File nashornJs;
		private Classes classes;
		private ScriptEngineManager factory;
		private ScriptEngine engine;
		
		ExecutionImpl(Code.Source.File nashornJs) {
			this.nashornJs = nashornJs;
			this.classes = Classes.create(new Classes.Configuration() {
				@Override public boolean canCreateClassLoaders() {
					return true;
				}

				@Override public ClassLoader getApplicationClassLoader() {
					return Nashorn.class.getClassLoader();
				}
			});
			Thread.currentThread().setContextClassLoader(classes.getApplicationClassLoader());
			this.factory = new ScriptEngineManager();
			this.engine = factory.getEngineByName("nashorn");
		}
		
		@Override public void host(String name, Object value) {
			factory.getBindings().put(name, value);
		}

		@Override public void addEngine() {
			host("$nashorn", new Host() {
				@Override public Loader.Classpath getClasspath() {
					return classes.getScriptClasses().toScriptClasspath();
				}
			});
			scripts.add(nashornJs);
		}
		
		private List<Code.Source.File> scripts = new ArrayList<Code.Source.File>();

		@Override public void script(Code.Source.File script) {
			scripts.add(script);
		}

		@Override public Object execute() {
			try {
				for (Code.Source.File file : scripts) {
					ScriptContext c = engine.getContext();
					c.setAttribute(ScriptEngine.FILENAME, file.getSourceName(), ScriptContext.ENGINE_SCOPE);
					engine.eval(file.getReader(), c);
				}
				//	TODO	global object?
				return null;
			} catch (ScriptException e) {
				throw new RuntimeException(e);
			}
		}
	} 
	
	public static void main(final String[] args) throws Invocation.CheckedException {
		Shell shell = Shell.main(args);
		Shell.Execution execution = new ExecutionImpl(shell.getInstallation().getJshLoader("nashorn.js"));
		shell.execute(execution);
	}
}
