package com.trainmark.grading;

import com.trainmark.shared.dto.CreateRubricRequest;
import com.trainmark.shared.dto.RubricSummary;
import java.util.Collection;
import java.util.Optional;

public interface RubricStore {
  Collection<RubricSummary> listRubrics(Long assignmentId);

  RubricSummary createRubric(CreateRubricRequest request);

  Optional<RubricSummary> findFirstForAssignment(Long assignmentId);
}
