package com.fishmaster.backend.controllers;

import com.fishmaster.backend.entites.Message;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MessageController {
    @RequestMapping("/hello")
    public Message hello() {
        return new Message("Hello Fish!");

    }
}
