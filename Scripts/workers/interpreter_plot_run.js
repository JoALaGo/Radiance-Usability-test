var simulations;
var last_simulation_dataset;
var initialized_profiles;
//this web worker is responsible for handling the plot of a simulation
self.addEventListener("message", function(e) {
    // the passed-in data is available via e.data
     //a plot already exists and we have to show the results of the engine
        //we first get the ID of the last simulation
       this.simulations = e.data.simulations;
       this.simulation_dataset = e.data.simulation_dataset;
       this.initialized_profiles = e.data.initialized_profiles;
        let last_simulation = this.simulations[0];
        //we get the simulation object
        let last_simulation_dataset = this.simulation_dataset[last_simulation];
        //we initialize the data set for each initialized profile
        for (let y in Object.entries(this.initialized_profiles)) {
            let entry = Object.entries(this.initialized_profiles)[y][0];
            this.simulation_dataset[last_simulation].run_stamps[entry].rendered_dataset = {

                x: [],

                y: [],

                type:'scatter',
                name: this.initialized_profiles[entry].profile_name

            };
            //we initialize y depending on the length of the simulation

            for (let dx = 0; dx < last_simulation_dataset.time_initialization; dx++) {
                //console.log('testing');
                this.simulation_dataset[last_simulation].run_stamps[entry].rendered_dataset.y.push(0);
            }
            for (let dx = 1; dx < last_simulation_dataset.time_initialization; dx++) {
                //console.log('testing');
                this.simulation_dataset[last_simulation].run_stamps[entry].rendered_dataset.x.push(dx);
            }
            //now that Y is initialized, we have to reason the logs in the run_stamps to fill in the correct state of the profile at the correct time
            for (let dy in this.simulation_dataset[last_simulation].run_stamps[entry]) {
                let object_entry = this.simulation_dataset[last_simulation].run_stamps[entry][dy];
                if (object_entry.hasOwnProperty('spent')) {
                    // we reason the time spent
                    
                    let spent = object_entry.spent;
                    let until = object_entry.until;
                    let start = (until - spent) - 1;//-1 because the array index of Y is 0
                    //console.log('Blank start: '+start+ 'spent: '+spent);
                    // we fill in the blanks in Y with 1 for each second that each profile spends in a run state
                    for (let rx = start; rx < until; rx++) {
                        this.simulation_dataset[last_simulation].run_stamps[entry].rendered_dataset.y[rx] = 1;
                    }

                }
            }

        }//End of the rendered datasets creation
        //we create the array of datasets required to graph each profile
        let datasets = [];
        //we first get the ID of the last simulation
        //ABOVE let last_simulation = this.simulations[0];
        //we get the simulation object
        //ABOVE let last_simulation_dataset = this.simulation_dataset[last_simulation];
        //we initialize the data set for each initialized profile
        for (let y in Object.entries(this.initialized_profiles)) {
            let entry = Object.entries(this.initialized_profiles)[y][0];
            //we place the dataset of each initialized profile in datasets
            datasets.push(this.simulation_dataset[last_simulation].run_stamps[entry].rendered_dataset);
        }
        
        //Now that we have gathered all the rendered datasets, we display them
        postMessage({datasets:datasets, simulations:this.simulations,simulation_dataset:this.simulation_dataset});
}, false);
