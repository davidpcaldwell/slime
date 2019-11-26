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

	public Code.Loader getJshLoader() {
		return configuration.getInstallation().getJshLoader();
	}

	//	TODO	Simplify handling of CoffeeScript by collapsing the next two methods and their invocations

	//	TODO	Used in jsh.js to retrieve CoffeeScript
	public Code.Loader.Resource getLibrary(String path) {
		Code.Loader plugins = configuration.getInstallation().getLibraries();
		try {
			return plugins.getFile(path);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	//	TODO	this is necessary still because of the fact that Code.Loader-based .jar files do not correctly implement
	//			java.util.ServiceLoader, so JAR files must be added to the classpath using a special API, so they must be added
	//			as java.io.File objects.
	public File getLibraryFile(String path) {
		return configuration.getInstallation().getLibraryFile(path);
	}

	private Loader loader = new Loader() {
		private Streams streams = new Streams();

		//	TODO	push back out into invoking code; appears to be used only by jsh/loader/nashorn.js
		public String getCoffeeScript() throws IOException {
			Code.Loader.Resource _file = configuration.getInstallation().getLibraries().getFile("coffee-script.js");
			if (_file == null) return null;
			return streams.readString(_file.getReader());
		}

		public String getLoaderCode(String path) throws IOException {
			return streams.readString(configuration.getInstallation().getPlatformLoader().getFile(path).getReader());
		}	

		public Loader.Classes.Interface getClasspath() {
			return Shell.this.classpath;
		}

		private File getTscPath() {
			return configuration.getInstallation().getLibraryFile("node/bin/tsc");
		}

		private File getNodeBinPath() {
			return configuration.getInstallation().getLibraryFile("node/bin");
		}

		private File createTemporaryDirectory(String prefix) throws IOException {
			File rv = File.createTempFile(prefix, null);
			rv.delete();
			rv.mkdirs();
			return rv;
		}

		public Loader.Typescript getTypescript() throws IOException {
			Code.Loader.Resource tsc = configuration.getInstallation().getLibraries().getFile("node/bin/tsc");
			if (tsc != null) {
				return new Loader.Typescript() {
					@Override public String compile(String code) throws IOException {
						try {
							//	In unbuilt shell, these worked without 'final' annotation, but in test suite, they did not
							final File tmp = createTemporaryDirectory("tsc");
							final File ts = new File(tmp, "code.ts");
							streams.writeString(code, new FileOutputStream(ts));
							File js = new File(tmp, "code.js");
							OperatingSystem.get().run(
								new Command.Context() {
									@Override public File getWorkingDirectory() {
										return tmp;
									}
								
									@Override public Map<String,String> getSubprocessEnvironment() {
										Map<String,String> underlying = OperatingSystem.Environment.SYSTEM.getMap();
										HashMap<String,String> rv = new HashMap<String,String>();
										rv.putAll(underlying);
										rv.put("PATH", rv.get("PATH") + File.pathSeparator + getNodeBinPath());
										return rv;
									}

									@Override public InputStream getStandardInput() {
										return Streams.Null.INPUT_STREAM;
									}
								
									@Override public OutputStream getStandardOutput() {
										return System.out;
									}
								
									@Override public OutputStream getStandardError() {
										return System.err;
									}
								},
								new Command.Configuration() {
									@Override public String getCommand() {
										try {
											return getTscPath().getCanonicalPath();
										} catch (IOException e) {
											throw new RuntimeException(e);
										}
									}
								
									@Override public String[] getArguments() {
										try {
											return new String[] { 
												"--outDir", tmp.getCanonicalPath(),
												ts.getCanonicalPath() 
											};
										} catch (IOException e) {
											throw new RuntimeException(e);
										}
									}
								}
							);
							String compiled = streams.readString(new FileReader(js));
							return compiled;
						} catch (FileNotFoundException e) {
							e.printStackTrace();
							throw e;
						} catch (NullPointerException e) {
							e.printStackTrace();
							throw e;
						}
					}
				};
			}
			return null;
		}
	};

	public Loader getLoader() {
		return loader;
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

	//	TODO	certainly appears this can be merged with Code.Loader.Resource, now that Code.Loader.Resource has concept of URI
	public static abstract class Script {
		private static Script create(final Code.Loader.Resource delegate, final java.net.URI uri) {
			return new Script() {
				@Override public String toString() {
					return Script.class.getName() + " delegate=" + delegate + " uri=" + uri;
				}

				@Override public java.net.URI getUri() {
					return uri;
				}

				public Code.Loader.Resource getSource() {
					return delegate;
				}
			};
		}

		static Script create(File file) {
			return create(Code.Loader.Resource.create(file), file.toURI());
		}

		static Script create(Code.Loader.Resource delegate) {
			return create(delegate, null);
		}

		public abstract java.net.URI getUri();
		public abstract Code.Loader.Resource getSource();
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
		public abstract Code.Loader getPlatformLoader();
		public abstract Code.Loader getJshLoader();
		public abstract Code.Loader getLibraries();
		public abstract File getLibraryFile(String file);
		public abstract Code.Loader[] getExtensions();
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
			public static Packaged create(final Code.Loader code, final File file) {
				return new Packaged() {
					@Override public Code.Loader getCode() {
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
			public abstract Code.Loader getCode();

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

		Interface(Installation installation, Loader.Classes.Interface classpath) {
			this.installation = installation;
		}

		//	TODO	probably needs a better name
		public Code.Loader[] getPluginSources() {
			return installation.getExtensions();
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

		protected final Code.Loader getJshLoader() {
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
		protected abstract void setJshRuntimeObject();

		/**
		 *	Executes the given script in the global scope.
		 *	@param script The script to execute.
		 */
		protected abstract void script(Code.Loader.Resource script);

		/**
		 *	Executes the main script, returning its exit status.
		 *	@return The exit status of the main program.
		 */
		protected abstract Integer run();

		public final Integer execute() {
			LOG.log(Level.INFO, "Executing shell with %s", this);
			shell.setClasspath(getClasspath());
			this.setGlobalProperty("$jsh", shell);
			this.setJshRuntimeObject();
			try {
				this.script(shell.getJshLoader().getFile("jsh.js"));
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			return this.run();
		}
	}
}