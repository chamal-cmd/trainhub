-- ─────────────────────────────────────────────────────────────────────────────
-- seed-team-training.sql
-- Creates the "Team Training" subject with 8 topics, each containing a step
-- with the relevant embedded video / PDF attachments.
--
-- Run once in the Supabase SQL editor.
-- Safe to re-run: uses a unique title check so it won't duplicate.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  subj_id    UUID;
  t1 UUID; t2 UUID; t3 UUID; t4 UUID;
  t5 UUID; t6 UUID; t7 UUID; t8 UUID;
BEGIN

  -- ── Guard: skip if subject already exists ─────────────────────────────────
  IF EXISTS (SELECT 1 FROM subjects WHERE title = 'Team Training') THEN
    RAISE NOTICE 'Team Training subject already exists — skipping seed.';
    RETURN;
  END IF;

  subj_id := gen_random_uuid();
  t1 := gen_random_uuid(); t2 := gen_random_uuid();
  t3 := gen_random_uuid(); t4 := gen_random_uuid();
  t5 := gen_random_uuid(); t6 := gen_random_uuid();
  t7 := gen_random_uuid(); t8 := gen_random_uuid();

  -- ── Subject ───────────────────────────────────────────────────────────────
  INSERT INTO subjects (id, title, description, emoji, cover_color)
  VALUES (
    subj_id,
    'Team Training',
    'Recorded team training sessions, discussions and resources.',
    '🎥',
    '#f97316'
  );

  -- ── Topic 1: Surgical Partner Discussion ──────────────────────────────────
  INSERT INTO topics (id, subject_id, title, order_index)
  VALUES (t1, subj_id, 'Surgical Partner Discussion - February 9th', 1);

  INSERT INTO steps (id, topic_id, title, order_index, content)
  VALUES (gen_random_uuid(), t1, 'Session Recording', 1,
    jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object('type','paragraph','content',
          jsonb_build_array(jsonb_build_object('type','text','text',
            'Watch the session recording below.')))
      ),
      'attachments', jsonb_build_array(
        jsonb_build_object(
          'type', 'video_url',
          'name', 'Surgical Partner Training Session',
          'url',  'https://drive.google.com/file/d/1HXbohCrs9mcGJ4u8i0ujd0F-wPamZ566/view'
        )
      )
    )
  );

  -- ── Topic 2: Tanda Discussion ─────────────────────────────────────────────
  INSERT INTO topics (id, subject_id, title, order_index)
  VALUES (t2, subj_id, 'Tanda Discussion - February 23rd', 2);

  INSERT INTO steps (id, topic_id, title, order_index, content)
  VALUES (gen_random_uuid(), t2, 'Session Recording', 1,
    jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object('type','paragraph','content',
          jsonb_build_array(jsonb_build_object('type','text','text',
            'Watch the session recording below.')))
      ),
      'attachments', jsonb_build_array(
        jsonb_build_object(
          'type', 'video_url',
          'name', 'Tanda Discussion Recording',
          'url',  'https://drive.google.com/file/d/1ttPJVPSI43-4ZOH6dM7oejZrbsA0EM9j/view'
        )
      )
    )
  );

  -- ── Topic 3: Payroll Tax Training ─────────────────────────────────────────
  INSERT INTO topics (id, subject_id, title, order_index)
  VALUES (t3, subj_id, 'Payroll Tax Training - June 7th', 3);

  INSERT INTO steps (id, topic_id, title, order_index, content)
  VALUES (gen_random_uuid(), t3, 'Session Recording', 1,
    jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object('type','paragraph','content',
          jsonb_build_array(jsonb_build_object('type','text','text',
            'Watch the session recording and review the reference document below.')))
      ),
      'attachments', jsonb_build_array(
        jsonb_build_object(
          'type', 'video_url',
          'name', 'Payroll Tax Training (Vimeo)',
          'url',  'https://vimeo.com/941888751/363ba582a0'
        ),
        jsonb_build_object(
          'type', 'video_url',
          'name', 'Payroll Tax Training (Loom)',
          'url',  'https://www.loom.com/share/dd5f6bdab1284b8f800b9e61bb01dd17'
        ),
        jsonb_build_object(
          'type', 'pdf',
          'name', 'Individual Banking Model – Flow Of Funds',
          'url',  'https://trainual-prod.s3.amazonaws.com/uploads/step_attachment/attach/548222/Individual_Banking_Model__Flow_Of_Funds__2_.pdf?X-Amz-Expires=604800&X-Amz-Date=20260525T063909Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAT4UPBYSK7XGDLMOY%2F20260525%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=89e582b30b9f458bd8eb6f77e2ceac60fbd6491486beffc67dd19fa0406e3cc7'
        )
      )
    )
  );

  -- ── Topic 4: Fraud Detection ──────────────────────────────────────────────
  INSERT INTO topics (id, subject_id, title, order_index)
  VALUES (t4, subj_id, 'Fraud Detection - July 26th', 4);

  INSERT INTO steps (id, topic_id, title, order_index, content)
  VALUES (gen_random_uuid(), t4, 'Session Recording', 1,
    jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object('type','paragraph','content',
          jsonb_build_array(jsonb_build_object('type','text','text',
            'Watch the session recording below.')))
      ),
      'attachments', jsonb_build_array(
        jsonb_build_object(
          'type', 'video_url',
          'name', 'Fraud Detection Training Session',
          'url',  'https://vimeo.com/962156479/0c162a70ea'
        )
      )
    )
  );

  -- ── Topic 5: Benchmark Your Practice ─────────────────────────────────────
  INSERT INTO topics (id, subject_id, title, order_index)
  VALUES (t5, subj_id, 'Benchmark Your Practice - August 23rd', 5);

  INSERT INTO steps (id, topic_id, title, order_index, content)
  VALUES (gen_random_uuid(), t5, 'Session Recording', 1,
    jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object('type','paragraph','content',
          jsonb_build_array(jsonb_build_object('type','text','text',
            'Watch the session recording and download the industry report below.')))
      ),
      'attachments', jsonb_build_array(
        jsonb_build_object(
          'type', 'video_url',
          'name', 'Benchmark Your Practice (Loom)',
          'url',  'https://www.loom.com/share/6f766004b5b94503805faac1c7fdd193'
        ),
        jsonb_build_object(
          'type', 'pdf',
          'name', '2023 Touchstone General Practice Industry Report',
          'url',  'https://trainual-prod.s3.amazonaws.com/uploads/step_attachment/attach/548223/2023_Touchstone_General_Practice_Industry_Report__final___1_.pdf?X-Amz-Expires=604800&X-Amz-Date=20260525T064019Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAT4UPBYSK7XGDLMOY%2F20260525%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=0170730d44832d4322d23099152e176a9a3af494d9f453f291a84c079706729e'
        )
      )
    )
  );

  -- ── Topic 6: Review of Monthly Profit and Loss ────────────────────────────
  INSERT INTO topics (id, subject_id, title, order_index)
  VALUES (t6, subj_id, 'Review of Monthly Profit and Loss', 6);

  INSERT INTO steps (id, topic_id, title, order_index, content)
  VALUES (gen_random_uuid(), t6, 'Session Overview', 1,
    jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object('type','paragraph','content',
          jsonb_build_array(jsonb_build_object('type','text','text',
            'Content for this session will be added soon.')))
      ),
      'attachments', '[]'::jsonb
    )
  );

  -- ── Topic 7: How To Leverage AI ───────────────────────────────────────────
  INSERT INTO topics (id, subject_id, title, order_index)
  VALUES (t7, subj_id, 'How To Leverage AI - September 13th', 7);

  INSERT INTO steps (id, topic_id, title, order_index, content)
  VALUES (gen_random_uuid(), t7, 'Session Recording', 1,
    jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object('type','paragraph','content',
          jsonb_build_array(jsonb_build_object('type','text','text',
            'Watch the session recording below.')))
      ),
      'attachments', jsonb_build_array(
        jsonb_build_object(
          'type', 'video_url',
          'name', 'How To Leverage AI – Training Session',
          'url',  'https://vimeo.com/982894973/bea3208d13'
        )
      )
    )
  );

  -- ── Topic 8: GP Registrars ────────────────────────────────────────────────
  INSERT INTO topics (id, subject_id, title, order_index)
  VALUES (t8, subj_id, 'GP Registrars', 8);

  INSERT INTO steps (id, topic_id, title, order_index, content)
  VALUES (gen_random_uuid(), t8, 'Session Overview', 1,
    jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object('type','paragraph','content',
          jsonb_build_array(jsonb_build_object('type','text','text',
            'Content for this session will be added soon.')))
      ),
      'attachments', '[]'::jsonb
    )
  );

  RAISE NOTICE 'Team Training seeded successfully (subject id: %)!', subj_id;
END $$;
