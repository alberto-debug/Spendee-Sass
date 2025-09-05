package com.alberto.Spendee.sass.domain.role;

import com.alberto.Spendee.sass.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashSet;

@Component
public class RoleSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {

        if(roleRepository.findByName("ROLE_USER").isEmpty()){
            roleRepository.save(new Role(null, "ROLE_USER", new HashSet<>()));
        }

        if (roleRepository.findByName("ROLE_ADMIN").isEmpty()){
            roleRepository.save(new Role(null, "ROLE_ADMIN", new HashSet<>()));
        }
    }
}
