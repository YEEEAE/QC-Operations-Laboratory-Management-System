// Audit-only in-memory adversarial probes. No fs, network or DB imports.
import { xlsxBytes } from '../../../src/modules/reporting/infrastructure/xlsx-exporter.ts';
import { setTelemetryProviders, resetTelemetryProviders, withSpan } from '../../../src/shared/observability/telemetry.ts';
import { createSignatureEvidence } from '../../../src/modules/e-signatures/domain/signature-evidence.ts';
const results=[];
const bytes=xlsxBytes([],[]), end=bytes.length-22;
let cursor=bytes.readUInt32LE(end+16), actual=0;
while(cursor<end && bytes.readUInt32LE(cursor)===0x02014b50){actual++;cursor+=46+bytes.readUInt16LE(cursor+28)+bytes.readUInt16LE(cursor+30)+bytes.readUInt16LE(cursor+32);}
results.push({id:'XLSX',at:new Date().toISOString(),declared:bytes.readUInt16LE(end+10),actual,behavior:actual===bytes.readUInt16LE(end+10)?'PASS':'FAIL'});
let completed=false;
setTelemetryProviders({startSpan(){return {traceId:'a',spanId:'b',setAttribute(){throw Error('audit_attribute_failure')},recordException(){},end(){}}}});
try{await withSpan('audit',async()=>{completed=true;return 7});results.push({id:'TELEMETRY',behavior:'PASS',completed});}
catch(error){results.push({id:'TELEMETRY',at:new Date().toISOString(),behavior:'FAIL',completed,error:error.message});}
finally{resetTelemetryProviders();}
const evidence=createSignatureEvidence({actorId:'synthetic-audit',subjectType:'LAB_TEST',subjectId:'synthetic-test',subjectVersion:1n,action:'FINAL_APPROVE',meaning:'FINAL_APPROVE',signedAt:new Date(),snapshotHash:'not-a-content-digest',reauthMethod:'PASSWORD',requestId:'synthetic-request'});
results.push({id:'SIGNATURE-NON-DIGEST',at:new Date().toISOString(),acceptedNonDigest:evidence.snapshotHash==='not-a-content-digest',behavior:'FAIL',limit:'Domain validation probe only; no authenticated exploit or persisted signature.'});
console.log(JSON.stringify({node:process.version,DB_connections:0,results},null,2));
