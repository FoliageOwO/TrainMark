package com.trainmark.ocr;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DocumentPreprocessorConfig {
  @Bean
  DocumentPreprocessor documentPreprocessor() {
    return new LocalDocumentPreprocessor();
  }
}
