//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.engine;

import java.io.*;
import java.net.*;
import java.nio.channels.*;
import java.security.*;
import java.util.*;
import java.util.concurrent.locks.*;
import java.util.logging.Level;

import javax.lang.model.element.*;
import javax.tools.*;

public class Java {
	private static final inonit.system.Logging LOG = inonit.system.Logging.get();

	private static javax.tools.JavaCompiler javac;

	private static javax.tools.JavaCompiler compiler() {
		if (javac == null) {
			javac = javax.tools.ToolProvider.getSystemJavaCompiler();
		}
		return javac;
	}

	private static class SourceFileObject implements JavaFileObject {
		private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();

		private Code.Loader.Resource delegate;

		SourceFileObject(Code.Loader.Resource delegate) {
			this.delegate = delegate;
		}

		@Override public String toString() {
			return "SourceFileObject:" + " uri=" + toUri() + " name=" + getName();
		}

		public Kind getKind() {
			return Kind.SOURCE;
		}

		public boolean isNameCompatible(String simpleName, Kind kind) {
			//	TODO	line below is suspicious, should try removing it
			if (simpleName.equals("package-info")) return false;
			if (kind == JavaFileObject.Kind.SOURCE) {
				String slashed = delegate.getSourceName().replace("\\", "/");
				String basename = slashed.substring(slashed.lastIndexOf("/")+1);
				String className = basename.substring(0,basename.length()-".java".length());
				return className.equals(simpleName);
			}
			throw new UnsupportedOperationException("simpleName = " + simpleName + " kind=" + kind);
		}

		public NestingKind getNestingKind() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public Modifier getAccessLevel() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public URI toUri() {
			return delegate.getURI().adapt();
		}

		public String getName() {
			//	Specification does not specify but a relative path would be a good idea
			return delegate.getSourceName();
		}

