package inonit.script.jsh;

import inonit.script.rhino.*;
import java.io.*;
import java.util.*;

public abstract class Installation {
	public abstract Engine.Source getPlatformLoader(String path);
	public abstract Engine.Source getRhinoLoader();
	public abstract Engine.Source getJshLoader();

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

		public abstract Code getCode();
	}

	public abstract Plugin[] getPlugins();
	
	public static Installation unpackaged() {
		return new Installation() {
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

			public Engine.Source getPlatformLoader(String path) {
				return Engine.Source.create(getFile("loader", path));
			}

			public Engine.Source getRhinoLoader() {
				return Engine.Source.create(getFile("loader", "rhino/literal.js"));
			}

			public Engine.Source getJshLoader() {
				return Engine.Source.create(getFile("jsh", "jsh.js"));
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

			public Plugin[] getPlugins() {
				ArrayList<Plugin> rv = new ArrayList<Plugin>();
				addPluginsTo(rv, System.getProperty("jsh.library.modules"));
				//	Defaults for jsh.plugins: installation modules directory? Probably obsolete given that we will be loading
				//	them. $HOME/.jsh/plugins?
				addPluginsTo(rv, System.getProperty("jsh.plugins"));
				return rv.toArray(new Plugin[rv.size()]);
			}
		};
	}
}
