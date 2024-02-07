class Step {
    constructor() {
        this.by_state = [];
        this.by_operations = [];
        this.by_parameter = [];
        this.results_generated = [];
        this.description = '';
    }
}

var selected_collections = [];

var test_tube = new Object();
this.test_tube.collections = [];
this.test_tube.collections_configurations = [];
this.test_tube.collections_mirror = [];
this.test_tube.inner_profiles = [];
//at a document-level syntax, the profile configuration parameters are found like this: [collection_id]_[configuration_id]_[parameter name]
let collection_configuration_keys = { space_representation: '', parameter_pool_policy: '', hardware_usage_policy: '', amount_of_instances: '' };


//at a document-level syntax, the profile configuration parameters are found like this: [configuration_id]_[profile_id]_[parameter name]
let profile_configuration_template = { amount_of_instances: '', hardware_usage_policy: '' };

function getProfileOperationalPathways(profile, sequencer, step) {
    //Profile is the profile to get the operational pathways of, SEQUENCER is the array where we will store the sequences, step is just the initial step
    //console.log("%cgetOperationalPathways: step " + step, "background-color: white;color:red;");
    //We have to get the consumption from the operations.
    //I have to create a new attribute for the operatins called "weight". Weight will determine
    //how much actual consumption each one of the operations represents. Right now, I will not add
    //this property, instead I will assign consupmtion the following way: Low: 1/3 of the consumption, Medium: 2/3 high 3/3
    //there is still an issue as not all operations are used at the same time. Therefore, I need to find
    //the available operational sequences using triggers, results, operations and profile states

    //Priority: 1- profile state, 2- operations and results, Operations
    //I will handle all of this by using steps.

    //1- we get the operations that get triggered by the profile state
    if (step == 0) {
        let new_step = new Step();
        let triggers_index = findPlaceByParentName('Triggers', profile);
        if (triggers_index == null) {
            alertify.error('(er3) The profile: can not be executed because it does not seem to be a BBCP.');
            return;
        }
        //------TRIGGERED BY STATE------
        for (let x in profile[triggers_index][4]) {
            if (profile[triggers_index][4][x].inner_variables[0].variables.trigger_Type == "state" && profile[triggers_index][4][x].inner_variables[0].variables.trigger_value == "run") {

                //console.log("%cOperation triggered by run: "+profile[triggers_index][4][x].inner_variables[0].variables.operation_id,'background-color:white;color:blue;');
                new_step.description += '\n@' + (step + 1) + '\n' + findInstanceInProfile(findPlaceByParentName('Operations', profile), profile[triggers_index][4][x].inner_variables[0].variables.operation_id, profile).Name.split(' ').join('') + ' is On';
                new_step.by_state.push(profile[triggers_index][4][x].inner_variables[0].variables.operation_id);

                new_step.description += '\n@' + (step + 2) + '\n' + findInstanceInProfile(findPlaceByParentName('Operations', profile), profile[triggers_index][4][x].inner_variables[0].variables.operation_id, profile).Name.split(' ').join('') + ' is Off';

            }
        }



        //operations triggered by an operation get triggered instantly by it in the same step
        //operations triggered by a parameter get triggered in the next step to the one where the parameter is generated

        //find the operations triggered by any operation up until now
        //----------TRIGGERED BY OPERATIONS-------
        /*  for(let x in new_step.by_state){
             //we match the operations that get triggered by the operation in x, using triggers of course
             let triggers = profile[findPlaceByParentName('Triggers',profile)][4];
             for(let y in triggers){
                 let operation_id = triggers[y].inner_variables[0].variables.operation_id;
                 let target_operation = triggers[y].inner_variables[0].variables.trigger_value;
                 let trigger_type = triggers[y].inner_variables[0].variables.trigger_Type;
     
                 //console.log("Operation by_state: "+step.by_state[x]+" Operation id:"+operation_id+" trigger_type: "+trigger_type+" target_operation: "+target_operation );
     
                 if(operation_id == new_step.by_state[x] && trigger_type == 'operation'){
                     console.log("%cOperation triggered by other operation(s): "+target_operation,'background-color:white;color:blue;' );
                     new_step.by_operations.push(target_operation);
                 }
             }
         }
      */
        getOperationsCascade(new_step.by_state, profile, new_step.by_operations);

        //we get the by_operations timing
        for (let x in new_step.by_operations) {
            let operation_id = new_step.by_operations[x];
            let operation_name = findInstanceInProfile(findPlaceByParentName('Operations', profile), operation_id, profile).Name;
            let operation_pseudonim = operation_name.split(' ').join('');
            new_step.description += '\n' + '@' + (step + 1) + '\n' + operation_pseudonim + ' is On';
            new_step.description += '\n' + '@' + (step + 2) + '\n' + operation_pseudonim + ' is Off';
        }

        //now that we have the operations triggered by the state and by other operations, we need to get the results they generate
        //--------------RESULTS---------------
        let results_index = findPlaceByParentName('Results', profile);
        for (let x in new_step.by_state) {
            for (let y in profile[results_index][4]) {
                let parameter_instance = profile[results_index][4][y].inner_variables[0].variables.parameter;
                let parameter_name = findInstanceInProfile(findPlaceByParentName('Parameters', profile), parameter_instance, profile);
                if (profile[results_index][4][y].inner_variables[0].variables.source_operation == new_step.by_state[x]) {
                    //console.log("%cResult: "+parameter_instance+" created by: "+new_step.by_state[x],"background-color:white;color:blue;");
                    new_step.results_generated.push(profile[results_index][4][y].inner_variables[0].variables.parameter);

                }
            }
        }
        for (let x in new_step.by_operations) {
            for (let y in profile[results_index][4]) {

                if (profile[results_index][4][y].inner_variables[0].variables.source_operation == new_step.by_operations[x]) {
                    //console.log("%cResult: "+profile[results_index][4][y].inner_variables[0].variables.parameter+" created by: "+new_step.by_operations[x],"background-color:white;color:blue;");
                    new_step.results_generated.push(profile[results_index][4][y].inner_variables[0].variables.parameter);
                }
            }
        }

        sequencer[step] = new_step;
        step += 1;
        getProfileOperationalPathways(profile, sequencer, step);

    } else {
        //****************** STEP>0 ****************

        //we are not in step 0, we gotta set our references to step-1
        let new_step = new Step();

        let previous_step = sequencer[(step - 1)];
        let triggers_index = findPlaceByParentName('Triggers', profile);
        //we first get the operations triggered by previous results

        //------------TRIGGERED BY RESULTS----------

        for (let x in previous_step.results_generated) {
            //we match the operations that get triggered by the operation in x, using triggers of course
            let triggers = profile[findPlaceByParentName('Triggers', profile)][4];
            for (let y in triggers) {
                let operation_to_trigger = triggers[y].inner_variables[0].variables.operation_id;
                let parameter = triggers[y].inner_variables[0].variables.trigger_value;
                let trigger_type = triggers[y].inner_variables[0].variables.trigger_Type;

                //console.log("Operation by_state: "+step.by_state[x]+" Operation id:"+operation_id+" trigger_type: "+trigger_type+" target_operation: "+target_operation );

                if (parameter == previous_step.results_generated[x] && trigger_type == 'parameter') {
                    //console.log("%cOperation triggered by previous parameters: "+operation_to_trigger,'background-color:white;color:blue;' );
                    new_step.by_parameter.push(operation_to_trigger);
                    let operation_name = findInstanceInProfile(findPlaceByParentName('Operations', profile), operation_to_trigger, profile).Name;
                    let operation_pseudonim = operation_name.split(' ').join('');

                    new_step.description += '\n@' + (step + 1);
                    new_step.description += '\n' + operation_pseudonim + ' is On';
                    new_step.description += '\n@' + (step + 2);
                    new_step.description += '\n' + operation_pseudonim + ' is Off';
                }
            }

        }

        //--------TRIGGERED BY OPERATIONS--------
        getOperationsCascade(new_step.by_parameter, profile, new_step.by_operations);
        for (let x in new_step.by_operations) {
            let operation_name = findInstanceInProfile(findPlaceByParentName('Operations', profile), new_step.by_operations[x], profile).Name;
            let operation_pseudonim = operation_name.split(' ').join('');

            new_step.description += '\n@' + (step + 1);
            new_step.description += '\n' + operation_pseudonim + ' is On';
            new_step.description += '\n@' + (step + 2);
            new_step.description += '\n' + operation_pseudonim + ' is Off';
        }
        //---------RESULTS---------
        let results_index = findPlaceByParentName('Results', profile);
        for (let x in new_step.by_parameter) {
            for (let y in profile[results_index][4]) {

                if (profile[results_index][4][y].inner_variables[0].variables.source_operation == new_step.by_parameter[x]) {
                    //console.log("%cResult: "+profile[results_index][4][y].inner_variables[0].variables.parameter+" created by: "+new_step.by_parameter[x],"background-color:white;color:blue;");
                    new_step.results_generated.push(profile[results_index][4][y].inner_variables[0].variables.parameter);
                }
            }
        }
        for (let x in new_step.by_operations) {
            for (let y in profile[results_index][4]) {

                if (profile[results_index][4][y].inner_variables[0].variables.source_operation == new_step.by_operations[x]) {
                    console.log("%cResult: " + profile[results_index][4][y].inner_variables[0].variables.parameter + " created by: " + new_step.by_operations[x], "background-color:white;color:blue;");
                    new_step.results_generated.push(profile[results_index][4][y].inner_variables[0].variables.parameter);
                }
            }
        }

        if (new_step.by_operations == '' && new_step.by_parameter == '') {
            return;
        } else {
            sequencer[step] = new_step;
            step += 1;
            getProfileOperationalPathways(profile, sequencer, step);
        }


    }
}

