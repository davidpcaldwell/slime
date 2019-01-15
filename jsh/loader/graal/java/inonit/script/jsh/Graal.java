package inonit.script.jsh;

import javax.script.*;

import inonit.script.engine.*;

public class Graal extends Main.Engine {
	public static abstract class Host {
		public final void putMember(String name, Object value) {
			org.graalvm.polyglot.Context.getCurrent().getBindings("js").putMember(name, value);
		}
		
		public final Object getMember(String name) {
			return org.graalvm.polyglot.Context.getCurrent().getBindings("js").getMember(name);
		}
	}

	private static class ExecutionImpl extends Shell.Execution {
		private inonit.script.engine.Host host;
		private boolean top;

		ExecutionImpl(final Shell shell, boolean top) {
			super(shell);
			this.host = inonit.script.graal.HostFactory.create(new Loader.Classes.Configuration() {
				@Override public boolean canCreateClassLoaders() {
					return true;
				}

				@Override public ClassLoader getApplicationClassLoader() {
					return Nashorn.class.getClassLoader();
				}

				@Override public java.io.File getLocalClassCache() {
					return shell.getEnvironment().getClassCache();
				}
			});
			this.top = top;
		}
		
		//	TODO	completely copy-pasted from Nashorn.java
		private static class ExitException extends RuntimeException {
			private int status;

			ExitException(int status) {
				super("Exit with status: " + status);
				this.status = status;
			}

			int getExitStatus() {
				return status;
			}
		}

		@Override protected Loader.Classes.Interface getClasspath() {
			return host.getClasspath();
		}
		
		@Override public void setGlobalProperty(String name, Object value) {
			host.set(name, value);
		}
		
		@Override public void script(Code.Loader.Resource script) {
			host.add(script);
		}

		//	TODO	completely copy-pasted from Nashorn.java
		private ExitException getExitException(Exception e) {
			Throwable t = e;
			while(t != null) {
				if (t instanceof ExitException) {
					return (ExitException)t;
				}
				t = t.getCause();
			}
			return null;
		}

		@Override public Integer run() {
			try {
				Object ignore = host.run();
				return null;
			} catch (RuntimeException e) {
				ExitException exit = getExitException(e);
				if (exit != null) {
					return exit.getExitStatus();
				}
				throw e;
			} catch (ScriptException e) {
				ExitException exit = getExitException(e);
				if (exit != null) {
					return exit.getExitStatus();
				}
				throw new Nashorn.UncaughtException(e);
			}
		}
		
		@Override public void setJshHostProperty() {
			setGlobalProperty("$nashorn", new Nashorn.Host() {
				@Override public Loader.Classes.Interface getClasspath() {
					return host.getClasspath();
				}

				@Override public boolean isTop() {
					return top;
				}

				@Override public void exit(int status) {
					throw new ExitException(status);
				}
			});
			setGlobalProperty("$graal", new Host() {
			});
			try {
				host.add(this.getJshLoader().getFile("nashorn.js"));
			} catch (java.io.IOException e) {
				throw new RuntimeException(e);
			}
		}
	}
	
	public void main(Shell.Container context, Shell shell) throws Shell.Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(shell, true);
		Integer rv = execution.execute();
		if (rv == null) {
		} else if (rv.intValue() == 0) {
		} else {
			context.exit(rv.intValue());
		}
	}

	public static void main(String[] args) throws Shell.Invocation.CheckedException {
		Main.cli(new Graal(), args);
	}
}