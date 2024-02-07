// we need a global variable to decide which collection we will edit
var collection_selected = '';
var parameter_pool = '';
var assigned_profiles = [];
var deassigned_profiles = [];
var assigned_collections = [];
var deasssigned_collections = [];
var collection_innheritance_tree = [];
var inheritance_tree_branches = ['inheritance_tree_branch_1','inheritance_tree_branch_2','inheritance_tree_branch_3','inheritance_tree_branch_4'];
var temporal_parameter_pool = [];





function reInitializeCollectionsView() {
    document.getElementById('collections_builder_assigned_profiles').innerHTML = '';
    document.getElementById('collections_builder_deassigned_profiles').innerHTML = '';
    document.getElementById('collections_builder_assigned_collections').innerHTML = '';
    document.getElementById('collections_builder_deassigned_collections').innerHTML = '';
    document.getElementById('parameter_pool').innerHTML = '';
    clear_inheritance_tree();
    synchronizeAvailableContentListElements(false, { class: 'profile_assign', type: "profile", dom_data_type: "profile-assign" });
    synchronizeAvailableContentListElements(false, { class: 'profile_deassign', type: "profile", dom_data_type: "profile-deassign" });
    synchronizeAvailableContentListElements(false, { class: 'collection_assign', type: "collection", dom_data_type: "collection-assign" });
    synchronizeAvailableContentListElements(false, { class: 'collection_deassign', type: "collection", dom_data_type: "collection_deassign" });
    let parameter_pool = [];
    this.collection_innheritance_tree = [];
    fillParameterPool(collection_selected, parameter_pool, 0);//it is not worth it to alter synchronizeAvailableContentListElements.. just handle it manually.
    populateParameterPool(parameter_pool);
    this.temporal_parameter_pool = parameter_pool;
    removeInheritedCollections();
    populateCollectionInheritanceTree();

    //addToCollectionsView();
    //replace the name of the collection
    document.getElementById('currently_selected_collection').innerHTML = '';
    document.getElementById('currently_selected_collection').innerHTML = collection_selected.element_name;
    //we delete the existing diagram
    try {
        this.inheritance_diagram.clear();
        this.inheritance_diagram.update();
        
        document.getElementById('collection_inheritance_diagram').innerHTML = '';
    } catch (error) {
        this.inheritance_diagram = '';
    }
    //we re-create the inheritance diagram
    var diagram_dom_target = document.getElementById('collection_inheritance_diagram');
    this.inheritance_diagram = new Two().appendTo(diagram_dom_target);
    this.inheritance_diagram.renderer.setSize(diagram_dom_target.offsetWidth, diagram_dom_target.offsetHeight);
    drawInheritanceDiagram(diagram_dom_target);
    //we add the algorithm
    collection_builder_algorithm_editor.setValue(this.db.collection_builder_algorithm);
    restartTooltips();
}

function runCollectionBuilderAlgorithm() {

    //we remove the shadow animation from the rate profile button
    let run_algorithm_button = document.getElementById('run_algorithm_button');
    run_algorithm_button.classList.remove('attention');

    saveToStorage('collection_builder_algorithm');
    if(this.db.collection_builder_algorithm!==null&&this.db.collection_builder_algorithm!==''){
        try {
            eval(this.db.collection_builder_algorithm);
        } catch (error) {
            console.log('There was an error attempting to execute the algorithm on startup: '+error);
        }
       
    }
    
}
function collectionDeassign(id, collection) {
    if (collection == "false" || collection == null) {
        collection = this.collection_selected.inner_profiles;
    } else {
        collection = this.collection_selected.inner_collections;
    }
    //we have to check if it is already assigned


    for (let x in collection) {
        if (collection[x] == id) {
            collection.splice(x, 1);
        }
    }
    reInitializeCollectionsView();
    updateLocalStorage();
    playSound('Success_2');
}
function collectionAssign(id, collection) {
    if (collection == "false" || collection == null) {
        collection = this.collection_selected.inner_profiles;
    } else {
        collection = this.collection_selected.inner_collections;
    }
    if (checkIfAssigned(id, collection)) { return; };
    collection.push(id);
    reInitializeCollectionsView();
    updateLocalStorage();
    playSound('Success_2');
}

