//this listener is responsible for updating the UI each time a schema is loaded
var from;
var audio = true;
var load_schema_button = document.getElementById('load_schema_button');
var element_to_edit = new Object();
var temporal_selection = "";
var available_views = ["interpreter", "manager", "builder", "collection_builder"];
var default_view = "manager";
var current_view;
var temporal_variables_subset = [];
var temporal_parent_index = "";
var editor_instances = [];
var temporal_instance_data = '';
var last_viewed_instance_data;
var tree_lines = [];
var temporal_inheritance_lines = [];
var external_triggers_cache = [];
var external_triggers_available_entities;
var inheritance_diagram;
var inheritance_diagram_two_objects = new Object();
var inheritance_diagram_branches = new Object();


//this section if for adding things to the html toolbox
var add_code_execution = { name: "Trigger code", content: 'onClick="executeCustomCode(' + "'" + 'variableName_reserved_code' + "'" + ')"', notes: '' };
var add_styled_button = { name: "Styled button", content: '<button class="generic_button border">Your text here</button>', notes: '' };
var add_metadata_anchor = { name: "Metadata anchor", content: '<div id="metadata_anchor_~id~" style="display:none;"></div>', notes: 'Place the anchor ABOVE all your custom HTML code to make it work' };
var get_uid = { name: "Get UID", content: "~id~" };

var custom_html_tools = [add_metadata_anchor, add_code_execution, add_styled_button, get_uid];

//this section here is for adding things to the code toolbox 
var add_custom_function = { name: "Custom function", content: '~function function_name(){}~' };
var fetch_metadata = { name: "Fetch metadata", content: "let metadata = getPropertyMetadata('metadata_anchor_id');", notes: "Replace the id with the html anchor's id" };
var save_to_variable = { name: "Save value", content: "//to save the value of a custom element, pass to it the value in custom_value\nsaveRawPropertyValue(metadata.parent_index,metadata.input_id,metadata.variable_name,metadata.is_variable_subset,metadata.is_instance,metadata.type,metadata.instance_id,true,metadata.subset_name,custom_value)" };
//variable_name,is_variable_subset,parent_index,is_instance,type,input_id
var get_metadata_variables = { name: "Get metadata variables", content: "//available variables in the metadata: \n//metadata.variable_name;\n//metadata.is_variable_subset; \n//metadata.parent_index;\n//metadata.is_instance;\n//metadata.type;\n//metadata.input_id;" }
var custom_code_tools = [fetch_metadata, save_to_variable, get_metadata_variables];

//this section here is for the toolbox responsible for the custom value load

var get_current_values = { name: "Get property values", content: "//property_value\n//instance_id\n//parent_index" };
var wait_for_element_to_exist = { name: "Wait for dom element", content: "waitForElementToExist('<element in the dom to wait for>').then((elm) => {\n//type your code here\n});" }

var custom_value_load_tools = [get_current_values, wait_for_element_to_exist];
//We initialize the algorithm editor in the builder
var builder_algorithm_editor;
var collection_builder_algorithm_editor;
var builder_ui_lines = [];
var popups_manager;

class externalTrigger {
    constructor(parent_collection, parent_profile, target_profile, target_operation, trigger_type, trigger_value, source_operation) {
        this.element_id = createUID()
        this.parent_collection = parent_collection;
        this.parent_profile = parent_profile;
        this.target_profile = target_profile;
        this.target_operation = target_operation;
        this.trigger_type = trigger_type;
        this.trigger_value = trigger_value;
        this.source_operation = source_operation;
    }
}
document.addEventListener("DOMContentLoaded", function (event) {



    load_schema_button.addEventListener('click', function (event) {
        synchronizeAvailableContentBoxElements(false, "schema");
    });

    document.getElementById("builder_level_selection").addEventListener('change', function () {
        builderInitialization();
    });


    let search_boxes = document.getElementsByClassName("box_search_bar");
    Array.from(search_boxes).forEach(element => {
        element.addEventListener('keydown', function () {
            filterContentBoxes(element.dataset.content_type, element.value);
        });
    });
    let list_search_boxes = document.getElementsByClassName("list_search_bar");
    Array.from(list_search_boxes).forEach(element => {
        element.addEventListener('keydown', function () {
            filterContentLists(element.dataset.content_type, element.value);
        });
    });

    let assignment_search_boxes = document.getElementsByClassName("profile_assign_search_bar");
    Array.from(assignment_search_boxes).forEach(element => {
        element.addEventListener('keydown', function () {
            filterProfileAssignmentBoxes(element.dataset.content_type, element.value);
        });
    });

    menuSelection(default_view);

    // var myCodeMirror = CodeMirror(document.getElementById('available_children'));
    // myCodeMirror.refresh();

    $('#teaching_modal').on('shown', function () {

        let dom_editor = [];
        for (let x in this.editor_instances) {
            let editor = CodeMirror.fromTextArea(document.getElementById(this.editor_instances[x]), {
                lineNumbers: true,
                mode: "htmlmixed"
            });

            dom_editor.push(editor);
        }

        for (let x in dom_editor) {
            dom_editor[x].refresh()
        }
    })

    //Initialization of the profile builder's algorithm editor with ACE:

    builder_algorithm_editor = ace.edit("builder_algorithm");
    ace.require("ace/ext/language_tools");
    builder_algorithm_editor.setOptions({

        highlightActiveLine: true,
        enableLiveAutocompletion: true,
        enableBasicAutocompletion: true
    });
    builder_algorithm_editor.setTheme("ace/theme/chrome");
    builder_algorithm_editor.session.setMode("ace/mode/javascript");
    document.getElementById('builder_algorithm').style.fontSize = '18px';
    builder_algorithm_editor.setValue('');
    //End of the initialization of the profile builder's algorithm editor

    //Initialization of the profile builder's algorithm editor with ACE
    collection_builder_algorithm_editor = ace.edit("collection_builder_algorithm_editor");
    ace.require("ace/ext/language_tools");
    collection_builder_algorithm_editor.setOptions({

        highlightActiveLine: true,
        enableLiveAutocompletion: true,
        enableBasicAutocompletion: true
    });
    collection_builder_algorithm_editor.setTheme("ace/theme/chrome");
    collection_builder_algorithm_editor.session.setMode("ace/mode/javascript");
    document.getElementById('collection_builder_algorithm_editor').style.fontSize = '18px';
    collection_builder_algorithm_editor.setValue('');
    //End of the initialization of the profile builder's algorithm editor

    //we initialize the field for dropping library elements and loading them into RADIANCE
    $('#files_drop').fileDrop({

        removeDataUriScheme: true,
        decodebase64: true,
        onFileRead: function (fileCollection) {
            $.each(fileCollection, function () {
                //Do stuff with fileCollection here!
                let object_to_load = $.removeUriScheme(this.data);
                object_to_load = window.atob(object_to_load);
                object_to_load = JSON.parse(object_to_load);
                let type_to_load = document.getElementById('library_loader_selection').value;
                let exists = checkExistence(type_to_load, object_to_load);
                console.log(object_to_load);
                //In this step we now have the data loaded
                //we gotta check if an element with the same ID exists
                //  if it exists, we assign to the element being loaded the name +_copy and a new ID
                //  if it does not exist, we simply load the item

                if (exists == null) {
                    //we prompt the user to confirm
                    alertify.confirm('WARNING!', 'Are you sure you want to override the current database used by RADIANCE? A backup of the current database will be downloaded beforehand in case you want to roll back this decision.', function () {
                        try {
                            downloadDatabase();
                            console.log("CURRENT DB: \n" + db);
                            db = '';
                            db = object_to_load;
                            console.log("NEW DB: \n" + db);
                            updateLocalStorage();
                            alertify.success('Database overridden successfully');
                            $('#load_library_modal').modal('hide');

                        } catch (e) {
                            alertify.error('Unexpected error (see console): ' + e);
                            console.log('%c' + e, 'color:red;');
                        }

                    }
                        , function () { alertify.error('Database override cancelled') });

                } else {
                    if (exists.exists == true) {
                        object_to_load.element_id = Date.now() + (Math.random() * 100);
                        object_to_load.element_name = object_to_load.element_name + '_copy';
                        //store the new profile/schema/whatever
                        db[exists.route].push(object_to_load);
                        updateLocalStorage();
                        $('#load_library_modal').modal('hide');
                        alertify.success(type_to_load + " successfully loaded");
                    } else {

                        //store the new profile/schema/whatever
                        db[exists.route].push(object_to_load);
                        updateLocalStorage();
                        $('#load_library_modal').modal('hide');
                        alertify.success(type_to_load + " successfully loaded");
                    }
                }

                function checkExistence(type, object) {
                    let route = '';//to set the route to the right array of the DB.
                    if (type == 'schema') {
                        //the file contains an object
                        route = "schema_Array";
                    } else if (type == 'profile') {
                        //the file contains an object
                        route = "profile_Array";
                    } else if (type == 'collection') {
                        //the file contains an object
                        route = "collection_Array";
                    } else if (type == 'db') {
                        route = "";
                        return null;
                    }

                    //now we check if the element exists
                    if (findInstancePlaceInStorage(route.split("_Array").join(''), object.element_id) !== null) {
                        //the profile exists
                        return { exists: true, route };
                    } else {
                        return { exists: false, route };
                    }
                }
            });

        }

    });

    checkMemoryUsage();

    //we prompt the user for the tutorial
    let tutorial = true;
    if (tutorial == true) { loadSample() };

});

function loadSample() {
    let project = atob(tutorial_64);
    //we load the project from the variable tutorial_64 in the file 
    this.db = JSON.parse(project);
    updateLocalStorage();
    setBuilderSelection('profile', 1601203758668);
    menuSelection('builder');
    //check the size of the screen 
    var w = window.innerWidth;
    var h = window.innerHeight;
    let warning = '';
    if (w < 1080) {
        warning = '<div id="size-check" class="report_highlight_advice" style="">  <h5 style="color:darkred;text-align:center;">Your screen does not meet the minimum requirement for this test: a screen resolution of at least 1080x768<br> <u style="color:red;text-align:center;">Please refrain from taking this test</u></h5></div>';
    }
    let introduction = '<div class="" style="font-family: Raleway;"><h5 style="text-align:center;">Welcome to RADIANCE, a Green Software Engineering tool currently in a <i><u style="">BETA</u></i> state</h5> <ul><li>RADIANCE allows you to <u>design</u> the architecture and behavior of software using your previous knowledge, such as UML and programming-related concepts.</li> <li>The <b>objective</b> of this test is for the testers to decide if our <u style="color:darkgreen">green</u> features make you more aware of how certain software characteristics affect its energy consumption.</li><li> RADIANCE' + "'s" + ' <u style="color:darkgreen">green</u> features:<ul><li>Categorize from A to G the functions you declare by using a custom algorithm.<li>Rate the prospective consumption of the execution of your software model.</li><li>Create a report with advice on what choices can make the final software more efficient.</li></ul></ul>' + warning + 'The tutorial and its following questionnare will only take 10 minutes. Click "OK" to begin.</div>';


    alertify.confirm('<img class="img-fluid" id="radiance_logo_top" width="50%" src="./res/logohor.png" style="min-width: 140px;">', introduction, function () {
        mytutorial.start();
    }
        , function () { alertify.error('Usability test cancelled.') });


    var mytutorial = new Tutorial("usability_test", {
        steps: [
            {
                highlight: "#currently_selected_profile",

                text: 'You are currently inside an empty software model called "Tutorial"',
                position: 'bottom'
            },
            {
                highlight: "#available_parents",

                text: 'There are three main categories inside of a profile: Model characteristics, Functions/methods and Parameters. ',
                position: 'right'
            },
            {
                highlight: "#_0_parent_header",

                text: 'Model characteristics are used to describe the general behavioral attributes of the model. When you click on it, the current model' + "'" + 's characteristics get displayed.',
                position: 'right',
                callback: {
                    fn: () => {
                        populateChildren('0', null, null, false, true);
                        setTimeout(() => { document.getElementById("Computation_centric_subset_header").firstChild.click(); }, 1500);
                    }
                }
            },
            {
                highlight: "#available_variables_area",

                text: 'Some sub-categories are displayed inside, as well as several options. Each one represents a characteristic of the behavior of the software you are modeling, and each one affects how your model is rated.',
                position: 'left',
                callback: {
                    fn: () => {
                        setTimeout(() => { document.getElementById("Computation_centric_subset_header").firstChild.click(); }, 1500);

                    }
                }
            },
            {
                highlight: "#_15_parent_header",

                text: 'The Functions/Methods category is used to create instances of new functions and methods. You can add a new Function/Method by clicking in the "+" icon. Click on "Next" to see it. ',
                position: 'bottom',
                callback: {
                    fn: () => {
                        createInstanceFromProfileElement('test', 'available_children', 15, 15, 1);
                        populateChildren('15', null, null, true, true);

                    }
                }
            },
            {
                highlight: "#available_children_area",

                text: 'What you see here are the instances of the Functions/Models you have created, each one has their own name and their own characteristics. When you click on one, its properties are shown to you. Click on "Next".',
                position: 'bottom',
                callback: {
                    fn: () => {
                        let children = document.getElementById('available_children_area');
                        let available_children = children.getElementsByClassName("accordion-button");
                        available_children[0].click();
                        setTimeout(() => { document.getElementById("resource_usage_subset_header").firstChild.click(); document.getElementById('Processor_usage_1673438264399').classList.add('attention') }, 2000);

                    }
                }
            },
            {
                highlight: "#available_variables_area",

                text: 'You will see properties inside of different categories that correspond to their nature. After this tutorial, you will be free to select whichever value you think that conforms the best to what the function or method will do. (Attention: functions/methods are called operations in some places).',
                position: 'left',
                callback: {
                    fn: () => {
                        let children = document.getElementById('available_children_area');
                        let available_children = children.getElementsByClassName("accordion-button");
                        available_children[0].click();

                    }
                }
            },
            {

                highlight: "#_19_parent_header",

                text: 'Creating parameters and editing them works the same as functions/methods.',
                position: 'right',
                callback: {

                }
            },
            {

                highlight: "#radiance_logo_top",

                text: 'Lets load an example of a model of a video game',
                position: 'bottom',
                callback: {
                    fn: () => {

                        //we load the project from the variable tutorial_64 in the file 
                        this.db = JSON.parse(atob(sample_profile_64));
                        updateLocalStorage();
                        setBuilderSelection('profile', 887770500712);
                        setTimeout(() => { runBuilderAlgorithm('profile_builder') }, 300);
                        $('#temporal_report_modal').modal('toggle');
                    }
                }
            },
            {
                highlight: "#available_children_area",

                text: 'As you can see, the functions in this model are rated with a letter and a color. Ratings go from A (most frugal) to G, and they depend on the amount of resources a function consumes, as well as the behavioral traits of the model.',
                position: 'left',
                callback: {

                }
            },
            {
                highlight: "#model_sequencer_column",

                text: 'In order to obtain a rating, a function must have a trigger that defines what "activates" it; sets it in action. You can define this in the model sequencer. ',
                position: 'right',
                callback: {
                    fn: () => {
                        setTimeout(() => { document.getElementsByClassName('tutorial-close')[0].scrollIntoView({ behavior: "smooth" }); }, 1000);
                    }
                }
            },
            {
                highlight: "#model_sequencer_column",

                text: 'There are 3 things that can trigger a function: receiving a parameter, an active model state, and another function.',
                position: "right",

                callback: {
                    fn: () => {
                        //document.getElementById('results_sequencer_rules').parentNode.parentNode.previousSibling.nextElementSibling.previousElementSibling.children[0].click();
                        document.getElementById('results_sequencer_rules').parentElement.parentElement.previousElementSibling.classList.add('attention');
                        setTimeout(() => { document.getElementsByClassName('tutorial-close')[0].scrollIntoView({ behavior: "smooth" }); }, 1000);
                    }
                }
            },
            {
                highlight: "#model_sequencer_column",

                text: 'Triggering a function (A) with a parameter requires an exchange of a parameter with another function (B): Function B -parameter-> Function A. These relationships are created in the "Messages section".',
                position: "right",

                callback: {
                    fn: () => {
                        document.getElementById('results_sequencer_rules').parentElement.parentElement.previousElementSibling.classList.remove('attention');
                        document.getElementById('triggers_sequencer_rules').parentNode.parentNode.previousSibling.nextElementSibling.previousElementSibling.children[0].click();
                        document.getElementById('triggers_sequencer_rules').parentElement.parentElement.previousElementSibling.classList.add('attention');
                        setTimeout(() => { document.getElementsByClassName('tutorial-close')[0].scrollIntoView({ behavior: "smooth" }); }, 1000);
                    }
                }
            },
            {
                highlight: "#model_sequencer_column",

                text: 'The rest of the triggers are edited in the "Triggers" section. When you trigger by state, the "run" option means that the function will run in the beginning. It is a good idea to create this trigger in the beginning of every model. ',
                position: "right",

                callback: {
                    fn: () => {
                        setTimeout(() => { document.getElementsByClassName('tutorial-close')[0].scrollIntoView({ behavior: "smooth" }); }, 1000);
                        document.getElementById('triggers_sequencer_rules').parentElement.parentElement.previousElementSibling.classList.remove('attention');
                    }
                }
            },
            {
                highlight: "#plantuml_builder_flow",
                text: 'As you define messages, a sequence diagram is automatically generated to help you understand the flow of the functions. After the tutorial, you can click on "pop-out" to view it in another tab.',
                position: 'left',
                callback: {
                    fn: () => {
                        document.getElementById('run_algorithm_button').classList.add('attention');
                    }
                }
            },
            {
                highlight: '#run_algorithm_button',
                text: 'Once your model is ready you can rate its elements using this button. Keep in mind this: all the properties of the model and its functions should have a valid value, and the functions a valid trigger.',
                position: 'bottom',
                callback: {
                    fn: () => {
                        document.getElementById('run_algorithm_button').click();
                        document.getElementById('highlights_found').parentNode.parentElement.classList.add('attention');
                        setTimeout(() => {document.getElementById('highlights_found').parentNode.click(); }, 1000);
                        
                        
                    }
                }
            },
            {
                highlight: '#radiance_logo_top',
                text: 'You will find advice according to your model'+"'"+'s characteristics in the highlights section. They are things you should keep in mind to reduce the energy footprint of your sotfware in the next stages after the design and analysis.',
                position: 'bottom',
                callback: {
                    fn: () => {
                        $('#temporal_report_modal').modal('toggle');
                    }
                }
            },
            {
                highlight: '#plantuml_builder_timing',
                text: 'Now that the functions are classified, a step diagram is generated. The step diagram indicates the sequence in which your functions are triggered, with support for parallelism. A function triggered by another function will be "executed" simultaneously to the function that triggered it. For instance, the functions in step 3 are all executed in parallel. The colors represent the rating of the "step" (point of the sequence), and they depend on the definition of each function.',
                position: 'left',
                callback: {
                    fn: () => {
                        document.getElementById('questionnare_button').style.visibility="";
                    }
                }
            },
            {
                highlight: '#radiance_logo_top',
                text: 'You can now use RADIANCE. Try to build a model that represents a real world example, such as YouTube, with 4 functions: "Load video", "Play video", "Play sound" and "Show similar videos". Once you are done, rate your model and finish by filling our brief questionnare by clicking on the button located at the bottom right corner. Thank you for your time!',
                position: 'bottom',
                callback: {
                    fn: () => {
                        let project = atob(tutorial_64);
                        //we load the project from the variable tutorial_64 in the file 
                        this.db = JSON.parse(project);
                        updateLocalStorage();
                        setBuilderSelection('profile', 1601203758668);
                        menuSelection('builder');
                    }
                }
            }









        ],
        progressbar: true
    });



}

function restartTooltips() {
    $('[data-toggle="tooltip"]').tooltip({
        trigger: 'hover'
    });
    $('[data-toggle="tooltip"]').on('click', function () {
        $(this).tooltip('hide');
    })
}
function playSound(sound) {

    if (this.audio) {

        if (sound == "clone") {
            var audio = new Audio('res/clone.mp3');
            audio.volume = 0.1;
            audio.play();
        }
        if (sound == "delete") {
            var audio = new Audio('res/delete.mp3');
            audio.volume = 0.1;
            audio.play();
        }
        if (sound == "Success") {
            var audio = new Audio('res/Success.mp3');
            audio.volume = 0.1;
            audio.play();
        }
        if (sound == "Success_2") {
            var audio = new Audio('res/Success_2.mp3');
            audio.volume = 0.1;
            audio.play();
        }

    }

}

class windowManager {

    sequence_diagram_popups = [];
    timing_diagram_popups = [];

