package com.dat_management.backend.config;

import java.util.Properties;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import com.dat_management.backend.entity.SystemConfig;
import com.dat_management.backend.repository.SystemConfigRepository;

import lombok.RequiredArgsConstructor;

@Component
//@Configuration
@RequiredArgsConstructor
public class DynamicMailSenderFactory {

    private final SystemConfigRepository systemConfigRepository;

    @Bean
    public JavaMailSender getMailSender() {

        SystemConfig config =
                systemConfigRepository.findById(1L)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "System configuration not found"));

        JavaMailSenderImpl sender =
                new JavaMailSenderImpl();

        if (config.getActiveSmtpProvider()
                == SystemConfig.SmtpProvider.GMAIL) {

            sender.setHost(config.getGmailHost());
            sender.setPort(config.getGmailPort());
            sender.setUsername(config.getGmailUsername());
            sender.setPassword(config.getGmailPassword());

        } else {

            sender.setHost(config.getOutlookHost());
            sender.setPort(config.getOutlookPort());
            sender.setUsername(config.getOutlookUsername());
            sender.setPassword(config.getOutlookPassword());
        }

        Properties props =
                sender.getJavaMailProperties();

        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");

        return sender;
    }
}