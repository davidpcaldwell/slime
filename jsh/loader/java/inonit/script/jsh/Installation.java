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

import java.io.*;
import java.util.*;
import java.util.logging.*;

import inonit.system.*;
import inonit.script.engine.*;

public class Installation {
	public static abstract class Configuration {
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

	static Installation create(Configuration configuration) {
		Installation rv = new Installation();
		rv.configuration = configuration;
		return rv;
	}

	private Configuration configuration;

	private Installation() {
	}

	public final Code.Source.File getJshLoader(String path) {
		try {
			return configuration.getJshLoader().getFile(path);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public final Code.Source getPlatformLoader() {
		return configuration.getPlatformLoader();
	}

	public final Code.Source getJshLoader() {
		return configuration.getJshLoader();
	}

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
			if (rv.getCode().getScripts().getFile("plugin.jsh.js") != null) {
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

		private static void addPluginsTo(List<Installation.Plugin> rv, File file, boolean warn) {
			if (file.exists()) {
				if (file.isDirectory()) {
					if (new File(file, "plugin.jsh.js").exists()) {
						//	interpret as unpacked module
						Logging.get().log(Installation.class, Level.CONFIG, "Loading unpacked plugin from " + file + " ...");
						rv.add(Installation.Plugin.unpacked(file));
					} else {
						//	interpret as directory that may contain plugins
						File[] list = file.listFiles();
						Arrays.sort(list, new PluginComparator());
						for (File f : list) {
							addPluginsTo(rv, f, false);
						}
					}
				} else if (!file.isDirectory() && file.getName().endsWith(".slime")) {
					try {
						Installation.Plugin p = Installation.Plugin.slime(file);
						if (p != null) {
							Logging.get().log(Installation.class, Level.WARNING, "Loading plugin from %s ...", file);
							rv.add(p);
						} else {
							Logging.get().log(Installation.class, Level.WARNING, "Found .slime file, but no plugin.jsh.js: %s", file);
						}
					} catch (IOException e) {
						//	TODO	probably error message or warning
					}
				} else if (!file.isDirectory() && file.getName().endsWith(".jar")) {
					Logging.get().log(Installation.class, Level.CONFIG, "Loading Java plugin from " + file + " ...");
					rv.add(Installation.Plugin.jar(file));
				} else {
					//	Ignore, exists but not .slime or .jar or directory
					//	TODO	probably log message of some kind
					if (warn) Logging.get().log(Installation.class, Level.WARNING, "Cannot load plugin from %s as it does not appear to contain a valid plugin", file);
				}
			} else {
				Logging.get().log(Installation.class, Level.CONFIG, "Cannot load plugin from %s; file not found", file);
			}
		}

		static void addPluginsTo(List<Installation.Plugin> rv, File file) {
			addPluginsTo(rv, file, true);
		}

		//	Called by applications to load plugins
		public static Plugin[] get(File file) {
			Logging.get().log(Installation.class, Level.INFO, "Application: load plugins from " + file);
			List<Plugin> rv = new ArrayList<Plugin>();
			addPluginsTo(rv, file);
			return rv.toArray(new Plugin[rv.size()]);
		}

		public abstract Code getCode();
	}

	public final Plugin[] getPlugins() {
		File[] roots = configuration.getPluginRoots();
		ArrayList<Plugin> rv = new ArrayList<Plugin>();
		for (int i=0; i<roots.length; i++) {
			Logging.get().log(Installation.class, Level.CONFIG, "Loading plugins from installation root %s ...", roots[i]);
			Plugin.addPluginsTo(rv, roots[i]);
		}
		return rv.toArray(new Plugin[rv.size()]);
	}

	public final Code.Source.File getLibrary(String path) {
		Logging.get().log(Installation.class, Level.FINE, "Searching for library %s ...", path);
		File[] roots = configuration.getPluginRoots();
		Code.Source.File rv = null;
		for (File root : roots) {
			Logging.get().log(Installation.class, Level.FINER, "Searching for library %s in %s ...", path, root);
			if (new File(root, path).exists()) {
				Logging.get().log(Installation.class, Level.FINE, "Found library %s in %s ...", path, root);
				rv = Code.Source.File.create(new File(root, path));
			}
		}
		if (rv == null) {
			Logging.get().log(Installation.class, Level.FINE, "Did not find library %s.", path);
		}
		return rv;
	}
}