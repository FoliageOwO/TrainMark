package com.trainmark.file;

import java.io.IOException;
import java.io.InputStream;

public interface UploadObjectStore {
  void put(String objectKey, InputStream content) throws IOException;

  boolean exists(String objectKey);
}
