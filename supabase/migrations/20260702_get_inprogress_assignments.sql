CREATE OR REPLACE FUNCTION public.get_inprogress_assignments()
RETURNS TABLE (
  user_id       uuid,
  email         text,
  full_name     text,
  subject_id    uuid,
  subject_title text,
  subject_emoji text,
  total_steps   bigint,
  completed_steps bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.user_id,
    p.email,
    p.full_name,
    s.id          AS subject_id,
    s.title       AS subject_title,
    s.emoji       AS subject_emoji,
    COUNT(DISTINCT st.id)      AS total_steps,
    COUNT(DISTINCT sp.step_id) AS completed_steps
  FROM assignments a
  JOIN profiles p       ON p.id          = a.user_id
  JOIN subjects s       ON s.id          = a.subject_id
  JOIN topics   t       ON t.subject_id  = s.id
  JOIN steps    st      ON st.topic_id   = t.id
  LEFT JOIN step_progress sp
    ON sp.step_id  = st.id
    AND sp.user_id = a.user_id
  WHERE p.email IS NOT NULL
  GROUP BY a.user_id, p.email, p.full_name, s.id, s.title, s.emoji
  HAVING COUNT(DISTINCT sp.step_id) > 0
     AND COUNT(DISTINCT sp.step_id) < COUNT(DISTINCT st.id)
  ORDER BY p.email, s.title;
$$;
