-- User demographics summary (only users who completed profiles)
SELECT
  COUNT(*) AS total_profiles,
  COUNT(*) FILTER (WHERE gender = 'male') AS male_count,
  COUNT(*) FILTER (WHERE gender = 'female') AS female_count
FROM users
WHERE profile_completed_at IS NOT NULL;

-- Gender distribution in percent (completed profiles only)
SELECT
  gender,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS percent
FROM users
WHERE profile_completed_at IS NOT NULL
GROUP BY gender
ORDER BY gender;

-- Age distribution buckets (completed profiles only)
SELECT
  CASE
    WHEN age_years < 18 THEN '<18'
    WHEN age_years BETWEEN 18 AND 24 THEN '18-24'
    WHEN age_years BETWEEN 25 AND 34 THEN '25-34'
    WHEN age_years BETWEEN 35 AND 44 THEN '35-44'
    WHEN age_years BETWEEN 45 AND 54 THEN '45-54'
    WHEN age_years BETWEEN 55 AND 64 THEN '55-64'
    ELSE '65+'
  END AS age_bucket,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS percent
FROM (
  SELECT DATE_PART('year', AGE(CURRENT_DATE, birth_date))::int AS age_years
  FROM users
  WHERE profile_completed_at IS NOT NULL
    AND birth_date IS NOT NULL
) AS ages
GROUP BY age_bucket
ORDER BY MIN(age_years);
