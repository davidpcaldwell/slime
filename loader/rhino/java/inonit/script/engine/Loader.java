//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.engine;

import java.io.*;
import java.util.*;
import java.net.*;
import java.util.logging.*;

public abstract class Loader {
	private static final Logger LOGGER = Logger.getLogger(Loader.class.getName());
	private static final inonit.system.Logging LOG = inonit.system.Logging.get();

	public abstract String getCoffeeScript() throws IOException;
	public abstract String getLoaderCode(String path) throws IOException;

	public static abstract class Classes {
		private static class Unpacked extends Code {
			private String toString;
			private Code.Source source;
			private Code.Source classes;

			Unpacked(String toString, Code.Source source, Loader.Classes loader) {
				this.toString = toString;
				this.source = source;
				Code.Source compiling = Java.compiling(source, loader.getCompileDestination(), loader);
				this.classes = compiling;
			}

			public String toString() {
				return getClass().getName() + " [" + toString + "]";
			}

			public Source getScripts() {
				return source;
			}

			public Source getClasses() {
				return classes;
			}
		}

		private static Code loadUnpacked(final File base, Loader.Classes loader) {
			if (!base.isDirectory()) {
				throw new IllegalArgumentException(base + " is not a directory.");
			}
			String path = null;
			try {
				path = base.getCanonicalPath();
			} catch (IOException e) {
				path = base.getAbsolutePath();
			}
			return new Unpacked("file=" + path, Code.Source.create(base), loader);
		}

		private static Code loadUnpacked(final URL base, Loader.Classes loader) {
			return new Unpacked("url=" + base.toExternalForm(), Code.Source.create(base), loader);
		}

		public static abstract class Configuration {
			public abstract boolean canCreateClassLoaders();
			public abstract ClassLoader getApplicationClassLoader();
			public abstract File getLocalClassCache();
		}

		public class Interface {
			private ClassLoaderImpl loader;

			Interface(ClassLoaderImpl loader) {
				this.loader = loader;
			}

			public void setAsThreadContextClassLoaderFor(Thread thread) {
				thread.setContextClassLoader(loader);
			}

			public final void append(Code.Source code) {
				loader.append(code);
			}

			/**
				Returns class with the given name, or <code>null</code> if there is no such class.
			*/
			public final Class getClass(String name) {
				try {
					return Classes.this.classLoader().loadClass(name);
				} catch (ClassNotFoundException e) {
					return null;
				}
			}

			public final void append(Code code) {
				append(code.getClasses());
			}

			public final Code unpacked(File base) {
				return Classes.this.unpacked(base);
			}

			public final Code unpacked(URL base) {
				return Classes.this.unpacked(base);
			}
		}

		abstract File getLocalClassCache();

		private Java.Store store;

		final Java.Store getCompileDestination() {
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

		abstract ClassLoader classLoader();

		final Code unpacked(File base) {
			return loadUnpacked(base, this);
		}

		final Code unpacked(URL base) {
			return loadUnpacked(base, this);
		}

		public abstract ClassLoader getApplicationClassLoader();
		public abstract Interface getInterface();

		private Code.Source parent;

		private static Code.Source adapt(ClassLoader parent) {
			if (parent instanceof URLClassLoader) {
				List<URL> urls = Arrays.asList(((URLClassLoader)parent).getURLs());
				List<Code.Source> sources = new ArrayList<Code.Source>();
				for (URL url : urls) {
					if (url.getProtocol().equals("file")) {
						try {
							File file = new File(url.toURI());
							if (file.getName().endsWith(".jar")) {
								sources.add(Code.Source.zip(file));
							} else {
								sources.add(Code.Source.create(file));
							}
						} catch (java.net.URISyntaxException e) {
							throw new RuntimeException(e);
						}
					} else {
						sources.add(Code.Source.create(url));
					}
				}
				return Code.Source.create(sources);
			} else {
				return null;
			}
		}

		final Code.Source parent() {
			if (parent == null) {
				parent = adapt(classLoader().getParent());
			}
			return parent;
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

					ClassLoader classLoader() {
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

					ClassLoader classLoader() {
						return null;
					}

					@Override public Interface getInterface() {
						return null;
					}
				};
			}
		}

		private static class ClassLoaderImpl extends ClassLoader {
			static ClassLoaderImpl create(ClassLoader delegate) {
				LOGGER.log(Level.FINE, "Creating Loader.Classes: parent=%s", delegate);
				return new ClassLoaderImpl(delegate);
			}

			private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();
			private ArrayList<Code.Source> locations = new ArrayList<Code.Source>();
			private Code.Source dependencies = Code.Source.create(locations);

			private ClassLoaderImpl(ClassLoader delegate) {
				super(delegate);
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

			protected Class findClass(String name) throws ClassNotFoundException {
				//LOGGER.log(Level.FINE, "findClass(" + name + ")");
				String path = name.replace('.', '/') + ".class";
				String[] tokens = name.split("\\.");
				String packageName = tokens[0];
				for (int i=1; i<tokens.length-1; i++) {
					packageName += "." + tokens[i];
				}
				synchronized(locations) {
					for (Code.Source source : locations) {
						try {
							//LOGGER.log(Level.FINE, "findClass(" + name + ") using source " + source);
							Code.Source.File in = source.getFile(path);
							if (in != null) {
								if (getPackage(packageName) == null) {
									definePackage(packageName,null,null,null,null,null,null,null);
								}
								byte[] b = streams.readBytes(in.getInputStream());
								return defineClass(name, b, 0, b.length);
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
					for (Code.Source source : locations) {
						Code.Classes classes = source.getClasses();
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
					for (Code.Source source : locations) {
						Code.Classes classes = source.getClasses();
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

			void append(Code.Source code) {
				synchronized(locations) {
					locations.add(code);
				}
			}
		}
	}
}