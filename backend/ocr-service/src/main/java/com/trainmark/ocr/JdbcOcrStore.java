package com.trainmark.ocr;

import com.trainmark.shared.OcrJobStatus;
import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrBlockSummary;
import com.trainmark.shared.dto.OcrJobSummary;
import com.trainmark.shared.dto.OcrResultSummary;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.ocr.store", havingValue = "jdbc")
public class JdbcOcrStore implements OcrStore {
  private final OcrProvider ocrProvider;
  private final DocumentPreprocessor documentPreprocessor;
  private final String url;
  private final String username;
  private final String password;

  public JdbcOcrStore(
      OcrProvider ocrProvider,
      DocumentPreprocessor documentPreprocessor,
      @Value("${trainmark.ocr.jdbc.url:}") String url,
      @Value("${trainmark.ocr.jdbc.username:}") String username,
      @Value("${trainmark.ocr.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.ocr.jdbc.url is required when trainmark.ocr.store=jdbc");
    }
    this.ocrProvider = ocrProvider;
    this.documentPreprocessor = documentPreprocessor;
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<OcrJobSummary> listJobs(Long submissionId) {
    var sql = """
        SELECT id, submission_id, object_key, status, page_count, text_block_count,
               table_count, confidence, created_at
        FROM ocr_jobs
        """;
    if (submissionId != null) {
      sql += "WHERE submission_id = ?\n";
    }
    sql += "ORDER BY created_at DESC, id DESC";

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      if (submissionId != null) {
        statement.setLong(1, submissionId);
      }
      try (var results = statement.executeQuery()) {
        var jobs = new ArrayList<OcrJobSummary>();
        while (results.next()) {
          jobs.add(mapJob(results));
        }
        return jobs;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list OCR jobs", error);
    }
  }

  @Override
  public OcrJobSummary createJob(CreateOcrJobRequest request) {
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try {
        var jobId = insertPendingJob(connection, request);
        var document = documentPreprocessor.preprocess(request);
        var result = ocrProvider.recognize(jobId, request, document);
        var blocks = result.blocks();
        updateCompletedJob(connection, jobId, blocks);
        insertBlocks(connection, jobId, blocks);
        var job = getJob(connection, jobId);
        connection.commit();
        return job;
      } catch (SQLException | RuntimeException error) {
        connection.rollback();
        throw error;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create OCR job", error);
    }
  }

  @Override
  public OcrResultSummary result(Long jobId) {
    try (var connection = connect()) {
      var job = getJob(connection, jobId);
      var blocks = listBlocks(connection, jobId);
      return new OcrResultSummary(job.id(), job.submissionId(), buildPlainTextPreview(blocks), blocks);
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load OCR result", error);
    }
  }

  private Long insertPendingJob(Connection connection, CreateOcrJobRequest request) throws SQLException {
    var sql = """
        INSERT INTO ocr_jobs (submission_id, object_key, status)
        VALUES (?, ?, ?)
        """;
    try (var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, request.submissionId());
      statement.setString(2, request.objectKey());
      statement.setString(3, OcrJobStatus.RECOGNIZING.name());
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          return keys.getLong(1);
        }
      }
    }
    throw new SQLException("Insert did not return a generated OCR job id");
  }

  private void updateCompletedJob(Connection connection, Long jobId, List<OcrBlockSummary> blocks) throws SQLException {
    var sql = """
        UPDATE ocr_jobs
        SET status = ?, page_count = ?, text_block_count = ?, table_count = ?,
            confidence = ?, updated_at = now()
        WHERE id = ?
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setString(1, OcrJobStatus.COMPLETED.name());
      statement.setInt(2, pageCount(blocks));
      statement.setInt(3, blocks.size() * 28);
      statement.setInt(4, tableCount(blocks));
      statement.setInt(5, confidence(blocks));
      statement.setLong(6, jobId);
      statement.executeUpdate();
    }
  }

  private void insertBlocks(Connection connection, Long jobId, List<OcrBlockSummary> blocks) throws SQLException {
    if (blocks.isEmpty()) {
      return;
    }
    var sql = """
        INSERT INTO ocr_blocks (
          ocr_job_id, block_type, title, page, confidence, text_content, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """;
    try (var statement = connection.prepareStatement(sql)) {
      var sortOrder = 0;
      for (var block : blocks) {
        statement.setLong(1, jobId);
        statement.setString(2, block.type());
        statement.setString(3, block.title());
        statement.setInt(4, block.page());
        statement.setInt(5, block.confidence());
        statement.setString(6, block.title());
        statement.setInt(7, sortOrder++);
        statement.addBatch();
      }
      statement.executeBatch();
    }
  }

  private OcrJobSummary getJob(Connection connection, Long jobId) throws SQLException {
    var sql = """
        SELECT id, submission_id, object_key, status, page_count, text_block_count,
               table_count, confidence, created_at
        FROM ocr_jobs
        WHERE id = ?
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, jobId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return mapJob(results);
        }
      }
    }
    throw new IllegalArgumentException("OCR job not found: " + jobId);
  }

  private List<OcrBlockSummary> listBlocks(Connection connection, Long jobId) throws SQLException {
    var sql = """
        SELECT block_type, title, page, confidence
        FROM ocr_blocks
        WHERE ocr_job_id = ?
        ORDER BY sort_order, id
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, jobId);
      try (var results = statement.executeQuery()) {
        var blocks = new ArrayList<OcrBlockSummary>();
        while (results.next()) {
          blocks.add(new OcrBlockSummary(
              results.getString("block_type"),
              results.getString("title"),
              results.getInt("page"),
              results.getInt("confidence")
          ));
        }
        return blocks;
      }
    }
  }

  private OcrJobSummary mapJob(java.sql.ResultSet results) throws SQLException {
    return new OcrJobSummary(
        results.getLong("id"),
        results.getLong("submission_id"),
        results.getString("object_key"),
        OcrJobStatus.valueOf(results.getString("status")),
        results.getInt("page_count"),
        results.getInt("text_block_count"),
        results.getInt("table_count"),
        results.getInt("confidence"),
        results.getObject("created_at", OffsetDateTime.class)
    );
  }

  private String buildPlainTextPreview(List<OcrBlockSummary> blocks) {
    return "识别到 " + blocks.stream()
        .map(OcrBlockSummary::title)
        .reduce((left, right) -> left + "、" + right)
        .orElse("文档内容") + " 等结构化内容。";
  }

  private int pageCount(List<OcrBlockSummary> blocks) {
    return Math.max(1, blocks.stream().mapToInt(OcrBlockSummary::page).max().orElse(1));
  }

  private int tableCount(List<OcrBlockSummary> blocks) {
    return (int) blocks.stream().filter(block -> "table".equals(block.type())).count();
  }

  private int confidence(List<OcrBlockSummary> blocks) {
    if (blocks.isEmpty()) {
      return 0;
    }
    return blocks.stream().mapToInt(OcrBlockSummary::confidence).sum() / blocks.size();
  }

  private Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