		public InputStream openInputStream() throws IOException {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public OutputStream openOutputStream() throws IOException {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public Reader openReader(boolean ignoreEncodingErrors) throws IOException {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public CharSequence getCharContent(boolean ignoreEncodingErrors) throws IOException {
			return streams.readString(delegate.getInputStream());
		}

		public Writer openWriter() throws IOException {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public long getLastModified() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public boolean delete() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}
	}

	private static class Classes {
		private static Classes create(Store store, ClassLoader dependencies) {
			return new Classes(store, dependencies);
		}

		private MyJavaFileManager jfm;

		private Classes(Store store, ClassLoader dependencies) {
			this.jfm = new MyJavaFileManager(store, dependencies);
		}

		private Code.Loader.Resource getFile(String name) {
			try {
				MyJavaFileManager.OutputClass jfo = (MyJavaFileManager.OutputClass)this.jfm.getJavaFileForInput(null, name, null);
				if (jfo == null) return null;
				return jfo.toCodeSourceFile();
			} catch (IOException e) {
				return null;
			}
		}

		private boolean compile(JavaFileObject jfo) {
			this.jfm.store().beginCompile();
			boolean success = false;
			try {
				javax.tools.JavaCompiler.CompilationTask task = compiler().getTask(
					null,
					jfm,
					null,
					Arrays.asList(new String[] { "-Xlint:unchecked"/*, "-verbose" */ }),
					null,
					Arrays.asList(new JavaFileObject[] { jfo })
				);
				success = task.call();
				return success;
			} finally {
				this.jfm.store().finishCompile(success);
			}
		}

		private boolean compile(Code.Loader.Resource javaSource) {
			return compile(new SourceFileObject(javaSource));
		}

		final Store store() {
			return this.jfm.store();
		}

		private static class MyJavaFileManager implements JavaFileManager {
			private javax.tools.JavaFileManager delegate = compiler().getStandardFileManager(null, null, null);

			private Java.Store store;
			private final ClassLoader classLoader;

			private Map<String,OutputClass> map = new HashMap<String,OutputClass>();

			MyJavaFileManager(Java.Store store, ClassLoader classLoader) {
				this.store = store;
				this.classLoader = classLoader;
			}

			private void log(String message) {
				LOG.log(MyJavaFileManager.class, Level.FINE, message, null);
			}

			private void log(Level level, String message) {
				LOG.log(MyJavaFileManager.class, level, message, null);
			}

			private Code.Loader parent;

			private Code.Loader parent() {
				if (parent == null) {
					ClassLoader parentClassLoader = classLoader.getParent();
					if (parentClassLoader instanceof URLClassLoader) {
						parent = Code.Loader.create( (URLClassLoader)parentClassLoader );
					}
				}
				return parent;
			}

			final Store store() {
				return store;
			}

			public ClassLoader getClassLoader(JavaFileManager.Location location) {
				log("getClassLoader");
				if (location == StandardLocation.CLASS_PATH) return classLoader;
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public Iterable<JavaFileObject> list(JavaFileManager.Location location, String packageName, Set<JavaFileObject.Kind> kinds, boolean recurse) throws IOException {
				if (location == StandardLocation.PLATFORM_CLASS_PATH) {
					LOG.log(MyJavaFileManager.class, Level.FINER, "list location=" + location + " packageName=" + packageName + " kinds=" + kinds + " recurse=" + recurse, null);
					Iterable<JavaFileObject> rv = delegate.list(location, packageName, kinds, recurse);
					for (JavaFileObject o : rv) {
						log(Level.FINER, "list jfo " + o);
					}
					return rv;
				}
				if (location == StandardLocation.CLASS_PATH) {
					List<JavaFileObject> rv = new ArrayList<JavaFileObject>();
					LOG.log(MyJavaFileManager.class, Level.FINE, "list location=" + location + " packageName=" + packageName + " kinds=" + kinds + " recurse=" + recurse, null);
					Code.Loader parent = parent();
					if (parent != null) {
						LOG.log(MyJavaFileManager.class, Level.FINE, "parent=" + parent, null);
						String path = packageName.replaceAll("\\.","/");
						LOG.log(MyJavaFileManager.class, Level.FINE, "path=" + path, null);
						LOG.log(MyJavaFileManager.class, Level.FINE, "parent=" + parent, null);
						if (parent.getEnumerator() == null) {
							throw new Error("Parent enumerator is null for " + parent);
						}
						List<String> names = Arrays.asList(parent.getEnumerator().list(path));
						for (String name : names) {
							if (name.endsWith("/")) {
								continue;
							}
							//	TODO	may not work for empty package
							Code.Loader.Resource file = parent.getFile(path + "/" + name);
							if (name.length() < ".class".length()) {
								throw new RuntimeException("name is " + name);
							}
							String binaryName = (path + "/" + name.substring(0, name.length() - ".class".length()));
							binaryName = binaryName.replaceAll("\\/", ".");
							rv.add(new InputClass(file, binaryName));
						}
						LOG.log(MyJavaFileManager.class, Level.FINE, "path=" + path + " list=" + names, null);
					} else {
						LOG.log(MyJavaFileManager.class, Level.FINE, "classpath is null", null);
					}
					Iterable<JavaFileObject> standard = delegate.list(location, packageName, kinds, recurse);
					for (JavaFileObject s : standard) {
						rv.add(s);
					}
					return rv;
				}
				if (location == StandardLocation.SOURCE_PATH) {
					return Arrays.asList(new JavaFileObject[0]);
				} else if (location.getName().startsWith("SYSTEM_MODULES")) {
					return delegate.list(location, packageName, kinds, recurse);
				} else {
					throw new RuntimeException("No list() implementation for " + location);
				}
			}

			public String inferBinaryName(JavaFileManager.Location location, JavaFileObject file) {
				if (location == StandardLocation.PLATFORM_CLASS_PATH) {
					String rv = delegate.inferBinaryName(location, file);
					log(Level.FINER, "inferBinaryName location=" + location + " file=" + file + " rv=" + rv);
					return rv;
				}
				if (file instanceof InputClass) {
					String rv = ((InputClass)file).binaryName();
					log("inferBinaryName location=" + location + " file object " + file + " rv=" + rv);
					return rv;
				}
				if (location == StandardLocation.CLASS_PATH) {
					String rv = delegate.inferBinaryName(location, file);
					log("inferBinaryName location=" + location + " jfo " + file + " rv=" + rv);
					return rv;
				}
				if (location.getName().startsWith("SYSTEM_MODULES")) {
					String rv = delegate.inferBinaryName(location, file);
					log("inferBinaryName location=" + location + " jfo " + file + " rv=" + rv);
					return rv;
				}
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public boolean isSameFile(FileObject a, FileObject b) {
				log("isSameFile");
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public boolean handleOption(String current, Iterator<String> remaining) {
				log("handleOption");
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public boolean hasLocation(JavaFileManager.Location location) {
				log("hasLocation");
				if (location == StandardLocation.ANNOTATION_PROCESSOR_PATH) return false;
				if (location == StandardLocation.SOURCE_PATH) return true;
				//	StandardLocation.NATIVE_HEADER_OUTPUT not defined before Java 8
				if (location.getName().equals("NATIVE_HEADER_OUTPUT")) return false;
				//	Next three come from Java 11; fourth is used in Java 11 but not Java 8
				if (location.getName().equals("MODULE_SOURCE_PATH")) return false;
				if (location.getName().equals("ANNOTATION_PROCESSOR_MODULE_PATH")) return false;
				if (location.getName().equals("PATCH_MODULE_PATH")) return false;
				if (location.getName().equals("CLASS_OUTPUT")) return false;
				if (location.getName().startsWith("SYSTEM_MODULES")) return true;
				throw new UnsupportedOperationException("Not supported yet: hasLocation(location=" + location.getName() + ")");
			}

			public JavaFileObject getJavaFileForInput(JavaFileManager.Location location, String className, JavaFileObject.Kind kind) throws IOException {
				LOG.log(MyJavaFileManager.class, Level.FINE, "getJavaFileForInput: location=" + location + " className=" + className + " kind=" + kind, null);
				if (location == null) {
					return map.get(className);
				}
				if (location.getName().equals("SOURCE_PATH") && className != null && className.equals("module-info")) {
					return null;
				}
				if (location.getName().startsWith("SYSTEM_MODULES")) {
					//throw new UnsupportedOperationException("Refactoring required.");
					return delegate.getJavaFileForInput(location, className, kind);
				}
				throw new UnsupportedOperationException("Not supported yet: getJavaFileForInput(location=" + location.getName() + ")");
			}

			public JavaFileObject getJavaFileForOutput(JavaFileManager.Location location, String className, JavaFileObject.Kind kind, FileObject sibling) throws IOException {
				LOG.log(MyJavaFileManager.class, Level.FINE, "getJavaFileForOutput: location=" + location + " className=" + className + " kind=" + kind, null);
				map.put(className, new OutputClass(store,className));
				return map.get(className);
	//			if (location == StandardLocation.CLASS_OUTPUT) {
	//				return classes.forOutput(className);
	//			}
	//			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public FileObject getFileForInput(JavaFileManager.Location location, String packageName, String relativeName) throws IOException {
				LOG.log(MyJavaFileManager.class, Level.FINE, "getJavaFileForInput: location=" + location + " packageName=" + packageName + " relativeName=" + relativeName, null);
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public FileObject getFileForOutput(JavaFileManager.Location location, String packageName, String relativeName, FileObject sibling) throws IOException {
				log("getFileForOutput");
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public void flush() throws IOException {
				log("flush");
			}

			public void close() throws IOException {
				log("close");
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public int isSupportedOption(String option) {
				if (option.equals("--multi-release")) return -1;
				log("isSupportedOption");
				throw new UnsupportedOperationException("Not supported yet: isSupportedOption(" + option + ")"); //To change body of generated methods, choose Tools | Templates.
			}

			private Iterable<Set<JavaFileManager.Location>> getDefaultListLocationsForModules(JavaFileManager.Location location) {
				try {
					java.lang.reflect.Method method = delegate.getClass().getMethod("listLocationsForModules", new Class[] { JavaFileManager.Location.class });
					//	No real way to avoid unchecked warning here, since return type is generic, Class.cast() is not enough
					@SuppressWarnings("unchecked")
					Iterable<Set<JavaFileManager.Location>> rv = (Iterable<Set<JavaFileManager.Location>>)method.invoke(delegate, new Object[] { location });
					return rv;
				} catch (NoSuchMethodException e) {
					return null;
				} catch (IllegalAccessException e) {
					return null;
				} catch (java.lang.reflect.InvocationTargetException e) {
					return null;
				} finally {}
			}

			private String defaultInferModuleName(JavaFileManager.Location location) {
				try {
					java.lang.reflect.Method method = delegate.getClass().getMethod("inferModuleName", new Class[] { JavaFileManager.Location.class });
					return (String)method.invoke(delegate, new Object[] { location });
				} catch (NoSuchMethodException e) {
					return null;
				} catch (IllegalAccessException e) {
					return null;
				} catch (java.lang.reflect.InvocationTargetException e) {
					return null;
				} finally {}
			}

			public String inferModuleName(JavaFileManager.Location location) {
				return defaultInferModuleName(location);
			}

			public Iterable<Set<JavaFileManager.Location>> listLocationsForModules(JavaFileManager.Location location) {
				LOG.log(MyJavaFileManager.class, Level.FINE, "listLocationsForModules(" + location + "); default=" + getDefaultListLocationsForModules(location), null);
				return getDefaultListLocationsForModules(location);
//				return EMPTY_LOCATIONS_FOR_MODULES;
			}

			private static class InputClass implements JavaFileObject {
				private Code.Loader.Resource file;
				private String name;

				InputClass(Code.Loader.Resource file, String name) {
					this.file = file;
					this.name = name;
				}

				String binaryName() {
					return name;
				}

				public String toString() {
					return "InputClass: " + file;
				}

				public Kind getKind() {
					LOG.log(InputClass.class, Level.FINE, "getKind", null);
					return Kind.CLASS;
				}

				public boolean isNameCompatible(String simpleName, Kind kind) {
					LOG.log(MyJavaFileManager.class, Level.FINE, "isNameCompatible(" + simpleName + "," + kind + ")", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public NestingKind getNestingKind() {
					LOG.log(MyJavaFileManager.class, Level.FINE, "getNestingKind", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public Modifier getAccessLevel() {
					LOG.log(MyJavaFileManager.class, Level.FINE, "getAccessLevel", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public URI toUri() {
					LOG.log(MyJavaFileManager.class, Level.FINE, "toUri", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public String getName() {
					LOG.log(MyJavaFileManager.class, Level.FINE, "getName", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public InputStream openInputStream() throws IOException {
					LOG.log(MyJavaFileManager.class, Level.FINE, "openInputStream", null);
					return file.getInputStream();
//					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public OutputStream openOutputStream() throws IOException {
					LOG.log(MyJavaFileManager.class, Level.FINE, "openOutputStream", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public Reader openReader(boolean ignoreEncodingErrors) throws IOException {
					LOG.log(MyJavaFileManager.class, Level.FINE, "openReader", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public CharSequence getCharContent(boolean ignoreEncodingErrors) throws IOException {
					LOG.log(MyJavaFileManager.class, Level.FINE, "getCharContent", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public Writer openWriter() throws IOException {
					LOG.log(MyJavaFileManager.class, Level.FINE, "openWriter", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public long getLastModified() {
					LOG.log(MyJavaFileManager.class, Level.FINE, "getLastModified", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public boolean delete() {
					LOG.log(MyJavaFileManager.class, Level.FINE, "delete", null);
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}
			}

			private static class OutputClass implements JavaFileObject {
				private Store store;
				private String name;

				OutputClass(Store store, String name) {
					this.store = store;
					this.name = name;
				}

				Code.Loader.Resource toCodeSourceFile() {
					final OutputClass compiled = this;
					return new Code.Loader.Resource() {
						@Override public Code.Loader.URI getURI() {
							return Code.Loader.URI.create(compiled.toUri());
						}

						@Override public String getSourceName() {
							return null;
						}

						@Override public InputStream getInputStream() {
							try {
								return compiled.openInputStream();
							} catch (IOException e) {
								throw new RuntimeException(e);
							}
						}

						@Override public Long getLength() {
							//	TODO	length of array
							return null;
						}

						@Override public Date getLastModified() {
							//	TODO	might as well store
							return null;
						}
					};
				}

				public Kind getKind() {
					return Kind.CLASS;
				}

				public boolean isNameCompatible(String simpleName, Kind kind) {
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public NestingKind getNestingKind() {
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public Modifier getAccessLevel() {
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public URI toUri() {
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public String getName() {
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public InputStream openInputStream() throws IOException {
					return store.read(name).getInputStream();
				}

				public OutputStream openOutputStream() throws IOException {
					return store.createOutputStream(name);
				}

				public Reader openReader(boolean ignoreEncodingErrors) throws IOException {
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public CharSequence getCharContent(boolean ignoreEncodingErrors) throws IOException {
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public Writer openWriter() throws IOException {
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public long getLastModified() {
					throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
				}

				public boolean delete() {
					store.remove(name);
					return true;
				}
			}
		}
	}

	private static class SourceDirectoryClassesSource extends Code.Loader {
		private Code.Loader delegate;
		private Java.Classes classes;

		SourceDirectoryClassesSource(Code.Loader delegate, Store store, ClassLoader classLoader) {
			this.delegate = delegate;
			this.classes = Classes.create(store, classLoader);
		}

		public String toString() {
			return "SourceDirectoryClassesSource: src=" + delegate;
		}

		private HashMap<String,Code.Loader.Resource> cache = new HashMap<String,Code.Loader.Resource>();

		private boolean hasClass(String name) {
			try {
				Class<?> c = Java.class.getClassLoader().loadClass(name);
				return c != null;
			} catch (ClassNotFoundException e) {
				return false;
			}
		}

		@Override public synchronized Code.Loader.Resource getFile(String path) throws IOException {
			if (path.startsWith("org/apache/")) return null;
			if (path.startsWith("javax/")) return null;
			if (cache.get(path) == null) {
//				LOG.log(Java.class, Level.FINE, "Reading from " + path + " in store " + store, null);
				Code.Loader.Resource stored = this.classes.store().readAt(path);
				if (stored != null) {
					cache.put(path, stored);
				} else {
					//	System.err.println("Looking up class " + path + " for " + source);
					String className = path.substring(0,path.length()-".class".length());
					String sourceName = className + ".java";
					if (sourceName.indexOf("$") != -1) {
						//	do nothing
						//	TODO	should we not strip off the inner class name, and compile the outer class? I am assuming that
						//			given that this code appears to have been working, we never load an inner class before loading
						//			the outer class under normal Java operation
					} else {
						Code.Loader.Resource sourceFile = delegate.getFile("java/" + sourceName);
						if (sourceFile == null && hasClass("org.mozilla.javascript.Context")) {
							sourceFile = delegate.getFile("rhino/java/" + sourceName);
						}
						if (sourceFile != null) {
							//System.err.println("Compiling: " + jfo);
							boolean success = classes.compile(sourceFile);
							if (!success) {
								throw new RuntimeException("Failure: sourceFile=" + sourceFile);
							}
						}
					}
					cache.put(path, classes.getFile(className.replace("/",".")));
				}
			}
			return cache.get(path);
		}

		public Enumerator getEnumerator() {
			//	TODO	this probably can be implemented
			return null;
		}

		@Override public Code.Locator getLocator() {
			return null;
		}

		@Override public String getCacheIdentity() {
			String identity = classes.store().getCacheIdentity();
			return (identity != null) ? identity : Store.sourceDigest(delegate, "memory", true);
		}
	}

	static Code.Loader compiling(final Code.Loader base, final Store store, final ClassLoader dependencies) {
		return new SourceDirectoryClassesSource(base, store, dependencies);
	}

	static abstract class Store {
		private static final Map<String,ReentrantLock> FILE_LOCKS = new HashMap<String,ReentrantLock>();

		private static synchronized ReentrantLock getFileLock(File file) throws IOException {
			String path = file.getCanonicalPath();
			ReentrantLock lock = FILE_LOCKS.get(path);
			if (lock == null) {
				lock = new ReentrantLock();
				FILE_LOCKS.put(path, lock);
			}
			return lock;
		}

		private static class CacheLock {
			private final File cache;
			private final ReentrantLock jvm;
			private final RandomAccessFile file;
			private final java.nio.channels.FileLock operatingSystem;

			CacheLock(File cache, ReentrantLock jvm, RandomAccessFile file, java.nio.channels.FileLock operatingSystem) {
				this.cache = cache;
				this.jvm = jvm;
				this.file = file;
				this.operatingSystem = operatingSystem;
			}

			void close() {
				Throwable failure = null;
				try {
					if (operatingSystem != null) operatingSystem.release();
				} catch (Throwable e) {
					failure = e;
				}
				try {
					if (file != null) file.close();
				} catch (Throwable e) {
					if (failure == null) {
						failure = e;
					} else {
						failure.addSuppressed(e);
					}
				} finally {
					jvm.unlock();
				}
				if (failure instanceof Error) throw (Error) failure;
				if (failure instanceof RuntimeException) throw (RuntimeException) failure;
				if (failure != null) throw new RuntimeException("Could not unlock module class cache: " + cache, failure);
			}
		}

		private static CacheLock lock(File cache, File lockPath) {
			File parent = lockPath.getParentFile();
			if (!parent.exists() && !parent.mkdirs() && !parent.isDirectory()) throw new RuntimeException("Could not create cache lock parent directory: " + parent);
			RandomAccessFile opened = null;
			ReentrantLock acquired = null;
			try {
				acquired = getFileLock(lockPath);
				acquired.lock();
				if (acquired.getHoldCount() > 1) return new CacheLock(cache, acquired, null, null);
				opened = new RandomAccessFile(lockPath, "rw");
				java.nio.channels.FileLock fileLock = opened.getChannel().lock();
				return new CacheLock(cache, acquired, opened, fileLock);
			} catch (IOException e) {
				if (opened != null) {
					try {
						opened.close();
					} catch (IOException close) {
						e.addSuppressed(close);
					}
				}
				if (acquired != null && acquired.isHeldByCurrentThread()) acquired.unlock();
				throw new RuntimeException("Could not lock module class cache: " + cache, e);
			} catch (RuntimeException e) {
				if (opened != null) {
					try {
						opened.close();
					} catch (IOException close) {
						e.addSuppressed(close);
					}
				}
				if (acquired != null && acquired.isHeldByCurrentThread()) acquired.unlock();
				throw e;
			} catch (Error e) {
				if (opened != null) {
					try {
						opened.close();
					} catch (IOException close) {
						e.addSuppressed(close);
					}
				}
				if (acquired != null && acquired.isHeldByCurrentThread()) acquired.unlock();
				throw e;
			}
		}

		private static boolean causedByIOException(RuntimeException e) {
			Throwable cause = e;
			while (cause != null) {
				if (cause instanceof IOException) return true;
				cause = cause.getCause();
			}
			return false;
		}

		private static void update(MessageDigest digest, String string) {
			try {
				byte[] bytes = string.getBytes("UTF-8");
				digest.update(bytes);
				digest.update((byte)0);
			} catch (UnsupportedEncodingException e) {
				throw new RuntimeException(e);
			}
		}

		private static String hex(byte[] bytes) {
			StringBuilder rv = new StringBuilder();
			for (int i=0; i<bytes.length; i++) {
				String s = Integer.toHexString(bytes[i] & 0xff);
				if (s.length() == 1) rv.append("0");
				rv.append(s);
			}
			return rv.toString();
		}

		private static void update(MessageDigest digest, InputStream in) throws IOException {
			try {
				byte[] buffer = new byte[8192];
				int read;
				while( (read = in.read(buffer)) != -1 ) {
					digest.update(buffer, 0, read);
				}
			} finally {
				in.close();
			}
		}

		private static boolean updateFile(MessageDigest digest, File file, String path, Set<String> directories) throws IOException {
			if (!file.exists()) return false;
			if (file.isDirectory()) {
				String canonical = file.getCanonicalPath();
				if (!directories.add(canonical)) return true;
				File[] children = file.listFiles();
				if (children == null) return false;
				Arrays.sort(children, new Comparator<File>() {
					@Override public int compare(File a, File b) {
						return a.getName().compareTo(b.getName());
					}
				});
				for (int i=0; i<children.length; i++) {
					String childPath = (path.length() == 0) ? children[i].getName() : path + "/" + children[i].getName();
					if (!updateFile(digest, children[i], childPath, directories)) return false;
				}
			} else if (file.isFile()) {
				update(digest, path);
				update(digest, new FileInputStream(file));
			} else {
				return false;
			}
			return true;
		}

		private static String classPathIdentity;

		private static synchronized String getClassPathIdentity() throws IOException, NoSuchAlgorithmException {
			if (classPathIdentity != null) return classPathIdentity;
			String classPath = System.getProperty("java.class.path");
			if (classPath == null) return null;
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			update(digest, "slime-jsh-module-java-classpath-v1");
			String[] entries = classPath.split(java.util.regex.Pattern.quote(File.pathSeparator));
			for (int i=0; i<entries.length; i++) {
				File entry = new File(entries[i]).getCanonicalFile();
				update(digest, "classpath[" + i + "]=" + entry);
				if (!updateFile(digest, entry, "", new HashSet<String>())) return null;
			}
			classPathIdentity = hex(digest.digest());
			return classPathIdentity;
		}

		private static boolean addResources(Code.Loader source, String prefix, List<String> names) {
			Code.Loader.Enumerator enumerator;
			try {
				enumerator = source.getEnumerator();
				if (enumerator == null) return false;
				String[] entries;
				try {
					entries = enumerator.list(prefix);
				} catch (RuntimeException e) {
					LOG.log(Store.class, Level.FINE, "Could not enumerate Java source cache inputs for " + source, e);
					return false;
				}
				if (entries == null) return false;
				for (int i=0; i<entries.length; i++) {
					String entry = entries[i];
					String path = (prefix.length() == 0) ? entry : prefix + "/" + entry;
					if (entry.endsWith("/")) {
						if (!addResources(source, path.substring(0, path.length()-1), names)) return false;
					} else {
						names.add(path);
					}
				}
				return true;
			} catch (RuntimeException e) {
				LOG.log(Store.class, Level.FINE, "Could not enumerate Java dependency cache inputs for " + source, e);
				return false;
			}
		}

		private static boolean updateDependencies(MessageDigest digest, Code.Loader[] dependencies) throws IOException, NoSuchAlgorithmException {
			String classPathIdentity = getClassPathIdentity();
			if (classPathIdentity == null) return false;
			update(digest, "classpath=" + classPathIdentity);
			for (int i=0; i<dependencies.length; i++) {
				Code.Loader dependency = dependencies[i];
				String cacheIdentity = dependency.getCacheIdentity();
				if (cacheIdentity != null) {
					update(digest, "dependency[" + i + "]=" + cacheIdentity);
					continue;
				}
				ArrayList<String> names = new ArrayList<String>();
				if (!addResources(dependency, "", names)) return false;
				Collections.sort(names);
				update(digest, "dependency[" + i + "]");
				for (int j=0; j<names.size(); j++) {
					String name = names.get(j);
					Code.Loader.Resource resource = dependency.getFile(name);
					if (resource == null) return false;
					update(digest, name);
					update(digest, resource.getInputStream());
				}
			}
			return true;
		}

		static String dependenciesDigest(Code.Loader[] dependencies) {
			try {
				MessageDigest digest = MessageDigest.getInstance("SHA-256");
				update(digest, "slime-jsh-module-java-dependencies-v1");
				if (!updateDependencies(digest, dependencies)) return null;
				return hex(digest.digest());
			} catch (NoSuchAlgorithmException e) {
				throw new RuntimeException(e);
			} catch (IOException e) {
				LOG.log(Store.class, Level.FINE, "Could not read Java dependency cache inputs", e);
				return null;
			} catch (RuntimeException e) {
				if (!causedByIOException(e)) throw e;
				LOG.log(Store.class, Level.FINE, "Could not read Java dependency cache inputs", e);
				return null;
			}
		}

		private static boolean addJavaSources(Code.Loader source, String prefix, List<String> names) {
			Code.Loader.Enumerator enumerator;
			try {
				enumerator = source.getEnumerator();
			} catch (RuntimeException e) {
				LOG.log(Store.class, Level.FINE, "Could not enumerate Java source cache inputs for " + source, e);
				return false;
			}
			if (enumerator == null) return false;
			String[] entries;
			try {
				entries = enumerator.list(prefix);
			} catch (RuntimeException e) {
				LOG.log(Store.class, Level.FINE, "Could not enumerate Java source cache inputs for " + source, e);
				return false;
			}
			if (entries == null) return true;
			for (int i=0; i<entries.length; i++) {
				String entry = entries[i];
				if (entry.endsWith("/")) {
					if (!addJavaSources(source, prefix + "/" + entry.substring(0, entry.length()-1), names)) return false;
				} else if (entry.endsWith(".java")) {
					names.add(prefix + "/" + entry);
				}
			}
			return true;
		}

		static String sourceDigest(Code.Loader source, String dependenciesDigest, boolean allowEmpty) {
			try {
				ArrayList<String> names = new ArrayList<String>();
				if (!addJavaSources(source, "java", names)) return null;
				if (!addJavaSources(source, "rhino/java", names)) return null;
				if (!allowEmpty && names.size() == 0) return null;
				Collections.sort(names);

				MessageDigest digest = MessageDigest.getInstance("SHA-256");
				update(digest, "slime-jsh-module-java-cache-v1");
				update(digest, "compiler-options:-Xlint:unchecked");
				update(digest, "java.specification.version=" + System.getProperty("java.specification.version"));
				update(digest, "java.class.version=" + System.getProperty("java.class.version"));
				ProtectionDomain protectionDomain = Java.class.getProtectionDomain();
				if (protectionDomain != null && protectionDomain.getCodeSource() != null && protectionDomain.getCodeSource().getLocation() != null) {
					update(digest, "engine=" + protectionDomain.getCodeSource().getLocation().toExternalForm());
				}
				update(digest, "dependencies=" + dependenciesDigest);

				for (int i=0; i<names.size(); i++) {
					String name = names.get(i);
					Code.Loader.Resource resource = source.getFile(name);
					if (resource == null) return null;
					update(digest, name);
					update(digest, resource.getInputStream());
				}

				return hex(digest.digest());
			} catch (NoSuchAlgorithmException e) {
				throw new RuntimeException(e);
			} catch (IOException e) {
				LOG.log(Store.class, Level.FINE, "Could not read Java source cache inputs for " + source, e);
				return null;
			} catch (RuntimeException e) {
				if (!causedByIOException(e)) throw e;
				LOG.log(Store.class, Level.FINE, "Could not read Java source cache inputs for " + source, e);
				return null;
			}
		}

		static String sourceCacheDigest(String sourceDigest, String dependenciesDigest) {
			if (sourceDigest == null || dependenciesDigest == null) return null;
			try {
				MessageDigest digest = MessageDigest.getInstance("SHA-256");
				update(digest, "slime-jsh-module-java-cache-inputs-v1");
				update(digest, sourceDigest);
				update(digest, dependenciesDigest);
				return hex(digest.digest());
			} catch (NoSuchAlgorithmException e) {
				throw new RuntimeException(e);
			}
		}

		static Store sourceReactive(File root, String digest) {
			return (digest == null) ? null : file(new File(new File(root, digest), "classes"), digest);
		}

		private static class InMemoryWritableFile extends Code.Loader.Resource {
			private MyOutputStream out;
			private Date modified;

			private class MyOutputStream extends OutputStream {
				private ByteArrayOutputStream delegate = new ByteArrayOutputStream();

				@Override public void close() throws IOException {
					delegate.close();
					modified = new Date();
				}

				@Override public void flush() throws IOException {
					delegate.flush();
				}

				@Override public void write(byte[] b, int off, int len) throws IOException {
					delegate.write(b, off, len); //To change body of generated methods, choose Tools | Templates.
				}

				@Override public void write(int b) throws IOException {
					delegate.write(b);
				}

				@Override public void write(byte[] b) throws IOException {
					delegate.write(b); //To change body of generated methods, choose Tools | Templates.
				}

				ByteArrayOutputStream delegate() {
					return delegate;
				}
			}

			OutputStream createOutputStream() {
				modified = null;
				this.out = new MyOutputStream();
				return this.out;
			}

			@Override public Code.Loader.URI getURI() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			@Override public String getSourceName() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			@Override public InputStream getInputStream() {
				if (modified == null) throw new IllegalStateException("Stream is currently being written.");
				return new ByteArrayInputStream(this.out.delegate().toByteArray());
			}

			@Override public Long getLength() {
				if (modified == null) throw new IllegalStateException("Stream is currently being written.");
				return Long.valueOf(this.out.delegate().toByteArray().length);
			}

			@Override public Date getLastModified() {
				if (modified == null) throw new IllegalStateException("Stream is currently being written.");
				return modified;
			}
		}

		final String getClassLocationString(String name) {
			return name.replaceAll("\\.", "/") + ".class";
		}

		abstract OutputStream createOutputStreamAt(String name);

		void beginCompile() {
		}

		void finishCompile(boolean success) {
		}

		final OutputStream createOutputStream(String className) {
			return createOutputStreamAt(getClassLocationString(className));
		}

		abstract Code.Loader.Resource readAt(String name);

		Code.Loader.Resource read(String className) {
			return readAt(getClassLocationString(className));
		}

		abstract void removeAt(String location);

		final void remove(String name) {
			removeAt(getClassLocationString(name));
		}

		String getCacheIdentity() {
			return null;
		}

		private static class AtomicFileOutputStream extends OutputStream {
			private final File destination;
			private final File temporary;
			private final FileOutputStream delegate;
			private boolean closed;

			AtomicFileOutputStream(File destination) throws IOException {
				this.destination = destination;
				this.temporary = File.createTempFile("." + destination.getName() + ".", ".tmp", destination.getParentFile());
				this.delegate = new FileOutputStream(temporary);
			}

			@Override public void write(int b) throws IOException {
				delegate.write(b);
			}

			@Override public void write(byte[] b) throws IOException {
				delegate.write(b);
			}

			@Override public void write(byte[] b, int off, int len) throws IOException {
				delegate.write(b, off, len);
			}

			@Override public void flush() throws IOException {
				delegate.flush();
			}

			@Override public void close() throws IOException {
				if (closed) return;
				closed = true;
				delegate.close();
				if (destination.exists()) {
					if (!temporary.delete() && temporary.exists()) throw new IOException("Could not remove temporary class file: " + temporary);
				} else if (!temporary.renameTo(destination)) {
					if (!destination.exists()) throw new IOException("Could not finalize class file: " + destination);
					if (!temporary.delete() && temporary.exists()) throw new IOException("Could not remove temporary class file: " + temporary);
				}
			}
		}

		static Store memory() {
			return new Store() {
				private HashMap<String,InMemoryWritableFile> map = new HashMap<String,InMemoryWritableFile>();

				@Override synchronized String getCacheIdentity() {
					if (map.size() == 0) return null;
					try {
						MessageDigest digest = MessageDigest.getInstance("SHA-256");
						update(digest, "slime-jsh-module-java-memory-store-v2");
						ArrayList<String> names = new ArrayList<String>(map.keySet());
						Collections.sort(names);
						for (int i=0; i<names.size(); i++) {
							String name = names.get(i);
							update(digest, name);
							update(digest, map.get(name).getInputStream());
						}
						return hex(digest.digest());
					} catch (NoSuchAlgorithmException e) {
						throw new RuntimeException(e);
					} catch (IOException e) {
						throw new RuntimeException(e);
					} catch (IllegalStateException e) {
						return null;
					}
				}

				private InMemoryWritableFile create(String name) {
					if (map.get(name) == null) {
						map.put(name, new InMemoryWritableFile());
					}
					return map.get(name);
				}

				@Override OutputStream createOutputStreamAt(String location) {
					return create(location).createOutputStream();
				}

				@Override Code.Loader.Resource readAt(String location) {
					return map.get(location);
				}

				@Override void removeAt(String name) {
					map.remove(name);
				}
			};
		}

		static Store file(final File file) {
			return file(file, null);
		}

		private static Store file(final File file, final String cacheIdentity) {
			return new Store() {
				private File transaction;
				private Thread transactionThread;
				private CacheLock transactionLock;

				@Override String getCacheIdentity() {
					return cacheIdentity;
				}

				private File getLockFile() {
					return new File(file.getParentFile(), "." + file.getName() + ".lock");
				}

				private File getPublishJournal() {
					return new File(file.getParentFile(), "." + file.getName() + ".publish");
				}

				private File outputRoot() {
					return (transaction == null) ? file : transaction;
				}

				private void remove(File target) {
					if (target.isDirectory()) {
						File[] children = target.listFiles();
						if (children != null) {
							for (int i=0; i<children.length; i++) {
								remove(children[i]);
							}
						}
					}
					if (target.exists() && !target.delete()) throw new RuntimeException("Could not remove " + target);
				}

				private void addNewFiles(File from, File to, String relative, List<String> paths) {
					if (from.isDirectory()) {
						File[] children = from.listFiles();
						if (children != null) {
							for (int i=0; i<children.length; i++) {
								String child = (relative.length() == 0) ? children[i].getName() : relative + "/" + children[i].getName();
								addNewFiles(children[i], new File(to, children[i].getName()), child, paths);
							}
						}
					} else if (!to.exists()) {
						paths.add(relative);
					}
				}

				private void writePublishJournal(List<String> paths) {
					File journal = getPublishJournal();
					File temporary = null;
					try {
						temporary = File.createTempFile("." + journal.getName() + ".", ".tmp", journal.getParentFile());
						DataOutputStream output = new DataOutputStream(new FileOutputStream(temporary));
						try {
							output.writeInt(paths.size());
							for (int i=0; i<paths.size(); i++) output.writeUTF(paths.get(i));
						} finally {
							output.close();
						}
						if (!temporary.renameTo(journal)) throw new IOException("Could not finalize publish journal: " + journal);
						temporary = null;
					} catch (IOException e) {
						throw new RuntimeException("Could not write publish journal: " + journal, e);
					} finally {
						if (temporary != null && temporary.exists() && !temporary.delete()) {
							throw new RuntimeException("Could not remove temporary publish journal: " + temporary);
						}
					}
				}

				private void recoverPublication() {
					File journal = getPublishJournal();
					if (!journal.exists()) return;
					try {
						String root = file.getCanonicalPath() + File.separator;
						DataInputStream input = new DataInputStream(new FileInputStream(journal));
						try {
							int count = input.readInt();
							if (count < 0) throw new IOException("Invalid publish journal entry count: " + count);
							for (int i=0; i<count; i++) {
								File target = new File(file, input.readUTF());
								if (!target.getCanonicalPath().startsWith(root)) throw new IOException("Invalid publish journal path: " + target);
								if (target.exists() && !target.delete()) throw new IOException("Could not recover partially published class: " + target);
							}
						} finally {
							input.close();
						}
						if (!journal.delete() && journal.exists()) throw new IOException("Could not remove publish journal: " + journal);
					} catch (IOException e) {
						LOG.log(Java.class, Level.FINE, "Discarding module class cache after invalid publish journal: " + journal, e);
						if (file.exists()) remove(file);
						if (!journal.delete() && journal.exists()) throw new RuntimeException("Could not remove invalid publish journal: " + journal, e);
					}
				}

				private void publish(File from, File to) {
					if (from.isDirectory()) {
						if (!to.exists() && !to.mkdirs() && !to.isDirectory()) throw new RuntimeException("Could not create " + to);
						File[] children = from.listFiles();
						if (children != null) {
							for (int i=0; i<children.length; i++) {
								publish(children[i], new File(to, children[i].getName()));
							}
						}
					} else {
						to.getParentFile().mkdirs();
						if (to.exists()) return;
						if (!from.renameTo(to) && !to.exists()) throw new RuntimeException("Could not publish " + from + " to " + to);
					}
				}

				@Override public String toString() {
					return "Java.Store: directory = " + file;
				}

				@Override void beginCompile() {
					if (transaction != null) throw new IllegalStateException("Compile transaction is already active.");
					transactionLock = Store.lock(file, getLockFile());
					File parent = file.getParentFile();
					try {
						recoverPublication();
						transaction = java.nio.file.Files.createTempDirectory(parent.toPath(), "." + file.getName() + ".").toFile();
						transactionThread = Thread.currentThread();
					} catch (IOException e) {
						try {
							transactionLock.close();
						} catch (RuntimeException unlock) {
							e.addSuppressed(unlock);
						} finally {
							transactionLock = null;
						}
						throw new RuntimeException("Could not create compile transaction directory in " + parent, e);
					} catch (RuntimeException e) {
						try {
							transactionLock.close();
						} catch (RuntimeException unlock) {
							e.addSuppressed(unlock);
						} finally {
							transactionLock = null;
						}
						throw e;
					} catch (Error e) {
						try {
							transactionLock.close();
						} catch (RuntimeException unlock) {
							e.addSuppressed(unlock);
						} finally {
							transactionLock = null;
						}
						throw e;
					}
				}

				@Override void finishCompile(boolean success) {
					if (transaction == null) return;
					try {
						if (success) {
							ArrayList<String> paths = new ArrayList<String>();
							addNewFiles(transaction, file, "", paths);
							writePublishJournal(paths);
							publish(transaction, file);
							File journal = getPublishJournal();
							if (!journal.delete() && journal.exists()) throw new RuntimeException("Could not remove publish journal: " + journal);
						}
					} finally {
						File was = transaction;
						transaction = null;
						transactionThread = null;
						try {
							if (was.exists()) remove(was);
						} finally {
							CacheLock wasLock = transactionLock;
							transactionLock = null;
							wasLock.close();
						}
					}
				}

				@Override OutputStream createOutputStreamAt(String location) {
					File destination = new File(outputRoot(), location);
					destination.getParentFile().mkdirs();
					try {
						LOG.log(Java.class, Level.FINE, "Writing class to " + destination, null);
						return new AtomicFileOutputStream(destination);
					} catch (IOException e) {
						throw new RuntimeException(e);
					}
				}

				@Override Code.Loader.Resource readAt(String location) {
					boolean ownTransaction = transaction != null && transactionThread == Thread.currentThread();
					CacheLock readLock = (ownTransaction) ? null : Store.lock(file, getLockFile());
					try {
						if (!ownTransaction) recoverPublication();
						final File source = new File((ownTransaction) ? transaction : file, location);
						LOG.log(Java.class, Level.FINE, "Attempting to read class from " + source, null);
						if (!source.exists()) return null;
						return new Code.Loader.Resource() {
							@Override public Code.Loader.URI getURI() {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							@Override public String getSourceName() {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							@Override public InputStream getInputStream() {
								try {
									return new FileInputStream(source);
								} catch (FileNotFoundException e) {
									throw new RuntimeException(e);
								}
							}

							@Override public Long getLength() {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							@Override public Date getLastModified() {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}
						};
					} finally {
						if (readLock != null) readLock.close();
					}
				}

				@Override void removeAt(String location) {
					File at = new File(file, location);
					if (at.exists()) at.delete();
					if (at.exists()) at.delete();
				}
			};
		}
	}
}
