-- Rev 14 identity authority. Additive: no historical report/template backfill.
CREATE TABLE qc.inspection_report_catalog (
 id UUID PRIMARY KEY,
 doc_code TEXT NOT NULL,
 normalized_doc_code TEXT NOT NULL UNIQUE,
 official_title TEXT NOT NULL CHECK (length(btrim(official_title)) > 0),
 normalized_search_title TEXT NOT NULL,
 master_revision TEXT NOT NULL,
 source_list_revision INTEGER NOT NULL CHECK (source_list_revision = 14),
 source_row_no INTEGER NOT NULL,
 source_sha256 TEXT NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
 catalog_state TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (catalog_state IN ('ACTIVE','SOURCE_CONFLICT','NEEDS_SOURCE_RESCAN','RETIRED')),
 source_document_status TEXT NOT NULL DEFAULT 'NOT_DIGITIZED' CHECK (source_document_status IN ('MATCHED','NOT_DIGITIZED','SOURCE_REVISION_CONFLICT','SOURCE_TITLE_CONFLICT','NEEDS_SOURCE_RESCAN')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE qc.inspection_report_source_evidence (
 id UUID PRIMARY KEY DEFAULT uuidv7(),
 catalog_id UUID REFERENCES qc.inspection_report_catalog(id) ON DELETE RESTRICT,
 doc_code TEXT,
 source_title TEXT,
 source_revision TEXT,
 source_file TEXT NOT NULL,
 source_page INTEGER,
 source_sha256 TEXT NOT NULL,
 content_sha256 TEXT NOT NULL,
 status TEXT NOT NULL CHECK (status IN ('MATCHED','SOURCE_REVISION_CONFLICT','SOURCE_TITLE_CONFLICT','NOT_IN_MASTER_LIST','NEEDS_SOURCE_RESCAN')),
 resolution_status TEXT NOT NULL DEFAULT 'UNRESOLVED',
 UNIQUE (source_sha256, content_sha256),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE qc.inspection_templates ADD COLUMN catalog_id UUID REFERENCES qc.inspection_report_catalog(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX uq_inspection_templates_catalog ON qc.inspection_templates(catalog_id) WHERE catalog_id IS NOT NULL;
ALTER TABLE qc.inspection_template_versions ADD COLUMN report_revision TEXT, ADD COLUMN digital_form JSONB, ADD COLUMN source_evidence_id UUID REFERENCES qc.inspection_report_source_evidence(id) ON DELETE RESTRICT;
ALTER TABLE qc.inspection_reports ADD COLUMN form_values JSONB;
-- New execution must resolve server-owned source/mapping facts within the INSERT transaction.
CREATE FUNCTION qc.enforce_controlled_inspection_origin() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r qc.receiving_items; v qc.inspection_template_versions; c qc.inspection_report_catalog;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended((SELECT item_code FROM qc.receiving_items WHERE id=NEW.receiving_item_id),0));
 SELECT * INTO r FROM qc.receiving_items WHERE id=NEW.receiving_item_id FOR UPDATE;
 SELECT * INTO v FROM qc.inspection_template_versions WHERE id=NEW.template_version_id FOR SHARE;
 SELECT c1.* INTO c FROM qc.inspection_report_catalog c1 JOIN qc.inspection_templates t ON t.catalog_id=c1.id WHERE t.id=v.template_id FOR SHARE OF c1;
 IF r.id IS NULL OR r.workflow_state NOT IN ('READY_FOR_INSPECTION','UNDER_INSPECTION') OR v.state IS DISTINCT FROM 'APPROVED' OR v.approved_at IS NULL
 OR c.id IS NULL OR c.catalog_state IS DISTINCT FROM 'ACTIVE' OR c.source_document_status IS DISTINCT FROM 'MATCHED'
 OR NOT EXISTS (SELECT 1 FROM qc.inspection_templates t WHERE t.id=v.template_id AND t.active=true)
 OR v.effective_at IS NULL OR v.effective_at>CURRENT_TIMESTAMP
 OR v.report_revision IS DISTINCT FROM c.master_revision OR v.digital_form IS NULL
 OR NOT EXISTS (SELECT 1 FROM qc.inspection_report_source_evidence e WHERE e.id=v.source_evidence_id AND e.catalog_id=c.id AND e.status='MATCHED')
 OR NOT EXISTS (SELECT 1 FROM qc.inspection_item_templates m WHERE m.template_id=v.template_id AND m.item_code=r.item_code AND m.state='ACTIVE' AND m.effective_from<=CURRENT_DATE AND (m.effective_to IS NULL OR m.effective_to>=CURRENT_DATE))
 OR EXISTS (SELECT 1 FROM qc.inspection_template_versions newer WHERE newer.template_id=v.template_id AND newer.state='APPROVED' AND newer.effective_at<=CURRENT_TIMESTAMP AND (newer.effective_at,newer.created_at,newer.id)>(v.effective_at,v.created_at,v.id))
 THEN RAISE EXCEPTION 'CONTROLLED_INSPECTION_SOURCE_REQUIRED' USING ERRCODE='23514'; END IF;
 IF EXISTS (SELECT 1 FROM qc.inspection_reports prior WHERE prior.receiving_item_id=r.id AND prior.state IN ('DRAFT','SUBMITTED','UNDER_REVIEW','PENDING_QCM_APPROVAL')) THEN RAISE EXCEPTION 'INSPECTION_ALREADY_IN_FLIGHT' USING ERRCODE='23505'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER controlled_inspection_origin BEFORE INSERT ON qc.inspection_reports FOR EACH ROW EXECUTE FUNCTION qc.enforce_controlled_inspection_origin();
CREATE FUNCTION qc.enforce_controlled_template_source() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c qc.inspection_report_catalog;
BEGIN
 IF TG_OP='UPDATE' AND (OLD.approved_at IS NOT NULL OR OLD.state='APPROVED') AND
 (NEW.id,NEW.template_id,NEW.digital_form,NEW.report_revision,NEW.source_evidence_id,NEW.name,NEW.content_hash,NEW.source_document,NEW.version_no) IS DISTINCT FROM
 (OLD.id,OLD.template_id,OLD.digital_form,OLD.report_revision,OLD.source_evidence_id,OLD.name,OLD.content_hash,OLD.source_document,OLD.version_no)
 THEN RAISE EXCEPTION 'APPROVED_TEMPLATE_IMMUTABLE' USING ERRCODE='23514'; END IF;
 IF NEW.state='APPROVED' AND (TG_OP='INSERT' OR OLD.state IS DISTINCT FROM NEW.state) THEN
 SELECT c1.* INTO c FROM qc.inspection_report_catalog c1 JOIN qc.inspection_templates t ON t.catalog_id=c1.id WHERE t.id=NEW.template_id FOR SHARE OF c1;
 IF c.id IS NULL OR c.catalog_state IS DISTINCT FROM 'ACTIVE' OR c.source_document_status IS DISTINCT FROM 'MATCHED' OR NEW.report_revision IS DISTINCT FROM c.master_revision OR NEW.name IS DISTINCT FROM c.official_title OR NEW.digital_form IS NULL OR NEW.content_hash IS NULL
 OR NEW.digital_form->>'docCode' IS DISTINCT FROM c.doc_code OR NEW.digital_form->>'reportRevision' IS DISTINCT FROM c.master_revision OR NEW.digital_form->>'schemaVersion' IS DISTINCT FROM '1'
 OR NOT EXISTS (SELECT 1 FROM qc.inspection_report_source_evidence e WHERE e.id=NEW.source_evidence_id AND e.catalog_id=c.id AND e.status='MATCHED')
 THEN RAISE EXCEPTION 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER controlled_template_source BEFORE INSERT OR UPDATE ON qc.inspection_template_versions FOR EACH ROW EXECUTE FUNCTION qc.enforce_controlled_template_source();

-- Frozen master source SHA-256: 199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4
INSERT INTO qc.inspection_report_catalog (id,doc_code,normalized_doc_code,official_title,normalized_search_title,master_revision,source_list_revision,source_row_no,source_sha256,catalog_state,source_document_status) VALUES
('fd711d47-be82-5e61-b0e1-4cd9f329fd1f','F-823-T1','F-823-T1','Inspection & Test Report for Raw Material','inspection & test report for raw material','2',14,7,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('ceca8849-ec84-5135-bbe4-17dd18a4b154','F-823-T2','F-823-T2','Inspection & Test Report for General Material','inspection & test report for general material','1',14,8,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d0a1e7a8-421a-56d1-949a-c8c6d0b8935a','F-823-T3','F-823-T3','Inspection & Test Report for Aluminum Strip','inspection & test report for aluminum strip','3',14,9,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('9e2587b1-b3da-5a8b-95c2-f7fe2446a480','F-823-T4','F-823-T4','Inspection & Test Report for Cartoon & Boxes','inspection & test report for cartoon & boxes','2',14,10,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('fe2bfdef-0545-5b7e-a966-c3fab21d77ff','F-823-T5','F-823-T5','Inspection & Test Report for Liquid Chemicals','inspection & test report for liquid chemicals','2',14,11,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','SOURCE_CONFLICT','SOURCE_TITLE_CONFLICT'),
('8240066c-ab3b-5b09-b3d0-a5576b4f1b5f','F-823-T6','F-823-T6','Inspection & Test Report for 3 Way Stopcock','inspection & test report for 3 way stopcock','3',14,12,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('b9e8f526-c001-54c7-818e-9357b6fdcd34','F-823-T7','F-823-T7','Inspection & Test Report for  Silicon Rubber Tube','inspection & test report for silicon rubber tube','1',14,13,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d2f06d16-a8c0-5ea0-8458-62afe0bbe1bb','F-823-T8','F-823-T8','Inspection & Test Report for Fistula Needle','inspection & test report for fistula needle','1',14,14,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('cd878ffe-f682-53dd-91a7-92364a4f112f','F-823-T9','F-823-T9','Inspection & Test Report for Oxygen Nassal Cannula','inspection & test report for oxygen nassal cannula','3',14,15,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('1063787b-db81-580f-a6cb-a481ffdb9b32','F-823-T10','F-823-T10','Inspection & Test Report for FEP Tube','inspection & test report for fep tube','2',14,16,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('cce28223-a72f-563e-b890-94c9df344db2','F-823-T11','F-823-T11','Inspection & Test Report for Needle (Fistula)','inspection & test report for needle (fistula)','1',14,17,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('f5e4fb62-4392-5c56-aee4-ca9f1c7da6f8','F-823-T12','F-823-T12','Inspection & Test Report for Breathing Circuit','inspection & test report for breathing circuit','2',14,18,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('f023f06e-0f9a-5dac-a61c-c37d42389156','F-823-T13','F-823-T13','Inspection & Test Report for CVP Manometer Kit','inspection & test report for cvp manometer kit','2',14,19,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('ccddc554-6193-590b-8a02-680fbf74ec68','F-823-T14','F-823-T14','Inspection & Test Report for Oxygen Mask','inspection & test report for oxygen mask','2',14,20,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e4636aa3-da7a-5180-84f0-0e50cb631ba2','F-823-T15','F-823-T15','Inspection & Test Report for Thoracic Catheter','inspection & test report for thoracic catheter','5',14,21,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e57a9846-bf6e-55e0-adae-592bd08690cd','F-823-T16','F-823-T16','Inspection & Test Report for Urine Bag','inspection & test report for urine bag','3',14,22,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('3f423576-e6f4-57ca-be0d-53a03849a596','F-823-T17','F-823-T17','Inspection & Test Report for Central Venous Catheter','inspection & test report for central venous catheter','5',14,23,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('7fe14afd-a546-5529-8548-4866466ea819','F-823-T18','F-823-T18','Inspection & Test Report for Wound Drainage','inspection & test report for wound drainage','2',14,24,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('dcb08991-43d4-559b-9453-a3be296dca89','F-823-T18-1','F-823-T18-1','Inspection & Test Report Reservoir for Wound Drainage Set ','inspection & test report reservoir for wound drainage set','0',14,25,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e3130335-c86f-5d0b-8a46-835125f28d3b','F-823-T19','F-823-T19','Inspection & Test Report for Aerosal Mask','inspection & test report for aerosal mask','1',14,26,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('9f0881b4-330a-5bc2-8ce5-6133f58ee159','F-823-T20','F-823-T20','Inspection & Test Report for Non Re-breathing Mask','inspection & test report for non re-breathing mask','1',14,27,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('61703ee8-5531-5ba9-ab0c-a8d4d0996209','F-823-T21','F-823-T21','Inspection & Test Report for Blood Transfusion Set Administration Burette ','inspection & test report for blood transfusion set administration burette','3',14,28,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('57af3977-bbeb-5fa8-b4ae-9a2b1bc8b590','F-823-T22','F-823-T22','Inspection & Test Report for Blood Line (Hemodialysis)','inspection & test report for blood line (hemodialysis)','1',14,29,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('51d46a12-25b9-5d93-ba27-b0e76594e7e6','F-823-T23','F-823-T23','Inspection & Test Report for Breathing Filter','inspection & test report for breathing filter','1',14,30,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('b75c2efa-5866-5a81-805f-ad351fa98128','F-823-T23-1','F-823-T23-1','Inspection & Test Report for Filter Materials (Breathing filter)','inspection & test report for filter materials (breathing filter)','0',14,31,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('92fe8a7e-9c50-5570-9d8b-ceb5cc31a4aa','F-823-T24','F-823-T24','Inspection & Test Report for Catheter Mount','inspection & test report for catheter mount','1',14,32,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('8128f800-f77e-5cf2-8b0b-639c65d67498','F-823-T25','F-823-T25','Inspection & Test Report for Circumcision Device','inspection & test report for circumcision device','2',14,33,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d8a3c9a9-c62c-5b07-84fe-f2f2c83a6769','F-823-T26','F-823-T26','Inspection & Test Report for Closed Suction Set','inspection & test report for closed suction set','3',14,34,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('2b215c8c-c9d6-5cd9-8743-3c1fbe694988','F-823-T27','F-823-T27','Inspection & Test Report for Umbilical Cord Clamp','inspection & test report for umbilical cord clamp','2',14,35,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('a34e5c3e-d48a-54c8-8dc0-96422b077ef9','F-823-T28','F-823-T28','Inspection & Test Report for Corrugated Drinage Sheet','inspection & test report for corrugated drinage sheet','1',14,36,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('74485874-d674-5d17-a8a4-ee931a6c4633','F-823-T29','F-823-T29','Inspection & Test Report for E.T.T Tube Holder','inspection & test report for e.t.t tube holder','1',14,37,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('4b75850d-b83d-5ab5-a44c-08b12ec37c38','F-823-T30','F-823-T30','Inspection & Test Report for Endotracheal Tube','inspection & test report for endotracheal tube','3',14,38,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','SOURCE_CONFLICT','SOURCE_REVISION_CONFLICT'),
('a2740639-8f86-57cb-88e2-cec88224006e','F-823-T31','F-823-T31','Inspection & Test Report for Extension Tube','inspection & test report for extension tube','2',14,39,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('805ec1a5-b1d2-5d39-9432-9a06125d0142','F-823-T32','F-823-T32','Inspection & Test Report for Eye Shield','inspection & test report for eye shield','1',14,40,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('8250abc2-d2d0-5a84-9763-9a7b0ca8276c','F-823-T33','F-823-T33','Inspection & Test Report for Feeding Tube','inspection & test report for feeding tube','2',14,41,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('29664aa1-dcb2-5ffd-924f-089c6b24a22b','F-823-T34','F-823-T34','Inspection & Test Report for Foley Catheter','inspection & test report for foley catheter','4',14,42,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('af17b2cf-7012-51a5-91ff-e1cebeac3030','F-823-T35','F-823-T35','Inspection & Test Report for Guedel Airway','inspection & test report for guedel airway','2',14,43,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('3a916fae-b8e1-51c0-81c1-a7a76bfa375f','F-823-T36','F-823-T36','Inspection & Test Report for Heparin Cap','inspection & test report for heparin cap','1',14,44,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('4fb560f6-41d5-58a0-9bc4-8784f4e3c106','F-823-T37','F-823-T37','Inspection & Test Report for Hypodermic Needle ','inspection & test report for hypodermic needle','2',14,45,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','SOURCE_CONFLICT','SOURCE_TITLE_CONFLICT'),
('2af8d1f9-adc7-5686-b564-cd4d041a9a75','F-823-T38','F-823-T38','Inspection & Test Report for Infusion Set','inspection & test report for infusion set','2',14,46,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('c63916a4-c834-5d93-adae-373a7602b408','F-823-T39','F-823-T39','Inspection & Test Report for Injection Sealing Cap','inspection & test report for injection sealing cap','1',14,47,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('9f70b057-5c47-53b3-af28-d197b2ed633f','F-823-T40','F-823-T40','Inspection & Test Report for Intubating Stylet','inspection & test report for intubating stylet','3',14,48,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d7cc8971-ed2f-5f15-998d-ecaa9418986b','F-823-T41','F-823-T41','Inspection & Test Report for I.V Burette Set','inspection & test report for i.v burette set','1',14,49,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('887436b7-c4b7-50cb-87b7-f63281780af2','F-823-T42','F-823-T42','Inspection & Test Report for I.V Cannula','inspection & test report for i.v cannula','3',14,50,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('fff83ff5-de35-5097-b187-4fd9ebc3e3f5','F-823-T43','F-823-T43','Inspection & Test Report for Larygeal Airway','inspection & test report for larygeal airway','2',14,51,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('2f5fcaf5-36b6-527d-b828-59ab41e6b6a7','F-823-T44','F-823-T44','Inspection & Test Report for Mucous Extractor','inspection & test report for mucous extractor','2',14,52,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('45b7210a-eb49-528a-984f-cce21fbfbdc0','F-823-T45','F-823-T45','Inspection & Test Report for Nasophryngeal Airway','inspection & test report for nasophryngeal airway','1',14,53,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('90382ec3-57e8-564d-9f60-88bc3160d5a7','F-823-T46','F-823-T46','Inspection & Test Report for Nebulizer Jar & Connector','inspection & test report for nebulizer jar & connector','1',14,54,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e9e2f8b1-c9ed-582e-9505-f7746559af3a','F-823-T47','F-823-T47','Inspection & Test Report for Needle (I.V Cannula)','inspection & test report for needle (i.v cannula)','4',14,55,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('a329aecc-7765-5b1b-a161-bc266a729c1c','F-823-T48','F-823-T48','Inspection & Test Report for Nelaton Catheter','inspection & test report for nelaton catheter','4',14,56,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('bd54d15b-663f-52c0-80d3-eca28bad92fd','F-823-T49','F-823-T49','Inspection & Test Report for Oxygen Catheter','inspection & test report for oxygen catheter','1',14,57,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('f16933f9-3093-5402-a6e3-a6ac520924f0','F-823-T50','F-823-T50','Inspection & Test Report for Packaging Film & Papper','inspection & test report for packaging film & papper','3',14,58,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','NEEDS_SOURCE_RESCAN','NEEDS_SOURCE_RESCAN'),
('b766b6a1-8172-5bd6-aa8e-c20bbc6283db','F-823-T51','F-823-T51','Inspection & Test Report for Rectal Tube','inspection & test report for rectal tube','1',14,59,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('9f1c1363-5164-5549-9867-2ebda761edd5','F-823-T52','F-823-T52','Inspection & Test Report for Redon Drain Tube','inspection & test report for redon drain tube','1',14,60,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('343857f5-f7d9-5b20-afbf-3b9280fd8990','F-823-T53','F-823-T53','Inspection & Test Report for Ryles Tube','inspection & test report for ryles tube','2',14,61,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('0d428645-de71-5265-bb62-3feea264085a','F-823-T54','F-823-T54','Inspection & Test Report for Saliva Ejecting Tube','inspection & test report for saliva ejecting tube','2',14,62,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('29ed3875-b380-5416-9966-cd3fafb618c3','F-823-T55','F-823-T55','Inspection & Test Report for Scalp Vein','inspection & test report for scalp vein','1',14,63,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('845ab38b-5dac-5baf-94b2-8fccd58304f0','F-823-T56','F-823-T56','Inspection & Test Report for Scalpel','inspection & test report for scalpel','1',14,64,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('fd66ef86-8a1e-560b-b534-b6ebfab2216f','F-823-T57','F-823-T57','Inspection & Test Report for Silicon Resuscitator','inspection & test report for silicon resuscitator','2',14,65,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('a87f6a40-2bdc-5ca1-a3e1-fff8902695a7','F-823-T58','F-823-T58','Inspection & Test Report for Spinal Needle','inspection & test report for spinal needle','5',14,66,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('248e2db7-b913-5481-acb9-9d23da9b58ef','F-823-T59','F-823-T59','Inspection & Test Report for Suction Catheter','inspection & test report for suction catheter','2',14,67,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('94505bd3-38e9-53e6-8abc-a6daf02da59e','F-823-T60','F-823-T60','Inspection & Test Report for Surgical Gown','inspection & test report for surgical gown','1',14,68,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d189f965-95c5-5d16-850f-f0763937fbe7','F-823-T61','F-823-T61','Inspection & Test Report for Syringes','inspection & test report for syringes','3',14,69,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('07f0c05c-cdee-512e-9e51-2fee8c6a9036','F-823-T61-1','F-823-T61-1','Inspection & Test Report for Control Syringe ','inspection & test report for control syringe','0',14,70,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('7c385656-f2d9-5f18-bc30-0c499aac64ab','F-823-T61-2','F-823-T61-2','Inspection & Test Report for Oral Medication Syringe ','inspection & test report for oral medication syringe','0',14,71,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('110e6896-e27c-58d8-91b5-bec4f4f9063c','F-823-T62','F-823-T62','Inspection & Test Report for T & Mouth Piece','inspection & test report for t & mouth piece','1',14,72,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('8f8c0a96-bbc8-5127-81f9-b4d96f81eea1','F-823-T63','F-823-T63','Inspection & Test Report for T Drainage Tube','inspection & test report for t drainage tube','1',14,73,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('02acd782-68b0-5a65-a348-d334dd164c2b','F-823-T64','F-823-T64','Inspection & Test Report for Nelaton Catheter Tiemann','inspection & test report for nelaton catheter tiemann','2',14,74,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('7c612251-04cc-5649-ae57-64ea666b3cee','F-823-T65','F-823-T65','Inspection & Test Report for Tracheostomy Tube','inspection & test report for tracheostomy tube','1',14,75,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('c20818e2-5edb-5319-be1a-497f06c1fc3e','F-823-T66','F-823-T66','Inspection & Test Report for Tracheostomy Mask','inspection & test report for tracheostomy mask','1',14,76,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('9c28191f-6c9a-5a3e-bb6a-d0cdffe9e9db','F-823-T67','F-823-T67','Inspection & Test Report for Blood Transfusion Set','inspection & test report for blood transfusion set','3',14,77,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('feefabbd-7011-5462-bf7e-2234ab67c8b3','F-823-T68','F-823-T68','Inspection & Test Report for Umbilical Catheter','inspection & test report for umbilical catheter','2',14,78,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('c0dc09b5-7e6c-5a64-b2b3-85aa4f66356d','F-823-T69','F-823-T69','Inspection & Test Report for Ureteric Catheter','inspection & test report for ureteric catheter','2',14,79,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('ba854f01-82fa-5539-a39f-d8f97fe32f37','F-823-T70','F-823-T70','Inspection & Test Report for Urine Collector Peadiatric','inspection & test report for urine collector peadiatric','1',14,80,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('a69720db-8589-561c-8b24-8537ebf248e2','F-823-T71','F-823-T71','Inspection & Test Report for Urine Leg Bag','inspection & test report for urine leg bag','1',14,81,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('7934460b-854b-5970-8bd2-f5070b58d226','F-823-T72','F-823-T72','Inspection & Test Report for Urine Meter','inspection & test report for urine meter','1',14,82,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e8e964e5-4dcb-5b6a-adb9-c375739d8cfe','F-823-T73','F-823-T73','Inspection & Test Report for Vaginal Speculum','inspection & test report for vaginal speculum','4',14,83,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('025b0b74-7c2d-5c9a-b290-23c6d178a06f','F-823-T74','F-823-T74','Inspection & Test Report for Venturi Mask','inspection & test report for venturi mask','2',14,84,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('1cec0a67-b02d-58bd-bbdc-6aea350f7c2d','F-823-T75','F-823-T75','Inspection & Test Report for Yankaur Handle','inspection & test report for yankaur handle','2',14,85,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('f16ddcec-5c5a-53a2-b577-f4aa101f6e34','F-823-T76','F-823-T76','Inspection & Test Report for Blood Line Parts','inspection & test report for blood line parts','1',14,86,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('140cb049-6e05-5ef3-80f5-19cb21fbc9b7','F-823-T77','F-823-T77','Inspection & Test Report for Embolectomy Catheter','inspection & test report for embolectomy catheter','1',14,87,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('505ef82f-209d-5552-941e-91e9306bb187','F-823-T78','F-823-T78','Inspection & Test Report for Silicon Hubless Drain','inspection & test report for silicon hubless drain','2',14,88,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('5d8af5ba-1c02-5f84-938b-bf671b54cd3a','F-823-T79','F-823-T79','Inspection & Test Report for Tablets Dispensing','inspection & test report for tablets dispensing','1',14,89,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('24545daa-3637-5e30-961f-6f06917ab82b','F-823-T80','F-823-T80','Inspection & Test Report for Micunium Aspirator','inspection & test report for micunium aspirator','1',14,90,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('2b0f56e1-0ada-50e9-9674-33aab2328c98','F-823-T81','F-823-T81','Inspection & Test Report for Swivel Connector','inspection & test report for swivel connector','1',14,91,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e09e1c1d-809e-52f4-9c58-71cf8469b61f','F-823-T82','F-823-T82','Inspection & Test Report for Pressure Monitoring Kit','inspection & test report for pressure monitoring kit','1',14,92,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('279721f1-db93-5ddf-92c5-15dd596055a3','F-823-T83','F-823-T83','Inspection & Test Report for Breathing Bag','inspection & test report for breathing bag','1',14,93,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','SOURCE_CONFLICT','SOURCE_REVISION_CONFLICT'),
('ef0a2c95-8dc2-5d69-9e02-acc810793605','F-823-T84','F-823-T84','Inspection & Test Report for MDI Adaptor','inspection & test report for mdi adaptor','1',14,94,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('3e69e1ac-0f97-50fd-a60f-b720b7a26ced','F-823-T85','F-823-T85','Inspection & Test Report for Suspensory Bandege','inspection & test report for suspensory bandege','1',14,95,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d71e153e-f274-5c35-b75e-4728392b5e57','F-823-T86','F-823-T86','Inspection & Test Report for Saturation Probe','inspection & test report for saturation probe','1',14,96,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('826b0971-8072-5cde-890d-8affc43ba6f3','F-823-T87','F-823-T87','Inspection & Test Report for Urine Bag Sheet','inspection & test report for urine bag sheet','1',14,97,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('7449e709-9c88-5689-b6d1-523816b22524','F-823-T88','F-823-T88','Inspection & Test Report for Bouji Catheter','inspection & test report for bouji catheter','2',14,98,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('585b4041-1309-535b-b8bb-10eace6bdd99','F-823-T89','F-823-T89','Inspection & Test Report for Epidural Set','inspection & test report for epidural set','4',14,99,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('f24e6817-12db-5e49-85a6-37ab1088b0fd','F-823-T89-1','F-823-T89-1','Inspection & Test Report for Flat Filter for Epidural set ','inspection & test report for flat filter for epidural set','0',14,100,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('51ecf626-1de8-5c5d-8c70-2fce81afcc76','F-823-T89-2','F-823-T89-2','Inspection & Test Report for Connector & Clamp Epidural Catheter ','inspection & test report for connector & clamp epidural catheter','0',14,101,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('65007016-2041-529b-b7f9-07dc634196c6','F-823-T90','F-823-T90','Inspection & Test Report for Genrel Products','inspection & test report for genrel products','2',14,102,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','SOURCE_CONFLICT','SOURCE_TITLE_CONFLICT'),
('111bd38b-68a6-551c-9134-0a86a168dd4a','F-823-T91','F-823-T91','Inspection & Test Report for Corrugated Tube','inspection & test report for corrugated tube','1',14,103,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('c20aec72-9225-5512-8d4c-b0ea7af5d355','F-823-T92','F-823-T92','Inspection & Test Report for Endotracheal Tube Tie','inspection & test report for endotracheal tube tie','1',14,104,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('0b9fbb39-2c75-5b87-9dc2-20428d6d0d6b','F-823-T93','F-823-T93','Inspection & Test Report for Penrose Drainage Tube','inspection & test report for penrose drainage tube','2',14,105,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('904d82d3-dd30-5f22-8831-35f68fa5455c','F-823-T94','F-823-T94','Inspection & Test Report for Polyurethane umbilical Cath.','inspection & test report for polyurethane umbilical cath.','3',14,106,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('30e629bb-b724-5887-ba74-412204e578f7','F-823-T95','F-823-T95','Inspection & Test Report for Feeding Tube Gastrostomy','inspection & test report for feeding tube gastrostomy','2',14,107,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('6d0f442b-e8ac-54dc-b747-368edf4d8b24','F-823-T96','F-823-T96','Inspection & Test Report for Guide Wire','inspection & test report for guide wire','1',14,108,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('bd4e1cf3-6144-563a-825d-036ca1abbdf3','F-823-T97','F-823-T97','Inspection & Test Report for ETT Tube Subglotic','inspection & test report for ett tube subglotic','2',14,109,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('12ce9e0e-004b-5158-bea6-06e28efbe6ee','F-823-T98','F-823-T98','Inspection & Test Report for Endobroncheal Tube','inspection & test report for endobroncheal tube','3',14,110,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('570c5437-ce40-5eb8-bf82-9af545d6d4d2','F-823-T99','F-823-T99','Inspection & Test Report for Feeding Tube W/Guide wire','inspection & test report for feeding tube w/guide wire','2',14,111,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('72ab2973-8432-57a9-8ac4-36f5470c9eaf','F-823-T100','F-823-T100','Inspection & Test Report for Heamodilysis Cath. Set','inspection & test report for heamodilysis cath. set','3',14,112,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('ccdb863d-f40c-546c-9a42-375df76e678a','F-823-T101','F-823-T101','Inspection & Test Report for Blood Filter','inspection & test report for blood filter','3',14,113,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e0cf30ce-753a-59cb-bfe8-97b47ad9a7e0','F-823-T102','F-823-T102','Inspection & Test Report for Needle Veress','inspection & test report for needle veress','3',14,114,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','SOURCE_CONFLICT','SOURCE_REVISION_CONFLICT'),
('c396d328-a3c4-5da8-b219-c282087e222f','F-823-T103','F-823-T103','Inspection & Test Report for Peritoneal Catheter Kit','inspection & test report for peritoneal catheter kit','2',14,115,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('79c4c8c5-8f23-510c-b2ed-2acb61d87474','F-823-T104','F-823-T104','Inspection & Test Report for Supra-Pubic Catheter Set','inspection & test report for supra-pubic catheter set','1',14,116,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('0a618e55-09aa-5ab4-9e1f-9b74a33e9941','F-823-T105','F-823-T105','Inspection & Test Report for High Pressure Syringe','inspection & test report for high pressure syringe','2',14,117,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('995bf911-ab00-5491-b787-9b47f78ef278','F-823-T106','F-823-T106','Inspection & Test Report for Air Pressure Bag','inspection & test report for air pressure bag','2',14,118,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('29fa96a3-d982-5661-b492-8a56e3a4b511','F-823-T107','F-823-T107','Inspection & Test Report forTouhy Needle ','inspection & test report fortouhy needle','3',14,119,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('a76c0a80-b281-53d8-9073-9d64f56a7084','F-823-T108','F-823-T108','Inspection & Test Report for Temperature Probe','inspection & test report for temperature probe','2',14,120,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('6e8be58d-e097-5f1e-a4a8-24b3b569f9f4','F-823-T109','F-823-T109','Inspection & Test Report for Urinary Catheterization Tray','inspection & test report for urinary catheterization tray','4',14,121,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('7d6d4610-65ec-51bd-b16c-b0b6b2df3757','F-823-T110','F-823-T110','Inspection & Test Report for Spring Type Guide Wire','inspection & test report for spring type guide wire','1',14,122,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d6ae4fbd-834c-55d8-9905-840b8460bfa3','F-823-T111','F-823-T111','Inspection & Test Report for Foot Print Ink (Black)','inspection & test report for foot print ink (black)','1',14,123,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('72251c13-7dd4-503d-aa1b-fab7711d30cd','F-823-T112','F-823-T112','Inspection & Test Report Cuff for Automatic BP Monitor','inspection & test report cuff for automatic bp monitor','2',14,124,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('99ec0d9b-fedb-5d10-ba49-13ef32cc87a5','F-823-T113','F-823-T113','Inspection & Test Report for Suction Liner and Canister ','inspection & test report for suction liner and canister','2',14,125,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('b25bb625-8037-5a5b-8777-6dbbdf7d4f1f','F-823-T114','F-823-T114','Inspection & Test Report for Skin Marker Pin ','inspection & test report for skin marker pin','1',14,126,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('01bfb10a-9d7d-520f-a1a5-e9dd512f4ed7','F-823-T115','F-823-T115','Inspection & Test Report for Foley Catheter Closed Urinary Drainage System ','inspection & test report for foley catheter closed urinary drainage system','1',14,127,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('edcb31a6-609f-574e-be0b-5e8b287d342e','F-823-T116','F-823-T116','Inspection and test report for Pessary  ','inspection and test report for pessary','0',14,128,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d641e5ce-edc3-5c85-a564-2e5ca618cb87','F-823-T117','F-823-T117','Inspection and test report for Surgical Instruments  ','inspection and test report for surgical instruments','2',14,129,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('450cc26f-f604-5c8b-8230-ecfc9048e586','F-823-T118','F-823-T118','Inspection and test report for Gallipot ','inspection and test report for gallipot','2',14,130,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('2820591d-4335-57c4-8aed-c105290fc05d','F-823-T119','F-823-T119','Inspection and test report for Measuring Tape ','inspection and test report for measuring tape','2',14,131,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('0ed8d921-9917-5a70-8aad-d6a05f269827','F-823-T120','F-823-T120','Inspection and test report for Blood Bag','inspection and test report for blood bag','0',14,132,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('7c92c66f-d992-5f1f-bd4c-d5b5328c007a','F-823-T121','F-823-T121','Inspection & Test Report for Paper Roll Carton & Box ','inspection & test report for paper roll carton & box','3',14,133,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('c1194fa6-cd2b-5582-b67c-f9868457c756','F-823-T122','F-823-T122','Inspection & Test Report for scale ','inspection & test report for scale','1',14,134,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('5b94c4d8-acf7-5c83-9eb7-8df7cc251f39','F-823-T123','F-823-T123','Inspection & Test Report for Humidification Chamber','inspection & test report for humidification chamber','0',14,135,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e3d8095e-dac6-52da-94fc-9f09023c46ea','F-823-T124','F-823-T124','Inspection & Test Report for Brething Exerciser (Respivol)','inspection & test report for brething exerciser (respivol)','1',14,136,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d1812248-a2cf-5311-a954-3f297cffe7f9','F-823-T125','F-823-T125','Inspection & Test Report for Endotracheal Tube Securing Device (Velco Type)','inspection & test report for endotracheal tube securing device (velco type)','0',14,137,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('388adb30-953f-5286-8343-d52a87829715','F-823-T126','F-823-T126','Inspection & Test Report for Endotracheal Tube Holder (Non-Adhesive Adjustable)','inspection & test report for endotracheal tube holder (non-adhesive adjustable)','0',14,138,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('5a4e1f70-ce83-5396-ac1c-e21af423352b','F-823-T127','F-823-T127','Inspection & Test Report for Tracheostomy Tie       ','inspection & test report for tracheostomy tie','0',14,139,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e7207541-fedc-5919-a209-3723c0b9c478','F-823-T128','F-823-T128','Inspection & Test Report for Stethoscope  ','inspection & test report for stethoscope','1',14,140,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('933a3f20-75ba-5e06-bc76-5190645d966e','F-823-T129','F-823-T129','Inspection & Test Report for Skin Stapler Remover ','inspection & test report for skin stapler remover','1',14,141,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('6d3f2062-9f50-50f6-893c-950b00b09150','F-823-T130','F-823-T130','Inspection & Test Report for Enteral Feeding Pump Set','inspection & test report for enteral feeding pump set','0',14,142,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('92650cee-0783-51d5-a8dc-85c46ca3921f','F-823-T131','F-823-T131','Inspection & Test Report for Medical Face Mask Raw Material','inspection & test report for medical face mask raw material','1',14,143,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('174fbe9d-2898-51a1-a5cc-6c41b1a73361','F-823-T133','F-823-T133','Inspection & Test Report for Pacifiers','inspection & test report for pacifiers','0',14,144,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('c80659e6-312b-58c1-8d16-532ae8ddf58e','F-823-T134','F-823-T134','Inspection & Test Report for IV Armboard ','inspection & test report for iv armboard','0',14,145,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('9894b6b7-8d12-5f16-a061-025f2d602533','F-823-T135','F-823-T135','Inspection & Test Report for Filter for Sodium Bicarbonate ','inspection & test report for filter for sodium bicarbonate','1',14,146,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('3b086c9d-1ea8-5adf-af82-3b07addc96eb','F-823-T136','F-823-T136','Inspection & Test Report for  Infusion Flow Regulator','inspection & test report for infusion flow regulator','1',14,147,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('01b48024-68eb-5cbc-93d9-7b3b6a1712ca','F-823-T137','F-823-T137','Inspection & Test Report for  Coaxial Needle ','inspection & test report for coaxial needle','1',14,148,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('3f2763b5-0193-54d8-899b-7790cbb73c3e','F-823-T138','F-823-T138','Inspection & Test Report for  Angiographic Dose Control Syringe','inspection & test report for angiographic dose control syringe','0',14,149,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('86f77961-4416-54ab-a96f-5413880ab4d5','F-823-T139','F-823-T139','Inspection & Test Report for Mini Button Gastrostomy Tube Kit','inspection & test report for mini button gastrostomy tube kit','0',14,150,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('5b84c4ed-e572-545c-aff2-8f33b29c8764','F-823-T140','F-823-T140','Inspection & Test Report for Endotracheal Tube Securing Device(Velcro Type)','inspection & test report for endotracheal tube securing device(velcro type)','0',14,151,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('335b568d-a2af-5e4d-a5a8-6f29fb8515a5','F-823-T141','F-823-T141','Inspection & Test Report for Uretheral Catheter ','inspection & test report for uretheral catheter','0',14,152,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('29d45511-efbe-5073-9a1e-c4e33cca883b','F-823-T142','F-823-T142','Inspection & Test Report for Male Female LL Connectors ','inspection & test report for male female ll connectors','1',14,153,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('f8882b2c-bd6d-5fbe-a468-623965cb57c7','F-823-T143','F-823-T143','Inspection & Test Report Adaptor for Blood Management  Needle Free Connector','inspection & test report adaptor for blood management needle free connector','1',14,154,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('23024d89-8b1f-59cd-9368-7981289b503c','F-823-T144','F-823-T144','Inspection & Test Report for Ear Muffs ','inspection & test report for ear muffs','0',14,155,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('8e56fccf-d06e-5810-ae30-80f00fd77d84','F-823-T145','F-823-T145','Inspection & Test Report for Applicator ','inspection & test report for applicator','0',14,156,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('33f61316-4950-5496-b6ad-bea1c32c54da','F-823-T146','F-823-T146','Inspection & Test Report for Enema kit ','inspection & test report for enema kit','0',14,157,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('edacfde5-640f-5889-8478-facd97cad939','F-823-T147','F-823-T147','Inspection & Test Report for Instruments cleaning Brushes ','inspection & test report for instruments cleaning brushes','0',14,158,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('945cf3b2-8c20-50b6-a01f-ebe2386492c9','F-823-T148','F-823-T148','Inspection & Test Report for Non Obsorbable silk Suture thread','inspection & test report for non obsorbable silk suture thread','0',14,159,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('c724b256-9fa7-5daf-b916-b0c13597a63c','F-823-T149','F-823-T149','Inspection & Test Report for SPO2 Sensors','inspection & test report for spo2 sensors','0',14,160,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e002bb8c-5a7e-5a12-b4df-60be68fd8b52','F-823-T150','F-823-T150','Inspection & Test Report for Urine Collector Neonate ','inspection & test report for urine collector neonate','0',14,161,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('de521bbf-e682-5531-a5e2-752208620093','F-823-T151','F-823-T151','Inspection & Test Report for Syringe Bulb','inspection & test report for syringe bulb','0',14,162,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('0b62d0bd-aa5f-5fa2-b027-b2b6c14a8433','F-823-T152','F-823-T152','Inspection & Test Report for PVC Manual Resuscitation Bag ','inspection & test report for pvc manual resuscitation bag','0',14,163,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('db270506-dfde-512e-853c-85fe6a5d1842','F-823-T153','F-823-T153','Inspection & Test Report for Multisample Needle for Vacutainer ','inspection & test report for multisample needle for vacutainer','0',14,164,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('dd527302-8bce-558c-ba7d-8fce332034f1','F-823-T154','F-823-T154','Inspection & Test Report for Anesthesia Face Mask ','inspection & test report for anesthesia face mask','0',14,165,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('933dbde3-f786-521e-ad4e-1b241870758e','F-823-T155','F-823-T155','Inspection & Test Report for Band for Hemorrhoid Rubber ','inspection & test report for band for hemorrhoid rubber','0',14,166,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e678a4ef-3fe5-5730-8a9d-508c68f94f17','F-823-T156','F-823-T156','Inspection & Test Report for Male Cot Catheter ','inspection & test report for male cot catheter','0',14,167,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('3fc32187-5685-5387-9117-6002380e13d4','F-823-T157','F-823-T157','Inspection & Test Report for Rubber Lace ','inspection & test report for rubber lace','0',14,168,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('566aa51e-d427-5782-a31d-255cf9d8261e','F-823-T158','F-823-T158','Inspection & Test Report for Pasteur Pipette ','inspection & test report for pasteur pipette','0',14,169,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('234be922-dfc5-5078-803c-384d2de64eb4','F-823-T159','F-823-T159','Inspection & Test Report for Pipette Tips ','inspection & test report for pipette tips','0',14,170,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('5cf226f7-5728-5599-b7f4-9419475df25b','F-823-T160','F-823-T160','Inspection & Test Report for Tourniquet ','inspection & test report for tourniquet','0',14,171,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('22eca855-5d95-53bf-95bf-b2d1676f146e','F-823-T161','F-823-T161','Inspection & Test Report for Tooth Brush ','inspection & test report for tooth brush','0',14,172,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('cdad87b4-4427-5607-8d01-b5bc848b3d87','F-823-T162','F-823-T162','Inspection & Test Report for Biopsy Needle ','inspection & test report for biopsy needle','1',14,173,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('f6f6b77b-318b-5dcd-81b9-37a3a26b354c','F-823-T163','F-823-T163','Inspection & Test Report for Positioning Aid ','inspection & test report for positioning aid','0',14,174,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('c6149723-08f7-511e-ba3b-c8daaa57a607','F-823-T164','F-823-T164','Inspection & Test Report for Connector Nipple ','inspection & test report for connector nipple','0',14,175,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d5644f0b-0b38-5797-b4a2-510669ad39fb','F-823-T165','F-823-T165','Inspection & Test Report for Laparoscopic Smoke Filter ','inspection & test report for laparoscopic smoke filter','0',14,176,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('7047cb48-7832-5027-9abd-d2c4b8f73a81','F-823-T166','F-823-T166','Inspection & Test Report for Strap Restraints ','inspection & test report for strap restraints','0',14,177,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e824dc86-31ea-5e64-a626-328dbda0f10a','F-823-T167','F-823-T167','Inspection & Test Report for Plastic Container Pans','inspection & test report for plastic container pans','0',14,178,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e729f380-a5de-5a20-b53c-29137aef91f7','F-823-T168','F-823-T168','Inspection & Test Report for Silicon Flat Perforated Drain Tube ','inspection & test report for silicon flat perforated drain tube','0',14,179,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('4204bbac-caac-5074-8191-23c081964420','F-823-T169','F-823-T169','Inspection & Test Report for Goggles Antifog Features ','inspection & test report for goggles antifog features','0',14,180,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('493b4c5b-0a62-50ae-8c4d-fc8b0b78d813','F-823-T170','F-823-T170','Inspection & Test Report for Leukocyte Filter','inspection & test report for leukocyte filter','0',14,181,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e68e2e13-f31b-5f3d-a7a5-bbb80e21048c','F-823-T171','F-823-T171','Inspection & Test Report for TPN Bags','inspection & test report for tpn bags','0',14,182,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('baf03dda-5767-5855-a459-751192c86fe4','F-823-T172','F-823-T172','Inspection & Test Report for Stainless Steel Trocar ','inspection & test report for stainless steel trocar','0',14,183,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('2aebde14-2938-5fda-9d18-b05965a5afbc','F-823-T173','F-823-T173','Inspection & Test Report for Vascular Dilator ','inspection & test report for vascular dilator','0',14,184,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d1c11cac-5c8d-5b8f-8088-0fbd2443c1ac','F-823-T174','F-823-T174','Inspection & Test Report For Electro surgical Instruments','inspection & test report for electro surgical instruments','0',14,185,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('de22b854-aec4-5797-96a0-352fee59c7c7','F-823-T176','F-823-T176','Inspection & Test Report For Arterial catheter','inspection & test report for arterial catheter','0',14,187,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('df43ffbc-3d0c-5dd0-92ff-8802b04e9fd1','F-823-T177','F-823-T177','Inspection & Test Report for Feeding Tube With Enfit Male Connector','inspection & test report for feeding tube with enfit male connector','0',14,188,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('547e1a6c-c8da-5b78-98e4-e7df3bf4e2c4','F-823-T178','F-823-T178','Inspection & Test Report for Ear Plug','inspection & test report for ear plug','0',14,189,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('a63394da-4e87-56ad-8373-ed5c7d4ae496','F-823-T179','F-823-T179','Inspection & Test Report for Plastic Cap Self Righting  Luer Tip ','inspection & test report for plastic cap self righting luer tip','0',14,190,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('a98dd25b-1ea0-5fff-a755-b13a8ee31619','F-823-T180','F-823-T180','Inspection & Test Report for Blood Collection Needles','inspection & test report for blood collection needles','0',14,191,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('c97fe5c7-9d3d-5222-bc42-db4f2892af5f','F-823-T181','F-823-T181','Inspection & Test Report for TPN Tube ','inspection & test report for tpn tube','0',14,192,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('7f32e7d6-0046-5122-87e7-37d1fc5fe7fa','F-823-T182','F-823-T182','Inspection & Test Report for Needle Counter','inspection & test report for needle counter','0',14,193,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d013b550-3815-5703-a269-493e1b9e1ad4','F-823-T183','F-823-T183','Inspection & Test Report for Irrigation Syringe','inspection & test report for irrigation syringe','0',14,194,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('4f2d68db-b63a-575a-9aee-2cca04318981','F-823-T184','F-823-T184','Inspection & Test Report for Plastic Bottle','inspection & test report for plastic bottle','0',14,195,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('43248706-1e05-5d75-9899-c42b44a80bae','F-823-T185','F-823-T185','Inspection & Test Report for Straight / Y-Connectors','inspection & test report for straight / y-connectors','0',14,196,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('e2edd0c7-26a6-5ea0-8627-ad5e4bb50fbe','F-823-T186','F-823-T186','Inspection & Test Report for White label','inspection & test report for white label','0',14,197,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('d7724a8c-66fa-57aa-ba65-cc317bc21542','F-823-T187','F-823-T187','Inspection & Test Report for Oral Care Set','inspection & test report for oral care set','0',14,198,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('596134ce-d36e-50ea-8415-a99e3d473563','F-823-T188','F-823-T188','Inspection & Test Report for Cup for Medicine','inspection & test report for cup for medicine','0',14,199,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('74cb60c0-d1ea-5269-9b14-a040d3b7ed0d','F-823-T189','F-823-T189','Inspection & Test Report for Feeding Bottle','inspection & test report for feeding bottle','0',14,200,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED'),
('4d7ef5e3-9d2e-5422-a5ca-41378be5dd5f','F-823-T190','F-823-T190','Inspection & Test Report for Mesh Nebulizer','inspection & test report for mesh nebulizer','0',14,201,'199f1a8c453e4340fdf3e0c79ba93c53510f35b4b2b5875f6ef8e55750f128e4','ACTIVE','NOT_DIGITIZED');

-- Master identity corrections require a reviewed forward migration, never an in-place rename.
CREATE FUNCTION qc.reject_inspection_catalog_identity_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'CONTROLLED_CATALOG_IDENTITY_IMMUTABLE' USING ERRCODE='23514'; END IF;
 IF (NEW.id,NEW.doc_code,NEW.normalized_doc_code,NEW.official_title,NEW.master_revision,NEW.source_list_revision,NEW.source_row_no,NEW.source_sha256) IS DISTINCT FROM
 (OLD.id,OLD.doc_code,OLD.normalized_doc_code,OLD.official_title,OLD.master_revision,OLD.source_list_revision,OLD.source_row_no,OLD.source_sha256)
 THEN RAISE EXCEPTION 'CONTROLLED_CATALOG_IDENTITY_IMMUTABLE' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER immutable_inspection_catalog_identity BEFORE UPDATE OR DELETE ON qc.inspection_report_catalog FOR EACH ROW EXECUTE FUNCTION qc.reject_inspection_catalog_identity_change();


CREATE TRIGGER inspection_source_evidence_append_only BEFORE UPDATE OR DELETE ON qc.inspection_report_source_evidence FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER inspection_source_evidence_no_truncate BEFORE TRUNCATE ON qc.inspection_report_source_evidence FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE FUNCTION qc.guard_approved_inspection_children() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE version_id UUID; parent qc.inspection_template_versions;
BEGIN
 IF TG_TABLE_NAME='inspection_template_sections' THEN
   IF TG_OP='DELETE' THEN version_id=OLD.template_version_id; ELSE version_id=NEW.template_version_id; END IF;
 ELSE
   IF TG_OP='DELETE' THEN SELECT template_version_id INTO version_id FROM qc.inspection_template_sections WHERE id=OLD.section_id;
   ELSE SELECT template_version_id INTO version_id FROM qc.inspection_template_sections WHERE id=NEW.section_id; END IF;
 END IF;
 SELECT * INTO parent FROM qc.inspection_template_versions WHERE id=version_id FOR SHARE;
 IF parent.approved_at IS NOT NULL OR parent.state IN ('APPROVED','STOPPED','SUPERSEDED') THEN RAISE EXCEPTION 'APPROVED_TEMPLATE_IMMUTABLE' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' THEN
  IF TG_TABLE_NAME='inspection_template_sections' THEN
   IF OLD.template_version_id IS DISTINCT FROM NEW.template_version_id THEN RAISE EXCEPTION 'TEMPLATE_CHILD_REPARENT_DENIED' USING ERRCODE='23514'; END IF;
  ELSE
   IF OLD.section_id IS DISTINCT FROM NEW.section_id THEN RAISE EXCEPTION 'TEMPLATE_CHILD_REPARENT_DENIED' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER approved_inspection_sections_immutable BEFORE INSERT OR UPDATE OR DELETE ON qc.inspection_template_sections FOR EACH ROW EXECUTE FUNCTION qc.guard_approved_inspection_children();
CREATE TRIGGER approved_inspection_points_immutable BEFORE INSERT OR UPDATE OR DELETE ON qc.inspection_template_points FOR EACH ROW EXECUTE FUNCTION qc.guard_approved_inspection_children();

CREATE FUNCTION qc.guard_completed_inspection_form() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.state<>'DRAFT' AND NEW.form_values IS DISTINCT FROM OLD.form_values THEN RAISE EXCEPTION 'COMPLETED_INSPECTION_FORM_IMMUTABLE' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER completed_inspection_form_immutable BEFORE UPDATE ON qc.inspection_reports FOR EACH ROW EXECUTE FUNCTION qc.guard_completed_inspection_form();
