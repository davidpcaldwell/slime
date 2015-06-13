//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh;

import java.io.*;
import java.util.*;

import inonit.system.*;
import inonit.script.engine.*;

public class Main {
	public static Shell.Configuration shell() {
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

			@Override public Packaged getPackaged() {
				if (System.getProperty("jsh.launcher.packaged") != null) {
					return new Packaged() {
						@Override
						public Code.Source getCode() {
							return Code.Source.system("$packaged/");
						}

						@Override
						public File getFile() {
							return new java.io.File(System.getProperty("jsh.launcher.packaged"));
						}
					};
				} else {
					return null;
				}
			}
		};
	}

	public static Installation.Configuration unpackagedInstallation() {
		return new Installation.Configuration() {
			public String toString() {
				return getClass().getName()
					+ " jsh.library.scripts.loader=" + System.getProperty("jsh.library.scripts.loader")
					+ " jsh.library.scripts.jsh=" + System.getProperty("jsh.library.scripts.jsh")
					+ " jsh.library.modules=" + System.getProperty("jsh.library.modules")
					+ " jsh.plugins=" + System.getProperty("jsh.plugins")
				;
			}

//			File getFile(String prefix, String name) {
//				String propertyName = "jsh.library.scripts." + prefix;
//				if (System.getProperty(propertyName) != null) {
//					File dir = new File(System.getProperty(propertyName));
//					return new File(dir, name);
//				} else if (System.getProperty("jsh.library.scripts") != null) {
//					File root = new File(System.getProperty("jsh.library.scripts"));
//					File dir = new File(root, prefix);
//					return new File(dir, name);
//				} else {
//					throw new RuntimeException("Script not found: " + prefix + "/" + name);
//				}
//			}

			private File getModulePath(String path) {
				String property = System.getProperty("jsh.library.modules");
				File directory = new File(property + "/" + path);
				File file = new File(property + "/" + path.replace('/', '.') + ".slime");
				if (directory.exists() && directory.isDirectory()) {
					return directory;
				} else if (file.exists()) {
					return file;
				}
				throw new RuntimeException("Not found: " + path + " jsh.library.modules=" + property);
			}

			public Code.Source getPlatformLoader() {
				return Code.Source.create(new File(System.getProperty("jsh.library.scripts.loader")));
			}

			public Code.Source getJshLoader() {
				return Code.Source.create(new File(System.getProperty("jsh.library.scripts.jsh")));
			}

			public Code getShellModuleCode(String path) {
				return Code.slime(getModulePath(path));
			}

			public File[] getPluginRoots() {
				//	Defaults for jsh.plugins: installation modules directory? Probably obsolete given that we will be loading
				//	them. $HOME/.jsh/plugins?
				return getPluginRoots(System.getProperty("jsh.library.modules"), System.getProperty("jsh.plugins"));
			}
		};
	}

	public static Installation.Configuration packagedInstallation() {
		return new Installation.Configuration() {
			public String toString() {
				return getClass().getName() + " [packaged]";
			}

			//	TODO	the below mess was constructed to quickly get through adapting some APIs and should be revisited

			private Code.Source.File getPlatformLoader(String path) {
				return Code.Source.File.create(Code.Source.URI.jvm(Installation.class, "packaged/platform/" + path),"[slime]:" + path, null, null, ClassLoader.getSystemResourceAsStream("$jsh/loader/" + path));
			}

			public Code.Source getPlatformLoader() {
				return new Code.Source() {
					@Override
					public Code.Source.File getFile(String path) throws IOException {
						return getPlatformLoader(path);
					}

					@Override
					public Code.Classes getClasses() {
						return null;
					}
				};
			}

			private Code.Source.File getJshLoader(String path) {
				InputStream in = ClassLoader.getSystemResourceAsStream("$jsh/" + path);
				if (in == null) {
					throw new RuntimeException("Not found in system class loader: $jsh/" + path + "; system class path is " + System.getProperty("java.class.path"));
				}
				return Code.Source.File.create(Code.Source.URI.jvm(Installation.class, "packaged/jsh/" + path), "jsh/" + path, null, null, in);
			}

			public Code.Source getJshLoader() {
				return new Code.Source() {
					@Override
					public Code.Source.File getFile(String path) throws IOException {
						return getJshLoader(path);
					}

					@Override
					public Code.Classes getClasses() {
						return null;
					}
				};
			}

			public Code getShellModuleCode(String path) {
				return Code.system(
					"$jsh/modules/" + path + "/"
				);
			}

			public File[] getPluginRoots() {
				return getPluginRoots(System.getProperty("jsh.plugins"));
			}
		};
	}

	public static Shell shell(final String[] arguments) {
		final Shell.Configuration configuration = shell();
		if (System.getProperty("jsh.launcher.packaged") != null) {
			return new Shell() {
				@Override public Installation.Configuration getInstallationConfiguration() {
					return packagedInstallation();
				}

				@Override public Shell.Configuration getConfiguration() {
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
				@Override public Installation.Configuration getInstallationConfiguration() {
					return unpackagedInstallation();
				}

				@Override public Shell.Configuration getConfiguration() {
					return configuration;
				}

				@Override public Invocation getInvocation() throws Invocation.CheckedException {
					return Invocation.create(arguments);
				}
			};
		}
	}

	public static abstract class Engine {
		public abstract void main(Shell.Configuration.Context context, String[] args) throws Invocation.CheckedException;

		public final void shell(Shell.Configuration.Context context, String[] args) throws Invocation.CheckedException {
			Shell.initialize();
			main(context, args);
		}

		private class Runner extends Shell.Configuration.Context.Holder.Run {
			public void threw(Throwable t) {
				t.printStackTrace();
			}

			public void run(Shell.Configuration.Context context, String[] args) throws Invocation.CheckedException {
				Engine.this.shell(context,args);
			}
		}

		public final Integer embed(String[] args) throws Invocation.CheckedException {
			Shell.Configuration.Context.Holder context = new Shell.Configuration.Context.Holder();
			return context.getExitCode(new Runner(), args);
		}

		public final void cli(String[] args) throws Invocation.CheckedException {
			shell(Shell.Configuration.Context.VM, args);
		}
	}
}