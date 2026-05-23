package com.trainmark.grading;

import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingItemReview;
import com.trainmark.shared.dto.GradingResultSummary;
import com.trainmark.shared.dto.RubricItemSummary;
import com.trainmark.shared.dto.RubricPointSummary;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

public class LocalScoringProvider implements ScoringProvider {
  @Override
  public GradingResultSummary score(ScoringRequest request) {
    var rubric = request.rubric();
    var evidenceText = evidenceText(request);
    var scoredItems = rubric.items().stream()
        .map(item -> scoreItem(item, evidenceText))
        .toList();
    var teacherScore = scoredItems.stream().mapToInt(GradingItemReview::teacherScore).sum();
    return new GradingResultSummary(
        request.resultId(),
        request.assignmentId(),
        request.submissionId(),
        request.studentId(),
        request.studentName(),
        request.studentNo(),
        request.fileName(),
        "/previews/submissions/" + request.submissionId() + "/report.pdf",
        "/annotations/submissions/" + request.submissionId() + "/annotated.pdf",
        rubric.totalScore(),
        teacherScore,
        teacherScore,
        86,
        ReviewStatus.NEEDS_REVIEW,
        PublicationStatus.NOT_PUBLISHED,
        "本地规则评分已完成初评，建议教师重点复核扣分原因和证据定位。",
        null,
        null,
        scoredItems,
        List.of(new GradingAnnotationSummary(request.resultId(), 1, "自动评分摘要", "请复核规则评分生成的扣分证据", "info"))
    );
  }

  private GradingItemReview scoreItem(RubricItemSummary item, String evidenceText) {
    if (item.points().isEmpty()) {
      var hasEvidence = hasMeaningfulEvidence(evidenceText);
      var aiScore = hasEvidence ? Math.round(item.score() * 0.55f) : 0;
      return new GradingItemReview(
          item.id(),
          item.title(),
          item.score(),
          aiScore,
          aiScore,
          hasEvidence ? "评分项未配置关键词或得分点，系统按正文证据给出低权重初评分。" : "未检测到可用于评分的报告正文或 OCR 文本，该评分项暂不给分。",
          hasEvidence ? "请教师复核该分项证据后确认。" : "请教师确认学生是否提交了有效报告内容。",
          hasEvidence ? 62 : 35,
          List.of(hasEvidence ? item.title() + "：未配置细分得分点，仅按正文存在情况给出低权重初评分" : item.title() + "：无可用正文证据")
      );
    }

    var evidence = new ArrayList<String>();
    var pointScores = new ArrayList<Integer>();
    var matchedTerms = 0;
    var totalTerms = 0;
    var defaultBudget = item.score() / item.points().size();
    var remaining = item.score();
    for (var index = 0; index < item.points().size(); index++) {
      var point = item.points().get(index);
      var budget = point.score() > 0 ? point.score() : (index == item.points().size() - 1 ? remaining : defaultBudget);
      remaining -= budget;
      var pointScore = scorePoint(point, budget, evidenceText);
      pointScores.add(pointScore.score());
      evidence.addAll(pointScore.evidence());
      matchedTerms += pointScore.matchedTerms();
      totalTerms += pointScore.totalTerms();
    }

    var aiScore = Math.min(item.score(), pointScores.stream().mapToInt(Integer::intValue).sum());
    var matchRatio = totalTerms == 0 ? 0 : (double) matchedTerms / totalTerms;
    var confidence = hasMeaningfulEvidence(evidenceText) ? Math.min(96, Math.round(62 + (float) matchRatio * 30)) : 35;
    return new GradingItemReview(
        item.id(),
        item.title(),
        item.score(),
        aiScore,
        aiScore,
        "关键词/同义词命中 " + matchedTerms + "/" + totalTerms + "，按得分点权重自动扣分。",
        "请教师复核该分项证据后确认。",
        confidence,
        evidence
    );
  }

  private PointScore scorePoint(RubricPointSummary point, int budget, String evidenceText) {
    var terms = new ArrayList<String>();
    terms.addAll(point.keywords());
    terms.addAll(point.synonyms());
    terms.removeIf(String::isBlank);
    if (terms.isEmpty()) {
      if (!hasMeaningfulEvidence(evidenceText)) {
        return new PointScore(
            0,
            List.of(point.title() + "：未检测到可用于评分的报告正文或 OCR 文本"),
            0,
            0
        );
      }
      return new PointScore(
          Math.round(budget * 0.35f),
          List.of(point.title() + "：未配置关键词，仅按正文存在情况给出低权重初评分"),
          0,
          0
      );
    }

    if (!hasMeaningfulEvidence(evidenceText)) {
      return new PointScore(
          0,
          List.of(point.title() + "：未检测到可用于评分的报告正文或 OCR 文本"),
          0,
          terms.size()
      );
    }

    var normalized = evidenceText.toLowerCase(Locale.ROOT);
    var matched = terms.stream()
        .filter(term -> normalized.contains(term.toLowerCase(Locale.ROOT)))
        .toList();
    var missing = terms.stream()
        .filter(term -> !matched.contains(term))
        .toList();
    var ratio = (double) matched.size() / terms.size();
    var score = Math.round(budget * (float) ratio);
    var evidence = new ArrayList<String>();
    evidence.add(point.title() + "：命中 " + (matched.isEmpty() ? "无" : String.join("、", matched)));
    if (!missing.isEmpty()) {
      evidence.add(point.title() + "：缺失 " + String.join("、", missing));
    }
    return new PointScore(Math.max(0, Math.min(budget, score)), evidence, matched.size(), terms.size());
  }

  private String evidenceText(ScoringRequest request) {
    if (request.fileContentText() != null && !request.fileContentText().isBlank()) {
      return request.fileContentText();
    }
    return "";
  }

  private boolean hasMeaningfulEvidence(String evidenceText) {
    if (evidenceText == null || evidenceText.isBlank()) {
      return false;
    }
    var compact = evidenceText.replaceAll("\\s+", "");
    if (compact.length() >= 20) {
      return true;
    }
    return tokenize(evidenceText).size() >= 3;
  }

  private List<String> tokenize(String value) {
    var tokens = new LinkedHashSet<String>();
    var matcher = java.util.regex.Pattern.compile("[A-Za-z0-9_]+|[\\u4e00-\\u9fff]{2,}").matcher(value);
    while (matcher.find()) {
      tokens.add(matcher.group().toLowerCase(Locale.ROOT));
    }
    return List.copyOf(tokens);
  }

  private record PointScore(int score, List<String> evidence, int matchedTerms, int totalTerms) {}
}