    openWindow(type) {
        //two types of windows correspond to the popups
        if (type == 'sequence') {
            let window_id = createUID();
            let new_window = window.open(location.toString().replace('#','') + "sequence_preview.html", window_id);
            this.sequence_diagram_popups.push(new_window);

        } else {
            let window_id = createUID();
            let new_window = window.open(location.toString().replace('#','')  + "timing_preview.html", window_id);
            this.timing_diagram_popups.push(new_window);
        }
    }
    refreshWindows() {
        let sequence_windows_to_delete = [];
        let timing_diagram_windows_to_delete = [];


        for (let x in this.sequence_diagram_popups) {
            try {
                if (this.sequence_diagram_popups[x] != null) {

                    this.sequence_diagram_popups[x].location.reload();
                }
            }
            catch (error) {
                sequence_windows_to_delete.push(x);
            }

        }

        for (let y in this.timing_diagram_popups) {
            try {
                if (this.timing_diagram_popups[y] != null) {
                    this.timing_diagram_popups[y].location.reload();
                }
            } catch (error) {
                timing_diagram_windows_to_delete.push(x);
            }





            this.deleteDeadWindows(sequence_windows_to_delete, timing_diagram_windows_to_delete);
        }
    }

    deleteDeadWindows(sequence, timing) {
        for (let x in sequence) {
            this.sequence_diagram_popups.splice(x, 1);
        }
        for (let y in timing) {
            this.timing_diagram_popups.splice(y, 1);
        }
        sequence = [];
        timing = [];

    }


};

popups_manager = new windowManager();

//to synchronize all the UI
function restartUI() {
    from = "Restart UI: ";
    synchronizeAvailableContentBoxElements(true, "");
    synchronizeAvailableContentListElements(true, "");
    restartTooltips();

    console.log(from + " UI synchronized");
}

function synchronizeAvailableContentBoxElements(all, specificType) {
    from = "UI handler: ";
    if (all) {
        for (i in availableTypes) {
            let currentType = availableTypes[i];
            //console.log(from+ " synchronizing "+currentType+" in content boxes");
            if (db[currentType + "_Array"].length >= 0) {
                //we first get every content_box
                let dom_content_boxes_found = document.getElementsByClassName("content_box");

                //we check that the content type is schema
                let content_box_places = matchDomAttributeSearch(dom_content_boxes_found, currentType);
                ;
                //we clear the available content for each place (pertinent content box)

                $('[data-toggle="tooltip"]').tooltip('dispose');
                //console.log(from+" adding a "+currentType+"("+db[currentType+"_Array"].length+") in ("+content_box_places.length+") content boxes");

                fillInElements(currentType, content_box_places, "box", "");

            }

        }
    } else {
        if (db.hasOwnProperty(specificType + '_Array')) {
            if (db[specificType + "_Array"].length >= 0) {
                //we first get every content_box
                let dom_content_boxes_found = document.getElementsByClassName("content_box");

                let content_box_places = matchDomAttributeSearch(dom_content_boxes_found, specificType);


                $('[data-toggle="tooltip"]').tooltip('dispose');
                //console.log(from+" adding a "+specificType+"("+db[specificType+"_Array"].length+") in ("+content_box_places.length+") content boxes");

                fillInElements(specificType, content_box_places, "box", "");


            }
        } else {
            console.log("Not such property");
        }
    }



}

function synchronizeAvailableContentListElements(all, specificType, local) {
    from = "UI handler: ";
    if (all) {
        for (i in availableTypes) {
            let currentType = availableTypes[i];
            //console.log(from+ " synchronizing "+currentType+" in content list elements");
            if (db[currentType + "_Array"].length >= 0) {
                //we first get every content_box
                let dom_content_lists_found = document.getElementsByClassName("content_list");

                //we check that the content type is schema
                let content_list_places = matchDomAttributeSearch(dom_content_lists_found, currentType);
                ;
                //we clear the available content for each place (pertinent content box)

                $('[data-toggle="tooltip"]').tooltip('dispose');
                //console.log(from+" adding a "+currentType+"("+db[currentType+"_Array"].length+") in ("+content_list_places.length+") content lists");

                fillInElements(currentType, content_list_places, "list", "");

            }

        }
    } else {
        if (db.hasOwnProperty(specificType.type + '_Array')) {
            if (db[specificType.type + "_Array"].length >= 0) {
                //we first get every content_box
                let dom_content_lists_found = document.getElementsByClassName(specificType.class);
                //the second argument is the data type
                let content_list_places = matchDomAttributeSearch(dom_content_lists_found, specificType.dom_data_type);

                //console.log(content_list_places);
                $('[data-toggle="tooltip"]').tooltip('dispose');

                fillInElements(specificType.type, content_list_places, specificType.dom_data_type, "");


            }
        } else {
            //localized element fill
        }
    }



}

function fillInElements(elementType, places, contentType, filter) {
    let database = db[elementType + "_Array"];
    places.forEach(place => {
        place.innerHTML = '';
    });

    if (elementType == "schema" && contentType == "box") {
        database.forEach(element => {

            let layout = '<div class="col-12 content_box_column"><div class="row text-center"> <div class="col-8"><button  type="button" id="' + element.element_id + '" onclick="toggleType(' + element.element_id + ',' + "'schema'" + ')" class="btn ">' + element.element_name + '</button></div><div class="col-1" style="padding-left:2px;padding-right:2px;"><img src="res/download.png" class="img-fluid" alt="Responsive image" width="70%" style="padding-top:10px"data-toggle="tooltip" data-placement="bottom" title="Download this element" onclick="downloadElement(' + "'schema'" + ',' + element.element_id + ')"></div><div class="col-1" style="padding-left:2px;padding-right:2px;"><img src="res/edit.png" class="img-fluid" alt="Responsive image" width="70%" style="max-width:32px;padding-top:10px"data-toggle="tooltip" data-placement="bottom" title="Edit this element" onclick="rawEditElement(' + "'schema'" + ',' + element.element_id + ')" data-bs-toggle="modal" data-bs-target="#raw_edit_modal"></div><div class="col-1" style="padding-left:2px;padding-right:2px;"><img src="res/clone.png" class="img-fluid" alt="Responsive image" width="100%" data-toggle="tooltip" data-placement="bottom" title="Clone this element" onclick="cloneFromStorage(' + "'schema'," + element.element_id + ')"></div><div class="col-1"style="padding-left:2px;padding-right:2px;"><img src="res/delete.svg" class="img-fluid" alt="Responsive image" width="70%" style="padding-top:10px min-width:20px;"data-toggle="tooltip" data-placement="bottom" title="Delete this element" onclick="deleteFromStorage(' + "'schema'," + element.element_id + ')"></div> </row> </div>';
            //we fill the pertinent content boxes with the available schemas
            places.forEach(place => {
                //there is a filter in place
                if (filter != "" && element.element_name.includes(filter)) {
                    place.innerHTML += layout;
                } else if (filter == "") {
                    place.innerHTML += layout;
                }
            });

        });

    } else if (elementType == "schema" && contentType == "list") {
        database.forEach(element => {
            let htmid = Date.now();
            //if the builder is hidden, the onclick becomes the instance option
            //if the builder is active, the onclick becomes the selection for the builder
            let action;
            if (current_view == "manager_view") {
                action = "instanceSchema(" + element.element_id + ")";
            } else if (current_view == "builder_view") {
                action = "setBuilderSelection(" + element.element_schema + ")";
            }
            let layout = '<div class="col-12 content_box_column" onclick="' + action + '" id="' + element.element_id + htmid + '"><div class="row text-center"> <div class="col-12 "><button  type="button" id="' + element.element_id + '"  class="btn">' + element.element_name + '</button></div> </row> </div>';
            //we fill the pertinent content boxes with the available schemas
            places.forEach(place => {
                //there is a filter in place
                if (filter != "" && element.element_name.includes(filter)) {
                    place.innerHTML += layout;
                } else if (filter == "") {
                    place.innerHTML += layout;
                }
            });
        });
    }

    if (elementType == "profile" && contentType == "box") {
        database.forEach(element => {

            let layout = '<div class="col-12 content_box_column"><div class="row text-center"><div class="col-3" id="' + element.element_id + '_available_scores" style="margin-top:10px;"><div class="row rule"><div class="col rule" id="' + element.element_id + '_lowest_cs"></div><div class="col rule" style="font-size:smaller;">to</div><div class="col rule" id="' + element.element_id + '_highest_cs"></div></div></div> <div class="col-5"><button  type="button" id="' + element.element_id + '" class="btn " style="font-size:small;">' + element.element_name + '</button></div><div class="col-1" style="padding-left:2px;padding-right:2px;"><img src="res/download.png" class="img-fluid" alt="Responsive image" width="70%" style="padding-top:10px"data-toggle="tooltip" data-placement="bottom" title="Download this element" onclick="downloadElement(' + "'" + elementType + "'" + ',' + element.element_id + ')"></div><div class="col-1" style="padding-left:2px;padding-right:2px;"><img src="res/edit.png" class="img-fluid" alt="Responsive image" width="70%" style="max-width:32px;padding-top:10px"data-toggle="tooltip" data-placement="bottom" title="Edit this element" onclick="rawEditElement(' + "'" + elementType + "'," + element.element_id + ')" data-bs-toggle="modal" data-bs-target="#raw_edit_modal"></div><div class="col-1" style="padding-left:2px;padding-right:2px;"><img src="res/clone.png" class="img-fluid" alt="Responsive image" width="100%" data-toggle="tooltip" data-placement="bottom" title="Clone this element" onclick="cloneFromStorage(' + "'" + elementType + "'," + element.element_id + ')"></div><div class="col-1"style="padding-left:2px;padding-right:2px;"><img src="res/delete.svg" class="img-fluid" alt="Responsive image" width="70%" style="padding-top:10px;"data-toggle="tooltip" data-placement="bottom" title="Delete this element" onclick="deleteFromStorage(' + "'" + elementType + "'," + element.element_id + ')"></div> </row> </div>';
            //we fill the pertinent content boxes with the available schemas


            places.forEach(place => {
                //there is a filter in place
                if (filter != "" && element.element_name.includes(filter)) {
                    place.innerHTML += layout;
                } else if (filter == "") {
                    place.innerHTML += layout;
                }
            });

            //we add the available CS to the profiles
            try {


                if (element.hasOwnProperty("lowest_cs")) {
                    let lowest_label = getCategoryAccordingToTaxonomy(element.lowest_cs);
                    console.log("FOUND LABEL: " + lowest_label.label);
                    var params = {
                        fullscreen: false
                    };
                    var elem = document.getElementById(element.element_id + '_lowest_cs');
                    var two = new Two(params).appendTo(elem);
                    two.width = 20;
                    two.height = 20;
                    var circle = two.makeCircle(10, 10, 9);
                    let text = '?';
                    if (lowest_label.label != '') {
                        text = lowest_label.label;
                    }
                    var rating = two.makeText(text, 10, 10);
                    lowest_label.color == '' ? circle.fill = '#ffffff' : circle.fill = lowest_label.color;
                    two.update();
                    $('[data-toggle="tooltip"]').tooltip();

                    let highest_label = getCategoryAccordingToTaxonomy(element.highest_cs);

                    var elem_2 = document.getElementById(element.element_id + '_highest_cs');
                    var two_two = new Two(params).appendTo(elem_2);
                    two_two.width = 20;
                    two_two.height = 20;
                    var circle_two = two_two.makeCircle(10, 10, 9);
                    text = '?';
                    if (highest_label.label != '') {
                        text = highest_label.label;
                    }
                    rating = two_two.makeText(text, 10, 10);
                    highest_label.color == '' ? circle_two.fill = '#ffffff' : circle_two.fill = highest_label.color;
                    two_two.update();


                } else {
                    document.getElementById(element.element_id + '_available_scores').innerHTML = "";
                    let lowest_label = getCategoryAccordingToTaxonomy(0);
                    lowest_label.color = '';
                    lowest_label.label = '';
                    console.log("FOUND LABEL: " + lowest_label.label);
                    var params = {
                        fullscreen: false
                    };
                    var elem = document.getElementById(element.element_id + '_available_scores');
                    var two = new Two(params).appendTo(elem);
                    two.width = 50;
                    two.height = 50;
                    var circle = two.makeCircle(20, 20, 12);
                    let text = '?';
                    if (lowest_label.label != '') {
                        text = lowest_label.label;
                    }
                    var rating = two.makeText(text, 20, 20);
                    lowest_label.color == '' ? circle.fill = '#ffffff' : circle.fill = lowest_label.color;
                    two.update();

                }
            } catch (error) {

            }

        });

    } else if (elementType == "profile" && contentType == "list") {
        database.forEach(element => {
            let htmid = Date.now();
            let action;
            if (current_view == "manager_view") {
                action = "instanceSchema(" + element.element_id + ")";
            } else if (current_view == "builder_view") {
                action = "setBuilderSelection('profile'," + element.element_id + ")";
            }
            let layout = '<div class="col-12 content_box_column" onclick="' + action + '" id="' + element.element_id + htmid + '"><div class="row text-center"> <div class="col-12 "><button  type="button" id="' + element.element_id + '"  class="btn">' + element.element_name + '</button></div> </row> </div>';
            //we fill the pertinent content boxes with the available schemas
            places.forEach(place => {
                //there is a filter in place
                if (filter != "" && element.element_name.includes(filter)) {
                    place.innerHTML += layout;
                } else if (filter == "") {
                    place.innerHTML += layout;
                }
            });
        });
    } else if (elementType == "collection" && contentType == "box") {
        database.forEach(element => {

            let layout = '<div class="col-12 content_box_column"><div class="row text-center"> <div class="col-8"><button  type="button" id="' + element.element_id + '" class="btn ">' + element.element_name + '</button></div><div class="col-1" style="padding-left:2px;padding-right:2px;"><img src="res/download.png" class="img-fluid" alt="Responsive image" width="70%" style="padding-top:10px"data-toggle="tooltip" data-placement="bottom" title="Download this element" onclick="downloadElement(' + "'" + elementType + "'" + ',' + element.element_id + ')"></div><div class="col-1" style="padding-left:2px;padding-right:2px;"><img src="res/edit.png" class="img-fluid" alt="Responsive image" width="70%" style="max-width:32px;padding-top:10px"data-toggle="tooltip" data-placement="bottom" title="Edit this element" onclick="rawEditElement(' + "'" + elementType + "'," + element.element_id + ')" data-bs-toggle="modal" data-bs-target="#raw_edit_modal"></div><div class="col-1" style="padding-left:2px;padding-right:2px;"><img src="res/clone.png" class="img-fluid" alt="Responsive image" width="100%" data-toggle="tooltip" data-placement="bottom" title="Clone this element" onclick="cloneFromStorage(' + "'" + elementType + "'," + element.element_id + ')"></div><div class="col-1"style="padding-left:2px;padding-right:2px;"><img src="res/delete.svg" class="img-fluid" alt="Responsive image" width="70%" style="padding-top:10px;"data-toggle="tooltip" data-placement="bottom" title="Delete this element" onclick="deleteFromStorage(' + "'" + elementType + "'," + element.element_id + ')"></div> </row> </div>';
            //we fill the pertinent content boxes with the available schemas
            places.forEach(place => {
                //there is a filter in place
                if (filter != "" && element.element_name.includes(filter)) {
                    place.innerHTML += layout;
                } else if (filter == "") {
                    place.innerHTML += layout;
                }
            });

        });

    } else if (elementType == "collection" && contentType == "list") {
        database.forEach(element => {
            let action = '';
            let htmid = Date.now();
            let layout = '<div class="col-12 content_box_column" onclick="chooseCollection(' + element.element_id + ')" id="' + element.element_id + htmid + '"><div class="row text-center"> <div class="col-12 "><button  type="button" id="' + element.element_id + '"  class="btn">' + element.element_name + '</button></div> </row> </div>';
            //we fill the pertinent content boxes with the available schemas
            places.forEach(place => {
                //there is a filter in place
                if (filter != "" && element.element_name.includes(filter)) {
                    place.innerHTML += layout;
                } else if (filter == "") {
                    place.innerHTML += layout;
                }
            });

        });

    } else if (elementType == "profile" && contentType == "profile-assign") {
        database.forEach(element => {

            let htmid = Date.now();
            let action;
            //we have to check that the parent of the instance is not a consumption guide
            //get the profile
            let profile_parent = element.element_schema;
            let schema = getSchemaFromArray(db.schema_Array, profile_parent);
            if (schema == null) {
                alertify.error('There was an error verifying that the instance is not a consumption guide. This error is related to the parameter pool.');
                return;
            } else {
                if (schema.is_guide == false || schema.hasOwnProperty('is_guide') == false || schema.is_guide == null) {
                    console.log("The schema" + schema.element_name + "is not a consumption guide");
                    console.log("The profile " + element.element_name + " was added");
                    //check if the parent of the profile is a guide
                    //we need to signal in some visual way that the profile has been selected
                    let style = 'content_box_column';
                    let button_view = '';

                    if (checkIfAssigned(element.element_id, this.collection_selected.inner_profiles)) {
                        style = 'content_box_column_selected';

                    } else {
                        button_view = '<div class="col-1 text-center align-middle"align="center"><a class="instance_add"  onclick="collectionAssign(' + element.element_id + ')" style="margin-left:auto;margin-right:auto;margin-top:10px;" data-toggle="tooltip" data-placement="bottom" title=""><strong>+</strong></a></div>';
                    }

                    //cb_  stands for collection builder, eg: cb_+element.element_id+_highest_cs
                    let layout = '<div class="col-12  ' + style + '" id="deassigned_' + element.element_id + '_profile"><div class="row text-center"><div class="col-3" id="cb_' + element.element_id + '_available_scores" style="margin-top:10px;"><div class="row rule"><div class="col rule" id="cb_' + element.element_id + '_lowest_cs"></div><div class="col rule" style="font-size:smaller;">to</div><div class="col rule" id="cb_' + element.element_id + '_highest_cs"></div></div></div> <div class="col-8 "><button  type="button" id="' + element.element_id + '"  class="btn">' + element.element_name + '</button></div> ' + button_view + '</row> </div>';


                    //we fill the pertinent content boxes with the available schemas
                    places.forEach(place => {
                        //there is a filter in place
                        if (filter != "" && element.element_name.includes(filter)) {
                            place.innerHTML += layout;
                        } else if (filter == "") {
                            place.innerHTML += layout;
                        }
                    });

                    //we add the available CS to the profiles
                    try {


                        if (element.hasOwnProperty("lowest_cs")) {
                            let lowest_label = getCategoryAccordingToTaxonomy(element.lowest_cs);
                            console.log("FOUND LABEL: " + lowest_label.label);
                            var params = {
                                fullscreen: false
                            };
                            var elem = document.getElementById('cb_' + element.element_id + '_lowest_cs');
                            var two = new Two(params).appendTo(elem);
                            two.width = 20;
                            two.height = 20;
                            var circle = two.makeCircle(10, 10, 9);
                            let text = '?';
                            if (lowest_label.label != '') {
                                text = lowest_label.label;
                            }
                            var rating = two.makeText(text, 10, 10);
                            lowest_label.color == '' ? circle.fill = '#ffffff' : circle.fill = lowest_label.color;
                            two.update();
                            $('[data-toggle="tooltip"]').tooltip();

                            let highest_label = getCategoryAccordingToTaxonomy(element.highest_cs);

                            var elem_2 = document.getElementById('cb_' + element.element_id + '_highest_cs');
                            var two_two = new Two(params).appendTo(elem_2);
                            two_two.width = 20;
                            two_two.height = 20;
                            var circle_two = two_two.makeCircle(10, 10, 9);
                            text = '?';
                            if (highest_label.label != '') {
                                text = highest_label.label;
                            }
                            rating = two_two.makeText(text, 10, 10);
                            highest_label.color == '' ? circle_two.fill = '#ffffff' : circle_two.fill = highest_label.color;
                            two_two.update();


                        } else {
                            document.getElementById('cb_' + element.element_id + '_available_scores').innerHTML = "";
                            let lowest_label = getCategoryAccordingToTaxonomy(0);
                            lowest_label.color = '';
                            lowest_label.label = '';
                            console.log("FOUND LABEL: " + lowest_label.label);
                            var params = {
                                fullscreen: false
                            };
                            var elem = document.getElementById('cb_' + element.element_id + '_available_scores');
                            var two = new Two(params).appendTo(elem);
                            two.width = 50;
                            two.height = 50;
                            var circle = two.makeCircle(20, 20, 12);
                            let text = '?';
                            if (lowest_label.label != '') {
                                text = lowest_label.label;
                            }
                            var rating = two.makeText(text, 20, 20);
                            lowest_label.color == '' ? circle.fill = '#ffffff' : circle.fill = lowest_label.color;
                            two.update();

                        }
                    } catch (error) {

                    }




                } else {
                    console.log(schema.element_name + " is a consumption guide");
                }
            }

        });

    } else if (elementType == "profile" && contentType == "profile-deassign") {
        database.forEach(element => {
            let htmid = Date.now();
            let action;
            if (current_view == "manager_view") {
                action = "instanceSchema(" + element.element_id + ")";
            } else if (current_view == "builder_view") {
                action = "setBuilderSelection('profile'," + element.element_id + ")";
            }
            //we need to turn green those that already exist in the selected collection

            //we fill the pertinent content boxes with the available schemas
            if (checkIfAssigned(element.element_id, this.collection_selected.inner_profiles)) {

                let layout = '<div class="col-12 content_box_column" id="assigned_' + element.element_id + '_profile"><div class="row text-center"><div class="col-4"><a class="instance_delete"  onclick="collectionDeassign(' + element.element_id + ')" style="margin-left:auto;margin-right:auto;margin-top:10px;" data-toggle="tooltip" data-placement="bottom" title="Remove from collection" data-bs-original-title="Delete instance "><strong>-</strong></a></div> <div class="col-8 "><button  type="button" id="' + element.element_id + '"  class="btn">' + element.element_name + '</button></div> </row> </div>';
                places.forEach(place => {
                    //there is a filter in place
                    if (filter != "" && element.element_name.includes(filter)) {
                        place.innerHTML += layout;
                    } else if (filter == "") {
                        place.innerHTML += layout;
                    }
                });
            }
        });

    } else if (elementType == "collection" && contentType == "collection-assign") {
        database.forEach(element => {
            if (element.element_id !== this.collection_selected.element_id) {
                let htmid = Date.now();
                let action;
                if (current_view == "manager_view") {
                    action = "instanceSchema(" + element.element_id + ")";
                } else if (current_view == "builder_view") {
                    action = "setBuilderSelection('profile'," + element.element_id + ")";
                }
                //we need to turn green those that already exist in the selected collection
                let style = 'content_box_column';
                let button_view = '';
                if (checkIfAssigned(element.element_id, this.collection_selected.inner_collections)) {
                    style = 'content_box_column_selected';

                } else {
                    button_view = '<div class="col-4 text-center align-middle"align="center"><a class="instance_add"  onclick="collectionAssign(' + element.element_id + ',' + "'" + 'true' + "'" + ')" style="margin-left:auto;margin-right:auto;margin-top:10px;" data-toggle="tooltip" data-placement="bottom" title=""><strong>+</strong></a></div>';
                }
                let layout = '<div class="col-12  ' + style + '" id="deassigned_' + element.element_id + '_collection"><div class="row text-center"> <div class="col-8 "><button  type="button" id="' + element.element_id + '"  class="btn">' + element.element_name + '</button></div> ' + button_view + '</row> </div>';
                //we fill the pertinent content boxes with the available schemas
                places.forEach(place => {
                    //there is a filter in place
                    if (filter != "" && element.element_name.includes(filter)) {
                        place.innerHTML += layout;
                    } else if (filter == "") {
                        place.innerHTML += layout;
                    }
                });
            }
        });

    } else if (elementType == "collection" && contentType == "collection_deassign") {
        database.forEach(element => {
            let htmid = Date.now();
            let action;
            if (current_view == "manager_view") {
                action = "instanceSchema(" + element.element_id + ")";
            } else if (current_view == "builder_view") {
                action = "setBuilderSelection('profile'," + element.element_id + ")";
            }
            //we need to turn green those that already exist in the selected collection

            //we fill the pertinent content boxes with the available schemas
            if (checkIfAssigned(element.element_id, this.collection_selected.inner_collections)) {

                let layout = '<div class="col-12 content_box_column" id="assigned' + element.element_id + '_collection"><div class="row text-center"><div class="col-4"><a class="instance_delete"  onclick="collectionDeassign(' + element.element_id + ',' + "'" + 'true' + "'" + ')" style="margin-left:auto;margin-right:auto;margin-top:10px;" data-toggle="tooltip" data-placement="bottom" title="Remove from collection" data-bs-original-title="Delete instance "><strong>-</strong></a></div> <div class="col-8 "><button  type="button" id="' + element.element_id + '"  class="btn">' + element.element_name + '</button></div> </row> </div>';
                places.forEach(place => {
                    //there is a filter in place
                    if (filter != "" && element.element_name.includes(filter)) {
                        place.innerHTML += layout;
                    } else if (filter == "") {
                        place.innerHTML += layout;
                    }
                });
            }
        });

    } else if (elementType == "collection" && contentType == "collection-interpreter-assign") {
        database.forEach(element => {

            let htmid = Date.now();
            let action;
            if (current_view == "manager_view") {
                action = "instanceSchema(" + element.element_id + ")";
            } else if (current_view == "builder_view") {
                action = "setBuilderSelection('profile'," + element.element_id + ")";
            }
            //we need to turn green those that already exist in the selected collection
            let style = 'content_box_column';
            let button_view = '';
            let button_action = '';
            if (checkIfAssignedInterpreter(element.element_id, test_tube.collections)) {
                style = 'content_box_column_selected';
                button_view = '<div class="col-4 text-center align-middle"align="center"><a class="instance_remove"  onclick="interpreterCollectionDeassign(' + element.element_id + ',' + "'" + 'true' + "'" + ')" style="margin-left:auto;margin-right:auto;margin-top:10px;" data-toggle="tooltip" data-placement="bottom" title=""><strong>-</strong></a></div>';
            } else {
                button_view = '<div class="col-4 text-center align-middle"align="center"><a class="instance_add"  onclick="interpreterCollectionAssign(' + element.element_id + ',' + "'" + 'true' + "'" + ')" style="margin-left:auto;margin-right:auto;margin-top:10px;" data-toggle="tooltip" data-placement="bottom" title=""><strong>+</strong></a></div>';
            }
            let layout = '<div class="col-12  ' + style + '" id="deassigned_' + element.element_id + '_collection"><div class="row text-center"> <div class="col-8 "><button  type="button" id="' + element.element_id + '"  class="btn">' + element.element_name + '</button></div> ' + button_view + '</row> </div>';
            //we fill the pertinent content boxes with the available schemas
            places.forEach(place => {
                //there is a filter in place
                if (filter != "" && element.element_name.includes(filter)) {
                    place.innerHTML += layout;
                } else if (filter == "") {
                    place.innerHTML += layout;
                }
            });

        });

    }

}

