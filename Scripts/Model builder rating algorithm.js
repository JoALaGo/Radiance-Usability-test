var core_hardware_consumption_matrix = [['CPU_usage', 'CPU'], ['RAM_usage', 'RAM'], ['storage_usage', 'Storage'], ['network_usage', 'Network']];
var profile_bcs = {};
class Step {
    constructor() {
        this.by_state = [];
        this.by_operations = [];
        this.by_parameter = [];
        this.results_generated = [];
        this.description = '';
    }
}

var report_errors = [];
var report_highlights = [];
var report = [];
let monitoring = true;
function monitor(message) {
    if (monitoring) {
        console.log("Monitoring: " + message);
    }

}

function fetchProfileBcs(profile) {
    console.log("test test");
    if (profile == null) {
        profile = this.available_parents;
    }
    let computation_centric = Object.entries(profile[1][1]);
    let data_centric = Object.entries(profile[2][1]);
    let conduct_centric = Object.entries(profile[3][1]);

    let a = [computation_centric, data_centric, conduct_centric];

    a.forEach(category => {

        category.forEach(element => {
            profile_bcs[element[0]] = element[1];
            console.log("fetchProfileBcs: " + element[0] + " and " + element[1]);
        });
    });
    // Now that we have all the properties per categorie in a json, we can proceed and generate the highlights based on the users' selection
   Object.entries(profile_bcs).forEach(property=>{
    //property[0] is the name of the property, property[1] is the value
    let highlight = getAdvice(property[0],property[1],report_errors);
    if(highlight!=null){
        report_highlights.push(highlight);
    }
    
   });

}

class HardwareConsumption {
    constructor() {
        this.Cc = 0;
        this.Ca = 0;
        this.Rc = 0;
        this.Ra = 0;
        this.Nc = 0;
        this.Na = 0;
        this.Sc = 0;
        this.Sa = 0;
        this.Camera = '';
        this.camera_weight = '';
        this.Bluetooth = '';
        this.Bluetooth_weight = '';
        this.WIFI_usage = '';
        this.WIFI_usage_weight = '';
        this.GPS = '';
        this.GPS_weight = '';
        this.Screen_brightness = '';
        this.Screen_brightness_weight = '';
        this.cpuWeight = 0.3;//this weight is heavier because CPU consumes the battery AND generates residual heat
        this.ramWeight = 0.1;// this weight does not matter a lot because it is a constant source of consumption (the wattage required to keep ram is constant)
        this.netWeight = 0.5;// this weight is heavier because network consumes locally and remotely!
        this.storWeight = 0.1;
        //we get the qualitative consumption for each element from the profile and the quantitative consumption from the taxonomic guide
        this.HcS = '';
        this.SCS = '';
        this.BCS = '';//NOTE: THE PROPERTIES FOR THE BCS RELATED TO THE OPERATION ARE FETCHED INSIDE OF getRelativeConsumption()
        this.Ocs = '';


    }

    selfRateHcs(self) {

        this.HcS = (this.Cc / this.Ca * this.cpuWeight + this.Rc / this.Ra * this.ramWeight + this.Nc / this.Na * this.netWeight + this.Sc / this.Sa * this.storWeight) * 100;
        monitor("Instance rating: " + this.HcS);
    }
    selfRateScs(self) {
        //we have to be sure that the sensorial consumption score has all the parameters filled in with a value, otherwise we should not assess it.

        if (this.Bluetooth == '' || this.Camera == '' || this.GPS == '' || this.WIFI_usage == '') {
            report_errors.push({ type: "error", sentimient: "negative", message: "There was an issue while calculating the Sensor Consumption Score: not all the sensors have a value assigned. The final rating is invalid.", algorithmic_category: "Scs", target_operation: self.operation_id, references: "None" });

        } else {
            let value_tabulator = { on: 1, off: 0, cirumstancial: 0.5 };
            monitor("Values: " + JSON.stringify(this));
            let screen_brightness_tabulator = { unused: '', off: 0, low: 0.04, medium: 0.06, high: 0.1, auto: 0.05 };
            this.SCS = (value_tabulator[this.Bluetooth] * this.Bluetooth_weight + value_tabulator[this.GPS] * this.GPS_weight + value_tabulator[this.Camera] * this.camera_weight + screen_brightness_tabulator[this.Screen_brightness]) * 100;
            monitor("SCS score: " + this.SCS);
        }

    }

