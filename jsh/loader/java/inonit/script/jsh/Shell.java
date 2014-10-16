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
	public abstract Installation getInstallation();

	private Streams streams = new Streams();

	public final Streams getStreams() {
		return streams;
	}

	public final String getLoaderCode() throws IOException {
		return streams.readString(getInstallation().getJshLoader("bootstrap.js").getReader());
	}

	public Shell subshell(Configuration configuration, Invocation invocation) {
		return create(this.getInstallation(), configuration, invocation);
	}

	public abstract Configuration getConfiguration();
	public abstract Invocation getInvocation() throws Invocation.CheckedException;

	public static Shell create(final Installation installation, final Configuration configuration, final Invocation invocation) {
		return new Shell() {
			@Override public Installation getInstallation() {
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

	public static Shell main(final String[] arguments) {
		final Configuration configuration = Configuration.main();
		if (System.getProperty("jsh.launcher.packaged") != null) {
			return new Shell() {
				@Override public Installation getInstallation() {
					return Installation.packaged();
				}

				@Override public Configuration getConfiguration() {
					return configuration;
				}

				@Override public Invocation getInvocation() {
					return Invocation.packaged(arguments);
				}
			};
		} else {
			if (arguments.length == 0) {
				throw new IllegalArgumentException("No arguments supplied; is this actually a packaged application? system properties = " + System.getProperties());
			}
			return new Shell() {
				@Override public Installation getInstallation() {
					return Installation.unpackaged();
				}

				@Override public Configuration getConfiguration() {
					return configuration;
				}

				@Override public Invocation getInvocation() throws Invocation.CheckedException {
					return Invocation.create(arguments);
				}
			};
		}
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

				@Override public void exit(int status) {
					this.status = new Integer(status);
				}

				public Integer getExit() {
					return status;
				}
			}

			public abstract void exit(int status);
		}

		/**
		 *
		 *	@return An object capable of loading modules bundled with a script if this is a packaged application, or
		 *	<code>null</code> if it is not.
		 */
		public abstract Code.Source getPackagedCode();

		public abstract File getPackageFile();

		public static abstract class Stdio {
			public abstract InputStream getStandardInput();
			public abstract OutputStream getStandardOutput();
			public abstract OutputStream getStandardError();
		}

		public static Configuration main() {
			return new Shell.Configuration() {
				private InputStream stdin = new Logging.InputStream(System.in);
				//	We assume that as long as we have separate launcher and loader processes, we should immediately flush stdout
				//	whenever it is written to (by default it only flushes on newlines). This way the launcher process can handle
				//	ultimately buffering the stdout to the console or other ultimate destination.
				private OutputStream stdout = new Logging.OutputStream(inonit.script.runtime.io.Streams.Bytes.Flusher.ALWAYS.decorate(System.out), "stdout");
				//	We do not make the same assumption for stderr because we assume it will always be written to a console-like
				//	device and bytes will never need to be immediately available
				private OutputStream stderr = new PrintStream(new Logging.OutputStream(System.err, "stderr"));

				public ClassLoader getClassLoader() {
					return Shell.Configuration.class.getClassLoader();
				}

				public Properties getSystemProperties() {
					return System.getProperties();
				}

				public OperatingSystem.Environment getEnvironment() {
					return OperatingSystem.Environment.SYSTEM;
				}

				public Stdio getStdio() {
					return new Stdio() {
						public InputStream getStandardInput() {
							return stdin;
						}

						public OutputStream getStandardOutput() {
							return stdout;
						}

						public OutputStream getStandardError() {
							return stderr;
						}
					};
				}

				@Override public Code.Source getPackagedCode() {
					if (System.getProperty("jsh.launcher.packaged") != null) {
						return Code.Source.system("$packaged/");
					} else {
						return null;
					}
				}

				@Override public File getPackageFile() {
					if (System.getProperty("jsh.launcher.packaged") != null) {
						return new java.io.File(System.getProperty("jsh.launcher.packaged"));
					} else {
						return null;
					}
				}
			};
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