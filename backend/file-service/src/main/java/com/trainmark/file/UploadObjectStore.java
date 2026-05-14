package com.trainmark.file;

import java.io.IOException;
import java.io.InputStream;

public interface UploadObjectStore {
  void put(String objectKey, InputStream content) throws IOException;

  byte[] get(String objectKey) throws IOException;

  boolean exists(String objectKey);
}
