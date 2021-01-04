package inonit.script.jsh;

import javax.script.*;

import inonit.script.engine.*;

public class Graal extends Shell.Engine {
	public static abstract class Host {
		public final void putMember(String name, Object value) {
			org.graalvm.polyglot.Context.getCurrent().getBindings("js").putMember(name, value);
		}

		public final Object getMember(String name) {
			return org.graalvm.polyglot.Context.getCurrent().getBindings("js").getMember(name);
		}

	}

	private static class ExecutionImpl extends Shell.Execution {
		private Loader.Classes classes;
		private boolean top;

		ExecutionImpl(final Shell shell, boolean top) {
			super(shell);

			this.classes = Loader.Classes.create(
				shell.getEnvironment().getClassesConfiguration()
			);

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

		@Override public void setJshRuntimeObject(inonit.script.engine.Host.Program program) {
			program.bind("$nashorn", new Nashorn.Host() {
				@Override public Loader.Classes.Interface getClasspath() {
					return classes.getInterface();
				}

				@Override public boolean isTop() {
					return top;
				}

				@Override public void exit(int status) {
					throw new ExitException(status);
				}
			});
			program.bind("$graal", new Host() {
			});
			program.run(this.getJshLoaderFile("nashorn.js"));
		}

		private ErrorHandlingImpl errorHandling = new ErrorHandlingImpl();

		@Override protected ErrorHandling getErrorHandling() {
			return errorHandling;
		}

		private class ErrorHandlingImpl extends ErrorHandling {
			@Override
			public Integer run(Run r) {
				try {
					r.run();
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
		}

		@Override public inonit.script.engine.Host.Factory getHostFactory() {
			return inonit.script.graal.HostFactory.create(
				new inonit.script.graal.HostFactory.Configuration() {
					public inonit.script.graal.HostFactory.Configuration.Inspect inspect() {
						String setting = System.getProperty("jsh.debug.script");
						if (setting != null && setting.equals("graal")) {
							return inonit.script.graal.HostFactory.Configuration.Inspect.SLIME;
						} else {
							return null;
						}
					}
				}
			);
		}

		@Override public Loader.Classes getClasses() {
			return classes;
		}
	}

	public void main(Shell shell) throws Shell.Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(shell, true);
		Integer rv = execution.execute();
		if (rv == null) {
		} else if (rv.intValue() == 0) {
		} else {
			shell.getEnvironment().exit(rv.intValue());
		}
	}

	public static void main(String[] args) throws Shell.Invocation.CheckedException {
		Main.cli(new Graal(), args);
	}
}