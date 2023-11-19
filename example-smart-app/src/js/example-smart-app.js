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
        console.log("patient", patient)
        console.log("pt: ", pt)
        var patientId = patient.id
        console.log("Storing information")
        createTextMessageObservation(smart, patientId, 'TESTING SAMPLE');
        
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4',
                              'http://loinc.org|18842-5',
                             ]
                      }
                    }
                  });

        $.when(pt, obv).fail(onError);
        // var getTextMessagObservation(smart,patientId);
        
        $.when(pt, obv).done(function(patient, obv) {
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
          console.log("Discharge_summary", byCodes("18842-5") )

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
                  code: "18842-5",
                  display: "Discharge summary"
              }
          ]
      },
      subject: {
          reference: `Patient/${patientId}`
      },
      valueString: textMessage // The text message you want to store
  };

  return smart.patient.api.fetchAll({
      url: 'DocumentReference',
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
