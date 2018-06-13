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
				loader.append(code.getClasses());
			}
			
			public final Code slime(File packed) {
				return Code.slime(Code.Source.zip(packed));
			}
			
			public final Code slime(Code.Source.File packed) {
				return Code.slime(packed);
			}
			
			public final void appendUnpacked(Code.Source base) {
				Code code = Java.compiling(base, Classes.this);
				loader.append(code.getClasses());
			}
			
			public final Code unpacked(Code.Source base) {
				return Java.compiling(base, Classes.this);
			}

			public final Code unpacked(File base) {
				return Java.compiling(base, Classes.this);
			}

			public final Code unpacked(URL base) {
				return Java.compiling(base, Classes.this);
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
					for (Code.Source source : locations) {
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

			void append(Code.Source code) {
				synchronized(locations) {
					locations.add(code);
				}
			}
		}
	}
}