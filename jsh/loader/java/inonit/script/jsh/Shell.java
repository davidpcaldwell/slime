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

	private Loader.Classes.Interface classpath;

	final void setClasspath(Loader.Classes.Interface classpath) {
		this.classpath = classpath;
	}

	public Code.Source getPlatformLoader() {
		return configuration.getInstallation().getPlatformLoader();
	}

	public Code.Source getJshLoader() {
		return configuration.getInstallation().getJshLoader();
	}

	//	TODO	Simplify handling of CoffeeScript by collapsing the next three methods and their invocations
	
	public Code.Source getLibraries() {
		return configuration.getInstallation().getLibraries();
	}

	//	TODO	Used in jsh.js to retrieve CoffeeScript
	public Code.Source.File getLibrary(String path) {
		Code.Source plugins = configuration.getInstallation().getLibraries();
		try {
			return plugins.getFile(path);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	//	TODO	push back out into invoking code; appears to be used only by jsh/loader/nashorn.js
	public String getCoffeeScript() throws IOException {
		Code.Source.File _file = getLibraries().getFile("coffee-script.js");
		if (_file == null) return null;
		return streams.readString(_file.getReader());
	}

	public String getLoaderCode(String path) throws IOException {
		return streams.readString(getPlatformLoader().getFile(path).getReader());
	};

	public final Code[] getPlugins() {
		if (classpath == null) throw new IllegalStateException();
		return configuration.getInstallation().getExtensions().getPlugins(classpath).toArray(new Code[0]);
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

	public final void setRuntime(Object object) {
		this.$host = object;
	}

	public final Object runtime() {
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

		//	TODO	Currently unused, but presumably intended to support a lighter-weight embedding of jsh inside something
		//			smaller than a full VM

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

	public static abstract class Extensions {
		static Extensions create(final Extensions[] array) {
			return new Extensions() {
				@Override public List<Code> getPlugins(Loader.Classes.Interface classpath) {
					List<Code> rv = new ArrayList<Code>();
					for (Extensions p : array) {
						rv.addAll(p.getPlugins(classpath));
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

		static Extensions create(Code.Source source) {
			return new Plugins(source);
		}
		
		static Extensions create(File file) {
			return create(Code.Source.create(file));
		}

		public abstract List<Code> getPlugins(Loader.Classes.Interface classpath);
		public abstract Code.Source getLibraries();

		static class Plugins extends Shell.Extensions {
			static Plugins create(File file) {
				if (!file.exists()) return Plugins.EMPTY;
				if (!file.isDirectory()) throw new RuntimeException();
				return new Plugins(Code.Source.create(file));
			}

			static final Plugins EMPTY = new Plugins(Code.Source.NULL);

			private Code.Source source;

			Plugins(Code.Source source) {
				this.source = source;
			}

			static class PluginComparator implements Comparator<String> {
				private int evaluate(String file) {
					if (file.endsWith(".jar")) {
						return -1;
					}
					return 0;
				}

				public int compare(String o1, String o2) {
					return evaluate(o1) - evaluate(o2);
				}
			}

			private static void addPluginsTo(List<Code> rv, final Code.Source file, boolean top, Loader.Classes.Interface classpath) throws IOException {
				if (file.getFile("plugin.jsh.js") != null) {
					//	interpret as unpacked module
					LOG.log(Level.CONFIG, "Loading unpacked plugin from " + file + " ...");
					rv.add(classpath.unpacked(file));
				} else {
					String[] files = file.getEnumerator().list(null);
					if (files == null) return;
					Arrays.sort(files, new PluginComparator());
					for (String name : files) {
						if (name.endsWith("/")) {
							addPluginsTo(rv, file.child(name), false, classpath);
	//							throw new RuntimeException("Unimplemented: Code source child");
						} else if (name.endsWith(".slime")) {
							Code p = Code.slime(file.getFile(name));
							if (p.getScripts().getFile("plugin.jsh.js") != null) {
								LOG.log(Level.CONFIG, "Loading plugin from %s ...", file);
								rv.add(p);
							} else {
								LOG.log(Level.WARNING, "Found .slime file, but no plugin.jsh.js: %s", file);
							}
						} else if (name.endsWith(".jar")) {
							//	TODO	write a test that ensures this works
							LOG.log(Level.CONFIG, "Loading Java plugin from " + file + " ...");
							rv.add(Code.jar(file.getFile(name)));						
						} else {
							//	If this was a top-level thing to load, and was loaded by application, print a warning
							//	TODO	refactor to make this work
							boolean APPLICATION = false;
							if (top && APPLICATION) LOG.log(Level.WARNING, "Cannot load plugin from %s as it does not appear to contain a valid plugin", file);						
						}
					}
				}
			}

			@Override public List<Code> getPlugins(Loader.Classes.Interface classpath) {
				List<Code> rv = new ArrayList<Code>();
				try {
					addPluginsTo(rv, source, true, classpath);
					return rv;
				} catch (java.io.IOException e) {
					throw new RuntimeException(e);
				}
			}

			@Override public Code.Source getLibraries() {
				return source;
			}			
		}
	}

	public static abstract class Installation {
		public abstract Code.Source getPlatformLoader();
		public abstract Code.Source getJshLoader();
		public abstract Code.Source getLibraries();
		public abstract Extensions getExtensions();
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

		public final File getClassCache() {
			String value = this.getSystemProperties().getProperty("jsh.shell.classes");
			return (value == null) ? null : new File(new File(value), "modules");
		}

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
		private Installation installation;
		private Loader.Classes.Interface classpath;

		Interface(Installation installation, Loader.Classes.Interface classpath) {
			this.installation = installation;
			this.classpath = classpath;
		}
		
		public Code[] getPlugins() {
			return installation.getExtensions().getPlugins(classpath).toArray(new Code[0]);
		}

		//	Called by applications to load plugins from an arbitrary source
		public Code[] getPlugins(File file) {
			return Extensions.create(Code.Source.create(file)).getPlugins(classpath).toArray(new Code[0]);
		}
		
		public Code.Source getPluginSource() {
			return installation.getExtensions().getLibraries();
		}

		public Invocation invocation(File script, String[] arguments) {
			return Shell.Invocation.create(Shell.Script.create(script), arguments);
		}
	}

	public Interface getInterface() {
		if (classpath == null) throw new IllegalStateException();
		return new Interface(configuration.getInstallation(), classpath);
	}

	public static abstract class Execution {
		private Shell shell;

		protected Execution(Shell shell) {
			this.shell = shell;
		}

		protected abstract Loader.Classes.Interface getClasspath();

		protected final Code.Source getJshLoader() {
			return shell.getJshLoader();
		}

		/**
		 *	Should set a property on the global object. Used to set the <code>$jsh</code> property to the Shell object.
		 *	@param name The name of the property to set
		 *	@param value The value to which to set it
		 */
		protected abstract void setGlobalProperty(String name, Object value);

		/**
		 *	Must invoke <code>$jsh.setHost(o)</code> where o is a JavaScript object that will be provided to the <code>jsh.js</code>
		 *	script via <code>$jsh.host()</code>
		 */
		//	TODO	not quite DRY; all implementations must invoke $jsh.setHost; would be better if this somehow eval-ed and did
		//			that itself
		protected abstract void setJshHostProperty();

		/**
		 *	Executes the given script in the global scope.
		 *	@param script The script to execute.
		 */
		protected abstract void script(Code.Source.File script);

		/**
		 *	Executes the main script, returning its exit status.
		 *	@return The exit status of the main program.
		 */
		protected abstract Integer run();

		public final Integer execute() {
			LOG.log(Level.INFO, "Executing shell with %s", this);
			shell.setClasspath(getClasspath());
			this.setGlobalProperty("$jsh", shell);
			this.setJshHostProperty();
			try {
				this.script(shell.getJshLoader().getFile("jsh.js"));
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			return this.run();
		}
	}
}