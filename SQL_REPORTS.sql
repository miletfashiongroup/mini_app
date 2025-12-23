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

-- Analytics: daily funnel summary (using analytics_events + orders)
WITH daily_events AS (
  SELECT
    DATE(occurred_at) AS day,
    COUNT(*) FILTER (WHERE name = 'product_view') AS product_view,
    COUNT(*) FILTER (WHERE name = 'add_to_cart') AS add_to_cart,
    COUNT(*) FILTER (WHERE name = 'checkout_start') AS checkout_start
  FROM analytics_events
  GROUP BY 1
),
daily_orders AS (
  SELECT
    DATE(created_at) AS day,
    COUNT(*) AS order_created,
    COALESCE(SUM(total_amount_minor_units), 0) AS revenue_minor_units
  FROM orders
  GROUP BY 1
)
SELECT
  e.day,
  e.product_view,
  e.add_to_cart,
  e.checkout_start,
  o.order_created,
  o.revenue_minor_units,
  ROUND(o.order_created::numeric / NULLIF(e.checkout_start, 0), 4) AS checkout_cr
FROM daily_events e
LEFT JOIN daily_orders o ON o.day = e.day
ORDER BY e.day DESC;

-- Analytics: daily rollup (use analytics_daily_metrics for dashboards)
SELECT metric_date, metric_key, metric_value
FROM analytics_daily_metrics
ORDER BY metric_date DESC, metric_key;

-- Analytics: DAU (sessions as proxy)
SELECT metric_date, metric_value AS sessions
FROM analytics_daily_metrics
WHERE metric_key = 'sessions'
ORDER BY metric_date DESC;

-- Analytics: product CTR (catalog -> product_view)
SELECT
  properties->>'product_id' AS product_id,
  COUNT(*) AS product_views
FROM analytics_events
WHERE name = 'product_view'
GROUP BY 1
ORDER BY product_views DESC;

-- Analytics: size selection frequency
SELECT
  properties->>'product_id' AS product_id,
  properties->>'size' AS size,
  COUNT(*) AS selections
FROM analytics_events
WHERE name = 'size_selected'
GROUP BY 1, 2
ORDER BY selections DESC;

-- Analytics: search/filter usage (when events are implemented)
SELECT
  DATE(occurred_at) AS day,
  COUNT(*) FILTER (WHERE name = 'search_used') AS search_used,
  COUNT(*) FILTER (WHERE name = 'filter_applied') AS filter_applied
FROM analytics_events
GROUP BY 1
ORDER BY day DESC;