function getOperationsCascade(startOperations, profile, rootCascade) {
    let cascade = [];
    let triggers_index = profile[findPlaceByParentName('Triggers', profile)][4];
    //we gotta check the operations triggered by the start operations and the subsequent operations
    //console.log("START OPERATIONS: "+startOperations);
    for (let x in startOperations) {
        for (let y in triggers_index) {
            let trigger_data = triggers_index[y].inner_variables[0].variables;
            let trigger_origin = trigger_data.operation_id;
            let trigger_target = trigger_data.trigger_value;
            let trigger_Type = trigger_data.trigger_Type;
            //console.log("%cgetOperationsCascade: does operation "+startOperations[x]+" trigger "+trigger_target+"? ",'background-color:white;color:red;');
            if (startOperations[x] == trigger_origin && trigger_Type == 'operation') {
                //console.log("%cYES",'color:green');
                rootCascade.push(trigger_target);
                cascade.push(trigger_target);
            }//else{
            //console.log("%cNO",'color:red');
            //}

        }
    }

    if (cascade.length == 0) {
        return;
    } else {
        getOperationsCascade(cascade, profile, rootCascade);
    }
}

function interpreterCollectionAssign(id) {
    
    test_tube['collections'].push({ root_id: id, configuration_id: createUID(), content: { profiles: [], collections: [] } });
    let worker = new Worker("./Scripts/workers/populate_test_tube.js");
    /* let test = worker.postMessage({db:this.db,id:id});
    worker.onmessage = (e) => {
      //we get the results of the webworker into the test tube
      for(let x in e.data){
        test_tube.inner_profiles.push(e.data[x]);
      }
  
    }; */
    saveTestTubeToDB();
    interpreterInitialization();

}

