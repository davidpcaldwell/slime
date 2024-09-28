//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.engine;

import java.io.*;
import java.util.*;
import java.net.*;
import java.util.logging.*;

public abstract class Loader {
	private static final Logger LOGGER = Logger.getLogger(Loader.class.getName());
	private static final inonit.system.Logging LOG = inonit.system.Logging.get();

	public abstract String getLoaderCode(String path) throws IOException;
	public abstract Classes.Interface getClasspath();
	public abstract String getCoffeeScript() throws IOException;
	public abstract Typescript getTypescript() throws IOException;

	public static abstract class Typescript {
		public abstract String compile(String code) throws IOException;
	}

	/**
	 * An object that can both provide an application class loader and an interface for scripts to use, which includes the ability
	 * to create a {@link Code.Loader} which compiles its source files.
	 */
	public static abstract class Classes {
		public static abstract class Configuration {
			public abstract boolean canCreateClassLoaders();
			public abstract ClassLoader getApplicationClassLoader();
			public abstract File getLocalClassCache();
		}

		abstract File getLocalClassCache();
		abstract ClassLoaderImpl getClassLoader();

		public abstract ClassLoader getApplicationClassLoader();

		/**
		 * Provides an interface to class loading capabilities if they are available
		 *
		 * @return An {@Interface}, if configuration allows classes to be loaded, or <code>null</code> if it does not.
		 */
		public abstract Interface getInterface();

		public class Interface {
			private ClassLoaderImpl loader;

			Interface(ClassLoaderImpl loader) {
				this.loader = loader;
			}

			public void setAsThreadContextClassLoaderFor(Thread thread) {
				thread.setContextClassLoader(loader);
			}

			public final void add(Code.Loader code) {
				loader.append(code);
			}

			//	TODO	this special method is necessary because other Code.Loader implementations do not work with
			//			java.util.ServiceLoader. There is currently no test case for this so, until that changes, it will be hard to
			//			change or debug.
			public final void addJar(File file) throws IOException {
				loader.append(Code.Loader.jar(file));
			}

			/**
				Returns class with the given name, or <code>null</code> if there is no such class.
			*/
			public final Class<?> getClass(String name) {
				try {
					return Classes.this.getClassLoader().loadClass(name);
				} catch (ClassNotFoundException e) {
					return null;
				}
			}

			private Java.Store store;

			private Java.Store getCompileDestination() {
				LOG.log(Loader.class, Level.FINE, "getCompileDestination", null);
				if (store == null) {
					if (getLocalClassCache() == null) {
						return Java.Store.memory();
					} else {
						return Java.Store.file(getLocalClassCache());
					}
				}
				return store;
			}

			public final Code.Loader compiling(Code.Loader base) {
				return Java.compiling(base, getCompileDestination(), loader);
			}
		}

		public static Classes create(final Configuration configuration) {
			if (configuration.canCreateClassLoaders()) {
				final ClassLoaderImpl loaderClasses = ClassLoaderImpl.create(configuration.getApplicationClassLoader());
				return new Classes() {
					private Interface api;

					@Override public ClassLoader getApplicationClassLoader() {
						return loaderClasses;
					}

					@Override File getLocalClassCache() {
						LOG.log(Loader.class, Level.FINE, "Local class cache: " + configuration.getLocalClassCache(), null);
						return configuration.getLocalClassCache();
					}

					ClassLoaderImpl getClassLoader() {
						return loaderClasses;
					}

					@Override public Interface getInterface() {
						if (api == null) {
							api = new Interface(loaderClasses);
						}
						return api;
					}
				};
			} else {
				final ClassLoader loader = configuration.getApplicationClassLoader();
				return new Classes() {
					@Override public ClassLoader getApplicationClassLoader() {
						return loader;
					}

					@Override File getLocalClassCache() {
						LOG.log(Loader.class, Level.FINE, "Local class cache: null", null);
						return null;
					}

					ClassLoaderImpl getClassLoader() {
						return null;
					}

					@Override public Interface getInterface() {
						return null;
					}
				};
			}
		}

		private static class ClassLoaderImpl extends ClassLoader {
			static ClassLoaderImpl create(ClassLoader parent) {
				LOGGER.log(Level.FINE, "Creating Loader.Classes: parent=%s", parent);
				return new ClassLoaderImpl(parent);
			}

			private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();
			private ArrayList<Code.Loader> locations = new ArrayList<Code.Loader>();

			private ClassLoaderImpl(ClassLoader parent) {
				super(parent);
			}

			public String toString() {
				String rv = getClass().getName() + ": delegate=" + this.getParent() + " locations=[";
				synchronized(locations) {
					for (int i=0; i<locations.size(); i++) {
						rv += locations.get(i);
						if (i+1 != locations.size()) {
							rv += ",";
						}
					}
				}
				rv += "]";
				return rv;
			}

			private java.lang.reflect.Method polyfillGetDefinedPackage() {
				try {
					return ClassLoader.class.getMethod("getDefinedPackage", String.class);
				} catch (NoSuchMethodException e) {
					try {
						return ClassLoader.class.getDeclaredMethod("getPackage", String.class);
					} catch (NoSuchMethodException ee) {
						throw new RuntimeException(ee);
					}
				}
			}

			protected Class<?> findClass(String name) throws ClassNotFoundException {
				//LOGGER.log(Level.FINE, "findClass(" + name + ")");
				String path = name.replace('.', '/') + ".class";
				String[] tokens = name.split("\\.");
				String packageName = tokens[0];
				for (int i=1; i<tokens.length-1; i++) {
					packageName += "." + tokens[i];
				}
				synchronized(locations) {
					for (Code.Loader source : locations) {
						try {
							//LOGGER.log(Level.FINE, "findClass(" + name + ") using source " + source);
							Code.Loader.Resource in = source.getFile(path);
							if (in != null) {
								java.lang.reflect.Method getDefinedPackage = polyfillGetDefinedPackage();
								try {
									if (getDefinedPackage.invoke(this, packageName) == null) {
										definePackage(packageName,null,null,null,null,null,null,null);
									}
									byte[] b = streams.readBytes(in.getInputStream());
									return defineClass(name, b, 0, b.length);
								} catch (IllegalAccessException e) {
									throw new RuntimeException(e);
								} catch (java.lang.reflect.InvocationTargetException e) {
									throw new RuntimeException(e.getCause());
								}
							}
						} catch (IOException e) {
							//	do nothing
						}
					}
				}
				throw new ClassNotFoundException(name);
			}

			protected URL findResource(String name) {
				synchronized(locations) {
					for (Code.Loader source : locations) {
						Code.Locator classes = source.getLocator();
						if (classes != null) {
							URL url = classes.getResource(name);
							if (url != null) {
								return url;
							}
						}
					}
				}
				return null;
			}

			protected Enumeration<URL> findResources(String name) {
				java.util.Vector<URL> rv = new java.util.Vector<URL>();
				synchronized(locations) {
					for (Code.Loader source : locations) {
						Code.Locator classes = source.getLocator();
						if (classes != null) {
							URL url = classes.getResource(name);
							if (url != null) {
								rv.add(url);
							}
						}
					}
				}
				return rv.elements();
			}

			void append(Code.Loader code) {
				synchronized(locations) {
					locations.add(code);
				}
			}
		}
	}
}
