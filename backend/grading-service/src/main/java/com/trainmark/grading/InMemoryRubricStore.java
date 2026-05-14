package com.trainmark.grading;

import com.trainmark.shared.dto.CreateRubricRequest;
import com.trainmark.shared.dto.RubricItemSummary;
import com.trainmark.shared.dto.RubricPointSummary;
import com.trainmark.shared.dto.RubricSummary;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.rubric-store", havingValue = "memory", matchIfMissing = true)
public class InMemoryRubricStore implements RubricStore {
  private final AtomicLong rubricIds = new AtomicLong(2);
  private final AtomicLong itemIds = new AtomicLong(10);
  private final AtomicLong pointIds = new AtomicLong(100);
  private final Map<Long, RubricSummary> rubrics = new LinkedHashMap<>();

  public InMemoryRubricStore() {
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
  }

  @Override
  public Collection<RubricSummary> listRubrics(Long assignmentId) {
    return rubrics.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .toList();
  }

  @Override
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

  @Override
  public Optional<RubricSummary> findFirstForAssignment(Long assignmentId) {
    return rubrics.values().stream()
        .filter(item -> assignmentId.equals(item.assignmentId()))
        .findFirst()
        .or(() -> rubrics.values().stream().findFirst());
  }
}