function fillParameterPool(collection,parameter_pool,branch) {
    //we get all the parameters for each profile in the collection and place them in the UI under the parameter pool
    //this lets the user know that those parameters can apply at a global scale within the collection:
    // any of the parameters in the pool can be used by any operation in the collection.
    branch = branch+1;
    console.log(branch);

    if (collection == '') { //TODO: if the configuration of the collection is set to exclusive, no parameter pool should be available as each profile will be self-contained
        collection = this.collection_selected;
    } 

        let profiles = collection.inner_profiles;
        let collections = collection.inner_collections;
        
        this.collection_innheritance_tree.push({branch:branch,collections:collections,parent:collection.element_id});
        for (let x in profiles) {
            //we get the profile 
            let profile = db.profile_Array[findProfilePlaceInStorage('profile', profiles[x])];
            let parsed_profile = JSON.parse(profile.profile_cache);
          
            let parameters_array = parsed_profile[findPlaceByParentName('Parameters', parsed_profile)][4];//place 4 is reserved for the instances
            //now that we have the parameters array for the profile, we have to find for each parameter if it is external, if it is.. we push it to the list with the id of the parent
            // in this way the profile builder will be able to recognize the non exclusive parameters available for a profile
            for (let y in parameters_array) {
                checkParameterDirection(parameters_array[y].inner_variables[0].variables) == true ? parameter_pool.push({parameter:parameters_array[y], profile_id: profile.inner_id, collection:collection.element_id }) : null; //we store the parameter if it is valid
            }
        }
        //if the collection is the same collection, we return the parameters pool without recursion
        
        for(let x in collections){
            console.log(collections[x]);
            let current_collection = db.collection_Array[findProfilePlaceInStorage('collection', collections[x])];
            if(current_collection==null){
                
                alertify.confirm('Error encountered', 'A pre-existing collection within this collection was not found, do you wish to remove it to avoid further collisions?', function(){ 
                    alertify.success('Inexistent collection removed from the current collection'); 
                    collections.splice(x,1);
                    updateLocalStorage();
                }, function(){
                    });

            }else{
            if(current_collection.element_id!== this.collection_selected.element_id){
                 //we use recursion
                console.log("Checking collections :"+ collections);
                fillParameterPool(current_collection,parameter_pool,branch);
             }
            }

             
            
        }
        
        return parameter_pool;
    

    function checkParameterDirection(parameter) {
        if (parameter.direction == 'external') {
            return true;
        } else {
            return false;
        }

    }
}


function removeInheritedCollections(){
    //we have to remove all the collections that are already further down the collection tree so that they are not selected
    
    for(let x in collection_innheritance_tree){
        for(let y in collection_innheritance_tree[x].collections){
            //console.log("attempting to remove: "+collection_innheritance_tree[x].collections[y]);
            if(document.getElementById("deassigned_"+collection_innheritance_tree[x].collections[y]+"_collection")!== null && document.getElementById("assigned_"+collection_innheritance_tree[x].collections[y]+"_collection")==null){
                    document.getElementById("deassigned_"+collection_innheritance_tree[x].collections[y]+"_collection").remove();
                
            }
        }
    }
}

function getInheritedCollections(anchor_collection, valid_collections) {

    let collection_instances = this.db.collection_Array;
    //we look inside of each one to see if the actually have the current profile
    let collections_where_member = [];
    let sibling_collections = []
    let hegemonic;
    for (let x in collection_instances) {
        let current_collection_instance = collection_instances[x];
        let in_collection = false;
        for (let y in current_collection_instance.inner_collections) {
            let current_inner_collection = current_collection_instance.inner_collections[y];

            if (current_inner_collection == anchor_collection) {
                collections_where_member.push(current_collection_instance.element_id);
                hegemonic = getAllHegemonic(current_inner_collection, []);
                for (let a in current_collection_instance.inner_collections) {
                    if (current_collection_instance.inner_collections[a] != anchor_collection) {
                        sibling_collections.push(current_collection_instance.inner_collections[a]);
                    }

                }
            }

        }
    }
    
    for (let x in hegemonic) {
        collections_where_member.push(hegemonic[x]);
    }
    let unique_hegemonic_collections = [...new Set(collections_where_member)];
    valid_collections = [unique_hegemonic_collections, sibling_collections];
    console.log("Hegemonic collections: "+unique_hegemonic_collections);
    console.log("Valid collections: "+valid_collections);
    return valid_collections;

    function getAllHegemonic(anchor_collection, array) {


        let collection_instances = this.db.collection_Array;
        for (let x in collection_instances) {
            let current_collection_instance = collection_instances[x];
            let in_collection = false;
            for (let y in current_collection_instance.inner_collections) {
                let current_inner_collection = current_collection_instance.inner_collections[y];

                if (current_inner_collection == anchor_collection) {
                    array.push(current_collection_instance.element_id);
                    getAllHegemonic(current_collection_instance.element_id, array);

                }
            }

        }

        return array;
    }
}

function getCollectionInheritanceTree(collection_id,resulting_array,starting_branch) {
    let collection_inheritance_tree_layout = {"parent":"","collections":[],"branch":starting_branch};
    //we get the inner collections for the selected collection
    
    collection_inheritance_tree_layout.parent = collection_id;
    let root_collection = this.db.collection_Array[findInstancePlaceInStorage('collection',collection_id)];
    //console.log("Root instance: "+JSON.stringify(root_collection));
    //console.log("Root instance inner collections: "+root_collection.inner_collections);
    
    var register_place = null;
    //we check if the branch register already exists
    for(let x in resulting_array){
        if(resulting_array[x].parent == collection_id){
            //the branch register already exists
            register_place = x;//we save the place
        }
    }

    if(register_place!=null){
        //we push the children
        for(let x in root_collection.inner_collections){
            resulting_array[register_place].collections.push(root_collection.inner_collections[x]);
        }
    }else{
        //we are registering the current parent as a new one

        for(let x in root_collection.inner_collections){
            collection_inheritance_tree_layout.collections.push(root_collection.inner_collections[x]);
        }
        //we now push the filled up layout to the resulting array
        resulting_array.push(collection_inheritance_tree_layout);
        

    }

    if(register_place == null){
        //the register place is the last element
        register_place = resulting_array.length-1;
    }
    let nex_branch = starting_branch+1;
    for(let x in resulting_array[register_place].collections){
        getCollectionInheritanceTree(resulting_array[register_place].collections[x],resulting_array,nex_branch);
    }



    //console.log("Resulting array: "+JSON.stringify(resulting_array));
    return resulting_array;
}