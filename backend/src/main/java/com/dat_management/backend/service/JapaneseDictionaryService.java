package com.dat_management.backend.service;

import com.dat_management.backend.entity.JapaneseDictionary;
import com.dat_management.backend.repository.JapaneseDictionaryRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JapaneseDictionaryService {

    private final JapaneseDictionaryRepository japaneseDictionaryRepository;

    public List<JapaneseDictionary> getAll() {
        return japaneseDictionaryRepository.findAll();
    }

    // CREATE
    public JapaneseDictionary createEntry(JapaneseDictionary entry) {

        // Validate if entry with same English text already exists (optional)
        if (japaneseDictionaryRepository.existsByEnglishText(entry.getEnglishText())) {
            throw new RuntimeException("Entry with English text '" + entry.getEnglishText() + "' already exists");
        }
        return japaneseDictionaryRepository.save(entry);
    }

    // UPDATE
    public JapaneseDictionary updateEntry(Integer id, JapaneseDictionary entryDetails) {
        Optional<JapaneseDictionary> existingEntry = japaneseDictionaryRepository.findById(id);
        
        if (existingEntry.isPresent()) {
            JapaneseDictionary entry = existingEntry.get();

            if (!entry.getEnglishText().equals(entryDetails.getEnglishText())) {
                if (japaneseDictionaryRepository.existsByEnglishTextAndIdNot(entryDetails.getEnglishText(), id)) {
                    throw new RuntimeException("Entry with English text '" + entryDetails.getEnglishText() + "' already exists");
                }
            }

            entry.setJapaneseText(entryDetails.getJapaneseText());
            entry.setEnglishText(entryDetails.getEnglishText());
            return japaneseDictionaryRepository.save(entry);
        } else {
            throw new RuntimeException("Entry not found with id: " + id);
        }
    }

    // DELETE
    public void deleteEntry(Integer id) {
        if (!japaneseDictionaryRepository.existsById(id)) {
            throw new RuntimeException("Entry not found with id: " + id);
        }
        japaneseDictionaryRepository.deleteById(id);
    }

    public boolean entryExists(Integer id) {
        return japaneseDictionaryRepository.existsById(id);
    }
}