function populateParameterPool(parameter_array) {

    let place = document.getElementById('parameter_pool');
    //now that we have the place we have to add the elements
    parameter_array.forEach(element => {
        //per place: {parameter:[Object parameter],profile_id:profile_id}
        console.log(element.parameter);
        let inherited_icon = '';
        if (element.collection !== this.collection_selected.element_id) {
            //the parameter comes from another profile selected in another collection
            inherited_icon = '<a class="" onclick="enterInheritedCollection(' + "'" + element.collection + "'" + ')" style="margin-left:auto;margin-right:auto;margin-top:10px;" data-toggle="tooltip" data-placement="bottom" title="" data-bs-original-title="This parameter was inherited from an assigned collection, click on the icon to navigate to the parent collection"><img src="res/inherit.png" class="img-fluid"></a>';

        }
        let layout = '<div class="col-12  content_box_column" id="par_' + element.parameter.inner_id + '"><div class="row text-center"><div class ="col-sm-2 rule">' + inherited_icon + '</div><div class="col-sm-10"> <button  type="button" id="' + element.parameter.inner_id + '"  class="btn">' + element.parameter.Name + '</button></div></div> </row> </div>';
        place.innerHTML += layout;
    });

}

function populateCollectionInheritanceTree() {
    //the tree is located in the global variable this.collection_innheritance_tree
    //how should we present this information to the user? as one collection can have several collections, maybe the best would be to provide the user with a tree by using several columns
    // we add the self
    let tree_branch = document.getElementById('inheritance_tree_branch_1');
    let instance = this.collection_selected.element_id;
    let instance_name = this.collection_selected.element_name;
    let instance_id = instance;
    console.log("Inserting " + instance_name + " into branch 1");
    tree_branch.innerHTML += '<div class="col-12  rule tree_branch_element"  onmouseover="inheritance_tree_draw_artifact_lines(' + "'" + instance_id + "'" + ')"  onmouseout="inheritance_tree_remove_temporal_lines()" id="branch_element_' + instance_id + '">  ' + instance_name + '</button></div></div> </row> </div>';


    for (let x in this.collection_innheritance_tree) {
        //properties: branch, collections, parent
        //we push it to the corresponding branch column
        let superset = this.collection_innheritance_tree[x];
        for (let y in superset.collections) {
            tree_branch = document.getElementById('inheritance_tree_branch_' + (superset.branch + 1));
            instance = this.db.collection_Array[findInstancePlaceInStorage('collection', superset.collections[y])];
            instance_name = instance.element_name;
            instance_id = instance.element_id;
            console.log("Inserting " + instance_name + " into branch " + (superset.branch + 1));
            tree_branch.innerHTML += '<div class="col-12  rule tree_branch_element"  onmouseover="inheritance_tree_draw_artifact_lines(' + "'" + instance_id + "'" + ')"  onmouseout="inheritance_tree_remove_temporal_lines()" id="branch_element_' + instance_id + '">  ' + instance_name + '</button></div></div> </row> </div>';

            //we add the hover listener

            //we add the lines
            try {
                let line = new LeaderLine(
                    document.getElementById('branch_element_' + instance_id),
                    document.getElementById('branch_element_' + superset.parent)

                );
                line.size = 2;
                line.path = 'straight';
                this.tree_lines.push(line);
            } catch (error) {

            }

        }


    }

}

function inheritance_tree_draw_artifact_lines(collection_id) {

    //we already have a parameter pool, we just need to use it :)
    // properties in the parameter pool per object: parameter,profile_id,collection
    for (let x in this.temporal_parameter_pool) {
        //console.log("connecting artifact parameter " + temporal_parameter_pool[x].inner_id + " to " + this.temporal_parameter_pool[x].collection);
        if (this.temporal_parameter_pool[x].collection == collection_id) {
            try {
                let line = new LeaderLine(
                    document.getElementById('branch_element_' + this.temporal_parameter_pool[x].collection),
                    document.getElementById('par_' + this.temporal_parameter_pool[x].parameter.inner_id)
                );

                console.log("Connected collection " + collection_id + ' to parameter' + this.temporal_parameter_pool[x].parameter.inner_id);
                //let animOptions= {duration: 500, timing: [0.58, 0, 0.42, 1]};
                //line.show([showEffectName[draw, animOptions]]);
                this.temporal_inheritance_lines.push(line);
            } catch (error) {

            }
        }

    }

}

function inheritance_tree_remove_temporal_lines() {
    console.log("REMOVING LINES");
    for (let x in this.temporal_inheritance_lines) {
        this.temporal_inheritance_lines[x].remove();
    }
    this.temporal_inheritance_lines = [];
}

function checkIfAssigned(id, array) {

    for (let x in array) {
        if (array[x] == id) {
            return true;
        }
    }
    return false;

}

function checkIfAssignedInterpreter(id, array) {

    for (let x in array) {
        if (array[x].root_id == id) {
            return true;
        }
    }
    return false;

}

function matchDomAttributeSearch(origin, target) {
    let matched_elements = [];

    //because origin is a collection of DOM elements, we have to cast it to an array in order to use for each with it.
    Array.from(origin).forEach(element => {
        //if the data-content_type matches the target, we push it into the array
        if (element.dataset.content_type == target) {
            matched_elements.push(element);
        }
    });
    return matched_elements;
}

function filterContentBoxes(type, searchTerm) {
    from = "filterContentBoxes:";
    if (searchTerm.length >= 2) {
        //we get the content boxes where we will filter the content
        console.log(from + " filtering content boxes of type " + type + " by " + searchTerm);
        fillInElements(type, matchDomAttributeSearch(document.getElementsByClassName("content_box"), type), "box", searchTerm);

    } else if (searchTerm.length === 1) { synchronizeAvailableContentBoxElements(false, type); }
}

function filterProfileAssignmentBoxes(type, searchTerm) {
    from = "filterProfileAssignmentBoxes:";
    if (searchTerm.length >= 2) {
        //we get the content boxes where we will filter the content
        console.log(from + " filtering  profile assignment of type " + type + " by " + searchTerm);
        fillInElements(type, matchDomAttributeSearch(document.getElementsByClassName("profile_assign"), type), "profile-assign", searchTerm);

    } else if (searchTerm.length === 1) { synchronizeAvailableContentListElements(false, 'profile'); }
}

function filterContentLists(type, searchTerm) {
    from = "filterContentLists:";
    if (searchTerm.length >= 2) {
        //we get the content boxes where we will filter the content
        console.log(from + " filtering content lists of type " + type + " by " + searchTerm);
        fillInElements(type, matchDomAttributeSearch(document.getElementsByClassName("content_list"), type), "list", searchTerm);

    } else if (searchTerm.length === 1) { synchronizeAvailableContentListElements(false, type); }
}

function rawEditElement(type, id) {
    element_to_edit.element_type = type;
    element_to_edit.element_id = id;
    let place_in_storage = findInstancePlaceInStorage(type, id);
    //this function prepares the raw edition modal with the required content
    document.getElementById("raw_text_field").value = JSON.stringify(db[type + "_Array"][place_in_storage].element_content);
    document.getElementById("raw_name").value = db[type + "_Array"][place_in_storage].element_name;
    if (db[type + "_Array"][place_in_storage].is_guide) {
        document.getElementById('the_modified_schema_is_guide').checked = true;
    } else {
        document.getElementById('the_modified_schema_is_guide').checked = false;
    }

}

function cleanAllLines() {
    //we gotta clean up the lines!
    for (let x in this.builder_ui_lines) {
        this.builder_ui_lines[x][0].remove();
    }
    this.builder_ui_lines.length = 0;
    clear_inheritance_tree();
}
function menuSelection(tab) {
    cleanAllLines();
    from = "menuSelection: ";
    for (i in available_views) {

        let current_selection = available_views[i];

        if (current_selection != tab) {
            let dom_element = document.getElementById(current_selection + "_view");
            let dom_button = document.getElementById(current_selection + "_button");
            if (dom_element.style.display != "none") {
                dom_element.style.display = "none";
                dom_button.className = "menu_element_unselected";
            }
            //console.log(from+" hidding "+current_selection+"_view");
        }
    }
    document.getElementById(tab + '_view').style.display = "block";
    document.getElementById(tab + "_button").className = "menu_element_selected";
    //console.log(from+" displaying "+tab+"_view");
    current_view = tab + "_view";
    if (tab == "builder") {
        builderInitialization();
    } if (tab == "collection_builder") {
        console.log("Initializing the collection builder");
        collectionsBuilderInitialization();
    } if (tab == 'interpreter') {
        interpreterInitialization();
    }
    //to prevent collisions of intent between views
    restartUI();
}

function buildTeacherUI(data) {

    //this function is responsible of populating the modal
    document.getElementById("teacher_accordion").innerHTML = '';
    document.getElementById("teacher_accordion_categories").innerHTML = '';
    console.log(from + "populating the teacher, prefetched level data: " + JSON.stringify(this.temporal_level_data));
    from = "buildTeacherUI: ";
    let button;
    let ui_content = { button };
    let variable = '';
    let pseudonim;
    let validating_expression_input;
    let input_type;
    let custom_html;
    let custom_code;
    let custom_value_load;
    let name;
    let hide_variable;
    let category_name;
    let category_pseudonim;
    let hide_category;

    let ui_variable_fields = { name, pseudonim, validating_expression_input, input_type, hide_variable, custom_html, custom_code, custom_value_load };
    let ui_categories_fields = { category_pseudonim, hide_category };


    for (let i in this.available_variables) {
        //this.available_variables comes from the dissection of the object. 
        //console.log(from+"populating the variable's fields: "+this.available_variables[i]);
        variable = this.available_variables[i];


        document.getElementById('teacher_accordion').innerHTML += '<div class="accordion-item"><div class="accordion-header shadow-sm" id="heading_' + variable + '"><h5 class="mb-0"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_' + variable + '" aria-expanded="false" aria-controls="collapse_' + variable + '">' + variable + ' </button></h5></div><div id="collapse_' + variable + '" class="accordion-collapse collapse" aria-labelledby="heading_' + variable + '" data-bs-parent="#teacher_accordion"><div class="accordion-body" ><div class="row" id="teacher_content_' + variable + '" ></div> </div></div></div>';
        //we append the fields that correspond to the configuration of the variables
        ui_variable_fields.name = '<div id="' + variable + '_name">';

        ui_variable_fields.pseudonim = '<div class="col-sm-3"><div class="mb-4"><label for="" class="form-label">Add a <strong>pseudonim</strong> to the variable</label><input type="text" class="form-control" name="" id="' + variable + '_pseudonim" aria-describedby="helpId" placeholder=""> <small id="helpId" class="form-text text-muted">Any text is valid.</small></div></div>';

        ui_variable_fields.validating_expression_input = '<div class="col-sm-3"><div class="mb-3"><label for="" class="form-label">Add a <strong>validating expression</strong></label><input type="text" class="form-control" name="" id="' + variable + '_validating_expression_input" aria-describedby="helpId" placeholder=""> <small id="helpId" class="form-text text-muted">A valid regular expression. Leave it empty for no validation.</small></div></div>';

        ui_variable_fields.input_type = '<div class="col-sm-3"><div class="mb-4"><label for="" class="form-label">Select an <strong>input type</strong></label><select class="form-control is-select" name="" id="' + variable + '_input_type"><option>Direct</option><option>Custom</option></select><small id="helpId" class="form-text text-muted">Custom = custom code | Direct (default) = input field</small></div></div>';


        ui_variable_fields.hide_variable = '<div class="col-sm-3>"<div class="mb-3"><label for="" class="form-label"><div class="form-check form-switch"><input type="checkbox" class="form-check-input" type="checkbox" id="' + variable + '_hide_variable"><label class="form-check-label" for="flexSwitchCheckDefault"><strong>Hide this variable?</label></div></div></div>';

        ui_variable_fields.custom_html = '<div class="col-md-12>"<div class="mb-3"><label for="" class="form-label">Input area for <strong>custom HTML code</strong></label><textarea class="form-control" name="" id="' + variable + '_custom_html" rows="5"></textarea><small id="helpId" class="form-text text-muted">The html elements that will be presented to the user to fill this variable.</small></div></div><div class="col-md-12"><h6><strong>Custom HTML toolbox:</strong></h6></div><div class="col-md-12 border"><div class="d-flex flex-row" id="' + variable + '_custom_html_toolbox"></div></div>';

        ui_variable_fields.custom_code = '<div class="col-md-12>"<div class="mb-3"><label for="" class="form-label">Input area for the <strong>logic that manages your custom HTML</strong></label><textarea class="form-control" name="" id="' + variable + '_custom_code" rows="5"></textarea><small id="helpId" class="form-text text-muted">Custom functions that interpret your HTML elements to generate a value output.</small></div></div><div class="col-md-12"><h6><strong>Custom code toolbox:</strong></h6></div><div class="col-md-12 border"><div class="d-flex flex-row" id="' + variable + '_custom_code_toolbox"></div></div>'

        ui_variable_fields.custom_value_load = '<div class="col-md-12>"<div class="mb-3"><label for="" class="form-label">Input area for the <strong>logic that translates the stored value to your custom layout.</strong> </label><textarea class="form-control" name="" id="' + variable + '_custom_value_load" rows="5"></textarea><small id="helpId" class="form-text text-muted">Custom logic that transforms the original value for your custom layout. Use the variable name current value to aquire the current value for the variable. </small></div></div><div class="col-md-12"><h6><strong>Custom code toolbox:</strong></h6></div><div class="col-md-12 border"><div class="d-flex flex-row" id="' + variable + '_custom_value_load_toolbox"></div></div>'



        for (let x in ui_variable_fields) {
            document.getElementById('teacher_content_' + variable).innerHTML += ui_variable_fields[x];

        }

        //we add the tools to the custom html toolbox

        for (let x in this.custom_html_tools) {

            document.getElementById(variable + "_custom_html_toolbox").innerHTML += '<div class="p-2" onClick="useHtmlTool(' + "'" + variable + '_custom_html' + "'" + ',' + x + ')">' + this.custom_html_tools[x].name + '</div>';
        }

        for (let x in this.custom_code_tools) {

            document.getElementById(variable + "_custom_code_toolbox").innerHTML += '<div class="p-2" onClick="useCodeTool(' + "'" + variable + '_custom_code' + "'" + ',' + x + ')">' + this.custom_code_tools[x].name + '</div>';
        }

        for (let x in this.custom_value_load_tools) {

            document.getElementById(variable + "_custom_value_load_toolbox").innerHTML += '<div class="p-2" onClick="useCodeValueLoadTool(' + "'" + variable + '_custom_value_load' + "'" + ',' + x + ')">' + this.custom_value_load_tools[x].name + '</div>';
        }


    }

    //we filter out the parents so that categories can be customized as well
    prepareConfigurationForUi();

    if (this.available_parents.length != 0) {


        console.log("%c Adding the parents to the teacher", "color:red");

        var filtered_categories = new Map();
        for (let y in this.available_parents) {
            filtered_categories.set(this.available_parents[y][0], '');
        }


        console.log("%cbuildTeacherUI: found categories: ", "color:green");
        let iterator = filtered_categories.keys();
        let current_key = iterator.next();

        while (!current_key.done) {
            variable = current_key.value;

            document.getElementById('teacher_accordion_categories').innerHTML += '<div class="accordion-item"><div class="accordion-header shadow-sm" id="heading_teacher_category_' + variable + '"><h5 class="mb-0"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_teacher_category' + variable + '" aria-expanded="false" aria-controls="collapse_teacher_category_' + variable + '">' + variable + ' </button></h5></div><div id="collapse_teacher_category' + variable + '" class="accordion-collapse collapse" aria-labelledby="heading_' + variable + '" data-bs-parent="#teacher_accordion"><div class="accordion-body" ><div class="row" id="teacher_categories_content_' + variable + '" ></div> </div></div></div>';
            //we append the fields that correspond to the configuration of the variables


            ui_categories_fields.category_pseudonim = '<div class="col-sm-3"><div class="mb-4"><label for="" class="form-label">Add a <strong>pseudonim</strong> to the category</label><input type="text" class="form-control" name="" id="' + variable + '_category_pseudonim" aria-describedby="helpId" placeholder=""> <small id="helpId" class="form-text text-muted">Any text is valid.</small></div></div>';


            ui_categories_fields.hide_category = '<div class="col-sm-3>"<div class="mb-3"><label for="" class="form-label"><div class="form-check form-switch"><input type="checkbox" class="form-check-input" type="checkbox" id="' + variable + '_hide_category"><label class="form-check-label" for="flexSwitchCheckDefault"><strong>Hide this category?</label></div></div></div>';


            for (let x in ui_categories_fields) {
                document.getElementById('teacher_categories_content_' + variable).innerHTML += ui_categories_fields[x];
            }

            current_key = iterator.next();
        }
    }


    console.log(from + "Teaching UI built, awaiting for conclusion");
    let level_variables_configuration = findConfigurationVariables();
    console.log("buildTeacherUi: %c RESETTING THE TEMPORAL LEVEL DATA", 'color: red');

    console.log('buildTeacherUi:%c data in the database to populate the teacher ui with: ', "color:#4287f5");
    //console.log(JSON.stringify(level_variables_configuration.configuration_variables));

    if (level_variables_configuration.configuration_variables.length == 0) {
        this.temporal_level_data = null;
    }

    if (this.temporal_level_data != null && this.temporal_level_data.length != 0) {
        if (this.temporal_level_data.length != 0) {
            //why is the temporal level data filled with the data of the previous level?

            let variable_names = Object.keys(ui_variable_fields);

            console.log(from + "there was an existing configuration found for this level, retrieving the existing data");

            //we fill in the data of the existing configuration into the UI
            for (let i in this.available_variables) {
                for (let x in variable_names) {
                    let document_element = document.getElementById(available_variables[i] + "_" + variable_names[x]);

                    document_element.className.includes("form-check-input") ? document_element.checked = temporal_level_data[i][variable_names[x]] : document_element.value = temporal_level_data[i][variable_names[x]];

                }
            }


            //We fill in the data of the available categories into the existing UI elements

            let properties_per_category = Object.keys(ui_categories_fields);
            for (let x in this.temporal_level_data) {
                //we have to fech each object inside of the temporal level data in order to update the UI with its real value.

                if (this.temporal_level_data[x].hasOwnProperty('category_name')) {
                    //now that we are placed in the temporal_level_data index for a category, we can configure the ui accordingly
                    for (let y in properties_per_category) {
                        if (properties_per_category[y] != 'category_name') {
                            let document_element = document.getElementById(this.temporal_level_data[x].category_name + '_' + properties_per_category[y]);
                            //check that it is not a checkmark ;)
                            document_element.className.includes("form-check-input") ? document_element.checked = temporal_level_data[x][properties_per_category[y]] : document_element.value = this.temporal_level_data[x][properties_per_category[y]];

                        }
                    }

                }
            }


            // for(let i = 0; i<filtered_categories.length;i++){
            //     for(let x in variable_names){
            //         let document_element = document.getElementById(current_key+"_"+variable_names[x]);

            //             document_element.className.includes("form-check-input") ?  document_element.checked = temporal_level_data[i][variable_names[x]]: document_element.value = temporal_level_data[i][variable_names[x]];

            //     }
            // }
        }
    }


}

