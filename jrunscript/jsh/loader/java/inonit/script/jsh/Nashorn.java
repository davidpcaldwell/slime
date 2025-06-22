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

	public static class HostImpl extends Host {
		private static Class getNashornClass(String name) {
			try {
				return Class.forName("jdk.nashorn." + name);
			} catch (ClassNotFoundException e) {
				try {
					return Class.forName("org.openjdk.nashorn." + name);
				} catch (ClassNotFoundException e2) {
					throw new RuntimeException("Java version: " + System.getProperty("java.version"), e2);
				}
			}
		}

		private Loader.Classes classes;
		private boolean top;
		private Class Context;

		private HostImpl(Loader.Classes classes, boolean top) {
			this.classes = classes;
			this.top = top;
			this.Context = getNashornClass("internal.runtime.Context");
		}

		@Override public Loader.Classes.Interface getClasspath() {
			return classes.getInterface();
		}

		@Override public boolean isTop() {
			return top;
		}

		@Override public void exit(int status) {
			throw new ExitException(status);
		}

		private Object getContext() {
			try {
				return Context.getMethod("getContext").invoke(null);
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
		}

		private Object unwrap(Object context, Object mirror) {
			try {
				Class Context = context.getClass();
				java.lang.reflect.Method getGlobal = Context.getMethod("getGlobal");
				Class ScriptObjectMirror = getNashornClass("api.scripting.ScriptObjectMirror");
				java.lang.reflect.Method unwrap = ScriptObjectMirror.getMethod("unwrap", Object.class, Object.class);
				Object global = getGlobal.invoke(context);
				Object unwrapped = unwrap.invoke(null, mirror, global);
				return unwrapped;
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
		}

		public Object compileScript(Object context, Object source, Object scope) {
			java.lang.reflect.Method method = null;
			try {
				//	TODO	Add org.openjdk.nashorn equivalent
				Class Source = Class.forName("jdk.nashorn.internal.runtime.Source");
				Class ScriptObject = Class.forName("jdk.nashorn.internal.runtime.ScriptObject");
				method = context.getClass().getMethod("compileScript", Source, ScriptObject);
				try {
					return method.invoke(context, source, unwrap(context, scope));
				} catch (Exception e) {
					throw new RuntimeException(e);
				}
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
		}

		public Object apply(Object compiled, Object target) {
			try {
				Class ScriptFunction = getNashornClass("internal.runtime.ScriptFunction");
				Class ScriptRuntime = getNashornClass("internal.runtime.ScriptRuntime");
				java.lang.reflect.Method apply = ScriptRuntime.getMethod("apply", ScriptFunction, Object.class, Object[].class);
				//System.err.println("compiled = " + compiled);
				Object context = getContext();
				return apply.invoke(null, unwrap(context, compiled), unwrap(context, target), new Object[0]);
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
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
				new HostImpl(this.classes, this.top)
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
