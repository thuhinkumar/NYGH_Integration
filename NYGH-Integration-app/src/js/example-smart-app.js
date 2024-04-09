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

    if (window.globalSummaries && window.globalSummaries.hasOwnProperty(patientName)) {
      console.log('Returning saved summary for:', patientName);
      displaySummary({generated_text: window.globalSummaries[patientName]});
      return; 
    }

    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer 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");
    myHeaders.append("Content-Type", "application/json");


    if(patientName == "NANCY"){
      var raw = JSON.stringify({ "inputs": "<s>[INST] <<SYS>> You are a helpful assistant that takes patient progress notes over a number of days and summarizes it into one paragraph. Summarize the following text: Day 1: Delirium: Secondary to pneumonia. Needed Haldol x1, started risperidone qAM. Pneumonia: On ceftriaxone, WBC 18 today. Needing 2L oxygen. Constipation: Given enema. Day 2: Delirium: Secondary to pneumonia. Better on risperidone q AM. Pneumonia: On ceftriaxone, WBC 10 today. Off oxygen now. Constipation: Multiple BM with enema. Day 3: Delirium: Secondary to pneumonia. Better on risperidone q AM. Pneumonia: On ceftriaxone, WBC 5 today. Off oxygen now. Caregiver burden: Daughter mentioned increased caregiver burden at home. SW to see. Day  4: Delirium: Secondary to pneumonia. Better on risperidone q AM. Resolved. Pneumonia: On ceftriaxone, WBC 5 today. Off oxygen now. Continue antibiotics for five days total. Caregiver burden: Seen by SW. Discharge home with increased supports. <</SYS>>[/INST]<s>", "parameters": { "max_new_tokens": 500 } });
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

