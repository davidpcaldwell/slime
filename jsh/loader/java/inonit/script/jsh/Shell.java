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

public class Shell {
	public static abstract class Configuration {
		public static Shell.Configuration create(final Installation installation, final Environment configuration, final Invocation invocation) {
			return new Shell.Configuration() {
				@Override public Installation getInstallation() {
					return installation;
				}

				@Override public Environment getEnvironment() {
					return configuration;
				}

				@Override public Invocation getInvocation() {
					return invocation;
				}
			};
		}

		public static abstract class Installation {
			protected final File[] getPluginRoots(String... searchpaths) {
				ArrayList<File> files = new ArrayList<File>();
				for (String searchpath : searchpaths) {
					if (searchpath != null) {
						int next = searchpath.indexOf(File.pathSeparator);
						while(next != -1) {
							files.add(new File(searchpath.substring(0,next)));
							searchpath = searchpath.substring(next+File.pathSeparator.length());
							next = searchpath.indexOf(File.pathSeparator);
						}
						if (searchpath.length() > 0) {
							files.add(new File(searchpath));
						}
					}
				}
				return files.toArray(new File[files.size()]);
			}

			public abstract Code.Source getPlatformLoader();
			public abstract Code.Source getJshLoader();

			/**
			 *	Specifies where code for "shell modules" -- modules included with jsh itself -- can be found.
			 *
			 *	@param path A logical path to the module; e.g., js/object for the jsh.js module.
			 *
			 *	@return An object that can load the specified module.
			 */
			public abstract Code getShellModuleCode(String path);
			public abstract File[] getPluginRoots();
		}

		public abstract Installation getInstallation();

		public abstract Environment getEnvironment();

		public abstract Invocation getInvocation();

		final Configuration subshell(final Environment environment, final Invocation invocation) {
			final Installation installation = getInstallation();
			return new Configuration() {
				@Override
				public Installation getInstallation() {
					return installation;
				}

				@Override
				public Environment getEnvironment() {
					return environment;
				}

				@Override
				public Invocation getInvocation() {
					return invocation;
				}
			};
		}
	}

	public static Shell create(Configuration configuration) {
		Shell rv = new Shell();
		rv.configuration = configuration;
		return rv;
	}

	private Configuration configuration;
	private Installation installation;

	private Shell() {
	}

	private Installation getInstallation() {
		if (installation == null) {
			installation = Installation.create(configuration.getInstallation());
		}
		return installation;
	}

	public Code.Source.File getLibrary(String path) {
		return getInstallation().getLibrary(path);
	}

	public Code.Source getPlatformLoader() {
		return getInstallation().getPlatformLoader();
	}

	public Code.Source getJshLoader() {
		return getInstallation().getJshLoader();
	}

	public Code getShellModuleCode(String path) {
		return configuration.getInstallation().getShellModuleCode(path);
	}

	private Streams streams = new Streams();

	public final Streams getStreams() {
		return streams;
	}

	public final String getLoaderCode() throws IOException {
		return streams.readString(getInstallation().getJshLoader("bootstrap.js").getReader());
	}

	public Shell subshell(Environment configuration, Shell.Invocation invocation) {
		return create(this.configuration.subshell(configuration, invocation));
	}

	public final Code[] getPlugins() {
		return installation.getPlugins();
	}

	public final Environment getEnvironment() {
		return configuration.getEnvironment();
	}

	public final Shell.Invocation getInvocation() {
		return configuration.getInvocation();
	}

	private Object $host;

	public final void setHost(Object object) {
		this.$host = object;
	}

	public final Object host() {
		return $host;
	}

	public static abstract class Script {
		private static Script create(final Code.Source.File delegate, final java.net.URI uri) {
			return new Script() {
				@Override public java.net.URI getUri() {
					return uri;
				}

				public Code.Source.File getSource() {
					return delegate;
				}
			};
		}

		static Script create(File file) {
			return create(Code.Source.File.create(file), file.toURI());
		}

		static Script create(Code.Source.File delegate) {
			return create(delegate, null);
		}

		public abstract java.net.URI getUri();
		public abstract Code.Source.File getSource();
	}

	public static abstract class Container {
		public static final Container VM = new Container() {
			@Override public void exit(int status) {
				System.exit(status);
			}
		};

		public static class Holder extends Container {
			private Integer status;
			private Throwable uncaught;

			@Override public void exit(int status) {
				this.status = new Integer(status);
			}

			public Integer getExitCode(Run run, Shell.Configuration shell) {
				try {
					run.run(this, shell);
					return status;
				} catch (Throwable t) {
					run.threw(t);
					if (status == null) return new Integer(1);
					return status;
				}
			}

			public static abstract class Run {
				public abstract void threw(Throwable t);
				public abstract void run(Container context, Shell.Configuration shell) throws Throwable;
			}
		}

		public abstract void exit(int status);
	}

	public static abstract class Environment {
		public abstract ClassLoader getClassLoader();

		public abstract Properties getSystemProperties();
		public abstract OperatingSystem.Environment getEnvironment();
		public abstract Stdio getStdio();

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

	public static abstract class Invocation {
		public abstract Script getScript();
		public abstract String[] getArguments();

		static class CheckedException extends Exception {
			CheckedException(String message) {
				super(message);
			}

			CheckedException(String message, Throwable cause) {
				super(message, cause);
			}
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