function fillBuilderUi() {
    //this function uses the information in this.available_parents to fill the UI.
    from + "fillBuilderUi: ";
    document.getElementById('available_parents').innerHTML = '';
    let children = document.getElementById('available_children').innerHTML = '';
    let variables = document.getElementById('available_children_variables').innerHTML = '';
    populateParents();

}
function populateParents() {

    let accordion_layout = '<div class="col-12" style="width:100% !important; padding-left:0px !important; padding-right:0px !important;"><div class="accordion" id="parents_accordion"></div></div>';
    var main_dom = document.getElementById("available_parents");
    main_dom.innerHTML += accordion_layout;

    for (let i in this.available_parents) {
        //if the current element's parent is root, we have to place it in the main section
        //if the current element's parent is not root, we have to place it within someone else, if it is an array or an object
        var place; //we store the dom element to populate here
        if (this.available_parents[i][3] == 'root') {
            place = document.getElementById('parents_accordion');
        } else {
            place = '';
        }
        let dom_id = i + "_parent";

        let amount_of_children = 0;

        for (let x in available_parents) {
            if (available_parents[x][3] == i) {
                amount_of_children++;
            }
        }
        let amount_of_children_layout = "";
        if (amount_of_children > 0) {
            amount_of_children_layout = '<div class="col-sm-4 text-center"><a class="children_amount" style="margin-left:auto;margin-right:auto;" data-toggle="tooltip" data-placement="bottom" title="Amount of sub-elements within this parent">' + amount_of_children + '<br><a style="font-size:xx-small;">Sub-elements</a></a></div>'
        } else {
            amount_of_children_layout = '<div class="col-sm-4 text-center" style="font-size:small">No sub-elements</div>'
        }
        var if_array = '';
        let action = 'onclick="populateChildren(' + "'" + i + "'" + ',null,null,false,true)"'
        if (this.available_parents[i][2] == 'array') {
            if_array = '<div class="col-sm-2" style="z-index:100;"><a class="instance_add" style="margin-left:auto;margin-right:auto;" data-toggle="tooltip" data-placement="bottom" title="Add an instance " onclick="createInstanceFromProfileElement(' + "'test'" + ',' + "'available_children'" + ',' + i + ',' + i + ',1)")"><strong>+</strong></a></div>';
            action = 'onclick="populateChildren(' + "'" + i + "'" + ',null,null,true,true)"';
        }
        //we have to intervene here in order to change the name according to this.temporalConfigurations
        let parent_real_name = this.available_parents[i][0];
        if (this.temporal_level_data != null) {
            if (this.temporal_level_data.length !== 0) {
                //console.log("populateParents:checking for custom category pseudonim for the category: "+this.available_parents[i][0]);
                let category_configuration = getCategoryConfiguration(this.available_parents[i][0]);

                if (category_configuration.category_pseudonim !== null && category_configuration.category_pseudonim !== '') {
                    parent_real_name = category_configuration.category_pseudonim.split('_').join(' ');
                } else {
                    parent_real_name = this.available_parents[i][0];
                }
            }
        }
        let accordion_item_layout = '<div class="accordion-item" ' + action + '"><h2 class="accordion-header shadow-sm content_box_option" id="_' + dom_id + '_header"><button class="accordion-button no-arrow collapsed" type="button"  style=""><div class="row text-center" style="width:100% !important;"><div class="col-sm-6"><img class="img-fluid" src="res/list-search.png" style="max-width:20px; margin-right:20px;">' + parent_real_name + '</div>' + amount_of_children_layout + if_array + '</div></button></h2><div id="_' + dom_id + '_content" class="accordion-collapse collapse" aria-labelledby="_' + dom_id + '_header"><div class="accordion-body" id="_' + dom_id + '_content_body"></div></div></div>';

        //we have to intervene here in case the category in this.temporalConfigurations is hidden.
        if (this.temporal_level_data != null) {
            if (this.temporal_level_data.length !== 0) {

                //console.log("populateParents: Checking if the category "+this.available_parents[i][0]+" should be hidden");
                let category_configuration = getCategoryConfiguration(this.available_parents[i][0]);
                if (category_configuration.hide_category == true) {
                    place = '';
                }
            }
        }
        if (place !== '') {

            place.innerHTML += accordion_item_layout;
        }

        // remove the bootstrap arrow
        $(".accordion-button.collapsed").removeClass("active");
        restartTooltips();
    }
}

//this function is in charge of populating children each time we click on a parent.
function populateChildren(parent_index, instance_index, instance_id, instanceable, is_parent) {
    this.last_viewed_instance_data = { 'parent_index': parent_index, 'instance_index': instance_index, 'instance_id': instance_id, 'instanceable': instanceable, 'is_parent': is_parent };
    document.getElementById('available_children_variables').innerHTML = '';
    if (parent_index == findPlaceByParentName('Operations', this.available_parents)) {
        document.getElementById('_' + findPlaceByParentName('Operations', this.available_parents) + '_parent_header').parentElement.classList.remove('attention');
    }
    //console.log(parent_index + ' ' + instance_index + ' ' + instance_id + ' ' + instanceable + ' ' + is_parent);
    let type = '';
    if (instance_index == null && instanceable == false && is_parent == true) {
        type = 1;// type numbers are specified in the documentation.
    } else if (instanceable && instance_index == null && is_parent) {
        type = 2;
    } else if (!instanceable && instance_index !== null && !is_parent) {
        type = 3;
    }
    //console.log("populateChildren: "+parent_index+" "+instance_index+" "+instance_id+" "+instanceable+" "+is_parent );
    //console.log("populateChildren: type found: "+type);
    switch (type) {

        case 1: { //a simple parent category

            document.getElementById('available_children').innerHTML = '';
            //console.log("populateChildren: [non-instanceable] [parent] selected");
            this.temporal_parent_index = parent_index;
            document.getElementById('available_children_variables').innerHTML = ' ';
            let accordion_layout = '<div class="col-12" style="width:100% !important; padding-left:0px !important; padding-right:0px !important;"><div class="accordion" id="children_accordion"></div></div>';
            document.getElementById('available_children').innerHTML += accordion_layout;
            let children_chain = [];
            children_chain = getChildrenChain(parent_index, children_chain);
            //console.log("%c populateChildren: found children: " + children_chain, 'color:green');
            this.temporal_variables_subset.length = 0;

            for (let i in children_chain) {
                //if there are only variables available inside and it is not an array, there is no need to add it as it is a set of variables
                let variables_subset = checkIfVariablesSubset(children_chain[i], parent_index);
                if (variables_subset == true) {
                    console.log("populateChildren: populating the subset " + this.available_parents[children_chain[i]][0] + " with the children of parent " + this.available_parents[parent_index][0]);
                    //we recollect the variables here: 

                    let variables = this.available_parents[children_chain[i]][1];
                    let parent_name = this.available_parents[children_chain[i]][0];
                    let entries_name = Object.entries(variables);

                    //IMPORTANT: as we are dealing with a variable sub-set, this means that, in the variable row, the variables must be presented within an accordion. we have to present the accortion first.
                    let subset_dom_id = this.available_parents[children_chain[i]][0] + "_subset";//this is the id for the dom element
                    let subset_name = this.available_parents[children_chain[i]][0].split('_').join(' ');

                    //we have to check if the subset name is actually a pseudonim

                    if (this.temporal_level_data.length !== 0) {
                        //there is an existing configuration
                        let configuration = getCategoryConfiguration(this.available_parents[children_chain[i]][0]);
                        if (configuration.hide_category) {
                            return;
                        }
                        if (configuration.category_pseudonim != null && configuration.category_pseudonim != '') {
                            subset_name = configuration.category_pseudonim.split('_').join(' ');
                        }
                    }
                    let subset_position = children_chain[i];//this is important because, even though we care who the parent of the subset is, the subset itself needs to be located :)

                    //we add the variable accordion to the layout
                    document.getElementById('available_children_variables').innerHTML += '<div class="accordion-item"><h2 class="accordion-header shadow-sm content_box_option" id="' + subset_dom_id + '_header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + subset_dom_id + '_accordion" aria-expanded="false" aria-controls="collapseOne"  style=""><div class="row text-center" style="width:100% !important;"><div class="col-sm-6">' + subset_name
                        + '</div></div></button></h2><div id="' + subset_dom_id + '_accordion" class="accordion-collapse collapse" aria-labelledby="' + subset_dom_id + '_header"><div class="accordion-body" id="' + subset_dom_id + '_accordion_body"></div></div></div>';
                    for (let x = 0; x < entries_name.length; x++) {
                        //we put in the ui the corresponding parent of the variables (if not the same as the current element that we clicked on)
                        //if the parent name corresponds to another parent, we have to populate the accordion with a section for these variables
                        //for now, lets only deal with the elements of the root parent
                        let key = entries_name[x][0];
                        let value = entries_name[x][1];
                        //if the value is not an array, we print it
                        if (!Array.isArray(value) && typeof value !== 'object') {
                            //we have to place everything that complies with the conditions above in the variables option. (place the variables in their place) 
                            //variable_name,dom_target,current_value,is_variable_subset,parent_index,instance_id,is_instance,type,subset_name
                            showVariableInput(key, subset_dom_id + '_accordion_body', value, variables_subset, subset_position, null, false, 1, 'root');
                        }
                    }

                }


            }

            populateVariables(parent_index, instance_index, instance_id, false, true);//we gotta grab the root variables of the parent and place them in the correct place, as sub sets 

        } break;

        case 2: {//a parent with instances of itself
            //console.log("populateChildren: type 2 [instanceable] [parent] selected");

            //console.log("%c populateChildren [instanceable][non Instance]: Populating an parent! ",'color:green');
            //parent_index,instance_index,instance_id,instanceable,is_parent
            populateVariables(parent_index, instance_index, instance_id, true, true);//we gotta grab the root variables of the parent and place them in the correct place, as sub sets havealready been dealt with

        } break;

        case 3: { //an instance with variables and other parents inside
            //console.log("populateChildren: [non-instanceable] [instance] selected (type 3)");
            //parent_index,instance_index,instance_id,instanceable,is_parent

            //if the instance_id is not empty, we take the data from the instance, not the parameters of the function :)

            if (instance_id != null) {
                //if the instance_id is not null, we have to:
                //1- retrieve and display the variables sub-set for the instance
                //2- retrieve and display the root variables for the instan
                let instance = getInstanceFromArray(this.available_parents[parent_index][4], instance_id);

                console.log("populateChildren: (type 3) Instance  of (" + this.available_parents[parent_index][0] + ") fetched!");

                let root_variables = [];
                let sub_sets = [];
                //2---
                root_variables = getRootVariablesOfInstance(instance);

                console.log("populateChildren: root varibles of " + instance.inner_id + " " + JSON.stringify(root_variables));
                //1---
                sub_sets = getSubSetVariablesOfInstance(instance);

                console.log("populateChildren: subsets of " + instance.inner_id + " " + JSON.stringify(sub_sets));


                if (sub_sets != null) {

                    for (let x in sub_sets) {

                        let subset_name = sub_sets[x].name;
                        let subset_dom_id = subset_name.split(' ').join('_') + "_subset";
                        if (this.temporal_level_data.length !== 0) {
                            //there is an existing configuration
                            let configuration = getCategoryConfiguration(subset_name);

                            if (configuration.hide_category) {
                                console.log("we are supposed to hide the category");
                            } else {
                                subset_dom_id = subset_name.split(' ').join('_') + "_subset";
                                if (configuration.category_pseudonim != null && configuration.category_pseudonim != '') {
                                    subset_name = configuration.category_pseudonim;
                                }
                                //we add the variable accordion to the layout
                                document.getElementById('available_children_variables').innerHTML += '<div class="accordion-item"><h2 class="accordion-header shadow-sm content_box_option" id="' + subset_dom_id + '_header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + subset_dom_id + '_accordion" aria-expanded="true" aria-controls="collapseOne"  style=""><div class="row text-center" style="width:100% !important;"><div class="col-sm-6">' + subset_name.split('_').join(' ') + '</div></div></button></h2><div id="' + subset_dom_id + '_accordion" class="accordion-collapse collapse" aria-labelledby="' + subset_dom_id + '_header"><div class="accordion-body" id="' + subset_dom_id + '_accordion_body"></div></div></div>';

                                //we populate the subset
                                for (let y in sub_sets[x].variables) {
                                    //variable_name,dom_target,current_value,is_variable_subset,parent_index,instance_id,is_instance,type,subset_name
                                    showVariableInput(y, subset_dom_id + '_accordion_body', sub_sets[x].variables[y], true, parent_index, instance_id, true, 3, subset_name);
                                }
                            }

                        } else {
                            let subset_dom_id = subset_name + "_subset";//this is the id for the dom element
                            //we add the variable accordion to the layout
                            document.getElementById('available_children_variables').innerHTML += '<div class="accordion-item"><h2 class="accordion-header shadow-sm content_box_option" id="' + subset_dom_id + '_header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + subset_dom_id + '_accordion" aria-expanded="true" aria-controls="collapseOne"  style=""><div class="row text-center" style="width:100% !important;"><div class="col-sm-6">' + subset_name.split('_').join(' ') + '</div></div></button></h2><div id="' + subset_dom_id + '_accordion" class="accordion-collapse collapse" aria-labelledby="' + subset_dom_id + '_header"><div class="accordion-body" id="' + subset_dom_id + '_accordion_body"></div></div></div>';

                            //we populate the subset
                            for (let y in sub_sets[x].variables) {
                                //variable_name,dom_target,current_value,is_variable_subset,parent_index,instance_id,is_instance,type,subset_name
                                showVariableInput(y, subset_dom_id + '_accordion_body', sub_sets[x].variables[y], true, parent_index, instance_id, true, 3, subset_name);
                            }

                        }


                    }

                }

                //2--- We display the root variables
                if (root_variables != null) {
                    //console.log("populateChildren: inserting root variables: "+JSON.stringify(root_variables));
                    for (let x in root_variables) {
                        //console.log("adding root variable"+JSON.stringify(root_variables[x]));

                        for (let y in root_variables[x].variables) {
                            //console.log("adding root variable "+y+" with value: "+root_variables[x].variables[y]);
                            //variable_name,dom_target,current_value,is_variable_subset,parent_index,instance_id,is_instance,type,subset_name
                            showVariableInput(y, 'available_children_variables', root_variables[x].variables[y], false, parent_index, instance_id, true, 3, 'root');
                        }

                    }

                }

                //we display the instance libraries and the instances within them now
                populateVariables(parent_index, instance_index, instance_id, false, false);

            }
        } break;


        default:
            alertify.error("There is an error with the type of the object you just clicked on (er1)");
            break;
    }

}

