/*
	Test cases:
	Cygwin launch by absolute Cygwin path
	Cygwin launch by softlink being in PATH
	Cygwin launch by #!
	FreeBSD launch by absolute path
	FreeBSD launch by #!

	Future:
	FreeBSD launch by softlink being in PATH
	Cygwin launch with Java not in PATH
*/
/*
	TODO	remove debugging output below
	TODO	launcher should respect JSH_JAVA_HOME
	TODO	add Windows-without-Cygwin test cases
	TODO	add other UNIX test cases
	TODO	On Windows, jvm.dll must be in the PATH. For a possible workaround for this limitation, see:
			http://java.sun.com/products/jdk/faq/jni-j2sdk-faq.html question 3
	TODO	FreeBSD launch by softlink being in PATH
	TODO	FreeBSD does not respect executable bit of script when sent as argument from launcher; should it?
*/

#include <string.h>

#include <jni.h>

#ifdef WIN32
const char SLASH = '\\';
#include "shlwapi.h"
const int PATH_MAX = MAX_PATH;

char* dirname(char *path) {
	PathRemoveFileSpec(path);
	return path;
}

char* realpath(char *path,char *other) {
	strcpy(other,path);
	return other;
}
#endif

#ifdef __unix__
#include <stdlib.h>
#include <limits.h>
#include <libgen.h>
const char SLASH = '/';
#endif

JNIEnv* create_vm(char *classpath) {
	JavaVM* jvm;
	JNIEnv* env;
	JavaVMInitArgs args;
	JavaVMOption options[1];

	args.version = JNI_VERSION_1_2;
	args.nOptions = 1;
	char classpathOption[PATH_MAX];
	sprintf(classpathOption, "-Djava.class.path=%s", classpath);
	options[0].optionString = classpathOption;
	args.options = options;
	args.ignoreUnrecognized = JNI_FALSE;

	JNI_CreateJavaVM(&jvm, (void **)&env, &args);
	return env;
}

void invoke_class(JNIEnv* env, int argc, char **argv) {
	jclass helloWorldClass;
	jmethodID mainMethod;
	jobjectArray applicationArgs;
	jstring applicationArg;
	int i;

	helloWorldClass = (*env)->FindClass(env, "inonit/script/jsh/launcher/Main");

	mainMethod = (*env)->GetStaticMethodID(env, helloWorldClass, "main", "([Ljava/lang/String;)V");

	applicationArgs = (*env)->NewObjectArray(env, argc, (*env)->FindClass(env, "java/lang/String"), NULL);

	for (i=1; i<argc; i++) {
		applicationArg = (*env)->NewStringUTF(env, argv[i]);
		(*env)->SetObjectArrayElement(env, applicationArgs, i-1, applicationArg);
	}

	(*env)->CallStaticVoidMethod(env, helloWorldClass, mainMethod, applicationArgs);
}

void debug(char* mask, char* string) {
	if (1 == 2) {
		printf(mask, string);
	}
}

int main(int argc, char **argv) {
	/*	Get the parent directory of this launcher. */
	debug("argv[0] = %s\n", argv[0]);
	char *fullpath = malloc(PATH_MAX);
	fullpath = realpath(argv[0],fullpath);
	debug("fullpath = %s\n", fullpath);
	char *parent = malloc(PATH_MAX);
	parent = realpath(fullpath,parent);
	debug("parent = %s\n", parent);
	parent = dirname(parent);
	debug("parent = %s\n", parent);

	/*	Append jsh.jar to the path of the parent directory of this launcher. */
	char jar[PATH_MAX];
	strcpy(jar, parent);
	char path[9];
	sprintf(path, "/jsh.jar");
	path[0] = SLASH;
	strcat(jar, path);

	debug("jar = %s\n", jar);
	JNIEnv* env = create_vm(jar);
	invoke_class(env, argc, argv);
}
