package com.dat_management.backend.service;

import com.dat_management.backend.entity.JapaneseDictionary;
import com.dat_management.backend.repository.JapaneseDictionaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JapaneseTranslateService {

    private final JapaneseDictionaryRepository repository;

    /**
     * Reads the current dictionary on every export. This intentionally does not
     * cache the values because the dictionary is maintained through CRUD.
     */
    public Map<String, String> getDictionary() {
        List<JapaneseDictionary> rows = repository.findAll();
        Map<String, String> dictionary = new LinkedHashMap<>();

        for (JapaneseDictionary row : rows) {
            if (row == null || row.getEnglishText() == null || row.getJapaneseText() == null) {
                continue;
            }

            String key = normalize(row.getEnglishText());
            if (!key.isEmpty()) {
                dictionary.putIfAbsent(key, row.getJapaneseText());
            }
        }

        return dictionary;
    }

    public String translate(String englishText, Map<String, String> dictionary) {
        if (englishText == null || englishText.isBlank()) {
            return englishText;
        }

        String translated = dictionary.get(normalize(englishText));
        return translated != null ? translated : englishText;
    }

    private String normalize(String value) {
        return value == null
                ? ""
                : value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
