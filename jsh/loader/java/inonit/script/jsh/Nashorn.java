//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.jsh;

import javax.script.*;

import inonit.script.engine.*;

public class Nashorn extends Shell.Engine {
	public static abstract class Host {
		public abstract boolean isTop();
		public abstract Loader.Classes.Interface getClasspath();
		public abstract void exit(int status);
	}

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

	public static Integer execute(Shell shell) throws Shell.Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(shell, false);
		return execution.execute();
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

	public static class UncaughtException extends RuntimeException {
		UncaughtException(ScriptException e) {
			super(e);
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

		@Override protected Loader.Classes getClasses() {
			return classes;
		}

		@Override public void setJshRuntimeObject(inonit.script.engine.Host.Program program) {
			program.bind(
				"$nashorn",
				new Host() {
					@Override public Loader.Classes.Interface getClasspath() {
						return classes.getInterface();
					}

					@Override public boolean isTop() {
						return top;
					}

					@Override public void exit(int status) {
						throw new ExitException(status);
					}
				}
			);

			program.run(this.getJshLoaderFile("nashorn.js"));
 		}

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
					throw new UncaughtException(e);
				}
			}
		}

		@Override public inonit.script.engine.Host.Factory getHostFactory() {
			return inonit.script.engine.Host.Factory.engine("nashorn");
		}
	}

	public static void main(final String[] args) throws Shell.Invocation.CheckedException {
		Main.cli(new Nashorn(), args);
	}
}