    selfRateBcs(self) {

        let guide = JSON.parse('{"properties":[{"property":"task_distribution","possible_values":[{"value":"centralized","score":0.5},{"value":"decentralized","score":1}]},{"property":"computational_criticality","possible_values":[{"value":"low","score":0.3},{"value":"medium","score":0.6},{"value":"high","score":1}]},{"property":"computation_complexity","possible_values":[{"value":"low","score":0.3},{"value":"medium","score":0.6},{"value":"high","score":1}]},{"property":"distribution_strategy","possible_values":[{"value":"yes","score":0},{"value":"no","score":1}]},{"property":"consumption_rate","possible_values":[{"value":"definite","score":0},{"value":"indefinite","score":0.1}]},{"property":"data_flow_behavior","possible_values":[{"value":"regular","score":0.8},{"value":"irregular","score":0.4}]},{"property":"data_flow_direction","possible_values":[{"value":"unidirectional","score":0.5},{"value":"bidirectional","score":1}]},{"property":"data_handling","possible_values":[{"value":"keep","score":0.5},{"value":"destroy","score":0},{"value":"store and broadcast","score":0.5}]},{"property":"access_frequency","possible_values":[{"value":"regular","score":0},{"value":"irregular","score":0.5}]},{"property":"depth","possible_values":[{"value":"foreground","score":0.5},{"value":"background","score":0}]},{"property":"dependence","possible_values":[{"value":"dependee","score":0.5},{"value":"dependant","score":0.5},{"value":"independent","score":0}]}]}');

        //we have to be really careful here because the values of the operations override the values of the profile.
        //if a value of operation is empty, we use the profile, otherwise we override it with that of the operation
        //the easiest way to make this is to override the values from the beginning
        let profile_bcs_copy = JSON.parse(JSON.stringify(profile_bcs));
        //console.log(JSON.stringify(profile_bcs_copy));
        Object.entries(profile_bcs_copy).forEach(element => {
            //console.log(self);
            if (self.hasOwnProperty('operation_' + element[0])) {
                profile_bcs_copy[element[0]] = self['operation_' + element[0]];

            }
        });


        for (let x in guide.properties) {
            let element = guide.properties[x].property;
            //console.log("Checking the guide score for property: "+element);
            if (profile_bcs_copy.hasOwnProperty(guide.properties[x].property)) {

                //console.log("Property match");
                //we now look for the actual quantitative value
                for (let y in guide.properties[x].possible_values) {
                    let guide_value = guide.properties[x].possible_values[y].value;
                    if (profile_bcs_copy[element] == '') {
                        //report_highlights.push({ type: "error", sentimient: "negative", message: "Property "+element+" has no value.", algorithmic_category: "", target_operation: self.operation_id, references: "None" });
                    }
                    else if (guide_value == profile_bcs_copy[element]) {
                        profile_bcs_copy[element] = guide.properties[x].possible_values[y].score;
                        //console.log("Score for property: "+element+" with original value: "+guide_value+" is: "+guide.properties[x].possible_values[y].score);
                    }
                }
            }
        }

        //now we sum the score of each property
        var sum = 0.0;
        Object.entries(profile_bcs_copy).forEach(element => {
            console.log("BCS sum: " + Number(sum) + " " + typeof sum + " adding: " + profile_bcs_copy[element[0]] + " type: " + typeof profile_bcs_copy[element[0]]);
            sum += Number(profile_bcs_copy[element[0]]);

        });

        this.BCS = sum;

    }

    selfOCS() {
        this.Ocs = this.BCS + this.SCS + this.HcS;
    }
}
var test_sequence;
var timing_diagram = '';

function initTimingDiagram(root_profile) {

    let profile;
    if (root_profile == null || root_profile == '') {
        profile = this.available_parents;
    } else {
        profile = root_profile;
    }

    //we initialize all the operations as robust
    let init = '\n <style>\n    timingDiagram {\n      .red {\n        LineColor red\n      }\n      .blue {\n        LineColor blue\n        LineThickness 3\n      }\n    }\n</style>\n scale 1 as 200 pixels';
    timing_diagram += init;
    let operations = profile[findPlaceByParentName('Operations', profile)][4];

    for (let x in operations) {
        timing_diagram += '\nrobust "' + operations[x].Name + '" as ' + operations[x].Name.split(' ').join('') + ' <' + '<' + 'blue' + '>' + '>';
    }

    timing_diagram += '\n @0';
    for (let x in operations) {
        timing_diagram += '\n' + operations[x].Name.split(' ').join('') + ' is Off';
    }
}


