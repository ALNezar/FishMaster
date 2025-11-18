package com.fishmaster.backend.repositories;


import com.fishmaster.backend.model.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends CrudRepository<User, Long> {
        Optional<User> findByEmail(String email);

        Optional<User> findByVerificationCode (String verificationCode );
}

