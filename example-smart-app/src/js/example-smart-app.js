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
          console.log("height:", byCodes('8302-2'))
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
          print("Generated patient = ", p)
          ret.resolve(p);

          // Call the Llama2 model and display the result
          query_model();
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
  async function query_model(data) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer RiDEhewoLaUjSdUnaULaktLjlWhBlDKdNtpGSMjQTsIoiTTfnkdMIZITZBNAHlbRdtjGYBvlRWDwbDMnpkYjJTkDfdQeEpnxkUNURmEBflwRqrzpjdMrulyKScrzTCoT");
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({ "inputs": "<s>[INST] <<SYS>> You are a helpful assistant that takes patient progress notes over a number of days and summarizes it into one paragraph. Summarize the following text: Day 1: Delirium: Secondary to pneumonia. Needed Haldol x1, started risperidone qAM. Pneumonia: On ceftriaxone, WBC 18 today. Needing 2L oxygen. Constipation: Given enema. Day 2: Delirium: Secondary to pneumonia. Better on risperidone q AM. Pneumonia: On ceftriaxone, WBC 10 today. Off oxygen now. Constipation: Multiple BM with enema. Day 3: Delirium: Secondary to pneumonia. Better on risperidone q AM. Pneumonia: On ceftriaxone, WBC 5 today. Off oxygen now. Caregiver burden: Daughter mentioned increased caregiver burden at home. SW to see. Day  4: Delirium: Secondary to pneumonia. Better on risperidone q AM. Resolved. Pneumonia: On ceftriaxone, WBC 5 today. Off oxygen now. Continue antibiotics for five days total. Caregiver burden: Seen by SW. Discharge home with increased supports. <</SYS>>[/INST]<s>", "parameters": { "max_new_tokens": 500 } });

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    fetch("https://a2907qjht80r9qrb.us-east-1.aws.endpoints.huggingface.cloud", requestOptions)
      .then(response => response.json())
      .then(result => {
        displaySummary(result);
        console.log(result);
      })
      .catch(error => console.log('error', error));
  }

  function displaySummary(result) {
    document.getElementById('progress-notes').innerHTML = `Day 1: Delirium: Secondary to pneumonia. Needed Haldol x1, started risperidone qAM. Pneumonia: On ceftriaxone, WBC 18 today. Needing 2L oxygen. Constipation: Given enema. Day 2: Delirium: Secondary to pneumonia. Better on risperidone q AM. Pneumonia: On ceftriaxone, WBC 10 today. Off oxygen now. Constipation: Multiple BM with enema. Day 3: Delirium: Secondary to pneumonia. Better on risperidone q AM. Pneumonia: On ceftriaxone, WBC 5 today. Off oxygen now. Caregiver burden: Daughter mentioned increased caregiver burden at home. SW to see. Day  4: Delirium: Secondary to pneumonia. Better on risperidone q AM. Resolved. Pneumonia: On ceftriaxone, WBC 5 today. Off oxygen now. Continue antibiotics for five days total. Caregiver burden: Seen by SW. Discharge home with increased supports.`;

    const generatedText = result[0].generated_text;
    const formattedText = generatedText.split('\n').join('<br>');
    document.getElementById('summary').innerHTML = formattedText;
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

// (function(window){
//   window.extractData = function() {
//     var ret = $.Deferred();

//     function onError() {
//       console.log('Loading error', arguments);
//       ret.reject();
//     }

//     function onReady(smart)  {
//       if (smart.hasOwnProperty('patient')) {
//         var patient = smart.patient;
//         var pt = patient.read();
//         var obv = smart.patient.api.fetchAll({
//                     type: 'Observation',
//                     query: {
//                       code: {
//                         $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
//                               'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
//                               'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
//                       }
//                     }
//                   });
  
//         // //test document data
//         //   var documentData = {
//         //     resourceType: "DocumentReference",
//         //     status: "current", // or another appropriate status
//         //     type: {
//         //       coding: [
//         //         {
//         //           system: "http://loinc.org",
//         //           code: "18842-5",
//         //           display: "Discharge summary" // Replace with appropriate display text
//         //         }
//         //       ]
//         //     },
//         //     subject: {
//         //       reference: "Patient/" + patient.id
//         //     },
//         //     content: [
//         //       {
//         //         attachment: {
//         //           contentType: "text/plain",
//         //           data: btoa("This is what I want to summarize") // Base64 encode string
//         //         }
//         //       }
//         //     ]
//         //   };//creating a document reference for the summary, this can be called later
          
//         // createDocumentReference(smart, documentData, function(response) {
//         // console.log('DocumentReference created:', response);
//         // var createdDocumentId = response.id; // Assuming the response contains the ID
//         // // Store this ID to fetch the document later
//         // }, function(error) {
//         //   console.error('Error creating DocumentReference:', error);
//         // });
//         // console.log('DocumentReference created:', createdDocumentId);
        
//         // var docRef = smart.patient.api.read({
//         //             type: 'DocumentReference',
//         //             id: createdDocumentId
//         //           });
        
//         //$.when(pt, obv, docRef).fail(onError);
//         $.when(pt, obv, docRef).done(function(patient, obv, docRef) {
//           var byCodes = smart.byCodes(obv, 'code');
//           var gender = patient.gender;

//           var fname = '';
//           var lname = '';
//           // Processing for the fetched DocumentReference
//           if (docRef) {
//             console.log('Fetched DocumentReference:', docRef);
//             // Additional processing as needed
//           }
          

//           if (typeof patient.name[0] !== 'undefined') {
//             fname = patient.name[0].given.join(' ');
//             lname = patient.name[0].family.join(' ');
//           }

//           var height = byCodes('8302-2');
//           var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
//           var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
//           var hdl = byCodes('2085-9');
//           var ldl = byCodes('2089-1');
//           var dischargeSumary = byCodes("18842-5")
//           onsole.log("DISCHARGE SUMMAR IS", dischargeSumary)
//           console.log(patient)
//           console.log(smart)

//           var p = defaultPatient();
//           p.birthdate = patient.birthDate;
//           p.gender = gender;
//           p.fname = fname;
//           p.lname = lname;
//           p.height = getQuantityValueAndUnit(height[0]);

//           if (typeof systolicbp != 'undefined')  {
//             p.systolicbp = systolicbp;
//           }

//           if (typeof diastolicbp != 'undefined') {
//             p.diastolicbp = diastolicbp;
//           }

//           p.hdl = getQuantityValueAndUnit(hdl[0]);
//           p.ldl = getQuantityValueAndUnit(ldl[0]);

//           ret.resolve(p);
//         });
//       } else {
//         onError();
//       }
//     }

//     FHIR.oauth2.ready(onReady, onError);
//     return ret.promise();

//   };
//     //MY FUNCTIONS
//   //used to create document reference
//   function createDocumentReference(smart, documentData, onSuccess, onError) {
//     return smart.request({
//       url: 'DocumentReference',
//       method: 'POST',
//       body: JSON.stringify(documentData),
//       headers: {
//         'Content-Type': 'application/fhir+json'
//       }
//   }).then(response => response.json())
//     .catch(error => console.error('Error creating DocumentReference:', error));
//   }
//   //function to fetch the document reference to summaries
//   function fetchDocumentReference(smart, documentId) {
//     smart.request(`DocumentReference/${documentId}`, {
//       method: 'GET'
//     }).then(function(documentReference) {
//       console.log('Fetched DocumentReference returned value:', documentReference);
//     }).catch(function(error) {
//       console.error('Error fetching DocumentReference:', error);
//     });
//   }

//   function defaultPatient(){
//     return {
//       fname: {value: ''},
//       lname: {value: ''},
//       gender: {value: ''},
//       birthdate: {value: ''},
//       height: {value: ''},
//       systolicbp: {value: ''},
//       diastolicbp: {value: ''},
//       ldl: {value: ''},
//       hdl: {value: ''},
//     };
//   }

  // function getBloodPressureValue(BPObservations, typeOfPressure) {
  //   var formattedBPObservations = [];
  //   BPObservations.forEach(function(observation){
  //     var BP = observation.component.find(function(component){
  //       return component.code.coding.find(function(coding) {
  //         return coding.code == typeOfPressure;
  //       });
  //     });
  //     if (BP) {
  //       observation.valueQuantity = BP.valueQuantity;
  //       formattedBPObservations.push(observation);
  //     }
  //   });

  //   return getQuantityValueAndUnit(formattedBPObservations[0]);
  // }

  // function getQuantityValueAndUnit(ob) {
  //   if (typeof ob != 'undefined' &&
  //       typeof ob.valueQuantity != 'undefined' &&
  //       typeof ob.valueQuantity.value != 'undefined' &&
  //       typeof ob.valueQuantity.unit != 'undefined') {
  //         return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
  //   } else {
  //     return undefined;
  //   }
  // }

  // window.drawVisualization = function(p) {
  //   $('#holder').show();
  //   $('#loading').hide();
  //   $('#fname').html(p.fname);
  //   $('#lname').html(p.lname);
  //   $('#gender').html(p.gender);
  //   $('#birthdate').html(p.birthdate);
  //   $('#height').html(p.height);
  //   $('#systolicbp').html(p.systolicbp);
  //   $('#diastolicbp').html(p.diastolicbp);
  //   $('#ldl').html(p.ldl);
  //   $('#hdl').html(p.hdl);
  // };

// })(window);