function getAlgoComponents() {

    //we get the operational pathways of the profile in order to define what operations to rate in each step and how
    var sequencer = [];
    //do not use the cache of this.element_to_edit.profile_cache as it will evaluate over the older cache, use this.available_parents instead.
    getProfileOperationalPathways(this.available_parents, sequencer, 0);
    //console.log("Algo: sequencer: "+JSON.stringify(sequencer));


    // We create a hardware consumption guide with the availability:
    let hardwareConsumption = new HardwareConsumption();

    //we set the hardware availability to whatever we want
    hardwareConsumption.Ca = 1.6;
    hardwareConsumption.Ra = 16;
    hardwareConsumption.Na = 2400;
    hardwareConsumption.Sa = 256;
    //We assign the weights here
    hardwareConsumption.camera_weight = 0.1;
    hardwareConsumption.Bluetooth_weight = 0.35;
    hardwareConsumption.WIFI_usage_weight = 0.35;
    hardwareConsumption.GPS_weight = 0.2;


    var sequencer_consumption = [];
    for (let x in sequencer) {
        sequencer_consumption.push(rateStep(sequencer[x], x, hardwareConsumption));
    }

    //we now calculate the final rating for each step by invoking the rateSelf for each of the hardware consumption instances in the sequencer ratings per step
    for (let x in sequencer_consumption) {
        //we enter each step
        for (let y in sequencer_consumption[x]) {
            let instance = sequencer_consumption[x][y];
            monitor("Instance: " + JSON.stringify(instance));
            monitor("Sequencer: " + JSON.stringify(sequencer));

            instance.selfRateHcs();
            instance.selfRateScs(instance);//I am passing the instance so that I can access the operation id (it is a hack to make my life easier).
            instance.selfRateBcs(instance);
            instance.selfOCS();
        }

    }
    console.log("ALGO SEQUENCER CONSUMPTION: " + JSON.stringify(sequencer_consumption));


    let step_ratings = [];//the average rating for each step, we take the mean from the instance's HcS

    for (let x in sequencer_consumption) {
        //we enter each step
        let avg_rating = 0;
        let sum = 0;
        for (let y in sequencer_consumption[x]) {
            let instance = sequencer_consumption[x][y];
            sum += instance.Ocs;
        }
        avg_rating = sum / sequencer_consumption[x].length;
        step_ratings.push(avg_rating);
    }

    console.log("Step ratings: " + JSON.stringify(step_ratings));

    for (let x in sequencer) {//here x is the step
        timing_diagram += sequencer[x].description;
    }

    //we add the rating background color to the timing diagram
    let background_descriptions = '';

    //THE COLORS ARE TAKEN FROM WIKIPEDIA: https://en.wikipedia.org/wiki/European_Union_energy_label (washing machines)
    timing_diagram += '\n';

    for (let x in step_ratings) {

        //we set the color selection
        console.log("Labeling score: " + step_ratings[x]);
        let label = getCategoryAccordingToTaxonomy(step_ratings[x]);
        background_descriptions += 'highlight ' + (Number(x) + 1) + ' to ' + (Number(x) + 2) + ' ' + label.color + ' : ' + label.label + '\n';

    }

    timing_diagram += background_descriptions;

    //we store the highest and the lowest scores in the profie data so that we can use them later
    let highest = 0;
    for (let x in sequencer_consumption) {

        for (let y in sequencer_consumption[x]) {
            let instance = sequencer_consumption[x][y];
            if (instance.Ocs > highest) {
                highest = instance.Ocs;
            }
        }

    }

    let lowest = 100;
    for (let x in sequencer_consumption) {

        for (let y in sequencer_consumption[x]) {
            let instance = sequencer_consumption[x][y];
            if (instance.Ocs < lowest) {
                lowest = instance.Ocs;
            }
        }

    }

    let db_profile_index = findProfilePlaceInStorage('profile', this.element_to_edit.element_id);
    if (this.db.profile_Array[db_profile_index].hasOwnProperty("lowest_cs")) {
        this.db.profile_Array[db_profile_index].lowest_cs = lowest;
        this.db.profile_Array[db_profile_index].highest_cs = highest;
    } else {
        this.db.profile_Array[db_profile_index]["lowest_cs"] = lowest;
        this.db.profile_Array[db_profile_index]["highest_cs"] = highest;
    }
}

