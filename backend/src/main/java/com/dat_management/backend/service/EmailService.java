package com.dat_management.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.dat_management.backend.dto.EmailRequestDto;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String email, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("OTP Verification");
        message.setText("Your OTP is: " + otp + ".(Valid for only one minutes)");

        mailSender.send(message);
    }

    public void sendEmail(EmailRequestDto emailRequestDto) {
        SimpleMailMessage message = new SimpleMailMessage();
        
        // Convert List to Array for multiple recipients
        if (emailRequestDto.getTo() != null && !emailRequestDto.getTo().isEmpty()) {
            message.setTo(emailRequestDto.getTo().toArray(new String[0]));
        }
        
        message.setSubject(emailRequestDto.getSubject());
        message.setText(emailRequestDto.getText());
        mailSender.send(message);
    }
}
