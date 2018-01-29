package org.example;

import org.example.util.ModuleWatcher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.marklogic.client.DatabaseClientFactory.Authentication;
import com.marklogic.client.helper.DatabaseClientConfig;
import com.marklogic.client.spring.DatabaseClientManager;
import com.marklogic.spring.http.AuthenticationHeader;
import com.marklogic.spring.http.SimpleRestConfig;

/**
 * The beans in this configuration are only intended to be used in a development environment.
 */
@Configuration
@Profile("dev")
@EnableScheduling
public class DevConfig {

    @Value("${mlAppName}")
    protected String mlAppName;

    @Value("${mlHost:localhost}")
    protected String mlHost;

    @Value("${mlRestPort}")
    protected Integer mlRestPort;

    @Value("${mlRestAdminUsername}")
    protected String mlRestAdminUsername;

    @Value("${mlRestAdminPassword}")
    protected String mlRestAdminPassword;

    @Bean
    public DatabaseClientConfig contentDatabaseClientConfig() {
        DatabaseClientConfig config = new DatabaseClientConfig(mlHost, mlRestPort, mlRestAdminUsername,
                mlRestAdminPassword);
        config.setDatabase(mlAppName + "-content");
        
        //assumes a rest endpoint
        AuthenticationHeader auth = AuthenticationHeader.getOption(new SimpleRestConfig(mlHost, mlRestPort));
        if (!"digest".equalsIgnoreCase(auth.getType())){
        	config.setAuthentication(Authentication.BASIC);
        }
        return config;
    }

    @Bean
    public DatabaseClientManager contentDatabaseClientManager() {
        return new DatabaseClientManager(contentDatabaseClientConfig());
    }

    @Bean
    public DatabaseClientManager modulesDatabaseClientManager() {
        DatabaseClientConfig config = new DatabaseClientConfig(mlHost, mlRestPort, mlRestAdminUsername,
                mlRestAdminPassword);
        config.setDatabase(mlAppName + "-modules");
        //assumes a rest endpoint
        AuthenticationHeader auth = AuthenticationHeader.getOption(new SimpleRestConfig(mlHost, mlRestPort));
        if (!"digest".equalsIgnoreCase(auth.getType())){
        	config.setAuthentication(Authentication.BASIC);
        }
        return new DatabaseClientManager(config);
    }

    @Bean
    public ModuleWatcher moduleWatcher() {
        return new ModuleWatcher(contentDatabaseClientManager().getObject(),
                modulesDatabaseClientManager().getObject());
    }
}