function populateVariables(parent_index, instance_index, instance_id, instanceable, is_parent) {


    let type = 'error';
    if (instance_index == null && instanceable == false && is_parent) {
        type = 1;// type numbers are specified in the documentation.
    } else if (instanceable && instance_index == null && is_parent) {
        type = 2;
    } else if (!instanceable && instance_index != null && !is_parent) {
        //operations etc.
        type = 3;
    } else if (instanceable && instance_index != null && is_parent) {
        type = 4;
    }
    //console.log("populateVariables: instance_index: "+instance_index+" instanceable: "+instanceable+" is_parent: "+is_parent);
    //console.log("populateVariables: type: "+type);

    switch (type) {

        case 1: {
            let parent_root_variables;//this variable is for storing the root variables
            let entries;//this variable is for creating an Object entries list with the variable above
            let children_chain;// this variable is for storing the index of each children for the current parent
            //according to the documentation, we know that this type is a parent with sub-categories and possibly root variables and sub-sets.
            parent_root_variables = this.available_parents[parent_index][1];

            entries = Object.entries(parent_root_variables);
            //console.log('populateVariables [non-instanceable][Parent]: Root variables to populate the children with (parent index: '+parent_index+'): '+JSON.stringify(parent_root_variables));
            this.temporal_parent_index = parent_index;//We need this for each listener in the input variable function
            for (let i = 0; i < entries.length; i++) {
                //entries[0] is the NAME
                //entries [1] is the VALUE
                showVariableInput(entries[i][0], 'available_children_variables', entries[i][1], false, this.temporal_parent_index, null, false, 1);
            }

            children_chain = [];
            children_chain = getChildrenChain(parent_index, children_chain);

            //console.log('populateVariables [non-instanceable] [Parent]: found children chain: '+children_chain);
            let first_level = [];

            for (let x in children_chain) {

                if (this.available_parents[children_chain[x]][3] == parent_index) {
                    first_level.push(children_chain[x]);

                }
            }


            //console.log('populateVariables: adding first level: '+first_level);
            for (let x in first_level) {
                // console.log('populateVareiables: trying to add first level element ('+first_level[x]+'): '+this.available_parents[first_level[x]][0]);
                if (this.available_parents[first_level[x]][2] == 'array') {
                    console.log('adding first level element: ' + this.available_parents[first_level[x]][0] + " parent index: " + parent_index + " self index: " + first_level[x]);
                    //library_name,dom_target,parent_index,self_index,is_parent,instanceable,instance_id
                    showInstanceLibraries(this.available_parents[first_level[x]][0], 'available_children', parent_index, first_level[x], is_parent, true, instance_id);
                }

            }
        } break;

        case 2: {


            let children_chain;// this variable is for storing the index of each children for the current parent
            children_chain = [];
            children_chain = getChildrenChain(parent_index, children_chain);
            document.getElementById('available_children').innerHTML = '';
            console.log('populateVariables: [Instanceable][Parent] type 2 found children chain: ' + children_chain);
            //if the type is a parent and it is instanceable, we just have to populate with the available instances.

            console.log("Showing instance library [For " + this.available_parents[parent_index][0] + "]");
            if (children_chain.length == 0) {//when we have no children, there is no use for passing along the instance index different to the parent
                showInstanceLibraries('available_children', 'available_children', parent_index, parent_index, false, false, 0);
            } else {
                showInstanceLibraries('available_children', 'available_children', parent_index, children_chain[x], false, false, 0);
            }
            //library_name,dom_target,parent_index,self_index,is_parent,instanceable,instance_id

        } break;

        case 3: {

            children_chain = [];
            children_chain = getChildrenChain(parent_index, children_chain);
            //console.log('populateVariables [non-instanceable] [Instance]: found children chain: '+children_chain);

            let amount_of_children_added = 0;
            document.getElementById('in' + instance_id + '_accordion').innerHTML = '';
            for (let x in children_chain) {
                if (this.available_parents[children_chain[x]][2] == 'array' && this.available_parents[children_chain[x]][3] == parent_index) {
                    //it is an instanceable element
                    //library_name,dom_target,parent_index,self_index,is_parent,instanceable,instance_id
                    amount_of_children_added++;
                    //console.log('populateVariables: found valid library: ' + this.available_parents[children_chain[x]][0] + ' adding to: ' + "in" + instance_id + "_accordion");
                    showInstanceLibraries(this.available_parents[children_chain[x]][0], "in" + instance_id + '_accordion', parent_index, children_chain[x], true, true, instance_id);
                }
            }
            if (amount_of_children_added == 0) {
                document.getElementById("in" + instance_id + '_accordion').style.visibility = 'hidden';

            }
        } break;

        case 4: {

        } break;

    }

    //==============================Draw the lines that guide the user==================================

    let source_id;
    let destination_id;
    let line_type;
    if (instance_id == null) {
        source_id = "_" + parent_index + "_parent_header";
        if (type == 1 && document.getElementById('children_accordion').innerHTML == '') {
            destination_id = 'available_variables_area';
        } else {
            destination_id = 'available_children_area';
        }
        line_type = "category";
    } else {

        source_id = 'in' + instance_id + '_header';
        destination_id = 'available_variables_area';
        line_type = "instance";
    }

    //we have to clean the pertinent lines
    //if the line type will be a category, we erase all the lines
    // if the line type will be an instance, we erase all the lines of type 'instance'
    if (line_type == 'category') {
        for (let x in this.builder_ui_lines) {
            this.builder_ui_lines[x][0].remove();
        }
        this.builder_ui_lines.length = 0;
    } else {
        for (let x in this.builder_ui_lines) {
            if (this.builder_ui_lines[x][1] == 'instance') {
                this.builder_ui_lines[x][0].remove();
                this.builder_ui_lines.splice(x, 1);
            }

        }
    }

    let selection = new LeaderLine(
        document.getElementById(source_id),
        document.getElementById(destination_id),
        {
            size: 5,

            startPlugColor: '#12b800',
            endPlugColor: '#b2b800',
            startPlug: 'square',
            endPlug: 'arrow',
            gradient: true,
            dash: { animation: true },
            dropShadow: { dx: 0, dy: 3 }
        }


    );

    if (line_type == 'instance') {
        this.builder_ui_lines.push([selection, 'instance']);
    } else {
        this.builder_ui_lines.push([selection, 'category']);
    }


    //==============================End of the lines that guide the user==================================


}


function showInstanceLibraries(library_name, dom_target, parent_index, self_index, is_parent, instanceable, instance_id) {

    //console.log("showInstanceLibraries: populating instance libraries with: " + library_name + " target: " + dom_target + " parent: " + parent_index + " self index: " + self_index + " is parent? " + is_parent + " is instanceable? " + instanceable + " father instance: " + instance_id);

    //createInstanceFromProfileElement: library_id,dom_target,parent_index,self_index,is_parent,is_instance,parent_id,parent_instance_id
    let library_id = library_name + new Date().getTime() + Math.floor(Math.random() * 100);

    let real_name = library_name.split('_').join(' ');

    if (this.temporal_level_data.length != 0) {
        //WARNING IMPORTANT CHANGE FROM SELF_INDEX TO PARENT INDEX
        let configuration = getCategoryConfiguration(this.available_parents[self_index][0]);//HERE

        if (configuration.category_pseudonim != null && configuration.category_pseudonim != '') {

            real_name = configuration.category_pseudonim.split('_').join(' ');
        }
    }
    let instanceable_layout = '<div class="accordion-item"><h2 class="accordion-header shadow-sm content_box_option" id="' + library_id + '_header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + library_id + '_accordion" aria-expanded="false" aria-controls="collapseOne"  style=""><div class="row text-center" style="width:100% !important;"><div class="col-sm-6">' + real_name + '</div><div class="col-sm-2" style="z-index:100;"><a class="instance_add" style="margin-left:auto;margin-right:auto;" data-toggle="tooltip" data-placement="bottom" title="" onclick="createInstanceFromProfileElement(' + "'" + library_id + "'" + ',' + "'" + dom_target + "'" + ',' + parent_index + ',' + self_index + ',false,false,' + "'" + library_id + "'" + ',' + instance_id + ' )" data-bs-original-title="Add an instance "><strong>+</strong></a></div></div></button></h2><div id="' + library_id + '_accordion" class="accordion-collapse collapse" aria-labelledby="' + library_id + '_header"><div class="accordion-body" id="' + library_id + '_accordion_body"><div class="d-flex flex-column" id="' + library_id + '_accordion_children"></div></div></div></div>';
    //parent_index,instance_index,instance_id



    //parent_index,instance_index,instance_id,instanceable,is_parent
    let instance_as_parent_layout = '<div class="accordion-item"><h2 class="accordion-header shadow-sm content_box_option" id="' + library_id + '_header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + library_id + '_accordion" aria-expanded="false" aria-controls="collapseOne"  style=""><div class="row text-center" style="width:100% !important;" onClick="populateChildren(' + parent_index + ',' + self_index + ',' + instance_id + ',false,true)" ><div class="col-sm-6">' + library_name.split('_').join(' ') + '</div><div class="col-sm-2" style="z-index:100;"></div></div></button></h2><div id="' + library_id + '_accordion" class="accordion-collapse collapse" aria-labelledby="' + library_id + '_header"><div class="accordion-body" id="' + library_id + '_accordion_body"><div class="d-flex flex-column" id="' + library_id + '_accordion_children"></div></div></div></div>';


    //we now populate the accordion with the available instances of the library
    //library_name,dom_target,parent_index,self_index,instance_id

    let type = 'error';
    if (instance_id == null && instanceable == false && is_parent) {
        type = 1;// type numbers are specified in the documentation.
    } else if (instanceable && instance_id == null && is_parent) {
        type = 2;
    } else if (!instanceable && instance_id != null && !is_parent) {
        type = 3;
    } else if (instanceable && instance_id != null && is_parent) {
        type = 2;
    }
    //console.log("showInstanceLibraries: instance_id: "+instance_id+" instanceable: "+instanceable+" is_parent: "+is_parent);
    //console.log("showInstanceLibraries: dealing with type: "+type);
    switch (type) {
        case 1: {
            //console.log("showInstanceLibraries type 1 [parent][non-instanceable]:placing inside library  "+library_id);
            document.getElementById(dom_target).innerHTML += instance_as_parent_layout;
            populateInstanceLibrary(library_id, library_id + '_accordion_children', parent_index, self_index, true, false, instance_id);
        } break;

        case 2: {

            if (this.temporal_level_data.length !== 0) {
                //console.log("checking if the library should be skipped");
                let available_configuration = getCategoryConfiguration(this.available_parents[self_index][0]);
                if (!available_configuration.hide_category) {

                    //we validate if the custom configuration for the
                    //console.log("showInstanceLibraries type 2 [parent][instanceable]:placing inside library  "+library_id+" and dom target: "+dom_target);
                    document.getElementById(dom_target).innerHTML += instanceable_layout;
                    populateInstanceLibrary(library_id, library_id + '_accordion_children', parent_index, self_index, true, true, instance_id);
                }
            }

        } break;

        case 3: {
            //console.log("showInstanceLibraries type 3 [non-parent][non-instanceable]:placing inside library  "+library_id);
            //console.log("showInstanceLibraries: populating instance libraries with: "+library_name+" target: "+dom_target+" parent: "+parent_index+" self index: "+self_index+" is parent? "+is_parent+" is instanceable? "+instanceable+" father instance: "+instance_id);
            //library_name,dom_target,parent_index,self_index,is_parent,instanceable,instance_id
            document.getElementById(dom_target).innerHTML += instance_as_parent_layout;
            populateInstanceLibrary('available_children', 'available_children', parent_index, self_index, false, false, instance_id);
        } break;

        default: {
            //console.log("showInstanceLibraries type DEF [parent][instanceable]:placing inside library  "+library_id);
            document.getElementById(dom_target).innerHTML += instanceable_layout;
            populateInstanceLibrary(library_id, library_id + '_accordion_children', parent_index, self_index, true, true, instance_id);
        } break;
    }



}


function populateInstanceLibrary(library_name, dom_target, parent_index, self_index, is_parent, instanceable, instance_id) {
    let dom_target_element = document.getElementById(dom_target);
    dom_target_element.innerHTML = '';


    let type = 'error';
    if (instance_id == null && instanceable == false && is_parent) {
        type = 1;// type numbers are specified in the documentation.
    } else if (instanceable && instance_id == null && is_parent) {
        type = 2;
    } else if (!instanceable && instance_id != null && !is_parent) {
        type = 3;
    } else if (instanceable && instance_id != null && is_parent) {
        type = 4;
    }
    //console.log("populateInstanceLibrary: type of element to fill with  type: "+type+ " conditions: instanceable: "+instanceable+" is_parent: "+is_parent+" instance_index:"+instance_id+" parent_index: "+parent_index+" self_index: "+self_index);
    switch (type) {
        case 1: {
            // console.log("showInstanceLibraries type 1 [parent][non-instanceable]:placing inside library  "+library_id);
            // document.getElemenatById(dom_target).innerHTML+=instance_as_parent_layout;
            // populateInstanceLibrary(library_id,library_id+'_accordion_children',parent_index,self_index,instance_id);
            //console.log("populateInstanceLibrary: type 1[parent][non-instanceable] populating instances for "+this.available_parents[parent_index][0]);
        } break;

        case 2: {

            //we have to intervene here to check if we are supposed to hide this category.

            //console.log("populateInstanceLibrary: type 2 [parent][instanceable] populating instances for "+this.available_parents[parent_index][0]);

            //console.log("found instances : "+Object.entries(this.available_parents[parent_index][4]));
            for (let x of this.available_parents[self_index][4]) {
                //console.log("populateInstanceLibrary type 2 [Instanceable]]: adding "+x.Name+" to "+dom_target+" with parent index: "+parent_index+" and self index: "+self_index);
                dom_target_element.innerHTML += '<div class="accordion-item"><h2 class="accordion-header shadow-sm content_box_option" id="in' + x.inner_id + '_header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#in' + x.inner_id + '_accordion" aria-expanded="false" aria-controls="in' + x.inner_id + '_header" onClick="populateChildren(' + self_index + ',' + self_index + ',' + x.inner_id + ',false,false)"  style=""><div class="row text-center" style=""><div class="col-sm-1" style="z-index:100;"><a class="instance_delete" style="margin-left:auto;margin-right:auto;" data-toggle="tooltip" data-placement="bottom" title="" onclick="deleteInstance(' + self_index + ',' + self_index + ',' + x.inner_id + ',false,false)" data-bs-original-title="Delete instance "><strong>-</strong></a></div></div><div class="col-sm-1"><img src="res/edit.png" class="img-fluid" alt="Responsive image" width="70%" style="max-width:32px;padding-top:10px"data-toggle="tooltip" data-placement="bottom" title="Edit this element" onclick="prepareInstanceForEdition(' + self_index + ',' + x.inner_id + ',' + "'" + x.Name + "'" + ');" data-bs-toggle="modal" data-bs-target="#raw_edit_instance_modal"></div><div class="col-sm-7">' + x.Name + '</div></button></h2><div id="in' + x.inner_id + '_accordion" class="accordion-collapse collapse" aria-labelledby="in' + x.inner_id + '_header"><div class="accordion-body" id="' + x.inner_id + '_accordion_body"><div class="d-flex flex-column" id="' + x.inner_id + '_accordion_children"></div></div></div></div>';

            }

        } break;

        case 3: {
            //console.log("populateInstanceLibrary: type 3 [non-parent][instance] populating instances for "+this.available_parents[parent_index][0]);
            //parent_index,instance_index,instance_id,instanceable,is_parent
            let original_parent = parent_index;
            let valid_instances = [];
            valid_instances = getMatchingInstancesToParent(instance_id, this.available_parents[self_index][4]);//WARNING, IMPORTANT CHANGE FROM SELF_INDEX TO ORIGINAL_PARENT
            //console.log("populateInstanceLibrary: found instances: "+JSON.stringify(valid_instances));

            //console.log("valid instances found for type 3 "+ valid_instances);
            for (let x of this.available_parents[parent_index][4]) {
                //console.log("populateInstanceLibrary type 3 [Instance]: adding "+x.Name+" to "+dom_target);
                let energy_rating;
                if (x.last_HCS != null) {
                    energy_rating = x.last_HCS.Ocs;
                } else {
                    energy_rating = 'Unrated';
                }
                dom_target_element.innerHTML += '<div class="accordion-item"><h2 class="accordion-header shadow-sm content_box_option" id="in' + x.inner_id + '_header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#in' + x.inner_id + '_accordion" aria-expanded="false" aria-controls="in' + x.inner_id + '_header" onClick="populateChildren(' + original_parent + ',' + self_index + ',' + x.inner_id + ',false,false)"  style=""><div class="row text-center" style=""><div class="col-sm-1" style="z-index:100;"><a class="instance_delete" style="margin-left:auto;margin-right:auto;" data-toggle="tooltip" data-placement="bottom" title="" onclick="deleteInstance(' + original_parent + ',' + self_index + ',' + x.inner_id + ',false,false)" data-bs-original-title="Delete instance"><strong>-</strong></a></div></div><div class="col-sm-1"><img src="res/edit.png" class="img-fluid" alt="Responsive image" width="70%" style="max-width:32px;padding-top:10px"data-toggle="tooltip" data-placement="bottom" title="Edit this element" onclick="prepareInstanceForEdition(' + parent_index + ',' + x.inner_id + ',' + "'" + x.Name + "'" + ');" data-bs-toggle="modal" data-bs-target="#raw_edit_instance_modal"></div><div class="col-sm-5">' + x.Name + '</div><div class="col-sm-2"style="display:none;"><h6 style="font-size:0.7rem;" id="' + x.inner_id + '_rating_quantities"></h6></div><div class="col-sm-1 rule float-end" id="' + x.inner_id + '_rating" data-toggle="tooltip" data-placement="top" title="Estimated energy rating for this operation"></div></button></h2><div id="in' + x.inner_id + '_accordion" class="accordion-collapse collapse" aria-labelledby="in' + x.inner_id + '_header"><div class="accordion-body" id="' + x.inner_id + '_accordion_body"><div class="d-flex flex-column" id="' + x.inner_id + '_accordion_children"></div></div></div></div>';

                if (parent_index == findPlaceByParentName('Operations', this.available_parents)) {
                    instance = findInstanceInStorage(original_parent, x.inner_id);
                    if (instance.hasOwnProperty('last_HCS')) {
                        let label = getCategoryAccordingToTaxonomy(instance.last_HCS.Ocs);
                        console.log("FOUND LABEL: " + label.label);
                        var params = {
                            fullscreen: false
                        };
                        var elem = document.getElementById(x.inner_id + '_rating');
                        var two = new Two(params).appendTo(elem);
                        two.width = 50;
                        two.height = 50;
                        var circle = two.makeCircle(20, 20, 12);
                        let text = '?';
                        if (label.label != '') {
                            text = label.label;
                        }
                        var rating = two.makeText(text, 20, 20)
                        label.color == '' ? circle.fill = '#ffffff' : circle.fill = label.color;
                        two.update();
                        $('[data-toggle="tooltip"]').tooltip();
                        // we add the results to the tag
                        document.getElementById(instance.inner_id + '_rating_quantities').innerHTML = 'HCS: ' + parseFloat(instance.last_HCS.HcS).toFixed(2) + '<br> SCS: ' + parseFloat(instance.last_HCS.SCS).toFixed(2) + " <br>BCS: " + parseFloat(instance.last_HCS.BCS).toFixed(2) + " <br>Ocs: " + parseFloat(instance.last_HCS.Ocs).toFixed(2);

                    }


                }
            }
        } break;

        case 4: {
            //console.log("populateInstanceLibrary type 4 [parent][instanceable] [from instance] populating in "+this.available_parents[self_index][0]+" belongs to instance: "+instance_id);  
            //the solution should be here, instead of showing every instance, just fetch the ones whose parent_instance_id matches them.

            //an instance of timed expectations would be created here
            let valid_instances = [];
            valid_instances = getMatchingInstancesToParent(instance_id, this.available_parents[self_index][4]);
            //console.log("populateInstanceLibrary: found instances: "+JSON.stringify(valid_instances));
            for (let x in valid_instances) {
                dom_target_element.innerHTML += '<div class="accordion-item"><h2 class="accordion-header shadow-sm content_box_option" id="in' + valid_instances[x].inner_id + '_header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#in' + valid_instances[x].inner_id + '_accordion" aria-expanded="false" aria-controls="in' + valid_instances[x].inner_id + '_header" onClick="populateChildren(' + self_index + ',' + self_index + ',' + valid_instances[x].inner_id + ',false,false)"  style=""><div class="row text-center" style=""><div class="col-sm-1" style="z-index:100;"><a class="instance_delete" style="margin-left:auto;margin-right:auto;" data-toggle="tooltip" data-placement="bottom" title="" onclick="deleteInstance(' + self_index + ',' + self_index + ',' + valid_instances[x].inner_id + ',false,false)" data-bs-original-title="Delete instance "><strong>-</strong></a></div></div><div class="col-sm-1"><img src="res/edit.png" class="img-fluid" alt="Responsive image" width="70%" style="max-width:32px;padding-top:10px"data-toggle="tooltip" data-placement="bottom" title="Edit this element" onclick="prepareInstanceForEdition(' + self_index + ',' + valid_instances[x].inner_id + ',' + "'" + valid_instances[x].Name + "'" + ');" data-bs-toggle="modal" data-bs-target="#raw_edit_instance_modal"></div><div class="col-sm-7">' + valid_instances[x].Name + '</div></button></h2><div id="in' + valid_instances[x].inner_id + '_accordion" class="accordion-collapse collapse" aria-labelledby="in' + valid_instances[x].inner_id + '_header"><div class="accordion-body" id="' + valid_instances[x].inner_id + '_accordion_body"><div class="d-flex flex-column" id="' + valid_instances[x].inner_id + '_accordion_children"></div></div></div></div>'

            }

        } break;
    }


}


