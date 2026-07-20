package com.dat_management.backend.repository;

import com.dat_management.backend.entity.JapaneseDictionary;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JapaneseDictionaryRepository extends JpaRepository<JapaneseDictionary, Integer> {
   boolean existsByEnglishText(String englishText);

   boolean existsByEnglishTextAndIdNot(String englishText, Integer id);
}