package inonit.script.engine;

import java.io.*;
import java.net.*;
import java.util.*;

import javax.lang.model.element.*;
import javax.tools.*;

public class Java {
	private static javax.tools.JavaCompiler javac;

	static javax.tools.JavaCompiler compiler() {
		if (javac == null) {
			javac = javax.tools.ToolProvider.getSystemJavaCompiler();
		}
		return javac;
	}

	private static class SourceFileObject implements JavaFileObject {
		private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();

		private Code.Source.File delegate;

		SourceFileObject(Code.Source.File delegate) {
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

	private static class SourceDirectoryClassesSource extends Code.Source {
		private Code.Source delegate;
		private Java.Classes classes;

		SourceDirectoryClassesSource(Code.Source delegate, Store store) {
			this.delegate = delegate;
			this.classes = Classes.create(store);
		}

//		private Java.Classes classes = Java.Classes.create(Java.Classes.Store.memory());

		private HashMap<String,Code.Source.File> cache = new HashMap<String,Code.Source.File>();

		private boolean hasClass(String name) {
			try {
				Class c = Java.class.getClassLoader().loadClass(name);
				return c != null;
			} catch (ClassNotFoundException e) {
				return false;
			}
		}

		@Override public Code.Source.File getFile(String path) throws IOException {
			if (path.startsWith("org/apache/")) return null;
			if (path.startsWith("javax/")) return null;
//				String[] tokens = path.split("\\/");
//				String basename = tokens[tokens.length-1];
//				if (basename.indexOf("$") != -1) {
//					return null;
//				}
			if (cache.get(path) == null) {
				//	System.err.println("Looking up class " + path + " for " + source);
				String className = path.substring(0,path.length()-".class".length());
				String sourceName = className + ".java";
				if (sourceName.indexOf("$") != -1) {
					//	do nothing
					//	TODO	should we not strip off the inner class name, and compile the outer class? I am assuming that
					//			given that this code appears to have been working, we never load an inner class before loading
					//			the outer class under normal Java operation
				} else {
					Code.Source.File sourceFile = delegate.getFile("java/" + sourceName);
					if (sourceFile == null && hasClass("org.mozilla.javascript.Context")) {
						sourceFile = delegate.getFile("rhino/java/" + sourceName);
					}
					if (sourceFile != null) {
//						javax.tools.JavaFileObject jfo = new SourceFileObject(sourceFile);
						//System.err.println("Compiling: " + jfo);
						boolean success = classes.compile(sourceFile);
						if (!success) {
							throw new RuntimeException("Failure: sourceFile=" + sourceFile);
						}
					}
				}
				cache.put(path, classes.getFile(className.replace("/",".")));
			}
			return cache.get(path);
		}

		public Enumerator getEnumerator() {
			//	TODO	this probably can be implemented
			return null;
		}

		@Override public Code.Classes getClasses() {
			return null;
		}
	}
	
	static Code.Source compiling(Code.Source code, Store store) {
		return new SourceDirectoryClassesSource(code, store);
	}
	
	private static class InMemoryWritableFile extends Code.Source.File {
		private MyOutputStream out;
		private Date modified;
		
		private class MyOutputStream extends OutputStream {
			private ByteArrayOutputStream delegate = new ByteArrayOutputStream();
			
			@Override
			public void close() throws IOException {
				delegate.close();
				modified = new Date();
			}

			@Override
			public void flush() throws IOException {
				delegate.flush();
			}

			@Override
			public void write(byte[] b, int off, int len) throws IOException {
				delegate.write(b, off, len); //To change body of generated methods, choose Tools | Templates.
			}

			@Override
			public void write(int b) throws IOException {
				delegate.write(b);
			}

			@Override
			public void write(byte[] b) throws IOException {
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

		@Override
		public Code.Source.URI getURI() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		@Override
		public String getSourceName() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		@Override
		public InputStream getInputStream() {
			if (modified == null) throw new IllegalStateException("Stream is currently being written.");
			return new ByteArrayInputStream(this.out.delegate().toByteArray());
		}

		@Override
		public Long getLength() {
			if (modified == null) throw new IllegalStateException("Stream is currently being written.");
			return new Long(this.out.delegate().toByteArray().length);
		}

		@Override
		public Date getLastModified() {
			if (modified == null) throw new IllegalStateException("Stream is currently being written.");
			return modified;
		}
	} 

	static abstract class Store {
		abstract OutputStream createOutputStream(String name);
		abstract Code.Source.File read(String name);
		abstract void remove(String name);
		
		static Store memory() {
			return new Store() {
				private HashMap<String,InMemoryWritableFile> map = new HashMap<String,InMemoryWritableFile>();
				
				private InMemoryWritableFile create(String name) {
					InMemoryWritableFile rv = map.get(name);
					if (map.get(name) == null) {
						map.put(name, new InMemoryWritableFile());
					}
					return map.get(name);
				}

				@Override OutputStream createOutputStream(String name) {
					return create(name).createOutputStream();
				}

				@Override
				Code.Source.File read(String name) {
					return map.get(name);
				}

				@Override
				void remove(String name) {
					map.remove(name);
				}
			};
		}
	}

	private static class Classes {
		private static Classes create(Store store) {
			return new Classes(store);
		}
		
		private MyJavaFileManager jfm;
		
		private Classes(Store store) {
			this.jfm = new MyJavaFileManager(store);
		}
		
		private Code.Source.File getFile(String name) {
			MyJavaFileManager.OutputClass jfo = this.jfm.getJavaFileForInput(null, name, null);
			if (jfo == null) return null;
			return jfo.toCodeSourceFile();
		}
		
		private boolean compile(JavaFileObject jfo) {
			javax.tools.JavaCompiler.CompilationTask task = Java.compiler().getTask(
				null,
				jfm,
				null,
				Arrays.asList(new String[] { "-Xlint:unchecked"/*, "-verbose" */ }),
				null,
				Arrays.asList(new JavaFileObject[] { jfo })
			);
			boolean success = task.call();
			return success;
		}
		
		private boolean compile(Code.Source.File javaSource) {
			return compile(new SourceFileObject(javaSource));
		}
		
		private static class MyJavaFileManager implements JavaFileManager {
			private ClassLoader classpath = new ClassLoader() {
				protected Class findClass(String name) throws ClassNotFoundException{
					throw new ClassNotFoundException(name);
				}
			};

			private javax.tools.JavaFileManager delegate = compiler().getStandardFileManager(null, null, null);

			private Java.Store store;

			private Map<String,OutputClass> map = new HashMap<String,OutputClass>();


			MyJavaFileManager(Java.Store store) {
				this.store = store;
			}

			public ClassLoader getClassLoader(JavaFileManager.Location location) {
				if (location == StandardLocation.CLASS_PATH) return classpath;
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public Iterable<JavaFileObject> list(JavaFileManager.Location location, String packageName, Set<JavaFileObject.Kind> kinds, boolean recurse) throws IOException {
				if (location == StandardLocation.PLATFORM_CLASS_PATH) return delegate.list(location, packageName, kinds, recurse);
				if (location == StandardLocation.CLASS_PATH) return delegate.list(location, packageName, kinds, recurse);
				if (location == StandardLocation.SOURCE_PATH) return Arrays.asList(new JavaFileObject[0]);
				if (true) throw new RuntimeException("No list() implementation for " + location);
				return Arrays.asList(new JavaFileObject[0]);
			}

			public String inferBinaryName(JavaFileManager.Location location, JavaFileObject file) {
				if (location == StandardLocation.PLATFORM_CLASS_PATH) return delegate.inferBinaryName(location, file);
				if (location == StandardLocation.CLASS_PATH) return delegate.inferBinaryName(location, file);
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public boolean isSameFile(FileObject a, FileObject b) {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public boolean handleOption(String current, Iterator<String> remaining) {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public boolean hasLocation(JavaFileManager.Location location) {
				if (location == StandardLocation.ANNOTATION_PROCESSOR_PATH) return false;
				if (location == StandardLocation.SOURCE_PATH) return true;
				//	StandardLocation.NATIVE_HEADER_OUTPUT not defined before Java 8
				if (location.getName().equals("NATIVE_HEADER_OUTPUT")) return false;
				throw new UnsupportedOperationException("Not supported yet: " + location.getName());
			}

			public OutputClass getJavaFileForInput(JavaFileManager.Location location, String className, JavaFileObject.Kind kind) {
				if (location == null) {
					return map.get(className);
				}
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public JavaFileObject getJavaFileForOutput(JavaFileManager.Location location, String className, JavaFileObject.Kind kind, FileObject sibling) throws IOException {
				map.put(className, new OutputClass(store,className));
				return map.get(className);
	//			if (location == StandardLocation.CLASS_OUTPUT) {
	//				return classes.forOutput(className);
	//			}
	//			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public FileObject getFileForInput(JavaFileManager.Location location, String packageName, String relativeName) throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public FileObject getFileForOutput(JavaFileManager.Location location, String packageName, String relativeName, FileObject sibling) throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public void flush() throws IOException {
			}

			public void close() throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public int isSupportedOption(String option) {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			private static class OutputClass implements JavaFileObject {
				private Store store;
				private String name;

				OutputClass(Store store, String name) {
					this.store = store;
					this.name = name;
				}
				
				Code.Source.File toCodeSourceFile() {
					final OutputClass compiled = this;
					return new Code.Source.File() {
						@Override public Code.Source.URI getURI() {
							return Code.Source.URI.create(compiled.toUri());
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
}
