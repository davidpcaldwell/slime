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
	private static final Logger LOG = Logger.getLogger(Shell.class.getName());

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

		public abstract Installation getInstallation();

		public abstract Environment getEnvironment();

		public abstract Invocation getInvocation();

		final Configuration subshell(final Environment environment, final Invocation invocation) {
			final Installation installation = getInstallation();
			return new Configuration() {
				@Override public Installation getInstallation() {
					return installation;
				}

				@Override public Environment getEnvironment() {
					return environment;
				}

				@Override public Invocation getInvocation() {
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

	private Shell() {
	}

	//	Used by engine
	public final String getBootstrapCode() throws IOException {
		return streams.readString(configuration.getInstallation().getJshLoader().getFile("bootstrap.js").getReader());
	}

	public Code.Source getPlatformLoader() {
		return configuration.getInstallation().getPlatformLoader();
	}

	public Code.Source getJshLoader() {
		return configuration.getInstallation().getJshLoader();
	}

	public Code.Source.File getLibrary(String path) {
		Code.Source plugins = configuration.getInstallation().getExtensions().getLibraries();
		try {
			return plugins.getFile(path);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public final Code[] getPlugins() {
		return configuration.getInstallation().getExtensions().getPlugins().toArray(new Code[0]);
	}

	private Streams streams = new Streams();

	public final Streams getStreams() {
		return streams;
	}

	public Shell subshell(Environment configuration, Shell.Invocation invocation) {
		return create(this.configuration.subshell(configuration, invocation));
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

	//	TODO	certainly appears this can be merged with Code.Source.File, now that Code.Source.File has concept of URI
	public static abstract class Script {
		private static Script create(final Code.Source.File delegate, final java.net.URI uri) {
			return new Script() {
				@Override public String toString() {
					return Script.class.getName() + " delegate=" + delegate + " uri=" + uri;
				}

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
				System.out.flush();
				System.err.flush();
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

	public static abstract class Installation {
		public static Installation create(final Code.Source platform, final Code.Source jsh, final Extensions extensions) {
			return new Installation() {
				@Override public Code.Source getPlatformLoader() {
					return platform;
				}

				@Override public Code.Source getJshLoader() {
					return jsh;
				}

				@Override public Extensions getExtensions() {
					return extensions;
				}
			};
		}

		public abstract Code.Source getPlatformLoader();
		public abstract Code.Source getJshLoader();
		public abstract Extensions getExtensions();

		public static abstract class Extensions {
			static Extensions create(final Extensions[] array) {
				return new Extensions() {
					@Override public List<Code> getPlugins() {
						List<Code> rv = new ArrayList<Code>();
						for (Extensions p : array) {
							rv.addAll(p.getPlugins());
						}
						return rv;
					}

					@Override public Code.Source getLibraries() {
						ArrayList<Code.Source> sources = new ArrayList<Code.Source>();
						for (Extensions p : array) {
							sources.add(p.getLibraries());
						}
						return Code.Source.create(sources);
					}
				};
			}

			public abstract List<Code> getPlugins();
			public abstract Code.Source getLibraries();
		}
	}

	public static abstract class Environment {
		public static Environment create(final ClassLoader loader, final Properties properties, final OperatingSystem.Environment environment, final Stdio stdio, final Packaged packaged) {
			return new Environment() {
				@Override public ClassLoader getClassLoader() {
					return loader;
				}

				@Override public Properties getSystemProperties() {
					return properties;
				}

				@Override public OperatingSystem.Environment getEnvironment() {
					return environment;
				}

				@Override public Stdio getStdio() {
					return stdio;
				}

				@Override public Packaged getPackaged() {
					return packaged;
				}
			};
		}
		public abstract ClassLoader getClassLoader();

		public abstract Properties getSystemProperties();
		public abstract OperatingSystem.Environment getEnvironment();
		public abstract Stdio getStdio();

		public static abstract class Packaged {
			public static Packaged create(final Code.Source code, final File file) {
				return new Packaged() {
					@Override public Code.Source getCode() {
						return code;
					}

					@Override public File getFile() {
						return file;
					}
				};
			}
			/**
			 *
			 *	@return An object capable of loading modules and scripts bundled with a script.
			 */
			public abstract Code.Source getCode();

			public abstract File getFile();
		}

		public abstract Packaged getPackaged();

		public static abstract class Stdio {
			public static Stdio create(final InputStream in, final OutputStream out, final OutputStream err) {
				return new Stdio() {
					@Override public InputStream getStandardInput() {
						return in;
					}

					@Override public OutputStream getStandardOutput() {
						return out;
					}

					@Override public OutputStream getStandardError() {
						return err;
					}
				};
			}

			public abstract InputStream getStandardInput();
			public abstract OutputStream getStandardOutput();
			public abstract OutputStream getStandardError();
		}
	}

	public static abstract class Invocation {
		public static Invocation create(final Script script, final String[] arguments) {
			//	TODO	probably should copy arguments array to make it immutable
			return new Invocation() {
				@Override public String toString() {
					String rv = String.valueOf(script);
					for (String s : arguments) {
						rv += " " + s;
					}
					return rv;
				}

				@Override public Script getScript() {
					return script;
				}

				@Override public String[] getArguments() {
					return arguments;
				}
			};
		}

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

	public static class Interface {
		//	Called by applications to load plugins
		public Code[] getPlugins(File file) {
			return Main.Plugins.create(file).getPlugins().toArray(new Code[0]);
		}

		public Invocation invocation(File script, String[] arguments) {
			return Shell.Invocation.create(Shell.Script.create(script), arguments);
		}
	}

	public Interface getInterface() {
		return new Interface();
	}

	public static abstract class Execution {
		private Shell shell;

		protected Execution(Shell shell) {
			this.shell = shell;
		}

		protected final Code.Source getJshLoader() {
			return shell.getJshLoader();
		}

		protected abstract void host(String name, Object value);
		protected abstract void addEngine();
		protected abstract void script(Code.Source.File script);
		protected abstract Integer run();

		public final Integer execute() {
			LOG.log(Level.INFO, "Executing shell with %s", this);
			final Execution execution = this;
			this.host("$jsh", shell);
			execution.addEngine();
			try {
				execution.script(shell.getJshLoader().getFile("jsh.js"));
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			return execution.run();
		}
	}
}