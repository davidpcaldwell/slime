//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh;

import java.io.*;
import java.util.*;
import java.util.logging.*;

import inonit.script.runtime.io.*;
import inonit.system.*;
import inonit.script.engine.*;

public abstract class Shell {
	public static void initialize() {
		if (!inonit.system.Logging.get().isSpecified()) {
			inonit.system.Logging.get().initialize(new java.util.Properties());
		}
		Thread.currentThread().setUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
			public void uncaughtException(Thread t, Throwable e) {
				Throwable error = e;
				java.io.PrintWriter writer = new java.io.PrintWriter(System.err,true);
				while(error != null) {
					writer.println(error.getClass().getName() + ": " + error.getMessage());
					StackTraceElement[] trace = error.getStackTrace();
					for (StackTraceElement line : trace) {
						writer.println("\t" + line);
					}
					error = error.getCause();
					if (error != null) {
						writer.print("Caused by: ");
					}
				}
			}
		});
	}

	private Installation installation;

	public abstract Installation.Configuration getInstallationConfiguration();

	public final Installation getInstallation() {
		if (installation == null) {
			installation = Installation.create(getInstallationConfiguration());
		}
		return installation;
	}

	private Streams streams = new Streams();

	public final Streams getStreams() {
		return streams;
	}

	public final String getLoaderCode() throws IOException {
		return streams.readString(getInstallation().getJshLoader("bootstrap.js").getReader());
	}

	public Shell subshell(Configuration configuration, Invocation invocation) {
		return create(this.getInstallationConfiguration(), configuration, invocation);
	}

	public abstract Configuration getConfiguration();
	public abstract Invocation getInvocation() throws Invocation.CheckedException;

	public static Shell create(final Installation.Configuration installation, final Configuration configuration, final Invocation invocation) {
		return new Shell() {
			@Override public Installation.Configuration getInstallationConfiguration() {
				return installation;
			}

			@Override public Configuration getConfiguration() {
				return configuration;
			}

			@Override public Invocation getInvocation() throws Invocation.CheckedException {
				return invocation;
			}
		};
	}

	private Object $host;

	public final void setHost(Object object) {
		this.$host = object;
	}

	public final Object host() {
		return $host;
	}

	public static abstract class Configuration {
		public abstract ClassLoader getClassLoader();

		public abstract Properties getSystemProperties();
		public abstract OperatingSystem.Environment getEnvironment();
		public abstract Stdio getStdio();

		public static abstract class Context {
			public static final Context VM = new Context() {
				@Override public void exit(int status) {
					System.exit(status);
				}
			};

			public static class Holder extends Context {
				private Integer status;
				private Throwable uncaught;

				@Override public void exit(int status) {
					this.status = new Integer(status);
				}

				public Integer getExitCode(Run run, String[] arguments) {
					try {
						run.run(this, arguments);
						return status;
					} catch (Throwable t) {
						run.threw(t);
						if (status == null) return new Integer(1);
						return status;
					}
				}

				public static abstract class Run {
					public abstract void threw(Throwable t);
					public abstract void run(Context context, String[] arguments) throws Throwable;
				}
			}

			public abstract void exit(int status);
		}

		public static abstract class Packaged {
			/**
			 *
			 *	@return An object capable of loading modules and scripts bundled with a script.
			 */
			public abstract Code.Source getCode();

			public abstract File getFile();
		}

		public abstract Packaged getPackaged();

		public static abstract class Stdio {
			public abstract InputStream getStandardInput();
			public abstract OutputStream getStandardOutput();
			public abstract OutputStream getStandardError();
		}
	}

	public static abstract class Execution {
		private Shell shell;

		final void initialize(Shell shell) {
			this.shell = shell;
			this.host("$jsh", shell);
		}

		protected final Shell getShell() {
			return this.shell;
		}

		protected abstract void host(String name, Object value);
		protected abstract void addEngine();
		protected abstract void script(Code.Source.File script);
		protected abstract Integer execute();

		public final Integer execute(Shell _this) {
			Logging.get().log(Shell.class, Level.INFO, "Executing shell with %s", this);
			final Execution execution = this;
			execution.initialize(_this);
			execution.addEngine();
			execution.script(_this.getInstallation().getJshLoader("jsh.js"));
			return execution.execute();
		}
	}
}