/*

function getTaxonomicRating() {
   
    var sequencer = [];

    getProfileOperationalPathways(JSON.parse(this.element_to_edit.profile_cache), sequencer, 0);//we get all the operational pathways that generate a consumption in a specific sequence
    //console.log("Generating steps ratings");
    var sequencer_consumption = [];
    for (let x in sequencer) {
        sequencer_consumption.push(rateStep(sequencer[x], x, GeforceNow));
    }

    console.log("Sequencer results: "+JSON.stringify(sequencer));
    //we now calculate the final rating for each step by invoking the rateSelf for each of the hardware consumption instances in the sequencer ratings per step
    for (let x in sequencer_consumption) {
        //we enter each step
        for (let y in sequencer_consumption[x]) {
            let instance = sequencer_consumption[x][y];
            instance.selfRateHcs();
        }

    }

    console.log("Rated consumption instances: " + JSON.stringify(sequencer_consumption));

    let step_ratings = [];//the average rating for each step, we take the mean from the instance's HcS

    for (let x in sequencer_consumption) {
        //we enter each step
        let avg_rating = 0;
        let sum = 0;
        for (let y in sequencer_consumption[x]) {
            let instance = sequencer_consumption[x][y];
            sum += instance.HcS;
        }
        avg_rating = sum / sequencer_consumption[x].length;
        step_ratings.push(avg_rating);
    }

    console.log("Step ratings: " + JSON.stringify(step_ratings));

    for (let x in sequencer) {//here x is the step
        timing_diagram += sequencer[x].description;
    }

    //we add the rating background color to the timing diagram
    let background_descriptions = '';

    //THE COLORS ARE TAKEN FROM WIKIPEDIA: https://en.wikipedia.org/wiki/European_Union_energy_label (washing machines)
    timing_diagram += '\n';

    for (let x in step_ratings) {

        //we set the color selection
        console.log("Labeling score: " + step_ratings[x]);
        let label = getCategoryAccordingToTaxonomy(step_ratings[x]);
        background_descriptions += 'highlight ' + (Number(x) + 1) + ' to ' + (Number(x) + 2) + ' ' + label.color + ' : ' + label.label + '\n';

    }

    timing_diagram += background_descriptions;
}

*/



