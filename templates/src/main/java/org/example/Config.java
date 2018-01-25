package org.example;

import org.apache.http.client.CredentialsProvider;
import org.example.util.URIUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.Authentication;

import com.marklogic.spring.http.RestConfig;
import com.marklogic.spring.http.SimpleRestConfig;
import com.marklogic.spring.http.proxy.HttpProxy;
import com.marklogic.spring.security.authentication.MarkLogicAuthenticationManager;
import com.marklogic.spring.security.context.SpringSecurityCredentialsProvider;
import com.marklogic.spring.security.web.util.matcher.CorsRequestMatcher;

/**
 * Extends Spring Boot's default web security configuration class and hooks in MarkLogic-specific classes from
 * marklogic-spring-web. Feel free to customize as needed.
 */
@Configuration
@EnableWebSecurity
public class Config extends WebSecurityConfigurerAdapter{

    /**
     * @return a config class with ML connection properties
     */
    @Bean
    public RestConfig restConfig() {
        return new SimpleRestConfig();
    }

    @Bean
    public CredentialsProvider credentialsProvider() {
        return new SpringSecurityCredentialsProvider();
    }

    /**
     * Utility class for URI actions (decoding, etc.).
     * @return
     */
    @Bean
    public URIUtil uriUtil() {
        return new URIUtil();
    }

    /*
      Servlet Filter to compress large http responses.

      Superseeded by the configuration in application.properties for Spring Boot which ONLY takes effect on embedded Tomcat.
          server.compression.enabled=true
          server.compression.min-response-size=128

      UNCOMMENT the following bean to enable compression on standalone application server deployment as an alternative to
           container-based configuration.
      Requires the following in build.gradle:
         compile ("com.github.ziplet:ziplet:2.2.0"){
             exclude group: 'javax.servlet', module: 'servlet-api'
             exclude group: 'org.slf4j', module: 'slf4j-api'
         }

       @ Bean
        public Filter compressingFilter() {
            return new CompressingFilter();
        }
     */
    /**
     * @return an HttpProxy that a Spring MVC controller can use for proxying requests to MarkLogic. By default, uses
     *         Spring Security for credentials - this relies on Spring Security not erasing the user's credentials so
     *         that the username/password can be passed to MarkLogic on every request for authentication.
     */
    @Bean
    public HttpProxy httpProxy() {
        return new HttpProxy(restConfig(), credentialsProvider());
    }
    
    @Bean
    public MarkLogicAuthenticationManager markLogicAuthenticationManager() {
        return new MarkLogicAuthenticationManager(restConfig());
    }

    /**
     * Sets MarkLogicAuthenticationProvider as the authentication manager, which overrides the in-memory authentication
     * manager that Spring Boot uses by default.  Configured to clear the credentials from the {@link Authentication}
     * object after authenticating.
     */
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        super.configure(auth);
        auth.parentAuthenticationManager(markLogicAuthenticationManager());
        auth.eraseCredentials(false);
    }

    /**
     * Configures what requests require authentication and which ones are always permitted. Uses CorsRequestMatcher to
     * allow for certain requests - e.g. put/post/delete requests - to be proxied successfully back to MarkLogic.
     *
     * This uses a form login by default, as for many MarkLogic apps (particularly demos), it's convenient to be able to
     * easily logout and login as a different user to show off security features. Spring Security has a very plain form
     * login page - you can customize this, just google for examples.
     */
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().requireCsrfProtectionMatcher(new CorsRequestMatcher()).and().authorizeRequests()
                .antMatchers(getAlwaysPermittedPatterns()).permitAll().anyRequest().authenticated().and().formLogin()
                .loginPage("/login").permitAll();
    }

    /**
     * Defines a set of URLs that are always permitted - these are based on the presumed contents of the
     * src/main/resources/static directory.
     *
     * @return
     */
    protected String[] getAlwaysPermittedPatterns() {
        return new String[] { "/bower_components/**", "/fonts/**", "/images/**", "/styles/**" };
    }

}