function showVariableInput(variable_name, dom_target, current_value, is_variable_subset, parent_index, instance_id, is_instance, type, subset_name) {

    var available_parameters = { variable_name: variable_name, is_variable_subset: is_variable_subset, parent_index: parent_index, is_instance: is_instance, type: type, subset_name: subset_name, current_value: current_value, instance_id: instance_id };
    from = 'inputVariable:';
    //console.log(from+" verifying variable "+variable_name+" for custom input in this level, parent: "+parent_index);
    let customLayout = verifyCustomLayout(variable_name);
    let input_id = new Date().getTime();
    input_id += Math.floor(Math.random() * 100); // a super sketchy way of identifying fields. LOL TODO: improve this.

    available_parameters['input_id'] = input_id;
    //console.log("CUSTOM LAYOUT: "+customLayout);


    if (customLayout == null) {
        alert("The property " + variable_name + " was not configured, RADIANCE initialized it for you. Customize it the configuration builder. The builder will be reloaded.");
        let new_config_variable = JSON.parse(this.builder_configuration_variable);
        new_config_variable.name = variable_name;
        new_config_variable.hide_variable = false;
        new_config_variable.input_type = "Direct";
        customLayout = verifyCustomLayout(variable_name);
        let selected_level = document.getElementById('builder_level_selection').value;
        let db_object_index = findLevelIndex(selected_level);
        //console.log("builderAritfactInterpret: index of the current level: " + JSON.stringify(db_object_index));
        var current_configurations = db.builderConfigurations[db_object_index.builder_configuration_index];
        console.log(current_configurations);
        for (let x in current_configurations.builder_configuration) {
            current_configurations.builder_configuration[x].configuration_variables.push(new_config_variable);
            console.log(current_configurations.builder_configuration[x]);
        }

        updateLocalStorage();
        builderInitialization();
        return;
    }

    if (!customLayout.custom) {

        //console.log(from+" no custom layout for the variable");
        //I tried to add a listener to the layout below, but it won't work as it is dynamically generated. Therefore, I will proceed to the creation of a "save" button to save the value of the field.
        let custom_name;
        if (this.temporal_level_data[customLayout.index].hide_variable == true) {
            return;
        } else {
            if (this.temporal_level_data[customLayout.index].pseudonim == null || this.temporal_level_data[customLayout.index].pseudonim == '') {

                custom_name = this.temporal_level_data[customLayout.index].name;
            } else {
                custom_name = this.temporal_level_data[customLayout.index].pseudonim;
            }


            document.getElementById(dom_target).innerHTML += '<div class="col-sm-12"style="font-family: ' + "Lora" + ';"><div class="row"><div class="col-sm-12">' + custom_name.split('_').join(' ') + ':</div><div class="col-sm-12"><div class="row"><div class="col-sm-10" style="margin-left:0px; padding-left:0px;"><input class="form-control" id="' + custom_name + '_value_field_' + input_id + '" name="' + custom_name + '_name" value="' + current_value + '"></div><div class="col-sm-2 text-center" style="margin-left:0px; padding-left:0px;"><img src="res/saveButton.png" class="img-fluid" alt="Responsive image" width="100%" style="padding-top:0px;min-width:30px;max-width:30px;" data-toggle="tooltip" data-placement="bottom" title="Save value" onclick="saveRawPropertyValue(' + parent_index + ',' + input_id + ',' + "'" + custom_name + "'" + ',' + is_variable_subset + ',' + is_instance + ',' + type + ',' + instance_id + ',false,' + "'" + subset_name + "'" + ')"></div></div></div></div></div>';
        }

    } else {
        //console.log(from+" custom layout for the variable found");
        let custom_name = this.temporal_level_data[customLayout.index].pseudonim;
        let custom_code = this.temporal_level_data[customLayout.index].custom_code;
        let custom_value_load = this.temporal_level_data[customLayout.index].custom_value_load;
        let custom_html = this.temporal_level_data[customLayout.index].custom_html;
        let input_type = this.temporal_level_data[customLayout.index].input_type;
        let hide_variable = this.temporal_level_data[customLayout.index].hide_variable;

        custom_name == null || custom_name == '' ? custom_name = this.temporal_level_data[customLayout.index].name : custom_name;

        if (hide_variable) {
            return;
        } else if (input_type == 'Direct' && custom_html != null && custom_html != '') {
            //we gotta get the custom HTML for the inline shit

            document.getElementById(dom_target).innerHTML += '<div class="col-sm-12"style="font-family: ' + "Lora" + ';"><div class="row"><div class="col-sm-12"><strong>' + custom_name.split('_').join(' ') + '</strong></div><div class="col-sm-12"><div class="row text-center" style="padding-left:0px;padding-right:0px;margin-left:0px;margin-right:0px;"><div id="' + input_id + '_available_parameters" class="parameter_metadata" style="display:none;">' + JSON.stringify(available_parameters) + '</div>' + custom_html + '</div></div></div><div id="' + custom_name + '_reserved_code" style="display:none;">' + custom_code + '</div>';

            if (custom_value_load != null && custom_value_load != '') {
                //console.log(current_value);

                if (available_parameters.current_value == "" || current_value == null) {
                    current_value = 'test';
                }
                instance_id == '' || instance_id == null ? instance_id = null : instance_id;
                parent_index == '' || parent_index == null ? parent_index = null : parent_index;

                //console.log("Loading custom layout with the following logic for the value:\n"+"let property_value ="+available_parameters.current_value+"; let instance_id = "+instance_id+"; let parent_index = "+instance_id+"; "+custom_value_load);
                eval("let property_value = '" + available_parameters.current_value + "'; let instance_id = '" + instance_id + "'; let parent_index = '" + parent_index + "'; " + custom_value_load);
            }
        } else if (input_type == 'Custom' && custom_code != null && custom_code != '' && custom_html != null && custom_html != '') {
            //we gotta get the custom HTML for the inline shit
            document.getElementById(dom_target).innerHTML += '<div class="col-sm-12"style="font-family: ' + "Lora" + ';"><div class="row"><div class="col-sm-12">' + custom_name.split('_').join(' ') + '</div></div></div>';

            if (custom_value_load != null && custom_value_load != '') {
                current_value == '' || current_value == null ? current_value = '' : current_value;
                instance_id == '' || instance_id == null ? instance_id = '' : instance_id;
                parent_index == '' || parent_index == null ? parent_index = '' : parent_index;
                eval("let property_value =" + available_parameters.current_value + "; let instance_id = " + instance_id + "; let parent_index = " + parent_index + "; " + custom_value_load);
            }
        }


    }

    function verifyCustomLayout(variable_name) {
        //console.log("VERIFY LAYOUT "+variable_name.split("-").join("_"));
        for (let x in this.temporal_level_data) {
            //console.log("checking for level data");
            let current_object = this.temporal_level_data[x];

            if (current_object.name == variable_name) {
                if ((current_object.custom_code != null && current_object.custom_html != null && current_object.custom_code != '' && current_object.custom_html != '') || current_object.hide_variable == true) {

                    return { 'custom': true, 'index': x };
                } else {
                    return { 'custom': false, 'index': x };
                }
            }

        }
        //the variable does not exist it, we should initialize it then (I tampered the stored object in the DB :) )
        return null;


    }

}

function useHtmlTool(dom_target, tool_index) {
    let content = this.custom_html_tools[tool_index].content.valueOf();
    if (content.includes('~id~')) {
        let uid = Date.now();
        content = content.split('~id~').join(uid);
    }

    if (content != this.custom_html_tools[tool_index].content) {
        document.getElementById(dom_target).value += content;
    } else {
        document.getElementById(dom_target).value += this.custom_html_tools[tool_index].content;
    }
    if (this.custom_html_tools[tool_index].notes != null && this.custom_html_tools[tool_index].notes != '') {
        alert(this.custom_html_tools[tool_index].notes);
    }

}

function useCodeTool(dom_target, tool_index) {
    document.getElementById(dom_target).value += this.custom_code_tools[tool_index].content;
    if (this.custom_code_tools[tool_index].notes != null && this.custom_code_tools[tool_index].notes != '') {
        alert(this.custom_code_tools[tool_index].notes);
    }
}

function useCodeValueLoadTool(dom_target, tool_index) {
    document.getElementById(dom_target).value += this.custom_value_load_tools[tool_index].content;
    if (this.custom_value_load_tools[tool_index].notes != null && this.custom_value_load_tools[tool_index].notes != '') {
        alert(this.custom_value_load_tools[tool_index].notes);
    }
}


function checkIfVariablesSubset(index, parent_index) {

    //variables subsets are variables inside objects that are not meant to be 
    let children = this.available_parents[index][3];
    if (parent_index == children && this.available_parents[index][2] !== 'array' && this.available_parents[index][2] == 'object') {
        return true;
    } else {
        return false;
    }
}


function reasonerPlantumlDiagram(type) {
    try {


        document.getElementById("plantuml_builder_flow").innerHTML = '';
        document.getElementById("plantuml_builder_timing").innerHTML = '';
        let sequence_string = buildPlantumlString(type);

        if (sequence_string != null) {
            console.log("%cPlantuml SEQUENCE diagram: \n" + sequence_string, "background-color:white;color:#4287f5");
            console.log("%cPlantuml TIMING diagram: \n" + db.timing_diagram, "background-color:white;color:#4287f5");
            db['sequence_preview_data'] = sequence_string;
            updateLocalStorage();
            document.getElementById("plantuml_builder_flow").innerHTML += '<img class="img-fluid" uml="' + sequence_string + '">';
            document.getElementById("plantuml_builder_timing").innerHTML += '<img class="img-fluid" ' + "uml='" + db.timing_diagram + "'" + '>';
            plantuml_runonce();



        } else {
            alertify.error("There was an error while fetching the plantuml diagram.");
        }

        function buildPlantumlString(type) {
            //finding the place of the instance statically won't work because the array can change in length with a new version of the schema..
            let string_openning = '';
            let string_closing = '';
            if (type == "sequence") {
                string_openning = '@startuml\n';
                string_closing = '@enduml\n';
            }

            var entities = [];
            //we have to find every instance of operation
            let operations_place = findPlaceByParentName("Operations", this.available_parents);
            if (operations_place == null) {
                return null;
            }
            for (let x in this.available_parents[operations_place][4]) {
                //add the operation to the string
                let current_entity = this.available_parents[operations_place][4][x].inner_variables[0].variables;
                if (current_entity.operation_ID == null || current_entity.operation_ID == '') {
                    current_entity.operation_ID = this.available_parents[operations_place][4][x].inner_id;
                }
                //console.log("%c Operation data handling: "+current_entity.operation_data_handling,"color:red");
                let new_entity = { id: current_entity.operation_ID, name: this.available_parents[operations_place][4][x].Name.split(' ').join('_'), data_handling: current_entity.operation_data_handling, description: current_entity.operation_description, task_distribution: current_entity.operation_task_distribution, uml_description: '' }

                if (new_entity.task_distribution == 'centralized') {
                    new_entity.uml_description += "entity " + new_entity.name + ' #red\n';
                } else if (new_entity.task_distribution == 'decentralized') {
                    new_entity.uml_description += "entity " + new_entity.name + ' #green\n';
                } else {
                    new_entity.uml_description += "entity " + new_entity.name + '\n';
                }

                if (new_entity.description != null && new_entity.description != '') {
                    new_entity.uml_description += 'note over ' + new_entity.name + ' : ' + new_entity.description + '\n';
                }

                //console.log("%c Operation data handling: "+new_entity.data_handling,"color:red");
                entities.push(new_entity);
            }

            var parameters = [];
            let parameters_place = findPlaceByParentName("Parameters", this.available_parents);
            if (parameters_place == null) {
                return null;
            }
            console.log("Checking parameters: " + JSON.stringify(this.available_parents[parameters_place][4]));
            for (let x in this.available_parents[parameters_place][4]) {
                //add the parameter to the string

                let current_entity = this.available_parents[parameters_place][4][x].inner_variables[0].variables;
                let current_entity_name = this.available_parents[parameters_place][4][x].Name;
                if (current_entity.parameter_ID == null || current_entity.parameter_ID == '') {
                    current_entity.parameter_ID = this.available_parents[parameters_place][4][x].inner_id;
                }
                let new_entity = { id: current_entity.parameter_ID, name: current_entity_name.split('"').join(''), origin: current_entity.origin }

                parameters.push(new_entity);
            }


            //lets get the results
            var results = [];
            let results_place = findPlaceByParentName("Results", this.available_parents);
            if (results_place == null) {
                return null;
            }

            for (let x in this.available_parents[results_place][4]) {
                let current_instance = this.available_parents[results_place][4][x].inner_variables[0].variables;
                //the results have: source operation ,target operation and parameter
                let new_result = { source: current_instance.source_operation, target: current_instance.target_operation, parameter: current_instance.parameter, uml_description: '' }

                //we add the description here
                console.log("looking in entities: " + JSON.stringify(entities) + "for " + new_result.source);
                let left_entity = getEntity(entities, new_result.source);
                let left = getEntityName(entities, new_result.source);
                let right_entity = getEntity(entities, new_result.target);
                let right = getEntityName(entities, new_result.target);
                //console.log("right: "+right);
                console.log("parameters: " + JSON.stringify(parameters) + " searching for " + new_result.parameter);
                let arg = getParameter(parameters, new_result.parameter);
                let origin = arg.origin;


                //console.log("%c Operation data handling: "+JSON.stringify(left_entity),"color:red");

                if (left_entity.data_handling == 'keep') {
                    if (origin == '') {
                        origin = "entity";
                    }
                    let create_instance = "\n" + origin.replace(' ', '_') + " " + left.replace(' ', '_') + "_" + origin.replace(' ', '_') + ' #f5edab';//we create the instance
                    console.log("HERE HERE: " + origin);
                    new_result.uml_description += create_instance;
                    new_result.uml_description += "\nbox " + origin.replace(' ', '_') + "_interaction #LightBlue\nparticipant " + left + "\nparticipant " + left.replace(' ', '_') + "_" + origin.replace(' ', '_');
                    new_result.uml_description += "\n" + left + " -> " + left + "_" + origin + ": '" + 'creates and stores ' + arg.name.split(' ').join("_") + "'";
                } else if (left_entity.data_handling == 'destroy') {
                    new_result.uml_description += "\n" + left + "->" + left + ':' + "'" + 'creates ' + arg.name.split(' ').join("_") + "'";
                } else if (left_entity.data_handling == '' || left_entity.data_handling == null) {
                    // new_result.uml_description+="'"+'creates'+arg.name.split(' ').join("_")+"'";
                }


                if (right != null) {
                    new_result.uml_description += "\n" + left + "->" + right + ": 'sends " + arg.name.split(' ').join('_') + "'";

                    if (left_entity.data_handling == 'destroy') {
                        new_result.uml_description += "\n" + left + "->" + left + ':' + "'" + 'destroys ' + arg.name.split(' ').join("_") + "'";
                    }

                    if (right_entity.data_handling == 'keep') {
                        console.log("HERE HERE: " + origin);
                        if (origin == '' || origin == 'operation') {
                            origin = "entity";
                        } else {
                            if (origin == "database") {
                                origin = 'database';
                            }
                        }
                        let create_instance = "\n" + origin + " " + right + "_" + origin + ' #f5edab';
                        console.log("HERE HERE something is broken..: " + origin);
                        new_result.uml_description += create_instance;
                        new_result.uml_description += "\nbox " + origin + "_interaction #LightBlue\nparticipant " + right + "\nparticipant " + right + "_" + origin;
                        new_result.uml_description += "\n" + right + "->" + right + '_' + origin + ':' + "'" + 'receives and stores ' + arg.name.split(' ').join("_") + "'";
                    } else if (right_entity.data_handling == 'destroy') {
                        new_result.uml_description += "\n" + right + "->" + right + ':' + "'" + 'receives and destroys ' + arg.name.split(' ').join("_") + "'";
                    } else if (right_entity.data_handling == '' || right_entity.data_handling == null) {
                        //new_result.uml_description+='receives '+arg.name.split(' ').join("_")+"'";
                    }
                }

                results.push(new_result);
            }

            return buildFinalString(entities, parameters, results);

            function getEntityName(array, entity_id) {
                //we have to get it from the entities array above
                for (let x in array) {
                    let entity = array[x];
                    if (entity.id == entity_id) {
                        return entity.name;
                    }
                }

            }

            function getEntity(array, entity_id) {
                //we have to get it from the entities array above
                for (let x in array) {
                    let entity = array[x];
                    if (entity.id == entity_id) {
                        return entity;
                    }
                }
            }

            function getParameter(array, parameter_id) {
                for (let x in array) {
                    let entity = array[x];
                    if (entity.id == parameter_id) {
                        return entity;
                    }
                }
            }

            function buildFinalString(entities, parameter, results) {
                let final_string = '';

                //we add the actors
                for (let x in entities) {
                    final_string += entities[x].uml_description;
                }
                //we add the interactions
                for (let x in results) {
                    final_string += results[x].uml_description;
                }

                return final_string;
            }

        }

    } catch (error) {
        //  console.log('%cPlantuml error... but it might not be important: '+error, 'color:red');
    }

}

