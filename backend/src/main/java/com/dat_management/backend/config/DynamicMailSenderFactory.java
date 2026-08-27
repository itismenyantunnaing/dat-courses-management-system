package com.dat_management.backend.config;

import java.util.Properties;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import com.dat_management.backend.entity.SystemConfig;
import com.dat_management.backend.repository.SystemConfigRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DynamicMailSenderFactory {

    private final SystemConfigRepository systemConfigRepository;

    @PostConstruct
    public void initializeDefaultMailConfig() {
        if (!systemConfigRepository.existsById(1L)) {
            log.info("Creating default mail configuration...");
            
            SystemConfig defaultConfig = new SystemConfig();
            // DON'T set ID - let JPA auto-generate or handle it differently
            // defaultConfig.setId(1L); // REMOVE THIS LINE
            
            defaultConfig.setActiveSmtpProvider(SystemConfig.SmtpProvider.GMAIL);
            defaultConfig.setGmailHost("smtp.gmail.com");
            defaultConfig.setGmailPort(587);
            defaultConfig.setGmailUsername("ishihakaryuu@gmail.com");
            defaultConfig.setGmailPassword("hrip knve xdxb zzpn");
            defaultConfig.setOutlookHost("smtp.office365.com");
            defaultConfig.setOutlookPort(587);
            defaultConfig.setOutlookUsername("your-email@outlook.com");
            defaultConfig.setOutlookPassword("your-password");
            
            // Set other required fields
            defaultConfig.setJwtExpiryHours(24);
            defaultConfig.setMaxLoginAttempts(5);
            defaultConfig.setSessionTimeoutMinutes(30);
            defaultConfig.setFileUploadSizeMb(0.5);
            
            systemConfigRepository.save(defaultConfig);
            log.warn("Default mail configuration created with ID: {}. Please update with actual SMTP settings via admin panel.", defaultConfig.getId());
        } else {
            log.info("Mail configuration already exists in database.");
        }
    }

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