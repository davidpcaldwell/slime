package inonit.script.jsh;

import java.io.*;
import java.util.*;
import java.util.logging.*;

import inonit.system.*;
import inonit.script.engine.*;

public abstract class Installation {
	public abstract Code.Source.File getPlatformLoader(String path);
	public abstract Code.Source.File getJshLoader(String path);

	/**
	 *	Specifies where code for "shell modules" -- modules included with jsh itself -- can be found.
	 *
	 *	@param path A logical path to the module; e.g., js/object for the jsh.js module.
	 *
	 *	@return An object that can load the specified module.
	 */
	public abstract Code getShellModuleCode(String path);

	public static abstract class Plugin {
		private static Plugin create(final Code code) {
			return new Plugin() {
				@Override
				public Code getCode() {
					return code;
				}
			};
		}

		static Plugin unpacked(final File directory) {
			return create(Code.unpacked(directory));
		}

		static Plugin slime(final File slime) throws IOException {
			//	TODO	what if this .slime contains classes? Should we load them? Right now, we do not
			Plugin rv = create(Code.slime(slime));
			if (rv.getCode().getScripts().getResourceAsStream("plugin.jsh.js") != null) {
				return rv;
			} else {
				return null;
			}
		}

		static Plugin jar(final File jar) {
			return create(Code.jar(jar));
		}

		static class PluginComparator implements Comparator<File> {
			private int evaluate(File file) {
				if (!file.isDirectory() && file.getName().endsWith(".jar")) {
					return -1;
				}
				return 0;
			}

			public int compare(File o1, File o2) {
				return evaluate(o1) - evaluate(o2);
			}
		}

		static void addPluginsTo(List<Installation.Plugin> rv, File file) {
			if (file.exists()) {
				if (file.isDirectory()) {
					if (new File(file, "plugin.jsh.js").exists()) {
						//	interpret as unpacked module
						rv.add(Installation.Plugin.unpacked(file));
					} else {
						//	interpret as directory of slime
						File[] list = file.listFiles();
						Arrays.sort(list, new PluginComparator());
						for (File f : list) {
							addPluginsTo(rv, f);
						}
					}
				} else if (file.getName().endsWith(".slime")) {
					try {
						Installation.Plugin p = Installation.Plugin.slime(file);
						if (p != null) {
							rv.add(p);
						}
					} catch (IOException e) {
						//	TODO	probably error message or warning
					}
				} else if (file.getName().endsWith(".jar")) {
					rv.add(Installation.Plugin.jar(file));
				} else {
					//	Ignore, not .slime or directory
					//	TODO	probably log message of some kind
				}
			}
		}

		public static Plugin[] get(File file) {
			List<Plugin> rv = new ArrayList<Plugin>();
			addPluginsTo(rv, file);
			return rv.toArray(new Plugin[rv.size()]);
		}

		public abstract Code getCode();
	}
	
	public abstract File[] getPluginRoots();

	public final Plugin[] getPlugins() {
		File[] roots = getPluginRoots();
		ArrayList<Plugin> rv = new ArrayList<Plugin>();
		for (int i=0; i<roots.length; i++) {
			Logging.get().log(Installation.class, Level.CONFIG, "Loading plugins from %s ...", roots[i]);
			Plugin.addPluginsTo(rv, roots[i]);
		}
		return rv.toArray(new Plugin[rv.size()]);		
	}
	
	public final Code.Source.File getLibrary(String path) {
		File[] roots = getPluginRoots();
		Code.Source.File rv = null;
		for (File root : roots) {
			if (new File(root, path).exists()) {
				rv = Code.Source.File.create(new File(root, path));
			}
		}
		return rv;
	}
	
	private static abstract class BaseInstallation extends Installation {
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
	}
	
	public static Installation unpackaged() {
		return new BaseInstallation() {
			public String toString() {
				return getClass().getName()
					+ " jsh.library.scripts=" + System.getProperty("jsh.library.scripts")
					+ " jsh.library.scripts.loader=" + System.getProperty("jsh.library.scripts.loader")
					+ " jsh.library.scripts.jsh=" + System.getProperty("jsh.library.scripts.jsh")
				;
			}

			File getFile(String prefix, String name) {
				String propertyName = "jsh.library.scripts." + prefix;
				if (System.getProperty(propertyName) != null) {
					File dir = new File(System.getProperty(propertyName));
					return new File(dir, name);
				} else if (System.getProperty("jsh.library.scripts") != null) {
					File root = new File(System.getProperty("jsh.library.scripts"));
					File dir = new File(root, prefix);
					return new File(dir, name);
				} else {
					throw new RuntimeException("Script not found: " + prefix + "/" + name);
				}
			}

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

			public Code.Source.File getPlatformLoader(String path) {
				return Code.Source.File.create(getFile("loader", path));
			}

			public Code.Source.File getJshLoader(String path) {
				return Code.Source.File.create(getFile("jsh", path));
			}

			public Code getShellModuleCode(String path) {
				return Code.slime(getModulePath(path));
			}

			private void addPluginsTo(List<Plugin> rv, String property) {
				if (property != null) {
					String[] tokens = property.split(File.pathSeparator);
					for (String token : tokens) {
						File file = new File(token);
						Plugin.addPluginsTo(rv, file);
					}
				}
			}

			public File[] getPluginRoots() {
				//	Defaults for jsh.plugins: installation modules directory? Probably obsolete given that we will be loading
				//	them. $HOME/.jsh/plugins?
				return getPluginRoots(System.getProperty("jsh.library.modules"), System.getProperty("jsh.plugins"));
			}
		};
	}
	
	public static Installation packaged() {
		return new BaseInstallation() {
			public String toString() {
				return getClass().getName() + " [packaged]";
			}

			public Code.Source.File getPlatformLoader(String path) {
				return Code.Source.File.create("[slime]:" + path, ClassLoader.getSystemResourceAsStream("$jsh/loader/" + path));
			}

			public Code.Source.File getJshLoader(String path) {
				InputStream in = ClassLoader.getSystemResourceAsStream("$jsh/" + path);
				if (in == null) {
					throw new RuntimeException("Not found in system class loader: $jsh/" + path + "; system class path is " + System.getProperty("java.class.path"));
				}
				return Code.Source.File.create("jsh/" + path, in);
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
}
