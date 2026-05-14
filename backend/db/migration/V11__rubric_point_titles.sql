ALTER TABLE rubric_points
  ADD COLUMN IF NOT EXISTS title VARCHAR(160);

UPDATE rubric_points
SET title = COALESCE(title, left(description, 160))
WHERE title IS NULL;

ALTER TABLE rubric_points
  ALTER COLUMN title SET NOT NULL;
