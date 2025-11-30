package com.fishmaster.backend.controllers;

import com.fishmaster.backend.model.Message;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// This a just a test controller to check if the backend is working.

@RestController
public class MessageController {
    @RequestMapping("/hello")
    public Message hello() {
        return new Message("Hello Fish!");

    }
}
