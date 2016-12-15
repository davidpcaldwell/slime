//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh;

import java.util.*;

import javax.script.*;

import inonit.script.engine.*;

public class Nashorn extends Main.Engine {
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

	public void main(Shell.Container context, Shell shell) throws Shell.Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(shell, true);
		Integer rv = execution.execute();
		if (rv == null) {
		} else if (rv.intValue() == 0) {
		} else {
			context.exit(rv.intValue());
		}
	}

	public static class UncaughtException extends RuntimeException {
		UncaughtException(ScriptException e) {
			super(e);
		}
	}

	private static class ExecutionImpl extends Shell.Execution {
		private inonit.script.nashorn.Host host;
		private boolean top;

		ExecutionImpl(final Shell shell, boolean top) {
			super(shell);
			this.host = inonit.script.nashorn.Host.create(new Loader.Classes.Configuration() {
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

		@Override
		protected Loader.Classes.Interface getClasspath() {
			return host.getClasspath();
		}

		@Override public void setGlobalProperty(String name, Object value) {
			host.set(name, value);
		}

		@Override public void setJshHostProperty() {
			setGlobalProperty("$nashorn", new Host() {
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
			try {
				host.add(this.getJshLoader().getFile("nashorn.js"));
			} catch (java.io.IOException e) {
				throw new RuntimeException(e);
			}
		}

		@Override public void script(Code.Source.File script) {
			host.add(script);
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
				throw new UncaughtException(e);
			}
		}
	}

	public static void main(final String[] args) throws Shell.Invocation.CheckedException {
		try {
			Main.cli(new Nashorn(), args);
		} catch (Throwable t) {
			t.printStackTrace();
			System.exit(255);
		}
	}
}