function interpreterCollectionDeassign(id, bol) {


    console.log(test_tube.collections);
    let target;
    //we gotta find and take out the id
    for (let x in test_tube.collections) {
        console.log(test_tube.collections[x]);
        if (test_tube.collections[x].root_id == id) {
            target = x;
            break;

        }
    }

    test_tube.collections.splice(target, 1);
    //we get rid of all the profiles that had the collection as a parent
    let to_slice = [];
    for (let x in test_tube.inner_profiles) {
        if (test_tube.inner_profiles[x].parent_collection == id) {
            to_slice.push(x);
        }
    }

    //we slice the profiles

    for (let x in to_slice) {
        test_tube.inner_profiles.slice(to_slice[x], 1);
    }

    saveTestTubeToDB();
    interpreterInitialization();

}

function saveConfiguration(type, configuration_id, root_id) {
    //the type can be either a profile or a collection.
    //the root id can be either the id of a profile or the id of a collection
    if (type == 'profile') {
        //we check if the profile exists and we should override it
        let existing_configuration = getProfileConfigurationById(configuration_id,root_id);
        
        //we get the possible keys for the profile's configuration
        let keys = Object.keys(profile_configuration_template);
        let tube = { ...profile_configuration_template };
        tube.instance_id = root_id;
        for (let x in keys) {
            console.log("Retrieving the value for property: " + keys[x]);
            let value = document.getElementById(configuration_id + '_' + root_id + '_' + keys[x]).value;
            //console.log("Value: " + value);
            tube[keys[x]] = value;
        }

        let target_configuration = getCollectionTestTubeById(configuration_id);
        if(existing_configuration== null){
            target_configuration.content.profiles.push(tube);
        }else{
            target_configuration.content.profiles[existing_configuration.index] = tube;
        }
        //console.log(JSON.stringify(target_configuration));
    } else {
        //it is a collection, not a profile
         //we check if the collection exists and we should override it
         let existing_configuration = getCollectionConfigurationById(configuration_id,root_id);
        //we get the possible keys for the profile's configuration
        let keys = Object.keys(collection_configuration_keys);
        let tube = { ...profile_configuration_template };
        tube.instance_id = root_id;
        for (let x in keys) {
            //console.log("Retrieving the value for property: " + keys[x]);
            let value = document.getElementById(configuration_id + '_' + root_id + '_' + keys[x]).value;
            //console.log("Value: " + value);
            tube[keys[x]] = value;
        }

        let target_configuration = getCollectionTestTubeById(configuration_id);
        if(existing_configuration== null){
            target_configuration.content.collections.push(tube);
        }else{
            target_configuration.content.collections[existing_configuration.index] = tube;
        }
        //console.log(JSON.stringify(target_configuration));

    }
    saveTestTubeToDB();
    alertify.success('Configuration saved');
}

function saveTestTubeToDB(){
    this.db.test_tube = {...this.test_tube};
    updateLocalStorage();
}


function getCollectionTestTubeById(configuration_id) {
    for (let x in this.test_tube.collections) {
        if (this.test_tube.collections[x].configuration_id == configuration_id) {
            return this.test_tube.collections[x];
        }
    }
    return null;
}

function getProfileConfigurationById(configuration_id, profile_id) {
    let configuration;
    let index;

    configuration = getCollectionTestTubeById(configuration_id);
    for (let x in configuration.content.profiles) {
        if (configuration.content.profiles[x].instance_id == profile_id) {
            configuration = configuration.content.profiles[x];
            index = x;
            return { configuration, index };
        }
    }

    return null;
}

function getCollectionConfigurationById(configuration_id, collection_id){
let configuration;
let index;
configuration = getCollectionTestTubeById(configuration_id);
for (let x in configuration.content.collections) {
    if (configuration.content.collections[x].instance_id == collection_id) {
        configuration = configuration.content.collections[x];
        index = x;
        return { configuration, index };
    }
}
return null;

}