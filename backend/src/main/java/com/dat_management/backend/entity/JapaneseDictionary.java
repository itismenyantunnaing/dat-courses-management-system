package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "japanese_dictionary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JapaneseDictionary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "japanese_text", nullable = false, columnDefinition = "TEXT")
    private String japaneseText;

    @Column(unique = true, name = "english_text", nullable = false,columnDefinition = "TEXT")
    private String englishText;
}

