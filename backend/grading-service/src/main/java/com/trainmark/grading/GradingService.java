package com.trainmark.grading;

import com.trainmark.shared.GradingJobStatus;
import com.trainmark.shared.dto.CreateGradingJobRequest;
import com.trainmark.shared.dto.CreateRubricRequest;
import com.trainmark.shared.dto.GradingJobSummary;
import com.trainmark.shared.dto.RubricItemSummary;
import com.trainmark.shared.dto.RubricPointSummary;
import com.trainmark.shared.dto.RubricSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class GradingService {
  private final AtomicLong rubricIds = new AtomicLong(2);
  private final AtomicLong itemIds = new AtomicLong(10);
  private final AtomicLong pointIds = new AtomicLong(100);
  private final AtomicLong jobIds = new AtomicLong(2);
  private final Map<Long, RubricSummary> rubrics = new LinkedHashMap<>();
  private final Map<Long, GradingJobSummary> jobs = new LinkedHashMap<>();

  public GradingService() {
    var points = List.of(
        new RubricPointSummary(1L, "功能模块完整", "覆盖登录、课程、任务、提交核心流程", 12, List.of("登录", "课程", "任务", "提交"), List.of("上传", "报告提交")),
        new RubricPointSummary(2L, "数据库设计合理", "实体关系清晰，字段和约束完整", 8, List.of("ER图", "表结构", "约束"), List.of("实体关系", "数据表"))
    );
    var items = List.of(
        new RubricItemSummary(1L, "需求与设计", 20, "CO1", points),
        new RubricItemSummary(2L, "系统实现", 50, "CO2", List.of()),
        new RubricItemSummary(3L, "报告规范", 30, "CO3", List.of())
    );
    rubrics.put(1L, new RubricSummary(1L, 1L, "Java Web 实训评分标准", 100, items));
    jobs.put(1L, new GradingJobSummary(1L, 1L, 1L, 65, 47, GradingJobStatus.SCORING, 86, OffsetDateTime.now().minusMinutes(18)));
  }

  public Collection<RubricSummary> listRubrics(Long assignmentId) {
    return rubrics.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .toList();
  }

  public RubricSummary createRubric(CreateRubricRequest request) {
    var rubricId = rubricIds.getAndIncrement();
    var items = request.items() == null ? List.<RubricItemSummary>of() : request.items().stream()
        .map(item -> new RubricItemSummary(
            itemIds.getAndIncrement(),
            item.title(),
            item.score(),
            item.courseOutcomeCode(),
            item.points() == null ? List.of() : item.points().stream()
                .map(point -> new RubricPointSummary(
                    pointIds.getAndIncrement(),
                    point.title(),
                    point.description(),
                    point.score(),
                    point.keywords(),
                    point.synonyms()
                ))
                .toList()
        ))
        .toList();
    var rubric = new RubricSummary(rubricId, request.assignmentId(), request.name(), request.totalScore(), items);
    rubrics.put(rubricId, rubric);
    return rubric;
  }

  public Collection<GradingJobSummary> listJobs(Long assignmentId) {
    return jobs.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .toList();
  }

  public GradingJobSummary createJob(CreateGradingJobRequest request) {
    var id = jobIds.getAndIncrement();
    var job = new GradingJobSummary(
        id,
        request.assignmentId(),
        request.rubricId(),
        request.submissionIds().size(),
        0,
        GradingJobStatus.PENDING,
        0,
        OffsetDateTime.now()
    );
    jobs.put(id, job);
    return job;
  }
}
