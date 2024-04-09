window.globalSummaries = {};

(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        console.log("pt: ", pt)
        var patientId = patient.id
        console.log("Storing information!")

        createTextMessageObservation(smart, patientId, 'Testing sample message')

        console.log("Done storing information")
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4',
                              'http://loinc.org|18842-5', 'http://loinc.org|18748-4',
                              'http://loinc.org|28655-9', 'http://loinc.org|11506-3 ',
                              'http://loinc.org|28570-0 ', 'http://loinc.org|75490-3 ',
                             ]
                      }
                    }
                  });

        $.when(pt, obv).fail(onError);
        
        $.when(pt, obv).done(function(patient, obv) {
          console.log("patient2", patient)
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';
          
          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }
          var Discharge_summary = byCodes('18842-5');
          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          console.log("Discharge_summary!:", Discharge_summary)
          console.log("height:", getQuantityValueAndUnit(height[0]))
          console.log("description:", byCodes('18748-4'), byCodes('28655-9'))

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);
          p.Discharge_summary = Discharge_summary;

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
          ret.resolve(p);

          // Call the Llama2 model and display the result
          query_model(fname);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      Discharge_summary: {value: ''}
    };
  }

  // Queries Llama2 model with input data.
  async function query_model(patientName) {

    var globalSummaries = JSON.parse(sessionStorage.getItem('globalSummaries')) || {};

    // Check if the summary for the given patient name already exists
    if (globalSummaries.hasOwnProperty(patientName)) {
      console.log('Returning saved summary for:', patientName, "summary is",globalSummaries[patientName] );
      displaySummary([{generated_text: globalSummaries[patientName]}]);
      return; 
    }

    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer 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");
    myHeaders.append("Content-Type", "application/json");


    if(patientName == "NANCY"){
      var raw = JSON.stringify({ "inputs": "<s>[INST] <<SYS>> You are a physician assistant, please summarize these patient progress notes into a one paragraph summary that explains the most important information about this patient's stay. <</SYS>> Patient 10 GIM Progress Note  14JAN2024 10:21       Hospital Progress To see this patient by her nurse because the patient was wanting to leave the hospital. The patient is 69 year old female admitted with confusion concerning for new diagnosis of neurodegenerative condition, seen by neurology and MRI brain is pending. The patient wants to have a shower. She says she showers usually twice a day and cannot have a shower here which is why she wants to go home. She is vaguely aware that she may have Alzheimer's disease and knows that she is in some sort of care facility but cannot tell me that she is in the hospital. I told her that we are waiting for an MRI, and she is agreeable with this plan. Findings/Investigations:  Last Charted Vitals & Measurements (Last 24 Hrs):  T: 36.5  DegC (Oral)  TMIN: 36.5  DegC (Oral)  TMAX: 37.1  DegC (Oral)  HR: 80(Peripheral)  RR: 18  BP: 133/72  SpO2: 98%   Patient looks well comfortable, walking around independently. She is not oriented to place. Selected Lab Results (Last 24 Hrs)  Additional Pertinent Results  Selected Notes & Imaging Results  Current Issues, Assessment and Plan  Ordered:  QUEtiapine, 12.5 mg, Tab, PO, q12h, PRN for Agitation, Start date 01/14/24 10:18:00 EST Unfortunately, we cannot shower the patient here on the ward However, she is currently redirectable.  Continue to try to redirect her.  Can try to offer a sponge bath Quetiapine as needed      GIM Progress Note  13JAN2024 08:20       Hospital Progress  Patient was seen.  RN was briefly at bedside  She is wondering into her neighbors room, but again redirectable  Repeat LFTs have improved.  Ammonia level only 16 which does not necessarily always correlate anyway and I doubt this is hepatic encephalopathy based on behavior.  Vitamin B12 197.  Increasingly, clinical picture seems to point to cognitive impairment rather than delirium.  Geriatrics consultation pending, along with multidisciplinary team assessment.  Will try to contact family for additional information and have put in social work consultation as well in anticipation of potential barriers to discharge Findings/Investigations  Last Charted Vitals & Measurements (Last 24 Hrs)  T: 36.5  DegC (Oral)  TMIN: 36.5  DegC (Oral)  TMAX: 37.1  DegC (Oral)  HR: 80(Peripheral)  RR: 18  BP: 133/72  SpO2: 98%   Selected Lab Results (Last 24 Hrs)  Additional Pertinent Results  Selected Notes & Imaging Results  Current Issues, Assessment and Plan       GIM Progress Note  15JAN2024 20:46       Hospital Progress  I spoke with patient's family at bedside, including daughter and other family members.  Unfortunately, patient was insistent on leaving hospital.  Fortunately, she remains redirectable.  I suspect once again this is due to underlying dementia/cognitive decline rather than delirium.  MRI head currently pending.  Geriatrics consult also pending with respect to possible underlying dementia/BPSD.  Geriatrics suspects Alzheimer's dementia.  Wandering is a concern.  I see they have seen patient by the time of this dictation, I refer to the most detailed note for information and thankful for their input.  Likely outpatient followup geriatrics memory clinic.  Form 1 has expired.  Daughter clearly expressed concern patient is not able to return home due to not being able to care for herself.  Patient might require form 3.  Charge nurse has left message for psychiatry to reassess.  From geriatrics note, there are concerns of paranoia as well.  Although patient lives with family, they do work and therefore patient might be left alone and is not safe for discharge.  I have ordered a sitter and repeat psychiatry assessment to determine form 3 eligibility.  Patient was seen by Dr. FAKEDOCTOR last week.  Findings/Investigations  Last Charted Vitals & Measurements (Last 24 Hrs)  T: 37  DegC (Oral)  TMIN: 36.5  DegC (Oral)  TMAX: 37.1  DegC (Oral)  HR: 79(Peripheral)  BP: 145/84  SpO2: 97%   Selected Lab Results (Last 24 Hrs)  Chemistry Albumin: 39 G/L (01/15/24 12:07:00) Calcium: 2.52 mmol/L (01/15/24 12:07:00) Cardiac/Endocrine HBA1C: 0.066 High (01/15/24 12:07:00) Additional Pertinent Results  INTERPRETATION:   No acute findings.   Hepatic steatosis.   [1] Selected Notes & Imaging Results  Current Issues, Assessment and Plan  Ordered:  Consult to Psychiatry OT Follow Up Sitter    GIM Progress Note  16JAN2024 20:13       Hospital Progress  Spoke with psychiatry: I fill out form 1 today.  Psychiatry will assess and most likely fill out form 3 most likely after discussion with Dr. FAKEDOCTOR.  No family at bedside.  However, daughter was updated today before.   Today, when I saw her she was directable, and said that she was enjoying her burger at bedside.  She says she did not get from hospital and someone caught it for her.    MRI has been done, see below.  Seen by geriatrics: Delirium seems resolving, patient closer to baseline.  Concern re Alzheimer's dementia, constipation.  Disposition remains a challenge and might require Twaddle Grace Hospital home monitoring program for falls detection and GPS tracking.  Psychiatry will be involved as well.  Currently has been placed on form 3.  Based on extensive workup, 1 suspect that she might be close to her baseline with respect to dementia.  Therefore, main barrier to discharge might potentially be a social one  when services could be in place will need to address home needs if children are working during the day and she might be at risk for wandering and is alone. Findings/Investigations  Last Charted Vitals & Measurements (Last 24 Hrs)  T: 36.9  DegC (Oral)  TMIN: 36.9  DegC (Oral)  TMAX: 37.4  DegC (Oral)  HR: 69(Peripheral)  RR: 18  BP: 126/73  SpO2: 98%   Selected Lab Results (Last 24 Hrs)  Additional Pertinent Results  Selected Notes & Imaging Results  MRI BRAIN   INDICATION: 69yearold female, cognitive impairment NYD.     COMPARISON: Head CT January 11, 2024 and prior imaging.   TECHNIQUE: Multiplanar multisequence MRI through the brain without gadolinium.  3D T1 sequences with MPR was performed as per dementia protocol.   FINDINGS:   ATROPHY:    Global cortical Atrophy Scale: 2   0: Normal volume  1: Opening of sulci  2: Volume loss of gyri  3: 'Knife blade' atrophy    Medial Temporal lobe Atrophy Score (Schelten's scale) Left: 1                Right: 1   0: No atrophy  1: Only widening of choroid fissure  2: Also widening of temporal horn of lateral ventricle  3: Moderate loss of hippocampal volume (decrease in height)  4: Severe volume loss of hippocampus    < 75 years: score 2 or more is abnormal.  > 75 years: score 3 or more is abnormal    Other focal atrophy: None   VASCULAR DISEASE:   Infarcts: No restriction effusion to suggest acute or subacute infarcts.   Microbleeds: No susceptibility artifact to suggest intracranial hemorrhage.   Fazekas scale for white matter lesions: 2 0: Absent  1: Punctate foci  2: Beginning confluence  3: Large confluent areas    OTHER: Mild circumferential mucosal thickening throughout the paranasal sinuses.   CONCLUSION:   No definite acute findings.   Mild generalized parenchymal atrophy.   [1] Current Issues, Assessment and Plan  [1] MRI Head Dementia; 01/16/2024 10:28 EST      GIM Progress Note  17JAN2024 16:57       Hospital Progress  I have updated patient's daughter over the telephone and questions answered.  Essentially, psychiatry has placed patient on form 3; sitter ordered; geriatrics noted that delirium is resolving.  We may well be witnessing patient's new baseline.  Therefore, discussed with family with respect to disposition.  Assuming patient is now in her new baseline, question is disposition and I encouraged daughter to speak with each other to discuss what options they could come up with and will liaise with social work.  Extensive metabolic workup otherwise is negative.  As patient is ambulating, will discontinue fragmin prophylaxis.  Reseen by geriatrics:  Patient does not seem to be delirious anymore She has declined cognitive testing in hospital, but there is clear cognitive impairment secondary to dementia  Sertraline now started at 25 mg, to be increased to 50 mg after 1 week if tolerated to help with paranoia/agitation, which the patient was experiencing at times at home  Primary concern at present is disposition; team is hoping for discharge home with daughter, but some safety mechanisms will need to be in place (home monitoring, kitchen safety, etc.). Will plan to follow patient into next week as team figures at disposition.  Depending on where she is going, patient may be a candidate for our memory clinic as an outpt  Still awaiting records from Sunnybrook, will request again  (I do not see notes from SBK on chart yet.) Findings/Investigations  Last Charted Vitals & Measurements (Last 24 Hrs)  T: 36.5  DegC (Oral)  TMIN: 36.5  DegC (Oral)  TMAX: 37.1  DegC (Oral)  HR: 71(Peripheral)  RR: 18  BP: 133/80  SpO2: 99%   Selected Lab Results (Last 24 Hrs)  Additional Pertinent Results  Selected Notes & Imaging Results  Current Issues, Assessment and Plan  Ordered:  Consult to Recreation Therapy      GIM Progress Note  17JAN2024 16:57       As such, may possibly be ALC soon if no further geri/psych intervention. Increase sertraline to 50 mg after 1 week. As patient remains redirectable does not seem to require additional anitpsychotics at present.      GIM Progress Note  18JAN2024 08:10       Hospital Progress  Liaise with social worker: Patient family is down to prepare her for going home with safety equipment Reseen by psychiatry: On form 3, not appropriate for voluntary or informal patient at present.  No significant agitation.  I refer to the note for information.  When I saw her early in the morning she continues to wander around but again redirectable  Plan: ALC status Liaised with social work Plan is for discharge once supports can be in place Findings/Investigations  Last Charted Vitals & Measurements (Last 24 Hrs)  T: 36.7  DegC (Oral)  TMIN: 36.7  DegC (Oral)  TMAX: 36.8  DegC (Oral)  HR: 85(Peripheral)  RR: 16  BP: 149/72  SpO2: 98%   Selected Lab Results (Last 24 Hrs)  Additional Pertinent Results  Selected Notes & Imaging Results  Current Issues, Assessment and Plan  Ordered:  Alternate Level of Care Vital Signs Weight      GIM Progress Note  19JAN2024 15:11       Hospital Progress  Patient continues to be directable, wandering on the floor.  There is a sitter with her I saw her in the afternoon of January 19.  Form 3 remains in place.  I have also completed a longterm care form for patient this afternoon.  Social work is aware.  ALC is currently in place. Findings/Investigations  Last Charted Vitals & Measurements (Last 24 Hrs)  T: 36.2  DegC (Oral)  TMIN: 36.2  DegC (Oral)  TMAX: 36.7  DegC (Oral)  HR: 62(Peripheral)  RR: 18  BP: 122/64  SpO2: 97%   Selected Lab Results (Last 24 Hrs)  Additional Pertinent Results  Selected Notes & Imaging Results  Current Issues, Assessment and Plan  Ordered:  Alternate Level of Care Communication Order      GIM Progress Note  20JAN2024 02:00       Hospital Progress  I came to see patient after my emergency room shift.  It was around 2 AM in the morning.  Patient is comfortable, sleeping.  No RN concerns.  Not wandering at nighttime.  I do not specifically with her out.  Reviewed her medications and they seem appropriate.  Blood pressure remains wellcontrolled.  Diabetes also satisfactorily controlled.  Patient remains on sertraline 25 mg daily.  There is a note from geriatrics on gender 17 saying that dosage may be increased to 50 mg after about 1 week's time to see if this may further help with paranoia and agitation if she tolerates 25 mg in hospital. Findings/Investigations  Last Charted Vitals & Measurements (Last 24 Hrs)  T: 36.6  DegC (Oral)  HR: 71(Peripheral)  RR: 20  BP: 132/81  SpO2: 99%   Additional Pertinent Results  Selected Notes & Imaging Results  Current Issues, Assessment and Plan. [/INST]<s>", "parameters": { "max_new_tokens": 500 } });
    }else{
      var raw = JSON.stringify({ "inputs": "<s>[INST] <<SYS>> You are a physician assistant, please summarize these patient progress notes into a one paragraph summary that explains the most important information about this patient's stay. <</SYS>>    Patient 3      GIM Progress Note  18JAN2024 19:20       Hospital Progress  42yearold male with history of morbid obesity, OSA, hypertension, psoriasis, currently not on treatment, presented with shortness of breath and decreased level of consciousness and hypercapnic respiratory failure initially admitted to the ICU, treated for communityacquired pneumonia with ceftriaxone and azithromycin from December 13 to 19.  December 23 he had bilateral PEs diagnosed.  He was started on anticoagulation.  On January 1 he had a tracheostomy.  While in the ICU he also had coag negative staph bacteremia that was persistent.  All his lines were changed and he was given 7 days of antibiotics.  He was decannulated on January 16.  He was transferred to the medical floor on January 17.  He also had distal lower extremity weakness, seen by neurology.  CT lumbar spineShowed no significant fracture or destructive osseous change.  Patient feels fine his main complaint is that he feels hot Findings/Investigations  Last Charted Vitals & Measurements (Last 24 Hrs)  T: 37  DegC (Axillary)  TMIN: 36.4  DegC (Oral)  TMAX: 37.3  DegC (Oral)  HR: 109(Peripheral)  RR: 21  BP: 117/75  SpO2: 94%   Unable to assess his JVD due to body habitus Heart rhythm is regular without murmurs Lung sounds are difficult to appreciate due to body habitus He does not have any pitting edema in the lower limbs He is unable to dorsiflex or plantarflex his foot.  Knee extension is 3 out of 5 on the right and barely 3 out of 5 on the left.Patient says this is improved compared to prior Sensation was normal as per patient Selected Lab Results (Last 24 Hrs)  Haematology HGB: 141 g/L (01/18/24 07:44:00) LKC: 8.5 10E9/L (01/18/24 07:44:00) Platelets: 222 10E9/L (01/18/24 07:44:00) Chemistry Glucose Random: 7.3 mmol/L (01/18/24 07:44:00) Creatinine: 34 UMOL/L Low (01/18/24 07:44:00) Albumin: 37 G/L (01/18/24 07:44:00) Calcium: 2.48 mmol/L (01/18/24 07:44:00) Magnesium: 0.85 mmol/L (01/18/24 07:44:00) Phosphate: 1.25 mmol/L (01/18/24 07:44:00) Sodium: 139 mmol/L (01/18/24 07:44:00) Potassium: 3.7 mmol/L (01/18/24 07:44:00) Chloride: 90 mmol/L Low (01/18/24 07:44:00) Total CO2: 37 mmol/L High (01/18/24 07:44:00) Anion Gap: 12 mmol/L (01/18/24 07:44:00) Additional Pertinent Results  Selected Notes & Imaging Results  Current Issues, Assessment and Plan  Ordered:  ALP ALT Communication Order Dietitian Follow Up Assessment Pharmacist Patient Flag Alert Total Bilirubin TSH US Doppler Arterial Leg Left Vitamin B12 Level Mr. FAKELASTis a 42yearold male with history of morbid obesity, OSA, hypertension, psoriasis, currently not on treatment, presented with shortness of breath and decreased level of consciousness and hypercapnic respiratory failure initially admitted to the ICU, treated for communityacquired pneumonia with ceftriaxone and azithromycin from December 13 to 19.  December 23 he had bilateral PEs diagnosed.  He was started on anticoagulation.  On January 1 he had a tracheostomy.  While in the ICU he also had coag negative staph bacteremia that was persistent.  All his lines were changed and he was given 7 days of antibiotics.  He was decannulated on January 16.  He was transferred to the medical floor on January 17.  He also had distal lower extremity weakness, seen by neurology.  CT lumbar spineShowed no significant fracture or destructive osseous change.   Hypercapnic respiratory failure Encourage use of CPAP  Pulmonary emboli Continue therapeutic dalteparin  Lower extremity distal weakness likely critical illness neuropathy Reexamine tomorrow, and may need to call neurology back if it is consistently worse  Left foot pressure injury Check ultrasound arterial Dopplers of the left lower extremity Ask for heel protector for the left foot  DVT prophylaxis: On dalteparin Diet: On NG tube feeds plus puréed diet CODE STATUS: Full Disposition: Pending improvement      GIM Progress Note  19JAN2024 23:03       Hospital Progress  Patient feels well Does not want to use CPAP because of claustrophobia Breathing is good Findings/Investigations  Last Charted Vitals & Measurements (Last 24 Hrs)  T: 36.4  DegC (Oral)  TMIN: 36.3  DegC (Oral)  TMAX: 36.8  DegC (Oral)  HR: 108(Peripheral)  RR: 20  BP: 127/78  SpO2: 92%   Respirations are comfortable.  He is quite awake No asterixis No confusion Abdomen is soft nontender Sensation is normal in the lower extremities Dorsiflexion plantarflexion is 0 out of 5 bilaterally. Hip flexion is 4 out of 5 bilaterally Knee extension is 4 out of 5 bilaterally Selected Lab Results (Last 24 Hrs)  Haematology HGB: 135 g/L (01/19/24 07:01:00) LKC: 9.6 10E9/L (01/19/24 07:01:00) Platelets: 265 10E9/L (01/19/24 07:01:00) Chemistry Creatinine: 36 UMOL/L Low (01/19/24 07:01:00) Sodium: 137 mmol/L (01/19/24 07:01:00) Potassium: 3.7 mmol/L (01/19/24 07:01:00) Chloride: 89 mmol/L Low (01/19/24 07:01:00) Total CO2: 36 mmol/L High (01/19/24 07:01:00) Anion Gap: 12 mmol/L (01/19/24 07:01:00) Cardiac/Endocrine TSH: 4.5 MU/L High (01/19/24 07:01:00) Liver Function Total Bilirubin: 15 UMOL/L (01/19/24 07:01:00) ALP: 93 U/L (01/19/24 07:01:00) ALT: 18 U/L (01/19/24 07:01:00) Other Labs B12: 247 PMOL/L (01/19/24 07:01:00) Additional Pertinent Results  Selected Notes & Imaging Results  Current Issues, Assessment and Plan  Ordered:  PT Follow Up Weekend Mr. FAKELASTis a 42yearold male with history of morbid obesity, OSA, hypertension, psoriasis, currently not on treatment, presented with shortness of breath and decreased level of consciousness and hypercapnic respiratory failure initially admitted to the ICU, treated for communityacquired pneumonia with ceftriaxone and azithromycin from December 13 to 19.  December 23 he had bilateral PEs diagnosed.  He was started on anticoagulation.  On January 1 he had a tracheostomy.  While in the ICU he also had coag negative staph bacteremia that was persistent.  All his lines were changed and he was given 7 days of antibiotics.  He was decannulated on January 16.  He was transferred to the medical floor on January 17.  He also had distal lower extremity weakness, seen by neurology.  CT lumbar spineShowed no significant fracture or destructive osseous change.   Hypercapnic respiratory failure Encourage use of CPAP  Pulmonary emboli Continue therapeutic dalteparin  Lower extremity distal weakness likely critical illness neuropathy Appears stable.  Can consider consulting Dr. FAKEDOCTOR when he is on for EMG nerve conduction nerve conduction studies  Left foot pressure injury Check ultrasound arterial Dopplers of the left lower extremity Ask for heel protector for the left foot  DVT prophylaxis: On dalteparin Diet: On NG tube feeds plus puréed diet CODE STATUS: Full Disposition: Pending improvement PT involved.    [INST]<s>", "parameters": { "max_new_tokens": 500 } });
    }


    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    fetch("https://k3lo5s5wk8w2ozm9.us-east-1.aws.endpoints.huggingface.cloud", requestOptions)
      .then(response => response.json())
      .then(result => {
        displaySummary(result);
        console.log(result);
      })
      .catch(error => console.log('error', error));
  }

  function displaySummary(result) {
    const generatedText = result[0].generated_text;
    document.getElementById('summary').innerHTML = generatedText;
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

function createTextMessageObservation(smart, patientId, textMessage) {
  var observation = {
      resourceType: 'Observation',
      status: 'final',
      code: {
          coding: [
              {
                  system: "http://loinc.org",
                  code: "8302-2",
                  display: "Discharge summary"
              }
          ]
      },

      valueString: textMessage
  };

  return smart.patient.api.fetchAll({
      url: 'Observation',
      method: 'POST',
      headers: {
          'Content-Type': 'application/fhir+json'
      },
      body: JSON.stringify(observation)
  });
}
})(window);

