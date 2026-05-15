package com.trainmark.file;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.StatObjectArgs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * MinIO/S3-backed {@link UploadObjectStore}.
 * Activated when {@code trainmark.upload.object-store=minio} and {@code trainmark.minio.endpoint} is set.
 */
public class MinioUploadObjectStore implements UploadObjectStore {
    private static final Logger log = LoggerFactory.getLogger(MinioUploadObjectStore.class);

    private final MinioClient client;
    private final String bucket;

    public MinioUploadObjectStore(String endpoint, String accessKey, String secretKey, String bucket, boolean secure) {
        this.client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
        this.bucket = bucket;
        ensureBucketExists();
    }

    private void ensureBucketExists() {
        try {
            boolean exists = client.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build()
            );
            if (!exists) {
                client.makeBucket(
                        MakeBucketArgs.builder().bucket(bucket).build()
                );
                log.info("Created MinIO bucket: {}", bucket);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to ensure MinIO bucket exists: " + bucket, e);
        }
    }

    @Override
    public void put(String objectKey, InputStream content) throws IOException {
        try {
            client.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .stream(content, content.available(), -1)
                            .contentType("application/octet-stream")
                            .build()
            );
            log.debug("Stored object in MinIO: {}/{}", bucket, objectKey);
        } catch (Exception e) {
            throw new IOException("Failed to upload to MinIO: " + objectKey, e);
        }
    }

    @Override
    public byte[] get(String objectKey) throws IOException {
        try (InputStream stream = client.getObject(
                GetObjectArgs.builder().bucket(bucket).object(objectKey).build()
        )) {
            if (stream == null) {
                throw new IOException("Object not found in MinIO: " + objectKey);
            }
            return readAllBytes(stream);
        } catch (Exception e) {
            throw new IOException("Failed to download from MinIO: " + objectKey, e);
        }
    }

    @Override
    public boolean exists(String objectKey) {
        try {
            client.statObject(
                    StatObjectArgs.builder().bucket(bucket).object(objectKey).build()
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Returns a presigned URL for direct download (valid for 1 hour).
     */
    public String getPresignedUrl(String objectKey) {
        try {
            return client.getPresignedObjectUrl(
                    io.minio.GetPresignedObjectUrlArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .method(io.minio.http.Method.GET)
                            .expiry(3600)
                            .build()
            );
        } catch (Exception e) {
            log.warn("Failed to generate presigned URL for {}", objectKey, e);
            return null;
        }
    }

    private static byte[] readAllBytes(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[8192];
        int nRead;
        while ((nRead = in.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toByteArray();
    }
}
