package inonit.script.jsh;

import java.util.*;

import javax.script.*;

import inonit.script.engine.*;
import java.util.List;

public class Nashorn {
	public static abstract class Host {
		public abstract boolean isTop();
		public abstract Loader.Classpath getClasspath();
	}
	
	public static class ExitException extends RuntimeException {
		private int status;
		
		public ExitException(int status) {
			this.status = status;
		}
		
		public int getExitStatus() {
			return status;
		}
	}
	
	public static void execute(Shell shell) throws Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(shell.getInstallation().getJshLoader("nashorn.js"), false);
		shell.execute(execution);
	}
	
	private static void main(Shell shell) throws Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(shell.getInstallation().getJshLoader("nashorn.js"), true);
		Integer rv = shell.execute(execution);
		if (rv == null) {
		} else if (rv.intValue() == 0) {
		} else {
			System.exit(rv.intValue());
		}
	}
	
	private static class ExecutionImpl extends Shell.Execution {
		private Code.Source.File nashornJs;
		private Classes classes;
		private ScriptEngineManager factory;
		private ScriptEngine engine;
		private boolean top;
		
		ExecutionImpl(Code.Source.File nashornJs, boolean top) {
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
			this.top = top;
		}
		
		@Override public void host(String name, Object value) {
			factory.getBindings().put(name, value);
		}

		@Override public void addEngine() {
			host("$nashorn", new Host() {
				@Override public Loader.Classpath getClasspath() {
					return classes.getScriptClasses().toScriptClasspath();
				}
				
				@Override public boolean isTop() {
					return top;
				}
			});
			scripts.add(nashornJs);
		}
		
		private List<Code.Source.File> scripts = new ArrayList<Code.Source.File>();

		@Override public void script(Code.Source.File script) {
			scripts.add(script);
		}

		@Override public Integer execute() {
			try {
				for (Code.Source.File file : scripts) {
					ScriptContext c = engine.getContext();
					c.setAttribute(ScriptEngine.FILENAME, file.getSourceName(), ScriptContext.ENGINE_SCOPE);
					engine.eval(file.getReader(), c);
				}
				//	TODO	global object?
				return null;
			} catch (ScriptException e) {
				if (e.getCause() != null && e.getCause() instanceof ExitException) {
					return ((ExitException)e.getCause()).getExitStatus();
				} else {
//					e.printStackTrace();
					return 255;
				}
			}
		}
	}
	
	public static void main(final String[] args) throws Invocation.CheckedException {
		main(Shell.main(args));
	}
}
