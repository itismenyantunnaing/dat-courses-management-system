-- Table structure for table system_configuration
--

DROP TABLE IF EXISTS system_configuration;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE system_configuration
(
    id                      bigint(20) NOT NULL AUTO_INCREMENT,
    active_smtp_provider    enum('GMAIL','OUTLOOK') NOT NULL,
    file_upload_size_mb     int(11) NOT NULL,
    gmail_host              varchar(255) DEFAULT NULL,
    gmail_password          varchar(255) DEFAULT NULL,
    gmail_port              int(11) DEFAULT NULL,
    gmail_username          varchar(255) DEFAULT NULL,
    jwt_expiry_hours        int(11) NOT NULL,
    max_login_attempts      int(11) NOT NULL,
    outlook_host            varchar(255) DEFAULT NULL,
    outlook_password        varchar(255) DEFAULT NULL,
    outlook_port            int(11) DEFAULT NULL,
    outlook_username        varchar(255) DEFAULT NULL,
    session_timeout_minutes int(11) NOT NULL,
    updated_at              datetime(6) DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table system_configuration
--

LOCK
TABLES system_configuration WRITE;
/*!40000 ALTER TABLE system_configuration DISABLE KEYS */;
INSERT INTO system_configuration
VALUES (1, 'GMAIL', 5, 'smtp.gmail.com', 'akhh zeae hqhm jxzq', 587, 'cherryk3113@gmail.com', 23, 5, NULL, NULL, NULL,
        NULL, 234, NULL);
UNLOCK TABLES;