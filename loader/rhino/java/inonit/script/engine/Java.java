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

	static class Classes {
		static Classes create(Store store) {
			return new Classes(store);
		}
		
		private MyJavaFileManager jfm;
		
		private Classes(Store store) {
			this.jfm = new MyJavaFileManager(store);
		}
		
		Code.Source.File getFile(String name) {
			MyJavaFileManager.OutputClass jfo = this.jfm.getJavaFileForInput(null, name, null);
			if (jfo == null) return null;
			return jfo.toCodeSourceFile();
		}
		
		boolean compile(JavaFileObject jfo) {
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
		
		static abstract class Store {
			abstract OutputStream createOutputStream(String name);
			abstract byte[] read(String name);
			abstract void remove(String name);

			static Store memory() {					
				return new Store() {
					private HashMap<String,ByteArrayOutputStream> map = new HashMap<String,ByteArrayOutputStream>();

					@Override OutputStream createOutputStream(String name) {
						ByteArrayOutputStream rv = new ByteArrayOutputStream();
						map.put(name,rv);
						return rv;
					}

					@Override
					byte[] read(String name) {
						return map.get(name).toByteArray();
					}

					@Override
					void remove(String name) {
						map.remove(name);
					}
				};
			}
		}

		private static class MyJavaFileManager implements JavaFileManager {
			private ClassLoader classpath = new ClassLoader() {
				protected Class findClass(String name) throws ClassNotFoundException{
					throw new ClassNotFoundException(name);
				}
			};

			private javax.tools.JavaFileManager delegate = compiler().getStandardFileManager(null, null, null);

			private Java.Classes.Store store;

			private Map<String,OutputClass> map = new HashMap<String,OutputClass>();


			MyJavaFileManager(Java.Classes.Store store) {
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
				private Classes.Store store;
				private String name;

				OutputClass(Classes.Store store, String name) {
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
					return new ByteArrayInputStream(store.read(name));
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
