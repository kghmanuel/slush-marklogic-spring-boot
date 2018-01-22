Assuming you just cloned this repository, here's how to deploy and run the application. 

## Prerequisites:

1. A [Java Development Kit (JDK) 1.7+ or 1.8+](http://www.oracle.com/technetwork/java/javase/downloads/index.html) (needed to compile a small amount of Java code in the Spring Boot app, as well as run the Spring Boot app)
1. [Node 4.x+](https://nodejs.org/en/download/)
1. [Bower](https://www.npmjs.com/package/bower)
1. [Gulp](https://www.npmjs.com/package/gulp)
1. [Git](https://git-scm.com/downloads) (required by Bower)
1. (Optional) [Gradle](http://gradle.org/gradle-download/)

Note that if you have Gradle installed locally already, you can run "gradle" instead of "./gradlew". 
If you don't, then the first time you run "./gradlew", Gradle will be downloaded, which may take a 
minute or so.

Deploy the MarkLogic portion of the application to MarkLogic (the "-i" is for info-level logging in Gradle, and
it's useful to see what's being deployed, but it's not required). Note that in the future, when your
MarkLogic config changes, you usually only need to run the task that corresponds to the modified resources.
Run "./gradlew tasks" to see all those tasks. It's rare that you'll need to run a full "mlDeploy" again in
the future.

    ./gradlew -i mlDeploy
        
To deploy the initial set of documents that will go to the content db, run the following command.
The deployContent task in build.gradle deploys the specific files from ml-content folder with their corresponding role 
and privilege pairs. 

    ./gradlew -i deployContent
    
Optional: To import 3,000 sample records, run the following command.
  
    ./gradlew -i importSampleData
    
Install semantics dependencies

    ./gradlew -i add_semantics_index_template
    npm install mlpm
    mlpm install visjs-graph
    ./gradlew -i mlLoadMlpm
    
Install the Node dependencies (only needs to be done in the future when these change):

    npm install

Install the Bower dependencies (only needs to be done in the future when these change):

    bower install

Build the webapp (need to do this any time a file in the webapp is changed):

    gulp build

Fire up Spring Boot, which runs an embedded Tomcat server:

    ./gradlew bootRun
  OR run the executable jar/war file (also has the embedded Tomcat).
  
    ./gradlew build
    java -jar build\libs\<app-name>-<version>.war
    
Username and password for the temp account is in:
  
    src\main\ml-config\security\users\sample-project-default-user.json
 
##War file deployment (non-root context/path ):
 
To generate a war file that excludes all jar files for the embedded tomcat:
(Note the diff between './gradlew build' vs './gradlew warRelease' - warRelease doesn't contain the embedded tomcat.) 

	 gulp build
    gradle warRelease
     
To prepare for remote application or web server deployments update the target info in gradle.properties:

    targetContainerId=tomcat8x    
    targetPort=8080    
    targetHost=localhost      
    targetContext=    
    deployUser=admin      
    deployPassword=
    
Prepare the target application/web server for remote deployments.  For Tomcat, you'll need to configure
the Manager application access:
https://tomcat.apache.org/tomcat-8.0-doc/manager-howto.html


Once the server is ready to receive remote deployments, run the following:

    gradle cargoDeployRemote -PdeployPassword=password -PtargetContext=<app-context>
    
The war file will be deployed as <app-context>.war
    
For the list of supported application servers see: https://codehaus-cargo.github.io/cargo/Home.html   

    
## What should I run while developing?

This is a 3 tier architecture - Angular, Spring Boot, and MarkLogic - and thus, during development, 
there are 3 things you'll want to update and test, ideally without having to run a build task manually. 
Here's the best way to do that:

1. In one terminal window, run "gulp watch" to process changes under src/main/webapp.
2. In another terminal window, run "gradle bootRun". This will not only run Spring Boot, but a component in the webapp 
will automatically load new/modified MarkLogic modules, just like "gradle mlWatch". 

You can also run the middle tier via an IDE like IntelliJ or Eclipse - just run the "App" program.

## How to assure reference paths (links) work for both root and non-root context deployments ?
Make sure to *use relative paths* (don't start path with '/') when adding bower components, images, css and others .  
Base href path will be set automatically by a javascript in the head of the main html file. 

When adding new html files *replace all* \<base href="/xx/xx/"/> tags with the following: 
(Important that you remove the base href tag and replace - you may follow the example in index.html and login.html.
 It won't work if you externalize and import the script. )
   
	<script>
        (function() {
            //Auto-insert base href tag base on URL path used to fetch this html.
            //Required by bower components, images, css, scripts that use $location and config for MLRestProvider's prefix
            //Simplifies build as this works for both embedded and war file deployments.
            var path = window.location.pathname;
            var head = document.querySelector('head');
            var baseElement = document.createElement('base');
            head.insertBefore(baseElement, head.firstChild);
            baseElement.setAttribute("href", path.substring(0, path.lastIndexOf('/') + 1));
        }());
	</script>

When adding new Angular JS modules that needs to invoke the MarkLogic API via ml-commons, add the 
*config* call for *MLRestProvider* similar to below:

		angular.module('app.login')
		.config(["MLRestProvider", function (MLRestProvider) {
					// Make MLRest target url start with the page's base href (proxy)
					MLRestProvider.setPrefix(angular.element(document.querySelector('base')).attr('href')+'v1');
				}])
		.factory('loginService', LoginService);