function waitForElementToExist(selector) {

    //courtesy of: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}


function prepareInstanceForEdition(parent_index, instance_id) {
    let instance = findInstanceInStorage(parent_index, instance_id);
    if (instance == null) {
        return;
    }
    instance.Name == null ? instance.Name = '<- No name, modify me' : instance.Name = instance.Name;
    document.getElementById('raw_instance_name').value = instance.Name;
    document.getElementById("save_instance_edition_button_place").innerHTML = '';
    document.getElementById("save_instance_edition_button_place").innerHTML += '<button class="generic_button" data-bs-dismiss="modal" onClick="saveRawInstanceEdition(' + "'raw_instance_name'" + ',' + "'Name'" + ',' + parent_index + ',' + instance_id + ')">Save changes</button>';
}


//----------------------OVERLAY FUNCTIONS FOR THE ALGORITHM--------------------------

function openNav(type) {
    if (type == 'profile_builder') {
        let current = document.getElementById("algorithm_editor_content");

        current.style.display == 'none' ? current.style.display = 'block' : current.style.display = 'none';
    } else {
        let current = document.getElementById("collection_builder_algorithm_editor_content");

        current.style.display == 'none' ? current.style.display = 'block' : current.style.display = 'none';
    }

}
//-------------------------------------------------------------------------------------



//Populate the available guides for consumption
function populateGuides() {
    let drop = document.getElementById('consumption_guide_select');
    //iterate over the available profiles that are valid instances of
    let options = getGuidesList();
    drop.innerHTML = '';
    let selected_consumption;
    if (this.element_to_edit.hasOwnProperty('consumption_guide')) {
        selected_consumption = this.element_to_edit.consumption_guide;
    } else {
        //we change the data of the stored profile
        db.profile_Array[findInstancePlaceInStorage('profile', this.element_to_edit.element_id)].consumption_guide = options[0];
        updateLocalStorage();
        alertify.success('Set the hardware consumption guide to the first one found.');
        selected_consumption = this.element_to_edit.consumption_guide;
    }
    //add the stupid options
    for (x in options) {
        drop.innerHTML += '<option value="' + options[x] + '"' + (selected_consumption == options[x] ? 'selected' : '') + '>' + db.profile_Array[findInstancePlaceInStorage('profile', options[x])].element_name + '</option>';
    }
}

function changeGuide() {
    let selection = document.getElementById('consumption_guide_select').value
    db.profile_Array[findInstancePlaceInStorage('profile', this.element_to_edit.element_id)].consumption_guide = selection;
    saveInstanceCache()
    updateLocalStorage();
    //we gotta update the "element_to_edit global variable as it is our reference. We do this by setting the builder selection."
    setBuilderSelection('profile', this.element_to_edit.element_id);
    alertify.success('New consumption guide selected.');
    builderInitialization();
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

function populateConfigurationCloner() {


    let profile_selector = document.getElementById('configuration_cloner_profile_select');
    let level_selector = document.getElementById('configuration_cloner_level_select');

    //we clean the available profiles

    profile_selector.innerHTML = '';

    //we grab the available profiles from the db

    let available_profiles = this.db.profile_Array;

    for (let x in available_profiles) {

        let profile_name = available_profiles[x].element_name;
        let profile_id = available_profiles[x].element_id;

        profile_selector.innerHTML += "<option value=" + "'" + profile_id + "'" + ">" + profile_name + "</option>";

    }


}

function cloneConfigurationFromTarget() {
    let profile_selector = document.getElementById('configuration_cloner_profile_select');
    let level_selector = document.getElementById('configuration_cloner_level_select');

    let level_selected = level_selector.value;
    let profile_selected = profile_selector.value;




    //We check if the configuration for the current profile is initialized

    //we try to find the place of the configuration for the current profile
    let target_profile_place = findConfigurationPlaceInStorage(this.element_to_edit.element_id);
    if (target_profile_place == null) {

        alertify.alert('Configuration clonning error!', "The target profile has no configuration. Please click on 'Save configuration' and retry", function () { alertify.success('Ok'); });
        return;
    } else {
        let source_profile_place = findConfigurationPlaceInStorage(profile_selected);
        if (source_profile_place == null) {
            alertify.alert('Configuration clonning error!', "The source profile has no configuration.", function () { alertify.success('Ok'); });
            return;
        } else {
            //we have to check that the level is valid
            var clone_level_index;
            for (let x in this.db.builderConfigurations[source_profile_place].builder_configuration) {
                if (this.db.builderConfigurations[source_profile_place].builder_configuration[x].level == level_selected) {
                    //we clone the level

                    let level_to_clone = this.db.builderConfigurations[source_profile_place].builder_configuration[x];
                    let profile_to_clone_to_index = findConfigurationPlaceInStorage(this.element_to_edit.element_id);
                    let index_level_to_clone_to = document.getElementById('builder_level_selection').value;

                    var target = this.db.builderConfigurations[profile_to_clone_to_index].builder_configuration[x];
                    clone_level_index = x;
                    var source = level_to_clone;

                    //we check that the current profile actually has an existing level in the current index
                    for (let y in this.db.builderConfigurations[profile_to_clone_to_index].builder_configuration) {
                        let current = this.db.builderConfigurations[profile_to_clone_to_index].builder_configuration[y];
                        if (current.level == index_level_to_clone_to) {

                            //everything required to perform the clonning exists, therefore we can proceed with the copy the level property by property.

                            let target_variables = target.configuration_variables;
                            let source_variables = source.configuration_variables;
                            console.log("target variables: " + JSON.stringify(target_variables));
                            console.log("Source variables: " + JSON.stringify(source_variables));
                            //we perform the copy
                            for (let a in target_variables) {
                                if (target_variables[a].hasOwnProperty('name')) {
                                    let target_variable_name = target_variables[a].name;
                                    for (let b in source_variables) {
                                        //we match the name of source variable to the current target variable in a
                                        let source_variable_name = source_variables[b].name;
                                        if (target_variable_name == source_variable_name) {
                                            //peform the copy
                                            //console.log("cloneConfigurationFromTarget: replacing " + JSON.stringify(target_variables[a]) + " with " + JSON.stringify(source_variables[b]));
                                            target_variables[a] = source_variables[b];

                                            break;
                                        } else {
                                            //console.log("cloneConfigurationFromTarget: comparing " + target_variables[a] + " with " + source_variables[b]);
                                        }
                                    }
                                } else {
                                    //it is category name
                                    let target_variable_name = target_variables[a].category_name;
                                    for (let b in source_variables) {
                                        //we match the name of source variable to the current target variable in a
                                        let source_variable_name = source_variables[b].category_name;
                                        if (target_variable_name == source_variable_name) {
                                            //peform the copy
                                            //console.log("cloneConfigurationFromTarget: replacing " + target_variables[a] + " with " + source_variables[b]);
                                            target_variables[a] = source_variables[b];

                                            break;
                                        } else {
                                            //console.log("cloneConfigurationFromTarget: comparing " + target_variables[a] + " with " + source_variables[b]);
                                        }
                                    }
                                }

                            }

                            //we forgot to actually place the result in the target.

                            let transient_result = JSON.stringify(target);
                            let result = JSON.parse(transient_result);
                            result.level = document.getElementById('builder_level_selection').value;

                            this.db.builderConfigurations[profile_to_clone_to_index].builder_configuration[parseInt(result.level) - 1] = result;

                            playSound('Success');
                            saveInstanceCache();
                            updateLocalStorage();
                            menuSelection('builder')
                            return;

                        }
                    }
                    alertify.alert('Configuration clonning error!', "The selected level does not exist in the profile to clone TO", function () { alertify.success('Ok'); });
                    return;



                }

                //alertify.alert('Configuration clonning error!', "The selected level does not exist in the profile to clone FROM", function () { //alertify.success('Ok'); });
                //return;
            }

            alertify.alert('Configuration clonning error!', "The selected level does not exist", function () { alertify.success('Ok'); });


        }
        alert("test 1");
    }
    alert("test 2");

}

function getCollectionsList(profile_id) {//we get all the collections that the profile is in
    if (profile_id == null) {
        profile_id = this.element_to_edit.element_id;
    }
    let collection_instances = this.db.collection_Array;

    //we look inside of each one to see if the actually have the current profile
    let valid_collections = [];
    for (let x in collection_instances) {
        let current_collection_instance = collection_instances[x];

        for (let y in current_collection_instance.inner_profiles) {
            let current_inner_profile = current_collection_instance.inner_profiles[y];

            if (current_inner_profile == profile_id) {
                valid_collections.push(current_collection_instance.element_id);
            }

        }
    }
    if (valid_collections.length == 0) {
        alertify.alert("The current profile is not a member in any of the available collections");
        return;
    }
    //we populate the collections selector

    let col_selector = document.getElementById('external_triggers_collections');
    col_selector.innerHTML = '';
    let inherited_collections = [];
    for (let x in valid_collections) {
        let collection = this.db.collection_Array[findInstancePlaceInStorage('collection', valid_collections[x])];
        col_selector.innerHTML += "<option value=" + '"' + collection.element_id + '"' + ">" + collection.element_name + " (Profile is participant)</option>";

        let collections_inheritance = getInheritedCollections(collection.element_id, inherited_collections);
        console.log(collections_inheritance);
        //[0] are collections where the collection is a member
        //[1] are siblings of the collection where the collection is a member
        for (let x in collections_inheritance[0]) {
            let collection = this.db.collection_Array[findInstancePlaceInStorage('collection', collections_inheritance[0][x])];
            col_selector.innerHTML += "<option value=" + '"' + collection.element_id + '"' + ">" + collection.element_name + " (Hegemonic collection)</option>";
        }

        for (let x in collections_inheritance[1]) {
            let collection = this.db.collection_Array[findInstancePlaceInStorage('collection', collections_inheritance[1][x])];
            col_selector.innerHTML += "<option value=" + '"' + collection.element_id + '"' + ">" + collection.element_name + " (Sibling collection)</option>";
        }
    }


}






function externalTriggersPopulation(flag, second_flag) {

    let col_selector = document.getElementById('external_triggers_collections');
    if (col_selector.value == '' || flag) {
        getCollectionsList();
    }

    //initialize the profile with the selected element
    let col_selection = col_selector.value;
    let profile_selector = document.getElementById('external_triggers_profiles');
    profile_selector.innerHTML = '';
    if (col_selection != '') {
        let profiles = fetchAllProfiles(col_selection);
        profile_selector.innerHTML = "";
        for (let x in profiles) {
            profile_selector.innerHTML += '<option value="' + profiles[x] + '">' + this.db.profile_Array[findInstancePlaceInStorage('profile', profiles[x])].element_name + '</option>';
        }
    }


    if (profile_selector.value == '') {
        profile_selector.innerHTML += '<option value="">No available profiles in the selected collection</option>';
    } else {
        profile_selector.innerHTML += '<option value="all">View everything in the collection</option>';
    }
    //we get the triggers available in the selection

    if (col_selector.value != '') {
        //fetch the triggers in the current collection
        //populateTriggers(col_selector.value,profile_selector);
        let external_triggers_container = document.getElementById('external_triggers_container');
        external_triggers_container.innerHTML = '';
        populateTriggers(col_selector.value, profile_selector.value);
    }


    function populateTriggers(parent_collection, parent_profile) {
        //triggers are a bit tricky because we have to add listeners depending on the type of trigger we select
        let document_row = document.getElementById('external_triggers_container');
        console.log("Populating the external triggers");
        //lets fetch the results
        let parent_collection_instance = this.db.collection_Array[findInstancePlaceInStorage('collection', parent_collection)];
        console.log("Parent collection: " + JSON.stringify(parent_collection_instance));
        //we have to check that it has external triggers
        if (parent_collection_instance.hasOwnProperty("external_triggers")) {
            //we read the triggers and filter by the parent profile
            let available_triggers = parent_collection_instance.external_triggers;
            // we populate the cache
            this.external_triggers_cache = [];
            for (let x in available_triggers) {
                console.log("Checking triggers in the colleciton");
                //we fetch each instance and place it in the cache, the properties available in the triggers are:
                //the parents are the places in which we are creating the triggers, the source operation is the operation of the collecftion and profile we are referencing. The target operation makes a reference to the selected operation in the current profile we are building
                /* this.parent_collection = parent_collection;
                this.parent_profile = parent_profile;
                this.target_profile = target_profile;
                this.target_operation = target_operation;
                this.trigger_type = trigger_type;
                this.trigger_value = trigger_value; */

                let current_trigger = available_triggers[x];
                console.log(current_trigger);
                let target_profile_instance = this.db.profile_Array[findInstancePlaceInStorage('profile', this.element_to_edit.element_id)];
                let target_profile_parsed = JSON.parse(target_profile_instance.profile_cache);
                let target_operation_instance = getInstanceFromArray(target_profile_parsed[findPlaceByParentName('Operations', this.available_parents)][4], current_trigger.target_operation);
                let parent_collection_instance = this.db.collection_Array[findInstancePlaceInStorage('collection', current_trigger.parent_collection)];
                let parent_profile_instance = this.db.profile_Array[findInstancePlaceInStorage('profile', current_trigger.parent_profile)];
                let trigger_value_instance;

                console.log(target_profile_instance);
                console.log(parent_profile_instance);



                console.log(this.external_triggers_cache);

                //we get the trigger value depending on the trigger type: parameter,state,operation
                switch (current_trigger.trigger_type) {
                    case "parameter":
                        //we have to get the parameters from the profile and search for the appropiate parameter
                        let parsed_cache = JSON.parse(parent_profile_instance.profile_cache);
                        let parameters_in_instance = parsed_cache[findPlaceByParentName('Parameters', parsed_cache)][4];
                        trigger_value_instance = getInstanceFromArray(parameters_in_instance, current_trigger.trigger_value);
                        break;
                    case "state":
                        trigger_value_instance = current_trigger.trigger_value;
                        break;
                    case "operation":
                        //we have to get the parameters from the profile and search for the appropiate parameter
                        let operation_parsed_cache = JSON.parse(parent_profile_instance.profile_cache);
                        let operations_in_instance = operation_parsed_cache[findPlaceByParentName('Operations', operation_parsed_cache)][4];
                        console.log(operations_in_instance);
                        trigger_value_instance = getInstanceFromArray(operations_in_instance, current_trigger.trigger_value);
                        console.log(trigger_value_instance);
                        break;
                }

                this.external_triggers_cache.push({ element_id: current_trigger.element_id, parent_collection: parent_collection_instance, parent_profile: parent_profile_instance, target_profile: target_profile_instance, target_operation: target_operation_instance, trigger_type: current_trigger.trigger_type, trigger_value: trigger_value_instance });
                console.log(this.external_triggers_cache);
                console.log(trigger_value_instance);
                if (parent_profile != '' && parent_profile != 'all') {
                    let external_triggers_container = document.getElementById('external_triggers_container');
                    external_triggers_container.innerHTML = '';

                    //we filter by the parent profile
                    for (let y in this.external_triggers_cache) {
                        if (this.external_triggers_cache[y].parent_profile.element_id == parent_profile) {
                            //we add 
                            external_triggers_container.innerHTML += '<div class="col-12 rule shadow-sm text-center content_box_option" style="margin-top:10px;padding-top:10px;padding-bottom:10px;padding-left:5px; background-color:linen;"><div class="row no-gutters rule align-items-center"> <div class="col-3 no-gutters rule"> <select class="form-select" aria-label="origin" id="' + this.external_triggers_cache[y].element_id + '_origin"> </select> </div> <div class="col-3 no-gutters rule"><select class="form-select" id="type_' + this.external_triggers_cache[y].element_id + '_parameter"> </select> </div> <div class="col-3 no-gutters rule"><select class="form-select" aria-label="target" id="' + this.external_triggers_cache[y].element_id + '_destination"> </select> </div> <div class="col-3 no-gutters rule"> <div class="row no-gutters rule text-center align-items-center"> <div class="col-6 rule"><a class="instance_delete" style="margin-left:auto;margin-right:auto;" data-toggle="tooltip" data-placement="bottom" title="" onclick="deleteExternalTrigger(' + "'" + this.external_triggers_cache[y].element_id + "'" + ')" data-bs-original-title="Delete instance "><strong>-</strong></a></div> <div class="col-6 rule"> <img class="img-fluid align-right" style="max-width: 30px;" src="./res/saveButton2.svg" onclick="saveExternalTrigger(' + "'" + this.external_triggers_cache[y].element_id + "'" + ')"></img> </div> </div> </div> </div> </div>';


                            //now that we have added the trigger template, we populate it

                            let origin = document.getElementById(this.external_triggers_cache[y].element_id + '_origin');
                            let type = document.getElementById('type_' + this.external_triggers_cache[y].element_id + '_parameter');
                            let parameter = document.getElementById(this.external_triggers_cache[y].element_id + '_destination');

                            let available_target_operations = this.available_parents[findPlaceByParentName('Operations', this.available_parents)][4];
                            let parsed_parent_profile = JSON.parse(this.external_triggers_cache[y].parent_profile.profile_cache);
                            console.log(parsed_parent_profile);
                            let source_operations = parsed_parent_profile[findPlaceByParentName('Operations', parsed_parent_profile)][4];
                            console.log(source_operations);

                            //we select all the EXTERNAL parameters of the parent profile
                            let parsed_parent_profile_parameters = parsed_parent_profile[findPlaceByParentName('Parameters', parsed_parent_profile)][4];
                            let external_parameters = [];

                            console.log(parsed_parent_profile_parameters);
                            for (let a in parsed_parent_profile_parameters) {
                                let current_parameter_properties = parsed_parent_profile_parameters[a].inner_variables[0].variables;
                                if (current_parameter_properties.direction == "external") {
                                    external_parameters.push(parsed_parent_profile_parameters[a]);
                                }
                            }

                            //lets add the origin
                            for (let z in available_target_operations) {
                                if (this.external_triggers_cache[y].target_operation != null) {
                                    origin.innerHTML += '<option value="' + available_target_operations[z].inner_id + '"' + (this.external_triggers_cache[y].target_operation.inner_id == available_target_operations[z].inner_id ? 'selected' : '') + '>' + available_target_operations[z].Name + '</option>';
                                } else {
                                    origin.innerHTML += '<option value="' + available_target_operations[z].inner_id + '">' + available_target_operations[z].Name + '</option>';
                                }
                            }

                            // lets add a "none" option for when there is no selection available
                            if (this.external_triggers_cache[y].target_operation == '') {
                                origin.innerHTML += '<option value="" selected>None</option>';
                            }


                            // lets add a "none" option for when there is no selection available

                            if (this.external_triggers_cache[y].trigger_type == '') {

                            } else {

                                let selection = this.external_triggers_cache[y].trigger_type;
                                type.innerHTML = '';
                                if (selection == 'parameter') {
                                    //we have to populate the destination with the available parameters
                                    //lets finish by adding the parameters
                                    for (let z in external_parameters) {
                                        console.log("adding parameters to the trigger destination");
                                        parameter.innerHTML += '<option value=' + "'" + external_parameters[z].inner_id + "'" + (this.external_triggers_cache[y].trigger_value.inner_id == external_parameters[z].inner_id ? 'selected' : '') + '>' + external_parameters[z].Name + '</option>';
                                    }
                                    if (this.external_triggers_cache[y].trigger_value == '') {
                                        parameter.innerHTML += '<option value="" selected>None</option>';
                                    }

                                } else if (selection == 'operation') {
                                    console.log("adding operations to the trigger destination");
                                    for (let z in source_operations) {
                                        parameter.innerHTML += '<option value=' + "'" + source_operations[z].inner_id + "'" + (this.external_triggers_cache[y].trigger_value.inner_id == source_operations[z].inner_id ? 'selected' : '') + '>' + source_operations[z].Name + '</option>';
                                    }

                                    if (this.external_triggers_cache[y].target_operation.inner_id == '') {
                                        parameter.innerHTML += '<option value="" selected>None</option>';
                                    }
                                } else if (selection == 'state') {

                                    parameter.innerHTML += '<option value="run">run</option><option value="stop">stop</option>';
                                    parameter.value = this.external_triggers_cache[y].trigger_value;


                                }
                            }

                            //lets finish by adding the available types of trigger

                            let selection = this.external_triggers_cache[y].trigger_type;
                            type.innerHTML += '<option value="parameter">Parameter</option><option value="state">' + "Operation's" + ' profile state</option><option value="operation">by operation</option>';
                            type.value = selection;

                            if (selection == '') {
                                type.innerHTML += '<option value="" selected>None</option>';
                            } else {
                                type.value = selection;
                            }

                            //we add the listener
                            type.addEventListener('change', (event) => {

                                parameter.innerHTML = '';
                                let selection = type.value;
                                if (selection == 'parameter') {
                                    //we have to populate the destination with the available parameters
                                    //lets finish by adding the parameters
                                    console.log(external_parameters);
                                    for (let z in external_parameters) {
                                        console.log(external_parameters[z]);
                                        console.log(parameter);
                                        parameter.innerHTML += '<option value="' + external_parameters[z].inner_id + '">' + external_parameters[z].Name + '</option>';

                                    }
                                    if (external_parameters.length == 0) {
                                        parameter.innerHTML += '<option value="" selected>None</option>';
                                    }

                                } else if (selection == 'operation') {
                                    console.log("adding operations to the trigger destination");

                                    for (let z in source_operations) {
                                        parameter.innerHTML += '<option value="' + source_operations[z].inner_id + '">' + source_operations[z].Name + '</option>';
                                    }

                                    if (source_operations.length == 0) {
                                        parameter.innerHTML += '<option value="" selected>None</option>';
                                    }
                                } else if (selection == 'state') {

                                    parameter.innerHTML = '<option value="run">run</option><option value="stop">stop</option>';
                                    console.log("adding states to the trigger destination");
                                    if (this.external_triggers_cache[y].trigger_value != '') {
                                        parameter.value = this.external_triggers_cache[y].trigger_value;
                                    }

                                }

                            });
                        }

                    }
                }

            }


        } else {
            alertify.alert("There are no available triggers for this collection and profile");
        }
    }

}

function addExternalTrigger() {
    //we get the parent collection
    let chosen_parent_collection = document.getElementById('external_triggers_collections').value;
    //we get the parent profile
    let chosen_parent_profile = document.getElementById('external_triggers_profiles').value;

    let new_external_trigger = new externalTrigger(chosen_parent_collection, chosen_parent_profile, this.element_to_edit.element_id, '', '', '', '');

    //we insert it into the chosen collection

    let parent_collection = this.db.collection_Array[findInstancePlaceInStorage('collection', chosen_parent_collection)];
    if (!parent_collection.hasOwnProperty('external_triggers')) {
        parent_collection['external_triggers'] = [];
    }
    parent_collection.external_triggers.push(new_external_trigger);

    updateLocalStorage();
    externalTriggersPopulation(false, true);


}




function fetchAllProfiles(collection_id) {

    let valid_profiles = [];
    let collection = this.db.collection_Array[findInstancePlaceInStorage('collection', collection_id)];
    //we get all the profiles in the collection
    for (let x in collection.inner_profiles) {
        if (collection.inner_profiles[x] != this.element_to_edit.element_id) {
            valid_profiles.push(collection.inner_profiles[x]);
        }
    }

    console.log("Profiles in collection = " + valid_profiles);
    return valid_profiles;
}


//--------COLLECTION BUILDER FUNCTIONS--------

function collectionsBuilderInitialization() {
    if (collection_selected == '') {
        //we display the modal to select a collection
        $('#collection_builder_selection_modal').modal('show');
    } else {
        reInitializeCollectionsView();
    }
}
function chooseCollection(element_id) {

    let collection = db["collection_Array"][findProfilePlaceInStorage('collection', element_id)];
    this.collection_selected = collection;

    $('#collection_builder_selection_modal').modal('hide');
    //replace the name of the collection
    reInitializeCollectionsView();

}


function drawInheritanceDiagram(dom_target) {
    //this function is in charge of drawing the diagram so that the user can be guided throughout the composition of 
    //nested collections. Even I am getting lost building nested collections.
    //This function makes use of Two.js (thank you =))
    //we get the nesting according to the inheritance tree variable in collections_handler (collection_innheritance_tree)
    this.inheritance_diagram_branches = new Object();
    let appereances = new Object();
    //we create all the objects needed for the diagram first
    for (let x in this.collection_innheritance_tree) {
        //we check if the collection exists

        let current_instance = this.collection_innheritance_tree[x];
        if (!this.inheritance_diagram_branches.hasOwnProperty(toString(current_instance.branch))) {
            this.inheritance_diagram_branches[current_instance.branch] = []
            //we check if the parent object exists
            if (!inheritance_diagram_two_objects.hasOwnProperty(current_instance.parent)) {
                inheritance_diagram_two_objects[current_instance.parent] = inheritance_diagram.makeRectangle(this.inheritance_diagram.renderer.width, this.inheritance_diagram.renderer.height, this.inheritance_diagram.renderer.height);
                inheritance_diagram_two_objects[current_instance.parent].fill = 'rgb(255, 225, 189)';
                inheritance_diagram_two_objects[current_instance.parent].DiagramRole = 'parent';
                console.log("%cThe parent collection : " + current_instance.parent + " did not exist as a Two object: adding it", 'color:#eb4034');
            } else {
                //if it exists, we need to verify that it is indeed a parent
                if (inheritance_diagram_two_objects[current_instance.parent].DiagramRole == 'child') {
                    console.log("NOT A CHILD");
                }
                console.log("%cThe parent collection : " + current_instance.parent + " already existed as a Two object: not adding it", '#87f542');
            }
        }

        for (let y in current_instance.collections) {
            current_object = current_instance.collections[y];
            console.log("Current object: " + current_object);
            if (!inheritance_diagram_two_objects.hasOwnProperty(current_object)) {
                console.log("%cThe children collection : " + JSON.stringify(current_object) + " did not exist as a Two object: ADDING it", 'color:#eb4034');
                inheritance_diagram_two_objects[current_object] = inheritance_diagram.makeRectangle(this.inheritance_diagram.renderer.width, this.inheritance_diagram.renderer.height, this.inheritance_diagram.renderer.height);
                inheritance_diagram_two_objects[current_object].DiagramRole = 'child';
                inheritance_diagram_two_objects[current_object].fill = 'rgb(255, 225, 189)';

            } else {
                //we check that it has a role as a children
                if (inheritance_diagram_two_objects[current_object].DiagramRole == 'parent') {
                    console.log("This is a parent, not a children!");
                }
            }
        }



    }

    //we create a tree with the objects needed to draw everything that is nested
    for (let x in this.collection_innheritance_tree) {
        let current_instance = this.collection_innheritance_tree[x];
        this.inheritance_diagram_branches[current_instance.branch].push(this.inheritance_diagram_two_objects[current_instance.parent]);
        this.inheritance_diagram_two_objects[current_instance.parent].radiance_id = current_instance.parent;
    }



    for (let x in Object.getOwnPropertyNames(this.inheritance_diagram_branches)) {
        //property names: 1,2,3,4... (the branches)
        let current_branch = this.inheritance_diagram_branches[Object.getOwnPropertyNames(this.inheritance_diagram_branches)[x]];
        //current_branch: this.inheritance_diagram_branches[1]
        for (let y in current_branch) {

            console.log("Operating on branch: " + current_branch[y]);
            if (x == 0) {//the first branch and member
                let current_branch_member = current_branch[y];
                let radiance_id = current_branch_member.radiance_id;
                //branch{1:[y,n..]}
                current_branch_member.width = (this.inheritance_diagram.renderer.width);
                current_branch_member.height = this.inheritance_diagram.renderer.height;
                current_branch_member.position.x = this.inheritance_diagram.renderer.width / 2;
                current_branch_member.position.y = this.inheritance_diagram.renderer.height / 2;

                let text = this.inheritance_diagram.makeText(getInstanceFromDb('collection', current_branch_member.radiance_id).element_name, current_branch_member.width / 2, current_branch_member.height - (current_branch_member.height - 10));
                current_branch_member.diagram_text = text;

                //we place the kids :) FIND EVERY CHILD OF THIS PARENT TO DEFINE THE QUOTA OF SPACE
                let children = [];
                for (let z in this.collection_innheritance_tree) {
                    let current_member = this.collection_innheritance_tree[z];
                    if (current_member.parent == radiance_id) {
                        for (let a in current_member.collections) {
                            children.push(current_member.collections[a]);
                        }
                    }
                }
                //now we assign the children within the parent
                let width_quota = current_branch_member.width / children.length;
                let height_quota = current_branch_member.height / (children.length);
                let covered_quota_width = Number(current_branch_member.width);
                console.log(children);
                for (let z in children) {
                    let two_member = this.inheritance_diagram_two_objects[children[z]];
                    let children_name = getInstanceFromDb('collection', two_member.radiance_id).element_name;
                    console.log("Adding: " + children_name);
                    //place it within the parent
                    two_member.width = width_quota;
                    two_member.height = height_quota;
                    //we now assign a position
                    console.log(current_branch_member.width - two_member.width * z + 1);
                    two_member.position.x = (current_branch_member.width / 2) - two_member.width * z + 1 + (two_member.width / 2);

                    two_member.position.y = current_branch_member.height - ((current_branch_member.height - two_member.height) / 2);
                    let text = this.inheritance_diagram.makeText(children_name, two_member.position.x, current_branch_member.height - ((current_branch_member.height - two_member.height - 10)));
                    two_member.diagram_text = text;

                }
            } else {

                ////////////////////////////////////////////////////////////////////////

                ////YOU GOTTA FILTER WHICH PARENT IS THE ACTUAL PARENT OF THE CHILD/////

                ////////////////////////////////////////////////////////////////////////
                //we get the previous member's parent
                let last_branch = this.inheritance_diagram_branches[Object.getOwnPropertyNames(this.inheritance_diagram_branches)[(parseFloat(x) - parseFloat(1))]];
                let parent_branch_member = last_branch[0];

            }



        }
    }


    this.inheritance_diagram.update();
}

function addToCollectionsView() {
    synchronizeAvailableContentListElements(false, { class: 'profile_assign', type: "profile", dom_data_type: "profile-assign" });
    synchronizeAvailableContentListElements(false, { class: 'profile_deassign', type: "profile", dom_data_type: "profile-deassign" });
    synchronizeAvailableContentListElements(false, { class: 'collection_assign', type: "collection", dom_data_type: "collection-assign" });
    synchronizeAvailableContentListElements(false, { class: 'collection_deassign', type: "collection", dom_data_type: "collection_deassign" });
    let parameter_pool = [];
    fillParameterPool(collection_selected, parameter_pool, 0);//it is not worth it to alter synchronizeAvailableContentListElements.. just handle it manually.
    populateParameterPool(parameter_pool);
}

function clear_inheritance_tree() {/*
    for (let x in inheritance_tree_branches) {
        document.getElementById(inheritance_tree_branches[x]).innerHTML = '';
    }
    //we clear the lines
    for (let x in this.tree_lines) {
        this.tree_lines[x].remove();
    }
    this.tree_lines = []*/
}



//--------INTERPRETER FUNCTIONS--------

function interpreterInitialization() {
    //we clean the entities initialization
    let entities_config_ui = document.getElementById('assigned_collections_accordion');
    let main_profiles_initialization_accordiion = document.getElementById('available_profiles_to_configure');
    entities_config_ui.innerHTML = '';
    main_profiles_initialization_accordiion.innerHTML = "";

    if (this.db.hasOwnProperty("test_tube")) {
        console.log("Loading an existing test tube");
        this.test_tube = { ...this.db.test_tube };

    } else {
        console.log("No pre-existing test tube available, initializing it from 0");
    }
    synchronizeAvailableContentListElements(false, { class: 'collection_assign', type: "collection", dom_data_type: "collection-interpreter-assign" });
    //we get each collection in the test tube
    for (let x in test_tube.collections) {
        // we fetch the name of the collections here because I am frnakly too tired and lazy to do it properly

        let name;
        let collections_db = this.db.collection_Array;
        let collection_position_in_db;
        //the root id is the parent collection
        let root_id = test_tube.collections[x].root_id;
        let configuration_id = test_tube.collections[x].configuration_id;
        for (let y in collections_db) {
            if (collections_db[y].element_id == test_tube.collections[x].root_id) {
                name = collections_db[y].element_name;
                collection_position_in_db = y;
                break;
            }
        }

        //this is the document layout for an accordion element for the collections initialization
        //removed from the debugging release:  id: '+root_id+' con: '+configuration_id+'
        let main_selected_collection_configuration_layout = '<div class="accordion-item"> <h2 class="accordion-header" id="' + root_id + '_' + configuration_id + '_header"> <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#_' + root_id + '_' + configuration_id + '_header_open" aria-expanded="true" aria-controls="_' + root_id + '_' + configuration_id + '_header_open"> ' + name + '</button> </h2> <div id="_' + root_id + '_' + configuration_id + '_header_open" class="accordion-collapse collapse" aria-labelledby="_' + root_id + '_' + configuration_id + '_header"> <div class="accordion-body" id="' + root_id + '_' + configuration_id + '_main_body"> </div> </div>';

        //this is the document layout for an accordion element for the initialization of the profiles of a selected collection
        //removed from the debugging release:  id: '+root_id+' con: '+configuration_id+'
        let main_selected_collection_profiles_layout = '<div class="accordion-item"> <h2 class="accordion-header" id="' + root_id + '_' + configuration_id + '_profile_header"> <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#_' + root_id + '_' + configuration_id + '_header_profile_open" aria-expanded="true" aria-controls="_' + root_id + '_' + configuration_id + '_header_profile_open"> ' + name + '</button> </h2> <div id="_' + root_id + '_' + configuration_id + '_header_profile_open" class="accordion-collapse collapse" aria-labelledby="_' + root_id + '_' + configuration_id + '_header_profile"> <div class="accordion-body" id="' + root_id + '_' + configuration_id + '_profile_main_body"> </div> </div>';

        //this is the document layout for the accordion items within a main layout
        let children_collections_layout = '<div class="accordion-item"> <h2 class="accordion-header"> <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#_c_' + root_id + '_' + configuration_id + '_col_header_open" aria-expanded="true" aria-controls="_c_' + root_id + '_' + configuration_id + '_col_header_open">Children collections configuration</button> </h2> <div id="_c_' + root_id + '_' + configuration_id + '_col_header_open" class="accordion-collapse collapse" aria-labelledby="_c_' + root_id + '_' + configuration_id + '_col_header"> <div class="accordion-body" id="' + root_id + '_' + configuration_id + '_children"> </div> </div>';


        //we add the children collection to the configuration for the selected collection

        let default_configuration = '<div class="accordion-item"> <h2 class="accordion-header" id="_' + root_id + '_' + configuration_id + '_header_config"> <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#_' + root_id + '_' + configuration_id + '_header_open_config" aria-expanded="true" aria-controls="_' + root_id + '_' + configuration_id + '_header_open_config">Collection configuration</button> </h2> <div id="_' + root_id + '_' + configuration_id + '_header_open_config" class="accordion-collapse collapse" aria-labelledby="_' + root_id + '_' + configuration_id + '_header"> <div class="row"> <div class="col-12">Amount of instances of this collection: <input id="' + configuration_id + '_' + root_id + '_amount_of_instances" type="number" class="form-control"></input></div><div class="col-12"> Space representation: <select class="form-select" id="' + configuration_id + '_' + root_id + '_space_representation"><option value="contained">Contained (no network consumption)</option><option value="uncontained">Uncontained (network consumption)</option></select></div><div class="col-12"> Parameter pool permanence policy:<select class="form-select" id="' + configuration_id + '_' + root_id + '_parameter_pool_policy"><option value="instant">Instant (The parameter must be consumed immediatly or it gets removed)</option><option value="ondemand">On-demand (parameters are stored and used asynchronously by any corresponding profile)</option></select> </div><div class="col-12">Parameter pool hardware usage policy:<select class="form-select" id="' + configuration_id + '_' + root_id + '_hardware_usage_policy"><option value="passive">No hardware consumption</option><option value="active">Active hardware consumption</option></select></div><div class="col-12 text-center" style="margin-bottom:10px"><button class="btn shadow-sm generic_button text-center" onclick="saveConfiguration(' + "'collection'," + "'" + configuration_id + "'" + ',' + "'" + root_id + "'" + ')" style="background-color:#6cded8!important;">Save configuration</button></div></div>';


        entities_config_ui.innerHTML += main_selected_collection_configuration_layout;
        main_profiles_initialization_accordiion.innerHTML += main_selected_collection_profiles_layout;
        //we grab the body of the accordion for the current collection
        let body = document.getElementById(root_id + '_' + configuration_id + '_main_body');
        //we add the accordion for the general configuration of the collection        
        body.innerHTML += default_configuration;

        //flag: add the correct values stored in the test tube here

        //we add the accordion for the configuration of each children collections as long as there are any 
        let nested_collections = getCollectionInheritanceTree(collections_db[collection_position_in_db].element_id, [], 0);

        //lets transfer the nested collections to a single dimension
        let flattened_nested_collections = [];

        for (let a in nested_collections) {
            flattened_nested_collections.push(nested_collections[a].parent);
            for (let b in nested_collections[a].collections) {
                flattened_nested_collections.push(nested_collections[a].collections[b]);
            }
        }
        // we get [98211,124124,124124,...]
        let unique_nested_collections = [...new Set(flattened_nested_collections)];
        console.log("Unique nested collections: " + unique_nested_collections);
        let nested_profiles = [];

        //we provide the configuration fields for each nested profile
        for (let c in unique_nested_collections) {
            let db_index = findInstancePlaceInStorage('collection', unique_nested_collections[c]);
            for (let d in this.db.collection_Array[db_index].inner_profiles) {
                nested_profiles.push(this.db.collection_Array[db_index].inner_profiles[d]);
            }
        }

        for (let a in this.db.collection_Array) {
            //we have to check, for each nested collection and the main collection, the profiles they include
            for (let b in this.db.collection_Array[a].inner_profiles) {
                nested_profiles.push(this.db.collection_Array[a].inner_profiles[b]);
            }
        }
        //now that we have all the inner profiles, we make sure that there are no duplicates.
        let unique_nested_profiles = [...new Set(nested_profiles)];
        //now that we have the unique nested profiles, we present them for configuration to the user
        console.log("Unique nested profiles: " + unique_nested_profiles);
        let profiles_initialization_accordion = document.getElementById(root_id + '_' + configuration_id + '_profile_main_body');

        for (let a in unique_nested_profiles) {
            //removido de la version de debugging: ' id: '+unique_nested_profiles[a]+' con: '+configuration_id+' en el nombre del boton

            let db_index = findInstancePlaceInStorage('profile', unique_nested_profiles[a]);
            let profile_name = this.db.profile_Array[db_index].element_name;
            let children_profiles_layout = '<div class="accordion-item"> <h2 class="accordion-header"> <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#_p_' + configuration_id + "_" + unique_nested_profiles[a] + '_col_header_open" aria-expanded="true" aria-controls="_p_' + configuration_id + "_" + unique_nested_profiles[a] + '_col_header_open">' + profile_name + '</button> </h2> <div id="_p_' + configuration_id + "_" + unique_nested_profiles[a] + '_col_header_open" class="accordion-collapse collapse" aria-labelledby="_p_col_header"> <div class="accordion-body" id="' + configuration_id + '_' + unique_nested_profiles[a] + '_profile_configuration"><div class="col-12">Amount of instances of this profile: <input id="' + configuration_id + '_' + unique_nested_profiles[a] + '_amount_of_instances" class="form-control"></input></div><div class="col-12"> Hardware usage policy<select class="form-select" id="' + configuration_id + '_' + unique_nested_profiles[a] + '_hardware_usage_policy"><option value="passive">No hardware consumption</option><option value="active">Active hardware consumption</option></select> </div><div class="col-12 text-center" style="margin-bottom:10px"><button class="btn shadow-sm generic_button text-center" onclick="saveConfiguration(' + "'profile'" + ',' + "'" + configuration_id + "'" + ',' + "'" + unique_nested_profiles[a] + "'" + ')" style="background-color:#6cded8!important;">Save configuration</button></div> </div> </div>';

            profiles_initialization_accordion.innerHTML += children_profiles_layout;
            //we get the configuration if any 
            let profile_configuration = getProfileConfigurationById(configuration_id, unique_nested_profiles[a]);
            if (profile_configuration != null) {
                //we get the value for each key and we add the value to the ui element
                let keys = Object.keys(profile_configuration_template);
                for (let y in keys) {
                    console.log("Current key: " + keys[y]);
                    console.log("DOM search: " + configuration_id + '_' + unique_nested_profiles[a] + '_' + keys[y]);
                    let key_value = profile_configuration.configuration[keys[y]];
                    let dom_element = document.getElementById(configuration_id + '_' + unique_nested_profiles[a] + '_' + keys[y]);
                    console.log("key value: " + key_value);
                    console.log("dom element value: " + dom_element.value);
                    dom_element.value = Number(key_value);
                    console.log("Dom element after change: " + dom_element.value);



                }
            }

        }




        //we provide the configuration fields for each nested collection
        if (collections_db[collection_position_in_db].inner_collections.length > 0) {
            console.log('Adding the configuration for children collections');
            let inner_collections = collections_db[collection_position_in_db].inner_collections;
            body.innerHTML += children_collections_layout;

            //nested collections structure: {parent:0000, collections:[],branch:0}
            console.log("Nested collections: " + JSON.stringify(nested_collections));

            for (let y in nested_collections) {
                if (nested_collections[y].parent == root_id) {
                    let target_dom = document.getElementById(root_id + '_' + configuration_id + '_children');
                    for (let z in nested_collections[y].collections) {

                        let current_selection = nested_collections[y].collections[z];
                        console.log('appending: ' + current_selection + ' to ' + target_dom);
                        target_dom.innerHTML += '<div class="accordion-item"> <h2 class="accordion-header" id="_' + configuration_id + '_' + current_selection + '_header_config"> <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#_' + configuration_id + '_' + current_selection + '_header_open_config" aria-expanded="true" aria-controls="_' + configuration_id + '_' + current_selection + '_header_open_config">' + this.db.collection_Array[findProfilePlaceInStorage('collection', current_selection)].element_name + ' </button> </h2> <div id="_' + configuration_id + '_' + current_selection + '_header_open_config" class="accordion-collapse collapse" aria-labelledby="_' + configuration_id + '_' + current_selection + '_header"> <div class="row"> <div class="col-12">Amount of instances of this collection: <input id="' + configuration_id + '_' + current_selection + '_amount_of_instances" type="number" class="form-control"></input></div><div class="col-12"> Space representation: <select class="form-select" id="' + configuration_id + '_' + current_selection + '_space_representation"><option value="contained">Contained (no network consumption)</option><option value="uncontained">Uncontained (network consumption)</option></select></div><div class="col-12"> Parameter pool permanence policy:<select class="form-select" id="' + configuration_id + '_' + current_selection + '_parameter_pool_policy"><option value="instant">Instant (The parameter must be consumed immediatly or it gets removed)</option><option value="ondemand">On-demand (parameters are stored and used asynchronously by any corresponding profile)</option></select> </div><div class="col-12">Parameter pool hardware usage policy:<select class="form-select" id="' + configuration_id + '_' + current_selection + '_hardware_usage_policy"><option value="passive">Passive (no consumption)</option><option value="active">Active consumption</option></select></div><div class="col-12 text-center" style="margin-bottom:10px"><button class="btn shadow-sm generic_button text-center" onclick="saveConfiguration(' + "'collection'," + "'" + configuration_id + "'" + ',' + "'" + current_selection + "'" + ')" style="background-color:#6cded8!important;">Save configuration</button></div></div>   <div class="accordion-item"> <h2 class="accordion-header"> <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#_c_col' + current_selection + '_' + configuration_id + '_header_open" aria-expanded="true" aria-controls="_c_col' + current_selection + '_' + configuration_id + '_header_open">Children collections configuration</button> </h2> <div id="_c_col' + current_selection + '_' + configuration_id + '_header_open" class="accordion-collapse collapse" aria-labelledby="_c_col_header"> <div class="accordion-body" id="' + current_selection + '_' + configuration_id + '_children"> </div> </div>';
                        //flag: add the correct values stored in the test tube to the UI elements
                    }
                } else {
                    let target_dom = document.getElementById(nested_collections[y].parent + '_' + configuration_id + '_children');
                    for (let z in nested_collections[y].collections) {

                        let current_selection = nested_collections[y].collections[z];
                        //id: '+current_selection+' con: '+configuration_id+' removed from the debugging releasse
                        console.log('appending: ' + current_selection + ' to ' + target_dom);
                        target_dom.innerHTML += '<div class="accordion-item"> <h2 class="accordion-header" id="_' + configuration_id + '_' + current_selection + '_header_config"> <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#_' + configuration_id + '_' + + current_selection + '_header_open_config" aria-expanded="true" aria-controls="_' + +configuration_id + '_' + current_selection + '_header_open_config">' + this.db.collection_Array[findProfilePlaceInStorage('collection', current_selection)].element_name + '</button> </h2> <div id="_' + configuration_id + '_' + + current_selection + '_header_open_config" class="accordion-collapse collapse" aria-labelledby="_' + configuration_id + '_' + current_selection + '_header"> <div class="row"> <div class="col-12">Amount of instances of this collection: <input id="' + configuration_id + '_' + current_selection + '_amount_of_instances" type="number" class="form-control"></input></div><div class="col-12"> Space representation: <select class="form-select" id="' + configuration_id + '_' + current_selection + '_space_representation"><option value="contained">Contained (no network consumption)</option><option value="uncontained">Uncontained (network consumption)</option></select></div><div class="col-12"> Parameter pool permanence policy:<select class="form-select" id="' + configuration_id + '_' + current_selection + '_parameter_pool_policy"><option value="instant">Instant (The parameter must be consumed immediatly or it gets removed)</option><option value="ondemand">On-demand (parameters are stored and used asynchronously by any corresponding profile)</option></select> </div><div class="col-12">Parameter pool hardware usage policy:<select class="form-select" id="' + configuration_id + '_' + current_selection + '_hardware_usage_policy"><option value="passive">No hardware consumption</option><option value="active">Active hardware consumption</option></select></div><div class="col-12 text-center" style="margin-bottom:10px"><button class="btn shadow-sm generic_button text-center" onclick="saveConfiguration(' + "'collection'," + "'" + configuration_id + "'" + ',' + "'" + current_selection + "'" + ')" style="background-color:#6cded8!important;">Save configuration</button></div></div><div class="accordion-item"> <h2 class="accordion-header"> <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#_c_col' + configuration_id + '_' + current_selection + '_' + configuration_id + '_header_open" aria-expanded="true" aria-controls="_c_col' + current_selection + '_' + configuration_id + '_header_open">Children collections configuration</button> </h2> <div id="_c_col' + current_selection + '_' + configuration_id + '_header_open" class="accordion-collapse collapse" aria-labelledby="_c_col' + current_selection + '_' + configuration_id + '_header"> <div class="accordion-body" id="' + current_selection + '_' + configuration_id + '_children"> </div> </div>';
                        //flag: add the correct values stored in the test tube to the UI elements
                    }
                }


            }
        }

    }
    runPlotInitialization()//interpreter_engine.js
}

