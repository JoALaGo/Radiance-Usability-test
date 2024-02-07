onmessage = function(message) {
    //we have to grab all the profiles in the collection and the nested profile sin the nested collections, initialize them
    //and send them back to the main thread.
    //we get the profiles in the main collection
    

    //lets fetch the db
    var db = message.data.db;
    let id = message.data.id;//the id of the collection
    let adam = findProfilePlaceInStorage('collection',id,db);
    adam = db['collection_Array'][adam];
    let profiles_in_test_tube = [];
    let test_tube_element = {parent_collection:'',db_reference:'',parsed_profile:''};
    //now that we've got our root collection (adam), we get the profiles inside of it
    for(let x in adam.inner_profiles){
        //we match the profiles in the collections with the collections available
        for(let y in db['profile_Array']){
            if(db['profile_Array'][y].element_id == adam.inner_profiles[x]){
                let new_entry = {...test_tube_element};
                new_entry.db_reference = db['profile_Array'][y];
                new_entry.parsed_profile = JSON.parse(db['profile_Array'][y].profile_cache);
                profiles_in_test_tube.push(new_entry);
                new_entry.parent_collection = id;
                break;
            }
        }
    }
    
    postMessage(profiles_in_test_tube);
    

    function findProfilePlaceInStorage(type, id,db) {
        let db_element = db[type + "_Array"];
        for (i = 0; i < db_element.length; i++) {
            if (db_element[i].element_id == id) {
                return i;
            }
        }
        return null;// when the profile does not exist
    }
    

};