-- Trainual → TrainHub Import
-- Generated: 2026-05-22T11:03:04.258Z

DO $$ DECLARE admin_id UUID; BEGIN
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;

  -- Subject: How to Get Started With Trainual
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('d557eb7e-ce31-4ff2-93f0-12ed43871b1b','How to Get Started With Trainual','🚀',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3a326efc-f360-4609-a2fe-5bbe152904ae','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('2132b1e0-d704-463a-b3bb-ba1501b85407','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('30db1873-d139-474d-87dd-e3a64b4070e3','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('da048393-197f-467a-80a4-a2ffd950c374','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('e0c2be17-fbbf-4d7c-9042-23ed05190262','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3aca00b6-6677-41ba-a891-798bdbe84fdb','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('75eeed30-d1e9-4859-b91f-2d407faf654f','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('0af0dfc9-f353-414c-861a-76e417dede97','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('47f59f33-cce5-46ee-88f7-090d1d5bac18','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a6565660-8423-461e-9c45-6e9f2f9ca296','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('9b1455d1-3f35-45c9-a65c-65d2420ada77','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('0bbaf652-43bd-4714-8de7-d03d45a6edf8','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('01edaa52-b516-4624-8121-4f254326cf6a','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('43f3231e-2806-4248-841b-9e9640cfec40','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3b29b502-4a6e-4607-94e1-f32682f2fc7d','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b8ae7dc5-7cef-4a93-bb62-0a36b55a46b8','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('2ca7349a-de50-46bb-84d7-89c136a3d5a3','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('fd9ea08d-bf11-4f91-939c-524b1df06142','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b548d377-e1dc-45ac-a72e-77977e2b3405','d557eb7e-ce31-4ff2-93f0-12ed43871b1b','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: How to Structure Your New Client's Asana Board
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('009fa299-b94b-4f46-8530-eb4d83b05fe9','How to Structure Your New Client''s Asana Board','📄',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('f870f67d-80f4-41a0-904a-77e6194a08bf','009fa299-b94b-4f46-8530-eb4d83b05fe9','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('27be5128-1452-4588-99c9-15ddb97abf59','009fa299-b94b-4f46-8530-eb4d83b05fe9','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('bbbf6737-709f-4021-97b2-dec04c3fd886','009fa299-b94b-4f46-8530-eb4d83b05fe9','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1e3db910-13c0-45c0-ac44-95a1b10b5ebc','009fa299-b94b-4f46-8530-eb4d83b05fe9','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('e2bb95e8-f40d-4055-abc2-666810cd1229','009fa299-b94b-4f46-8530-eb4d83b05fe9','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a4bd0a0d-abea-4f94-bcce-d7e99f62d5c7','009fa299-b94b-4f46-8530-eb4d83b05fe9','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7ed88ba5-c444-4938-9c6e-5350352e96a4','009fa299-b94b-4f46-8530-eb4d83b05fe9','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('e2244f70-28a4-4c04-bfd2-ab31978ae2d3','009fa299-b94b-4f46-8530-eb4d83b05fe9','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('565891c7-6500-4318-a3e0-25117882c1da','009fa299-b94b-4f46-8530-eb4d83b05fe9','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5d0ce4e8-005b-4c63-a0a6-c45c68f6925e','009fa299-b94b-4f46-8530-eb4d83b05fe9','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('bdbd0b6b-6419-43a8-8ded-b01be41ce7cc','009fa299-b94b-4f46-8530-eb4d83b05fe9','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5e1ba6aa-3b02-47a8-bca4-9a942f3dbc7e','009fa299-b94b-4f46-8530-eb4d83b05fe9','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('9596d460-942b-4c20-ad99-52063a1beb58','009fa299-b94b-4f46-8530-eb4d83b05fe9','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8fb84e57-fa39-4fa6-b73b-701cb75e570e','009fa299-b94b-4f46-8530-eb4d83b05fe9','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1edc9361-01e1-4b0a-bccd-35c40e25f1dd','009fa299-b94b-4f46-8530-eb4d83b05fe9','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a65a7fe3-a158-4b13-b7d5-f16f2affb068','009fa299-b94b-4f46-8530-eb4d83b05fe9','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('0754e1a7-37f7-416e-9a3d-ce854984a7af','009fa299-b94b-4f46-8530-eb4d83b05fe9','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('82c73f1a-e3d6-4c16-bfe1-f39767f712cb','009fa299-b94b-4f46-8530-eb4d83b05fe9','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('bcc5c4c5-e0cd-41c7-bc20-626dbf7c98bb','009fa299-b94b-4f46-8530-eb4d83b05fe9','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Client Meeting Structure
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('4dd86270-78ef-4c67-b975-b6240a431b1d','Client Meeting Structure','📲',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('80a4c232-1141-4b90-85cc-43eb4ddcc603','4dd86270-78ef-4c67-b975-b6240a431b1d','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3c89b9eb-fd3c-4147-a2f6-995f485ed947','4dd86270-78ef-4c67-b975-b6240a431b1d','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5ada7484-4666-496e-abaa-9bd0a7692f71','4dd86270-78ef-4c67-b975-b6240a431b1d','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('c8b5631e-752a-4069-8fd5-2e19b73ce746','4dd86270-78ef-4c67-b975-b6240a431b1d','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ead9cea5-3226-42f9-8ee7-b040dec7acdc','4dd86270-78ef-4c67-b975-b6240a431b1d','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('895d20af-8bd6-483e-ac0b-b9ef751e5c1b','4dd86270-78ef-4c67-b975-b6240a431b1d','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a9ee0ccb-8660-448a-99e9-a1c8a9856bc6','4dd86270-78ef-4c67-b975-b6240a431b1d','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b8ccbacd-a02f-4b1b-be2a-77f5b0737497','4dd86270-78ef-4c67-b975-b6240a431b1d','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('627e1a73-0d92-411e-9ce0-f866952f3e4c','4dd86270-78ef-4c67-b975-b6240a431b1d','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ab18eabe-5d1a-44ad-926e-bcaf3be017b0','4dd86270-78ef-4c67-b975-b6240a431b1d','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('cd710aed-71fe-4521-9471-946ae457552b','4dd86270-78ef-4c67-b975-b6240a431b1d','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3178edf6-606e-466d-ad85-380e8b24c3f8','4dd86270-78ef-4c67-b975-b6240a431b1d','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('98378a87-da00-4437-85f5-f94f252ebb6e','4dd86270-78ef-4c67-b975-b6240a431b1d','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('257b6fa1-3d64-4f8f-9689-6104f3cb64d0','4dd86270-78ef-4c67-b975-b6240a431b1d','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8e7a9668-fe7b-402c-ba1f-79ffba0c0385','4dd86270-78ef-4c67-b975-b6240a431b1d','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1d3fbe93-458c-49f0-bab7-cdba4d22b4ce','4dd86270-78ef-4c67-b975-b6240a431b1d','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ad2cabc5-07e1-460b-a669-fdb919a6e9f4','4dd86270-78ef-4c67-b975-b6240a431b1d','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('484a05f3-545e-4cae-abe9-f2ad1029774c','4dd86270-78ef-4c67-b975-b6240a431b1d','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d5edbe49-f61b-49a1-8453-a380b3988ebb','4dd86270-78ef-4c67-b975-b6240a431b1d','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Leave Policy
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('737fd457-abc4-46be-b1d8-85133b4ba611','Leave Policy','🌴',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('637955da-e859-454a-9c4c-d7e117e19385','737fd457-abc4-46be-b1d8-85133b4ba611','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('03012bf2-16b3-4745-b190-3aca45481337','737fd457-abc4-46be-b1d8-85133b4ba611','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('57f6c1a4-62c7-4bd4-b39b-a76daa6298d8','737fd457-abc4-46be-b1d8-85133b4ba611','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b233009e-9cfd-4bc1-9675-e399b3cdd660','737fd457-abc4-46be-b1d8-85133b4ba611','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ab08a208-bb86-46b5-aa92-b6c4b2bdb8f1','737fd457-abc4-46be-b1d8-85133b4ba611','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b45e5d5b-76f7-4685-b43e-c25fa44674fb','737fd457-abc4-46be-b1d8-85133b4ba611','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d895dd07-20d2-43d3-a3a9-55fb6d2e655e','737fd457-abc4-46be-b1d8-85133b4ba611','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('eb690493-64ae-40fe-a5db-cff6ba28d138','737fd457-abc4-46be-b1d8-85133b4ba611','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('93def1d1-f1f5-4c9f-b9f5-c2f3142d4ec2','737fd457-abc4-46be-b1d8-85133b4ba611','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('c8d87fd4-7bfc-4ee0-a8e8-c74c40864afe','737fd457-abc4-46be-b1d8-85133b4ba611','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('36559fe6-05b6-491c-b361-65875d5f85d6','737fd457-abc4-46be-b1d8-85133b4ba611','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('fadbe504-4909-427d-a11d-c121f7b78abc','737fd457-abc4-46be-b1d8-85133b4ba611','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1c005377-8cce-486f-ae81-c714e41619ce','737fd457-abc4-46be-b1d8-85133b4ba611','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('77f42af4-3833-41eb-8227-b850c475d58a','737fd457-abc4-46be-b1d8-85133b4ba611','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('35b46980-ed9d-461b-a198-a08342fbc060','737fd457-abc4-46be-b1d8-85133b4ba611','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('f44a3cac-12c0-4a71-8a65-de05c4ca04ef','737fd457-abc4-46be-b1d8-85133b4ba611','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('cd3bc846-cb3a-42fd-8658-529d72c3c2b9','737fd457-abc4-46be-b1d8-85133b4ba611','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('99493f2c-6894-4ce1-b50c-728ed512adc9','737fd457-abc4-46be-b1d8-85133b4ba611','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3332d3c2-fda0-465b-99fa-0ea5edcd5a11','737fd457-abc4-46be-b1d8-85133b4ba611','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Email Templates
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('53fb278d-dc64-48f6-8162-83222760f5cf','Email Templates','📩',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('c3f1850b-ab81-4f7b-85ab-ebc5e3a48c5c','53fb278d-dc64-48f6-8162-83222760f5cf','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('98180382-da9c-4c06-9fa7-15c19efc6dc0','53fb278d-dc64-48f6-8162-83222760f5cf','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5e572231-792c-43a7-a8c1-cf018d9de849','53fb278d-dc64-48f6-8162-83222760f5cf','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('6502202e-c219-4604-a00b-b0965f271ef1','53fb278d-dc64-48f6-8162-83222760f5cf','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('53b0c07b-cedf-4b1e-80a9-24e948c93539','53fb278d-dc64-48f6-8162-83222760f5cf','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('f8e12773-f9a6-431b-ad4e-528ffed8a1e0','53fb278d-dc64-48f6-8162-83222760f5cf','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('c8d63744-71ec-4f37-bedf-e43a92bd3c33','53fb278d-dc64-48f6-8162-83222760f5cf','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('195b9617-059a-4695-974b-11ddddc1d356','53fb278d-dc64-48f6-8162-83222760f5cf','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('e10fa576-a5f9-4a5b-b149-c133d20d4b65','53fb278d-dc64-48f6-8162-83222760f5cf','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3eb59199-3e0a-429a-a16c-1fb31782f877','53fb278d-dc64-48f6-8162-83222760f5cf','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('6fd55ced-1400-4bcf-84c3-f8c71ae4012b','53fb278d-dc64-48f6-8162-83222760f5cf','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a127961d-1a0f-400c-9da3-cc6a2bd5abca','53fb278d-dc64-48f6-8162-83222760f5cf','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('f66c53e3-d2c1-4ccf-98c7-4cb91c2a740b','53fb278d-dc64-48f6-8162-83222760f5cf','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('2a122fa9-85d1-4b13-8bbd-0b90d8798b9f','53fb278d-dc64-48f6-8162-83222760f5cf','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('9fc3618a-21ea-4593-b333-4ca831d68d5e','53fb278d-dc64-48f6-8162-83222760f5cf','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5fccc471-76ff-4b9f-af71-5adf77f5fd5b','53fb278d-dc64-48f6-8162-83222760f5cf','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('014941f0-d969-4aba-bbc0-b579a3e2c5ba','53fb278d-dc64-48f6-8162-83222760f5cf','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('233ea138-e226-4dc5-8d55-1614f594ff4e','53fb278d-dc64-48f6-8162-83222760f5cf','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('2b4f52f5-bb87-43b7-9f83-77ecf19607b5','53fb278d-dc64-48f6-8162-83222760f5cf','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Team Training
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('de7a80be-3063-4664-97e2-49b878190344','Team Training','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5d57d505-3d6f-40cc-b9bb-57a49bb9fbd1','de7a80be-3063-4664-97e2-49b878190344','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('0a531166-2c17-45fc-9bcf-1299ce0da5bc','de7a80be-3063-4664-97e2-49b878190344','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a06edb11-53aa-4d8d-9a5a-bc4cb5b59ec0','de7a80be-3063-4664-97e2-49b878190344','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('983b6b54-96c8-4641-adcf-21b46da40796','de7a80be-3063-4664-97e2-49b878190344','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7f2d8dbc-2767-4e8b-be9a-b55ea9c5446a','de7a80be-3063-4664-97e2-49b878190344','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1a6f4f2a-d9f6-4914-8fa8-ef534bfe74dd','de7a80be-3063-4664-97e2-49b878190344','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3ec0cd92-43b5-4d39-aa4e-2d15a8f39159','de7a80be-3063-4664-97e2-49b878190344','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d0ffe823-9db4-4684-9466-722236847e70','de7a80be-3063-4664-97e2-49b878190344','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8cd47c05-1610-43de-b157-2fcff1bf706c','de7a80be-3063-4664-97e2-49b878190344','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('03dddc64-d9d6-46c2-bad3-f0f1cf85e6b6','de7a80be-3063-4664-97e2-49b878190344','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('042afa74-c31a-4e87-b539-b3b480ad0f4b','de7a80be-3063-4664-97e2-49b878190344','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('6416ce09-8a55-49d7-876e-1968e654fb42','de7a80be-3063-4664-97e2-49b878190344','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('34916f28-3872-4784-9e69-b6d1615ffcfd','de7a80be-3063-4664-97e2-49b878190344','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('9928d741-acde-40d0-9d49-0173a569d2d5','de7a80be-3063-4664-97e2-49b878190344','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1d02b233-9916-4a8e-9013-73eb4f75b272','de7a80be-3063-4664-97e2-49b878190344','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('2b14643e-4c21-4258-b5ec-402d307edc88','de7a80be-3063-4664-97e2-49b878190344','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d8af1198-6b98-466d-b8d5-c9454090dec0','de7a80be-3063-4664-97e2-49b878190344','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5419b7bc-7986-47d9-b115-7621867d176b','de7a80be-3063-4664-97e2-49b878190344','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('cba137f1-2c18-476a-9b37-9c8a6754a186','de7a80be-3063-4664-97e2-49b878190344','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Dext Prepare
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Dext Prepare','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('6a4ef81f-c614-4770-a27e-46fd1155048f','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b784daeb-a7a2-4e3b-b42b-e1f839c8d6ce','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('05bbb1b7-fc8b-4a4e-9fc7-1bf447d57908','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('34aeab0b-fec7-40f5-8915-54285c8c0bf0','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('dcf206ee-9553-4614-bed6-1a0fa64a323c','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b30e11c3-3e05-4c26-92b9-19b65d496fa1','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3a053885-9936-4740-977a-1de622afe2fa','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8b33339a-a858-4f23-9628-3a3a478469a5','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ae251f50-88fd-476e-9202-a4601c4b6b87','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('063e4376-152a-4118-a3e5-61fa5b2f124d','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('761c9a72-7465-4a04-ae05-ea824117af26','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('cd3673d6-2647-44e5-8359-f2b893e6072e','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('50a58cc1-aa9c-495d-87c2-3a7ab35e44d7','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d030a05c-413a-4b9e-9bea-88f2c92243fb','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('92ff8801-589c-4f07-9ae0-5aefae52f078','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('28395b09-9227-4054-ac5b-6e5e9fa0545f','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('07974d77-ffc4-42c0-a128-e7c75ace26a1','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('fc355d26-f53e-41c6-b20c-5a210d4ee314','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('4b5e7a3b-5c21-452e-92d5-3f230b6844c9','f4e589b6-83df-4b6d-98b8-b34c82fb6cc7','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Quick Tips - Trick Bytes Video Series
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('9e61dfbb-324c-4285-a32c-f00000d6bc32','Quick Tips - Trick Bytes Video Series','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('45c7c759-46d2-48e1-b532-448404ce8b23','9e61dfbb-324c-4285-a32c-f00000d6bc32','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('221201af-dec3-4025-8cb8-e355b6f64965','9e61dfbb-324c-4285-a32c-f00000d6bc32','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3759407e-b987-4061-a9c5-0354d059271b','9e61dfbb-324c-4285-a32c-f00000d6bc32','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ea8f7a8f-8193-4a75-b6b8-7719178097e6','9e61dfbb-324c-4285-a32c-f00000d6bc32','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d4ef8bdc-675a-4cfc-bc4e-6acf01e67607','9e61dfbb-324c-4285-a32c-f00000d6bc32','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3ab8d304-dbf5-40d0-b25b-12e9173c64b9','9e61dfbb-324c-4285-a32c-f00000d6bc32','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a505fed4-3c3b-46b1-9e54-d25126d6df09','9e61dfbb-324c-4285-a32c-f00000d6bc32','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('754e4956-46c5-4a51-8627-ca36ab209ca0','9e61dfbb-324c-4285-a32c-f00000d6bc32','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('28e7b9bc-a41a-4adc-8ab4-d81380c47d7d','9e61dfbb-324c-4285-a32c-f00000d6bc32','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5c51ee58-fb3e-44b2-9f9f-89d402e5a6b8','9e61dfbb-324c-4285-a32c-f00000d6bc32','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5b2cc7c7-a9c7-4549-b161-06b387f1a031','9e61dfbb-324c-4285-a32c-f00000d6bc32','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('de7086b4-4b89-48ba-a1d0-ebbbd357dc00','9e61dfbb-324c-4285-a32c-f00000d6bc32','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b6f3c4b4-4d37-4b3b-aa51-420b6a47d3de','9e61dfbb-324c-4285-a32c-f00000d6bc32','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('74464c56-63cc-4bc2-9878-53e1f472de10','9e61dfbb-324c-4285-a32c-f00000d6bc32','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('cffbe779-5da9-437f-9b69-9e10ee02216d','9e61dfbb-324c-4285-a32c-f00000d6bc32','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('9736d7af-1aa6-42d0-baaf-1e469322fd26','9e61dfbb-324c-4285-a32c-f00000d6bc32','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('873d199b-5f3d-4360-9098-cd401c64da12','9e61dfbb-324c-4285-a32c-f00000d6bc32','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('81574c97-be01-4591-b8a5-8f05fa09bacd','9e61dfbb-324c-4285-a32c-f00000d6bc32','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('df2b9c22-75d8-4321-bc58-81b98284692b','9e61dfbb-324c-4285-a32c-f00000d6bc32','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Fathom Reporting
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Fathom Reporting','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('596d0d5b-2a21-4ea3-adf5-a9b20a36e3f6','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('2192f5b2-7343-41cc-9bed-61083a5b0611','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5e53618f-b9fe-4549-aa94-ebbc852492da','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('6c276f69-6e76-4fad-8990-d3b26e670736','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('836ef607-6a98-49ba-abf6-981750d12726','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b4609173-ade0-4047-9f28-4857a855f529','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ef97ed1d-c6ab-4b02-9c51-5d42b85d0784','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('967cd5e8-a5b2-455d-9f6f-754adfbb3753','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5a8fcf15-cf08-475b-b636-0c87173fa15f','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d61fdd6f-42a9-434b-a260-2d4ff01303eb','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('335d7d7f-be30-4194-9951-e9678efa3134','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('0815decc-686e-4757-831c-7356f084e063','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('15daaa89-3418-46ea-8250-f6f6c1cd72ab','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('0af7b0a8-fd2d-4639-bd74-78aacb4878d4','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('142b46a4-d0f3-4df5-a3cf-e082a60c336b','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('c5869815-213b-415a-929b-8bdd9758c6ff','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7fc732dc-da7c-45f5-82e9-c43503bf9ca6','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1871533d-5b35-46e7-9736-73123b4f2b20','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('45ff4801-751e-46b5-931c-33fce3d2f9cc','4262483d-6e1d-4dd8-8371-ad61c3f5fa95','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Applying Leave
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('6678f8ef-205b-40c6-bdf5-363bc4349134','Applying Leave','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8ed90c69-767f-4960-811d-3df36feb6d54','6678f8ef-205b-40c6-bdf5-363bc4349134','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('edba8d3c-44fd-4537-8c23-e0e866930b1b','6678f8ef-205b-40c6-bdf5-363bc4349134','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('f9440e7a-feaa-4d80-8f53-12bf1696edfe','6678f8ef-205b-40c6-bdf5-363bc4349134','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7ae327ed-615b-4bcf-8bc3-c4eef34ca796','6678f8ef-205b-40c6-bdf5-363bc4349134','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('85abcb03-122f-413e-bad6-4e57776424c5','6678f8ef-205b-40c6-bdf5-363bc4349134','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a7b9b892-2ae8-4737-9a62-18f8965c25ab','6678f8ef-205b-40c6-bdf5-363bc4349134','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('9b807779-2011-4008-bd82-3b86811d64de','6678f8ef-205b-40c6-bdf5-363bc4349134','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a65a1a7e-760b-48bc-9dc4-84f882d61e62','6678f8ef-205b-40c6-bdf5-363bc4349134','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a7e2315b-6897-4aa6-9a4b-7e860437ed4d','6678f8ef-205b-40c6-bdf5-363bc4349134','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('e57b82e6-dbe0-48cd-b9a9-6dea5c7969ce','6678f8ef-205b-40c6-bdf5-363bc4349134','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('205876f2-e10e-4a85-bfca-b613287e1cd4','6678f8ef-205b-40c6-bdf5-363bc4349134','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('c81a481d-ac81-43c0-ae7e-511cc02f8cd2','6678f8ef-205b-40c6-bdf5-363bc4349134','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('f357581d-02c3-4d4d-90c1-59e9bd419941','6678f8ef-205b-40c6-bdf5-363bc4349134','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a651b70c-3c52-467b-8d86-f84defd7d62f','6678f8ef-205b-40c6-bdf5-363bc4349134','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d0e15ef6-9d15-415f-9c55-9b0887f23340','6678f8ef-205b-40c6-bdf5-363bc4349134','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('fdc02f49-9c99-4b67-aae2-9184289a967b','6678f8ef-205b-40c6-bdf5-363bc4349134','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('27cca226-fd63-4b6a-a121-41637c49036d','6678f8ef-205b-40c6-bdf5-363bc4349134','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a6c02329-3d89-4f80-b4e1-e89d1e921be3','6678f8ef-205b-40c6-bdf5-363bc4349134','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5fe72f9e-5f39-4be2-8f6b-1717649f669a','6678f8ef-205b-40c6-bdf5-363bc4349134','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Payroll
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Payroll','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('4ebf16d8-6bef-4fdf-ac2f-d0e58c2a7966','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('bef2abff-33ea-45ad-8fa8-8dbc7f147ed4','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('03a5040a-b618-4f11-a6e2-5e133cfd2fbf','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('12c8fc66-e4b3-40a4-a65d-205b77b86925','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('098deb1d-4f45-4d7d-b03b-ee4ade1a483b','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ef4a0859-f5ad-42df-bf31-0c71507a185e','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('f41b487e-76fa-46ba-b528-ea265622d759','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('603bf8be-0b26-4532-9182-e4a820224a80','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('2bbefbc5-9176-4485-b1c3-8177bc096876','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('0244db59-4bd2-41e6-8da4-43ebff4a0309','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ae7da59a-35ed-4781-bd4b-21eacbc1bdf0','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('55c82391-308f-4941-87e2-69e89a481ac7','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('797f8931-7669-403d-b074-740e92246d5c','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('fe112753-3f73-4b9e-a4f6-56c3916b8f6e','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('166179cb-0566-4139-aae6-53fad434d9e9','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7ffd9fc9-5212-4076-973d-752978828ff9','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('e37543a0-64ca-4a89-9b69-0904c864ef45','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('28109c32-16fc-45ee-a45b-0322c2ccb02e','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ab37b1a5-6681-4f45-839b-a2129eb39760','0555057c-9e1f-4587-bf0f-4cfdadfcdb6c','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Employee Onboarding
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Employee Onboarding','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1efd94dc-eb19-4b9a-989e-2ed76cc90932','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('6e7aca1f-72b1-4d4c-b157-5cc041f609c1','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a29bd849-6542-481c-a496-e76597f7638f','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('0542889d-cca2-48ee-b9c2-56639f3a6e6a','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('e203a17e-e88e-457e-8412-5930240c6600','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('e176744c-2dcc-49a0-bfcb-a5ea6f6cb26e','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a62d9301-e2c2-482a-8e06-8b98250ee40d','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('e2017f72-dfb5-4c6e-ad5c-bc701375c3ff','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('f09fa7dc-942a-4df3-b47d-a6299b8d57b2','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('45a7f7ab-fbd0-493b-924e-7a8ad57eae15','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7b43ada4-bfa6-44bc-901e-780ae460ea73','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('f73c90ba-1c9c-4818-97cc-8ee94d09dbc3','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b3059a56-8b19-4c4c-a74d-f49a09784e60','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5e57972a-acd3-401f-ae6b-317366ff2c99','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('2668acb4-3968-4bee-b6ab-80f231145372','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8effd679-cfe7-4798-829e-10d9bcc6dd44','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('87243043-c4bb-4140-afda-6a6efcbceb73','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5db48804-8dde-4ef4-b376-68f5cd3d5a23','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('9f387572-0178-4a26-aefb-b1a6ab2dcc64','a26e43b1-61cd-4ca2-b62f-8b8a1de3f3ef','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Client Onboarding
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('821d3113-7331-4579-b84c-c828d4baacba','Client Onboarding','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('44fd791f-cde2-4e27-997c-9baae7fe55eb','821d3113-7331-4579-b84c-c828d4baacba','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7e0e65f4-c9d3-478c-98ec-bbda04aeb01d','821d3113-7331-4579-b84c-c828d4baacba','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('bc9db752-84dd-4102-a5a0-c9e05c3d67ea','821d3113-7331-4579-b84c-c828d4baacba','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('993a3711-5dfc-4c4f-914b-0536574d994a','821d3113-7331-4579-b84c-c828d4baacba','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('ed718700-8b90-4a35-987e-8f70a8bff5a0','821d3113-7331-4579-b84c-c828d4baacba','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('64b6371b-3b77-4fa7-a37b-f100478461a7','821d3113-7331-4579-b84c-c828d4baacba','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('fbbf4de1-96d8-4174-b8e2-b407d0470984','821d3113-7331-4579-b84c-c828d4baacba','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8fa34495-b2ce-4235-ba9c-661d92ee2296','821d3113-7331-4579-b84c-c828d4baacba','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('faee0262-b694-4f3e-82f5-c52ac2251d2a','821d3113-7331-4579-b84c-c828d4baacba','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8ea27b4b-e9d8-4275-8c27-69cecefb089f','821d3113-7331-4579-b84c-c828d4baacba','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('421456be-2291-450c-921b-5432cec891c5','821d3113-7331-4579-b84c-c828d4baacba','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5f1d1844-f32f-42b6-82aa-295fa02ad3e3','821d3113-7331-4579-b84c-c828d4baacba','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d520f8d1-fe1e-473b-8089-9b13638c5f48','821d3113-7331-4579-b84c-c828d4baacba','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a4cd26f3-7053-4efb-a318-7e0aadcec0ba','821d3113-7331-4579-b84c-c828d4baacba','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('bf2f8a25-e149-437f-a448-e4c5f69cf37a','821d3113-7331-4579-b84c-c828d4baacba','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8c73a66a-fff7-4546-a2bd-d2751fcf737f','821d3113-7331-4579-b84c-c828d4baacba','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('30634613-1ff0-4adf-adf6-3f21b0714506','821d3113-7331-4579-b84c-c828d4baacba','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('9f34e267-e1c7-4898-a4a1-738b70ccafc8','821d3113-7331-4579-b84c-c828d4baacba','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('95a5149e-9873-4c15-90a6-f3bb243ea19b','821d3113-7331-4579-b84c-c828d4baacba','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Xero Training
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('8125d313-9444-43cc-8afd-39de222d602e','Xero Training','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('dde3111c-2c52-4048-a133-d91aeef1b606','8125d313-9444-43cc-8afd-39de222d602e','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1c437b78-93fa-4cb1-8c52-c41974265cfc','8125d313-9444-43cc-8afd-39de222d602e','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('b47a5841-166e-4038-bb20-22e986e96bef','8125d313-9444-43cc-8afd-39de222d602e','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('d926ca49-f9d6-43ab-b5ca-3801f65ffaa0','8125d313-9444-43cc-8afd-39de222d602e','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('250eaf5b-4b67-43dd-bc15-33b579583180','8125d313-9444-43cc-8afd-39de222d602e','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('361a85ae-f2ba-4a00-b838-0a1d35812d03','8125d313-9444-43cc-8afd-39de222d602e','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('97d13e37-41f8-4dc3-8de7-9c536b73c64d','8125d313-9444-43cc-8afd-39de222d602e','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('799e07a0-f9b6-4a7f-8b4f-6135a119a680','8125d313-9444-43cc-8afd-39de222d602e','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('dce77c66-653d-43e5-802a-261d74076a0d','8125d313-9444-43cc-8afd-39de222d602e','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7e154708-06ec-4429-a89e-a69c355329d7','8125d313-9444-43cc-8afd-39de222d602e','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('c7a203ea-c14e-4f25-bf43-23783f38f027','8125d313-9444-43cc-8afd-39de222d602e','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('603ca11c-8d40-452a-8ce5-93ff6b457e30','8125d313-9444-43cc-8afd-39de222d602e','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7596bff3-8f5d-4d46-8511-68b9c4d60e5a','8125d313-9444-43cc-8afd-39de222d602e','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a15425d9-dc95-49c6-8f3e-ee95e95cf21f','8125d313-9444-43cc-8afd-39de222d602e','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('c0aaec3d-8a40-4a80-bc8b-9d42cbf6d743','8125d313-9444-43cc-8afd-39de222d602e','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('a5b25360-3ae3-4160-a24d-7786f3704bfc','8125d313-9444-43cc-8afd-39de222d602e','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5d8b1765-aa6c-4489-9247-b3388d926f32','8125d313-9444-43cc-8afd-39de222d602e','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7dded1dd-a971-45c0-b997-e322cc2e52af','8125d313-9444-43cc-8afd-39de222d602e','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('46a5295f-8abd-4590-b102-bea4f4c8a42b','8125d313-9444-43cc-8afd-39de222d602e','Waiver.',18) ON CONFLICT (id) DO NOTHING;

  -- Subject: Hiver Email Templates
  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('722b05a1-ee72-4435-8cf9-ad24429adaba','Hiver Email Templates','📚',admin_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('1f99afbb-1188-4193-88dc-7bea1eab5768','722b05a1-ee72-4435-8cf9-ad24429adaba','Normally we''re good with instructions but this page needs some work!',0) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('4d12fca9-6fd7-4b4f-b202-97e693562b65','722b05a1-ee72-4435-8cf9-ad24429adaba','We''ve been notified, just press the button below to go back to where you were.',1) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3a7e25fb-4103-4b65-a471-0b28a641be8c','722b05a1-ee72-4435-8cf9-ad24429adaba','Privacy Policy (Updated February 2022)',2) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('7f0668d0-82cf-4cf1-807a-80ff08f88539','722b05a1-ee72-4435-8cf9-ad24429adaba','Trainual Terms of Service Agreement (Updated August 2022)',3) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('43a0bb21-8372-4056-a104-8d5c8e07e1a4','722b05a1-ee72-4435-8cf9-ad24429adaba','Services and Right to Access.',4) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('3d2a2d32-56ca-4335-a2b6-e49a3f09521d','722b05a1-ee72-4435-8cf9-ad24429adaba','Term of Agreement and Renewal.',5) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('37ba8c2b-bac4-4efa-b619-05cb8ecb6be8','722b05a1-ee72-4435-8cf9-ad24429adaba','Termination.',6) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5b2f0f07-a07f-444b-8de0-23dc696a9063','722b05a1-ee72-4435-8cf9-ad24429adaba','Software Usage Rights and Restrictions; Service Levels.',7) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('5c5c5127-a006-4e7e-9c61-ccb8e1e82187','722b05a1-ee72-4435-8cf9-ad24429adaba','Payment Terms.',8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('c394813f-e5d6-45b5-9ca5-1b7d38d706e6','722b05a1-ee72-4435-8cf9-ad24429adaba','Affiliate Obligations; Use Restrictions.',9) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('734373a5-c2b5-4c75-8f62-da4cd5366c0e','722b05a1-ee72-4435-8cf9-ad24429adaba','Intellectual Property Rights and Data.',10) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('03aa7207-a94d-4289-8f9b-8693925c093f','722b05a1-ee72-4435-8cf9-ad24429adaba','Publicity.',11) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('6d49603a-bb54-4f8d-b368-1a2d8a96db16','722b05a1-ee72-4435-8cf9-ad24429adaba','Warranties and Liability.',12) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('2f80bc97-3c87-4416-a8fe-0151a36a8fe4','722b05a1-ee72-4435-8cf9-ad24429adaba','Indemnification.',13) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('6b6ac263-3334-459f-b281-ce4f6c21aa3d','722b05a1-ee72-4435-8cf9-ad24429adaba','Governing Law.',14) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('339d004c-8db2-4061-925e-53a6510a0649','722b05a1-ee72-4435-8cf9-ad24429adaba','Compliance with Laws and Control Disclaimer.',15) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('51c9a70c-fe69-426a-aa81-1a12ffb68056','722b05a1-ee72-4435-8cf9-ad24429adaba','Compliance with Economic Sanctions and Export Controls.',16) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('08c9a9f6-0891-4286-a205-c9785830192c','722b05a1-ee72-4435-8cf9-ad24429adaba','Entire Agreement and Amendments; Miscellaneous.',17) ON CONFLICT (id) DO NOTHING;
  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('8b7abe48-b8ac-44f7-b6b9-ea11d602b144','722b05a1-ee72-4435-8cf9-ad24429adaba','Waiver.',18) ON CONFLICT (id) DO NOTHING;

END $$;