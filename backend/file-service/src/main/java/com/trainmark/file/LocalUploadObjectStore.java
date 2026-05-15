package com.trainmark.file;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.upload.object-store", havingValue = "local", matchIfMissing = true)
public class LocalUploadObjectStore implements UploadObjectStore {
  private final Path root;

  public LocalUploadObjectStore(@Value("${trainmark.upload.object-root:.data/uploads}") String root) {
    this.root = Path.of(root).toAbsolutePath().normalize();
  }

  @Override
  public void put(String objectKey, InputStream content) throws IOException {
    var target = resolveObjectPath(objectKey);
    Files.createDirectories(target.getParent());
    Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
  }

  @Override
  public byte[] get(String objectKey) throws IOException {
    var target = resolveObjectPath(objectKey);
    if (!Files.isRegularFile(target)) {
      throw new IllegalArgumentException("Upload object content not found: " + objectKey);
    }
    return Files.readAllBytes(target);
  }

  @Override
  public boolean exists(String objectKey) {
    return Files.isRegularFile(resolveObjectPath(objectKey));
  }

  private Path resolveObjectPath(String objectKey) {
    var target = root.resolve(objectKey).normalize();
    if (!target.startsWith(root)) {
      throw new IllegalArgumentException("Upload object key escapes storage root");
    }
    return target;
  }
}
