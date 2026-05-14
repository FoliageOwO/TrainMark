package com.trainmark.grading;

import com.trainmark.shared.AppealStatus;
import com.trainmark.shared.dto.AppealSummary;
import com.trainmark.shared.dto.CreateAppealRequest;
import com.trainmark.shared.dto.ResolveAppealRequest;
import java.util.Collection;

public interface AppealStore {
  Collection<AppealSummary> listAppeals(Long resultId, Long studentId, AppealStatus status);

  AppealSummary createAppeal(CreateAppealRequest request, String studentName);

  AppealSummary resolveAppeal(Long appealId, ResolveAppealRequest request);
}