function rateStep(step, step_index, hardwareGuideline) {

    console.log("%c rateStep: rating step: " + step_index, 'background-color: white;color:blue');
    let newConsumption;

    let step_consumption = [];
    //------------by state operations---------
    for (let x in step.by_state) {
        if (step.by_state[x] != null) {
            newConsumption = new HardwareConsumption();
            Object.assign(newConsumption, hardwareGuideline);

            let consumption = getRelativeConsumption(step.by_state[x], newConsumption);

            //we assign to the operation its consumption value..
            findInstanceInStorage(findPlaceByParentName('Operations', this.available_parents), step.by_state[x])['last_HCS'] = consumption;

            step_consumption.push(consumption);
        }
    }
    //------------by parameter operations-----

    for (let x in step.by_parameter) {
        if (step.by_parameter[x] != null) {
            newConsumption = new HardwareConsumption();
            Object.assign(newConsumption, hardwareGuideline);
            let consumption = getRelativeConsumption(step.by_parameter[x], newConsumption);
            //we assign to the operation its consumption value..
            findInstanceInStorage(findPlaceByParentName('Operations', this.available_parents), step.by_parameter[x])['last_HCS'] = consumption;

            step_consumption.push(consumption);
        }
    }
    //------------by operation----------------

    for (let x in step.by_operations) {
        if (step.by_operations[x] != null) {
            newConsumption = new HardwareConsumption();
            Object.assign(newConsumption, hardwareGuideline);
            let consumption = getRelativeConsumption(step.by_operations[x], newConsumption);
            //we assign to the operation its consumption value..
            findInstanceInStorage(findPlaceByParentName('Operations', this.available_parents), step.by_operations[x])['last_HCS'] = consumption;

            step_consumption.push(consumption);
        }
    }

    console.log("Step " + x + " consumption data: " + JSON.stringify(step_consumption));

    return step_consumption;


    function getRelativeConsumption(operation_id, newConsumption) {

        console.log("%cgetRelativeConsumption: fetching the relative consumption for: " + operation_id, 'background-color:white;color:red');
        let profile = this.available_parents;
        let consumption_guide_index = findProfilePlaceInStorage('profile', this.element_to_edit.consumption_guide);
        let consumption_guide_unparsed = db.profile_Array[consumption_guide_index];
        let consumption_guide_parsed = JSON.parse(db.profile_Array[consumption_guide_index].profile_cache);
        let software_category = profile[0][1].software_category;
        let software_type = profile[0][1].software_type;
        let hardware_platform = profile[0][1].hardware_platform;
        let operation_instance = findInstanceInStorage(findPlaceByParentName('Operations', profile), operation_id);
        let sensor_usage_instance = findInstanceInStorage(findPlaceByParentName('Operations', profile), operation_id)
        let proportion = 3;
        //-----------CPU RELATIVE CONSUMPTION-------------
        //1 is the index of the resource usage

        let qualitative_value = operation_instance.inner_variables[1].variables.CPU_usage;
        let quantitative_value;

        newConsumption.Cc = getValueByConsumptionGuide(operation_id, software_category, software_type, hardware_platform, qualitative_value, 'CPU_usage');
        if (qualitative_value == 'low') {
            newConsumption.Cc = newConsumption.Cc / proportion;
        } else if (qualitative_value == 'medium') {
            newConsumption.Cc = (newConsumption.Cc / proportion) * 2;
        }

        //-------------RAM RELATIVE CONSUMPTION-----------

        qualitative_value = operation_instance.inner_variables[1].variables.RAM_usage;
        quantitative_value = '';

        newConsumption.Rc = getValueByConsumptionGuide(operation_id, software_category, software_type, hardware_platform, qualitative_value, 'RAM_usage');
        if (qualitative_value == 'low') {
            newConsumption.Rc = newConsumption.Rc / proportion;
        } else if (qualitative_value == 'medium') {
            newConsumption.Rc = (newConsumption.Rc / proportion) * 2;
        }

        //---------------Storage Relative consumption------------ 

        qualitative_value = operation_instance.inner_variables[1].variables.storage_usage;
        quantitative_value = '';


        newConsumption.Sc = getValueByConsumptionGuide(operation_id, software_category, software_type, hardware_platform, qualitative_value, 'storage_usage');
        if (qualitative_value == 'low') {
            newConsumption.Sc = newConsumption.Sc / proportion;
        } else if (qualitative_value == 'medium') {
            newConsumption.Sc = (newConsumption.Sc / proportion) * 2;
        }
        //---------------Network Relative consumption------------ 

        qualitative_value = operation_instance.inner_variables[1].variables.network_usage;
        quantitative_value = '';

        relative_consumption = '';


        newConsumption.Nc = getValueByConsumptionGuide(operation_id, software_category, software_type, hardware_platform, qualitative_value, 'network_usage');
        if (qualitative_value == 'low') {
            newConsumption.Nc = newConsumption.Nc / proportion;
        } else if (qualitative_value == 'medium') {
            newConsumption.Nc = (newConsumption.Nc / proportion) * 2;
        }

        //------We get the rest of the sensors---------
        newConsumption.GPS = sensor_usage_instance.inner_variables[2].variables.GPS;
        newConsumption.Bluetooth = sensor_usage_instance.inner_variables[2].variables.Bluetooth;
        newConsumption.Camera = sensor_usage_instance.inner_variables[2].variables.Camera;
        newConsumption.Screen_brightness = sensor_usage_instance.inner_variables[2].variables.Screen_brightness;
        newConsumption.WIFI_usage = sensor_usage_instance.inner_variables[2].variables.WIFI_usage;
        console.log("JSON: " + JSON.stringify(newConsumption));
        //------WE GET THE VALUES FOR THE BBCP PROPERTIES OF THE OPERATIONS--------
        newConsumption.operation_data_handling = operation_instance.inner_variables[0].variables.operation_data_handling;
        newConsumption.operation_depth = operation_instance.inner_variables[0].variables.operation_depth;
        newConsumption.operation_task_distribution = operation_instance.inner_variables[0].variables.operation_task_distribution;
        newConsumption.operation_id = operation_id;

        //we return the object with all the data for the operation
        return newConsumption;

    }

    function getValueByConsumptionGuide(operation_id, software_category, software_type, hardware_platform, qualitative_value, hardware_component) {

        let consumption_guide_index = findProfilePlaceInStorage('profile', this.element_to_edit.consumption_guide);
        let consumption_guide_unparsed = db.profile_Array[consumption_guide_index];
        let consumption_guide_parsed = JSON.parse(db.profile_Array[consumption_guide_index].profile_cache);
        let quantitative_value;
        if (qualitative_value == '') {
            return 0;
        }
        if (typeof qualitative_value == "string" || typeof qualitative_value == null) {
            //we get the quantitative value from the consumption guide
            //console.log("getRelativeConsumtion: The stored value is qualitative, converting to quantitative");
            //1- get the valid consumption guide according to the software category, the software type and the hardware platform
            if (software_type == '') {
                //there is no software type selection, therefore we have to look in the parent category
                //3 is the 'consumption' parent for the category, 4 is the instances
                let consumption_guide_instances = consumption_guide_parsed[3][4];
                let selected_consumption_guide_index;
                for (let x in consumption_guide_instances) {
                    if (consumption_guide_instances[x].parent_instance_id == software_category && consumption_guide_instances[x].inner_id == hardware_platform) {
                        selected_consumption_guide_index = consumption_guide_instances[x];
                    }
                }

                //now that we have the index of the consumption, we have to match the operation hardware consumption values to the values of the index
                let matrix_name = findInCoreHardwareComponentMatrix(hardware_component);

                let inner_variables = selected_consumption_guide_index.inner_variables

                //we fetch the object in the inner variables that matches the matrix_name
                let inner_variables_index = '';
                for (let x in inner_variables) {
                    if (inner_variables[x].name == matrix_name) {
                        inner_variables_index = x;
                        break;
                    }

                }

                return inner_variables[inner_variables_index].variables[qualitative_value];

            } else {
                //there is a selection of a software type, therefore the consumption comes from that sub-category
                //there is no software type selection, therefore we have to look in the parent category
                //9 is the 'consumption' parent for the software type, 4 is the instances
                let consumption_guide_instances = consumption_guide_parsed[9][4];
                let selected_consumption_guide_index;
                for (let x in consumption_guide_instances) {
                    if (consumption_guide_instances[x].parent_instance_id == software_type && consumption_guide_instances[x].inner_id == hardware_platform) {
                        selected_consumption_guide_index = consumption_guide_instances[x];
                    }
                }

                //now that we have the index of the consumption, we have to match the operation hardware consumption values to the values of the index
                let matrix_name = findInCoreHardwareComponentMatrix(hardware_component);

                let inner_variables = selected_consumption_guide_index.inner_variables

                //we fetch the object in the inner variables that matches the matrix_name
                let inner_variables_index = '';
                for (let x in inner_variables) {
                    if (inner_variables[x].name == matrix_name) {
                        inner_variables_index = x;
                        break;
                    }

                }

                return inner_variables[inner_variables_index].variables[qualitative_value];



            }


        } else {
            //the value is not a string, it is set to a number, probably by an advanced user
            console.log("%cgetRelativeConsumption: The stored value is already quantiative", 'color:red;');
            quantitative_value = qualitative_value;
            return quantitative_value;
        }
    }

    function findInCoreHardwareComponentMatrix(profile_component_name) {

        for (let x in core_hardware_consumption_matrix) {
            //console.log("checking "+profile_component_name+' against '+core_hardware_consumption_matrix[x][0]);
            if (core_hardware_consumption_matrix[x][0] == profile_component_name) {
                let matrix_equivalence_name = core_hardware_consumption_matrix[x][1];
                //console.log("Returning name equivalence: "+matrix_equivalence);
                //we now have to get the correct object within inner_variables
                return matrix_equivalence_name;
            }
        }

        return profile_component_name;


    }

}


