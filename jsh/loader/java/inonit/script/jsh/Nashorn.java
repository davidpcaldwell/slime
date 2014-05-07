package inonit.script.jsh;

import java.util.*;

import javax.script.*;

import inonit.script.engine.*;

public class Nashorn {
	public static abstract class Host {
		public abstract boolean isTop();
		public abstract Loader.Classpath getClasspath();
	}
	
	public static class ExitException extends RuntimeException {
		private int status;
		
		public ExitException(int status) {
			super("Exit with status: " + status);
			this.status = status;
		}
		
		public int getExitStatus() {
			return status;
		}
	}
	
	public static Integer execute(Shell shell) throws Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(false);
		return shell.execute(execution);
	}
	
	private static void main(Shell shell) throws Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(true);
		Integer rv = shell.execute(execution);
		if (rv == null) {
		} else if (rv.intValue() == 0) {
		} else {
			System.exit(rv.intValue());
		}
	}
	
	private static class ExecutionImpl extends Shell.Execution {
		private Classes classes;
		private inonit.script.nashorn.Host host;
		private boolean top;
		
		ExecutionImpl(boolean top) {
			this.classes = Classes.create(new Classes.Configuration() {
				@Override public boolean canCreateClassLoaders() {
					return true;
				}

				@Override public ClassLoader getApplicationClassLoader() {
					return Nashorn.class.getClassLoader();
				}
			});
			Thread.currentThread().setContextClassLoader(classes.getApplicationClassLoader());
			this.host = inonit.script.nashorn.Host.create(classes);
			this.top = top;
		}

		@Override public void host(String name, Object value) {
			host.set(name, value);
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
			host.add(this.getShell().getInstallation().getJshLoader("nashorn.js"));
		}
		
		@Override public void script(Code.Source.File script) {
			host.add(script);
		}

		@Override public Integer execute() {
			try {
				Object ignore = host.run();
				return null;
			} catch (ScriptException e) {
				if (e.getCause() != null && e.getCause().getCause() != null && e.getCause().getCause() instanceof ExitException) {
					return ((ExitException)e.getCause().getCause()).getExitStatus();
				} else {
					return 255;
				}
			}
		}
	}
	
	public static void main(final String[] args) throws Invocation.CheckedException {
		main(Shell.main(args));
	}
}