function getProfileOperationalPathways(profile, sequencer, step) {

    //console.log("%cgetOperationalPathways: PROFILE " + JSON.stringify(profile), "background-color: white;color:red;");
    console.log("%cgetOperationalPathways: step " + step, "background-color: white;color:red;");
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
        //alert("Available triggers: "+JSON.stringify(profile[triggers_index][4]));
        //------TRIGGERED BY STATE------
        for (let x in profile[triggers_index][4]) {
            if (profile[triggers_index][4][x].inner_variables[0].variables.trigger_Type == "state" && profile[triggers_index][4][x].inner_variables[0].variables.trigger_value == "run") {
                //alert("Operation "+profile[triggers_index][4][x].inner_variables[0].variables.operation_id+" triggered by state");
                //console.log("%cOperation triggered by run: "+profile[triggers_index][4][x].inner_variables[0].variables.operation_id,'background-color:white;color:blue;');
                new_step.description += '\n@' + (step + 1) + '\n' + findInstanceInStorage(findPlaceByParentName('Operations', this.available_parents), profile[triggers_index][4][x].inner_variables[0].variables.operation_id).Name.split(' ').join('') + ' is On';
                new_step.by_state.push(profile[triggers_index][4][x].inner_variables[0].variables.operation_id);
                new_step.description += '\n@' + (step + 2) + '\n' + findInstanceInStorage(findPlaceByParentName('Operations', this.available_parents), profile[triggers_index][4][x].inner_variables[0].variables.operation_id).Name.split(' ').join('') + ' is Off';

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
        console.log("PRE operations cascade: " + JSON.stringify(new_step));
        getOperationsCascade(new_step.by_state, profile, new_step.by_operations);
        console.log("POST operations cascade: " + JSON.stringify(new_step));
        //we get the by_operations timing
        for (let x in new_step.by_operations) {
            console.log("Adding Operation: " + new_step.by_operations[x] + " to ON at " + (step + 1));
            let operation_id = new_step.by_operations[x];
            let operation_name = findInstanceInStorage(findPlaceByParentName('Operations', profile), operation_id).Name;
            let operation_pseudonim = operation_name.split(' ').join('');
            new_step.description += '\n' + '@' + (step + 1) + '\n' + operation_pseudonim + ' is On';
            new_step.description += '\n' + '@' + (step + 2) + '\n' + operation_pseudonim + ' is Off';
        }
        console.log("New step descriptions: " + JSON.stringify(new_step.description));
        //now that we have the operations triggered by the state and by other operations, we need to get the results they generate
        //--------------RESULTS---------------
        let results_index = findPlaceByParentName('Results', profile);
        for (let x in new_step.by_state) {
            for (let y in profile[results_index][4]) {
                let parameter_instance = profile[results_index][4][y].inner_variables[0].variables.parameter;
                let parameter_name = findInstanceInStorage(findPlaceByParentName('Parameters', this.available_parents), parameter_instance);
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

        //we are not in step 0, we gotta set our references to step-1 in order to retrieve previous results
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
                    let operation_name = findInstanceInStorage(findPlaceByParentName('Operations', profile), operation_to_trigger).Name;
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
        console.log("POST operations cascade in step >0: " + JSON.stringify(new_step));
        for (let x in new_step.by_operations) {
            let operation_name = findInstanceInStorage(findPlaceByParentName('Operations', profile), new_step.by_operations[x]).Name;
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
    console.log("Operations cascade using the following triggers:\n " + JSON.stringify(triggers_index));
    //we gotta check the operations triggered by the start operations and the subsequent operations
    console.log("START OPERATIONS: " + startOperations);
    for (let x in startOperations) {
        for (let y in triggers_index) {
            let trigger_data = triggers_index[y].inner_variables[0].variables;
            let trigger_origin = trigger_data.operation_id;
            let trigger_target = trigger_data.trigger_value;
            let trigger_Type = trigger_data.trigger_Type;
            console.log("Current operation " + startOperations[x] + " trigger: \nType: " + trigger_Type + "\nOrigin: " + trigger_origin + "\nTarget: " + trigger_target);
            if (startOperations[x] == trigger_target && trigger_Type == 'operation') {
                console.log("%cgetOperationsCascade: does operation " + startOperations[x] + " trigger " + trigger_target + "? ", 'background-color:white;color:red;');
                console.log("%cYES", 'color:green');
                rootCascade.push(trigger_origin);
                cascade.push(trigger_origin);
            } else {
                console.log("%cNO", 'color:red');
            }

        }
    }

    if (cascade.length == 0) {
        return;
    } else {
        //we employ recursion to find out what other operations are triggered down the pipeline
        console.log("getOperaitionsCascade: starting recursion with: " + JSON.stringify(cascade));
        getOperationsCascade(cascade, profile, rootCascade);
    }
}


function getCategoryAccordingToTaxonomy(score) {

    let label = '';
    let color = '';
    if (score < 20) {
        label = 'A';
    } else if (score >= 20 && score < 30) {
        label = 'B';
    } else if (score >= 30 && score < 40) {
        label = 'C';
    } else if (score >= 40 && score < 50) {
        label = 'D';
    } else if (score >= 50 && score < 60) {
        label = 'E';
    } else if (score >= 60 && score < 70) {
        label = 'F';

        
    } else if (score >= 70) {
        label = 'G';
    }

    if (label == 'A') {
        color = '#33a357';
    }
    if (label == 'B') {
        color = '#79b752';
    }
    if (label == 'C') {
        color = '#c3d545';
    }
    if (label == 'D') {
        color = '#fff12c';
    }
    if (label == 'E') {
        color = '#edb731';
    }
    if (label == 'F') {
        color = '#d66f2c';
    }
    if (label == 'G') {
        color = '#cc232a';
    }

    let final_label = new Object();
    final_label.label = label;
    final_label.color = color;
    return final_label;
}


//lets open the general traits..


function getSubSetVariables(name) {
    let place = findPlaceByParentName(name, this.available_parents);
    return this.available_parents[place][1];
}
/*
function rateComputationCentric() {
    console.log('bollocks');
    //we get the properties for this sub-set of properties
    let variables = getSubSetVariables('Computation_centric');
    console.log('available variables: ' + Object.keys(variables));
    let score = 0;
    let max_score = Object.keys(variables).length;//this is not true, the maximum score should be relative to the availability of the data as well. some properties could be empty.

    variables.task_distribution == 'centralized' ? (score++, this.report.push({type:"",sentimient:"",message:"The <strong>task distribution</strong> of your profile is set to centralized. A centralized architecture can have its own benefits, however, deploying your software in a decentralized architecure can allow you to execute it in the most frugal hardware.",algorithmic_category:'',target_operation:'',references:''})) : null;

    let current_property = variables.computational_criticality;

    if (current_property == 'low') {
    } else if (current_property == 'medium') {
        score += 0.5;
    } else if (current_property == 'high') {
        score += 1;
        this.report.push({type:"highlight",sentiment:"negative",message:'Your <strong>computational criticality</strong> is set to high, more energy will be expended in order to obtain your results faster.', target_operation:'',references:''});
    }

    current_property = variables.computation_complexity;

    if (current_property == 'low') {
    } else if (current_property == 'medium') {
        score += 0.5;
    } else if (current_property == 'high') {
        score += 1;
        this.report.push('Your <strong>computational complexity</strong> is set to high, more energy will be expended in order to obtain your results.');
    }

    console.log(this.report);
    console.log('final computation centric score:' + score + '|' + max_score);

    let final_score = { rating: score, max_score: max_score, report: this.report, parent: 'Computation centric' };
    return final_score;
}
*/
/*
function rateDataCentric() {
    console.log('bollocks');
    //we get the properties for this sub-set of properties
    let variables = getSubSetVariables('Data_centric');
    console.log('available variables: ' + Object.keys(variables));
    let score = 0;
    let max_score = Object.keys(variables).length;

    let final_score = { rating: score, max_score: max_score, report: this.report, parent: 'Data centric' };
    return final_score;
}
*/


initTimingDiagram();
//-------Generate the ratings-------------
//we get the Ocs for each operation in a step: 
fetchProfileBcs(this.available_parents);
getAlgoComponents();
//let taxonomic_label = getCategoryAccordingToTaxonomy(taxonomic_rating);

//-------Generate the timing diagram-------
timing_diagram += '';
console.log("Timing diagram generated by the algorithm: " + timing_diagram);
this.db.timing_diagram = timing_diagram;
updateLocalStorage();
//the following line updates the memory of the builder to keep it up to date with the data generated by the algorithm
//this.setBuilderSelection('profile',this.element_to_edit.element_id);
//the following line updates the diagrams by making a request to plantuml url
reasonerPlantumlDiagram();
console.log("Report highlights: " + JSON.stringify(report_errors));
console.log("Report: " + report);
//----- Guide the user to new things in the UI -------
//the next line is used to highlight elements in the UI by adding a green shadow to them
document.getElementById('_' + findPlaceByParentName('Operations', this.available_parents) + '_parent_header').parentElement.classList.add('attention');
//the next line refreshes the operations list so that it gets updated with the latest labels.
populateChildren(findPlaceByParentName('Operations', this.available_parents), null, null, true, true);
//window.open('./timing_preview.html');
showReport(report_errors,report_highlights);

