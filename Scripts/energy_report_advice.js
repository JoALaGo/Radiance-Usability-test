var advice_db = JSON.parse('{"advice":[ { "ID": 1, "Property": "data_flow_behavior", "Value": "regular", "Advice": [ { "advice": "From an energy-efficiency perspective, it' + "'" + 's better to reduce network traffic by reading the data locally through a cache rather than accessing it remotely over the network.", "source": "https://web.archive.org/web/20240202103541/https://patterns.greensoftware.foundation/catalog/cloud/cache-static-data/" }, { "advice": "Compressing data should also be in your mind to minimize the size of the transmission.", "source": "https://web.archive.org/web/20240202103316/https://patterns.greensoftware.foundation/catalog/cloud/compress-transmitted-data/" }, { "advice": "From an energy-efficiency perspective, it' + "'" + 's better to minimize the size of the data transmitted so that less energy is required because the network traffic is reduced.", "source": "https://web.archive.org/web/20240202104139/https://patterns.greensoftware.foundation/catalog/cloud/reduce-transmitted-data/" } ], "Category": "model", "Sentiment": "bad" }, { "ID": 2, "Property": "distribution_strategy", "Value": "true", "Advice": [ { "advice": "From an energy-efficiency perspective, it' + "'" + 's better to shorten the distance a network packet travels so that less energy is required to transmit it. Similarly, from an embodied-carbon perspective, when a network packet traverses through less computing equipment, we are more efficient with hardware.", "source": "https://web.archive.org/web/20240202103650/https://patterns.greensoftware.foundation/catalog/cloud/choose-region-closest-to-users/" } ], "Category": "model", "Sentiment": "good" }, { "ID": 3, "Property": "distribution_strategy", "Value": "false", "Advice": [ { "advice": "From an energy-efficiency perspective, it' + "'" + 's better to shorten the distance a network packet travels so that less energy is required to transmit it. Similarly, from an embodied-carbon perspective, when a network packet traverses through less computing equipment, we are more efficient with hardware.", "source": "https://web.archive.org/web/20240202103650/https://patterns.greensoftware.foundation/catalog/cloud/choose-region-closest-to-users/" } ], "Category": "model", "Sentiment": "bad" }, { "ID": 4, "Property": "computational_criticality", "Value": "high", "Advice": [ { "advice": "CPU usage and utilization varies throughout the day, sometimes wildly for different computational requirements. The larger the variance between the average and peak CPU utilization values, the more resources need to be provisioned in stand-by mode to absorb those spikes in traffic.", "source": "https://web.archive.org/web/20230530043437/https://patterns.greensoftware.foundation/catalog/cloud/optimize-avg-cpu-utilization/" } ], "Category": "model", "Sentiment": "bad" }, { "ID": 5, "Property": "computational_criticality", "Value": "medium", "Advice": [ { "advice": "CPU usage and utilization varies throughout the day, sometimes wildly for different computational requirements. The larger the variance between the average and peak CPU utilization values, the more resources need to be provisioned in stand-by mode to absorb those spikes in traffic.", "source": "https://web.archive.org/web/20230530043437/https://patterns.greensoftware.foundation/catalog/cloud/optimize-avg-cpu-utilization/" } ], "Category": "model", "Sentiment": "neutral" }, { "ID": 6, "Property": "computational_complexity", "Value": "high", "Advice": [ { "advice": "From an energy efficiency perspective, optimizing and reducing the peak CPU utilization values for your system reduces the overall energy required to support traffic and can make your system hardware requirements more predictable overall. ", "source": "https://web.archive.org/web/20230530034209/https://patterns.greensoftware.foundation/catalog/cloud/optimize-peak-cpu-utilization/" }, { "advice": "CPU usage and utilization varies throughout the day, sometimes wildly for different computational requirements. The larger the variance between the average and peak CPU utilization values, the more resources need to be provisioned in stand-by mode to absorb those spikes in traffic. ", "source": "https://web.archive.org/web/20230530043437/https://patterns.greensoftware.foundation/catalog/cloud/optimize-avg-cpu-utilization/" } ], "Category": "model", "Sentiment": "bad" }, { "ID": 7, "Property": "task_distribution", "Value": "decentralized", "Advice": [ { "advice": "Choose the region that is closest to users.", "source": "https://web.archive.org/web/20230530042738/https://patterns.greensoftware.foundation/catalog/cloud/choose-region-closest-to-users/" }, { "advice": "Minimize the total number of deployed environments.", "source": "https://web.archive.org/web/20230530033718/https://patterns.greensoftware.foundation/catalog/cloud/minimizing-deployed-environments/" }, { "advice": "Reduce transmitted data.", "source": "https://web.archive.org/web/20230530053410/https://patterns.greensoftware.foundation/catalog/cloud/reduce-transmitted-data/" }, { "advice": "Scale down kubernetes applications when not in use.", "source": "https://web.archive.org/web/20230530041941/https://patterns.greensoftware.foundation/catalog/cloud/scale-down-kubernetes-workloads/" }, { "advice": "Scale Kubernetes workloads based on relevent demand metrics.", "source": "https://web.archive.org/web/20230530041617/https://patterns.greensoftware.foundation/catalog/cloud/scale-kubernetes-workloads-based-on-events/" } ], "Category": "model", "Sentiment": "neutral" }, { "ID": 8, "Property": "data_flow_direction", "Value": "bidirectional", "Advice": [ { "advice": "From an energy-efficiency perspective, it' + "'" + 's better to reduce network traffic by reading the data locally through a cache rather than accessing it remotely over the network.", "source": "https://web.archive.org/web/20240202103541/https://patterns.greensoftware.foundation/catalog/cloud/cache-static-data/" }, { "advice": "Compressing data should also be in your mind to minimize the size of the transmission.", "source": "https://web.archive.org/web/20240202103316/https://patterns.greensoftware.foundation/catalog/cloud/compress-transmitted-data/" }, { "advice": "From an energy-efficiency perspective, it' + "'" + 's better to minimize the size of the data transmitted so that less energy is required because the network traffic is reduced.", "source": "https://web.archive.org/web/20240202104139/https://patterns.greensoftware.foundation/catalog/cloud/reduce-transmitted-data/" } ], "Category": "model", "Sentiment": "bad" }, { "ID": 9, "Property": "data_handling", "Value": "keep", "Advice": [ { "advice": "Delete unused storage resources.", "source": "https://web.archive.org/web/20230530033045/https://patterns.greensoftware.foundation/catalog/cloud/delete-unused-storage-resources/" }, { "advice": "Set storage retention policies.", "source": "https://web.archive.org/web/20230530050441/https://patterns.greensoftware.foundation/catalog/cloud/set-retention-policy-on-storage-resources/" } ], "Category": "model", "Sentiment": "neutral" }, { "ID": 10, "Property": "data_handling", "Value": "destroy", "Advice": [ { "advice": "Choosing to not store everything is a great step in reducing storage hardware usage.", "source": "https://web.archive.org/web/20230530033045/https://patterns.greensoftware.foundation/catalog/cloud/delete-unused-storage-resources/" } ], "Category": "model", "Sentiment": "good" }, { "ID": 11, "Property": "access_frequency", "Value": "regular", "Advice": [ { "advice": "Shed lower priority traffic.", "source": "https://web.archive.org/web/20230530033602/https://patterns.greensoftware.foundation/catalog/cloud/shed-lower-priority-traffic/" }, { "advice": "Avoid chaining critical requests.", "source": "https://web.archive.org/web/20230530044223/https://patterns.greensoftware.foundation/catalog/web/avoid-chaining-critical-requests/" }, { "advice": "Avoid tracking unnecessary data.", "source": "https://web.archive.org/web/20230530053302/https://patterns.greensoftware.foundation/catalog/web/avoid-tracking-unnecessary-data/" } ], "Category": "model", "Sentiment": "neutral" }, { "ID": 12, "Property": "consumption_rate", "Value": "definite", "Advice": [ { "advice": "Queue non-urgent processing requests.", "source": "https://web.archive.org/web/20230530034300/https://patterns.greensoftware.foundation/catalog/cloud/queue-non-urgent-requests/" }, { "advice": "Scale Kubernetes workloads based on relevent demand metrics if applicable.", "source": "https://web.archive.org/web/20230530041617/https://patterns.greensoftware.foundation/catalog/cloud/scale-kubernetes-workloads-based-on-events/" } ], "Category": "model", "Sentiment": "neutral" } ]}');

function getAdvice(property_name, property_value, report_errors) {
    //we have to fetch each advice from the db above according to the input
    if (property_value == '' || property_value == null) {
        report_errors.push({ type: "error", sentimient: "negative", message: "The property " + '"' + property_name.replace('_',' ') + '"' + " has no value assigned, check the model characteristics.", algorithmic_category: "general", target_operation: null, references: "None" })
        return null;
    }
    for (let x in advice_db.advice) {
        let current_advice = advice_db.advice[x];
        if (current_advice.Property == property_name) {
            //it is the right property
            if (current_advice.Value == property_value) {
                //it is the right property with the right value, return the object
                return current_advice;
            }
        }
    }


}


function showReport(report_errors, report_highlights) {
    console.log("Final report highlights: "+JSON.stringify(report_highlights));
    //console.log("Report Highlights: " + report_highlights);
    $('#temporal_report_modal').modal('toggle');
    let error_accordion = document.getElementById('report-errors');
    //we clean the error accordion
    error_accordion.innerHTML = '';
    let highlights_accordion = document.getElementById('report-highlights');
    highlights_accordion.innerHTML = '';
    var errors_counter = 0;



    for (let x in report_errors) {
        //{type:"",sentimient:"",message:"",algorithmic_category:"",target_operation:"",references:""}
        if (report_errors[x].type == 'error') {

            errors_counter++;
            let operation_breadcrumb = '';
            //we get the operation in question
            if (report_errors[x].target_operation != null) {
                let operations = this.available_parents[findPlaceByParentName('Operations', this.available_parents)][4];
                var operation;
                for (let y in operations) {
                    if (operations[y].inner_id == report_errors[x].target_operation) {
                        operation = operations[y];
                        break;
                    }

                }
                let breadcrumb_category;
                if (report_errors[x].algorithmic_category == 'Scs') {
                    breadcrumb_category = 'sensor_usage_subset_header';
                } else if (report_errors[x].algorithmic_category == 'Bcs') {
                    breadcrumb_category = 'resource_usage_subset_header';
                } else {
                    breadcrumb_category = '';
                }
                console.log("Operation breadcrumb: " + JSON.stringify(operation));
                operation_breadcrumb = '<a class="operation_breadcrumb attention" onclick="populateChildren(' + "'" + 15 + "'" + ',null,null,true,true),populateChildren(' + "'" + 15 + "'" + ',' + "'" + 16 + "'" + ',' + "'" + operation.inner_id + "'" + ',false,false),document.getElementById(' + "'" + breadcrumb_category + "'" + ').firstChild.click(),$(' + "'" + '#temporal_report_modal' + "'" + ').modal(' + "'" + 'toggle' + "'" + ')';
            } else {
                //it is not an operation but a model error
                let breadcrumb_category;
                operation_breadcrumb = '<a class="operation_breadcrumb attention" onclick="document.getElementById(' + "'" + '_0_parent_header' + "'" + '),document.getElementById(' + "'" + breadcrumb_category + "'" + ').firstChild.click(),$(' + "'" + '#temporal_report_modal' + "'" + ').modal(' + "'" + 'toggle' + "'" + ')">Show me</a>';
                if (report_errors[x].algorithmic_category == 'Scs') {
                    breadcrumb_category = 'sensor_usage_subset_header';
                } else if (report_errors[x].algorithmic_category == 'Bcs') {
                    breadcrumb_category = 'resource_usage_subset_header';
                } else if (report_errors[x].algorithmic_category == 'computational_behavior') {
                    breadcrumb_category = 'Computation_centric_subset_header';
                } else if (report_errors[x].algorithmic_category == 'general') {
                    breadcrumb_category = '_0_parent_header';
                    operation_breadcrumb = '<a class="operation_breadcrumb " onclick="$(' + "'" + '#temporal_report_modal' + "'" + ').modal(' + "'" + 'toggle' + "'" + '),document.getElementById(' + "'" + breadcrumb_category + "'" + ').click();">Show me</a>';

                }
                //console.log("Operation breadcrumb: " + JSON.stringify(operation));


            }

            let error_template = '<div class="col-md-12"><div class="row rule centering content_box_option"> <div class="col-sm-1 d-flex justify-content-center"><a class="report_found_error">X</a></div><div class="col-sm-11">' + report_errors[x].message + '</div><div class="col-md-12 center operation_breadcrumb" align="center">' + operation_breadcrumb + '</div></div></div>';
            error_accordion.innerHTML += error_template;
        } else {



        }
    }
    //the highlights are handled 
    var highlights_amount = 0;
   //we filter out the highlights that are empty
   let to_splice=[];
   let splicer=0;
    
    for (let x in report_highlights) {
        var image='';
        var advice_content='';
        var image_description='';
        
        if (report_highlights[x] != null) {
            
            highlights_amount++;
            if (report_highlights[x].Sentiment == 'good') {
                image = './res/good.png';
                image_description='Well done, also consider...';
            }else if (report_highlights[x].Sentiment=='bad'){
                image='./res/bad.png';
                image_description='Be careful!';
            }else if(report_highlights[x].Sentiment=='neutral'){
                image='./res/neutral.png';
                image_description='Keep in mind the following';
            }
            //we now add the number of advices we need;
            for(let y in report_highlights[x].Advice){
                console.log("Current advice: "+JSON.stringify(report_highlights[x].Advice[y]));
                let new_advice = report_highlights[x].Advice[y].advice;
                console.log(new_advice);
                let new_source = report_highlights[x].Advice[y].source;
                advice_content +='<div class="row report_highlight_advice"> <div class="col-sm-10 "> <li>'+new_advice+'</li> </div> <div class="col-sm-2 rule" style="align-self:center"> <a href="'+new_source+'"target="_blank" style="font-size:small;color:green">Source</a> </div> </div>';
            }
            console.log("Advice content: \n"+JSON.stringify(advice_content));
            var element_skeleton = '<div class="col-md-12 rule report_highlight_parent"> <div class="row rule shadow"><div class="col-sm-12 text-center"><h6>When <u>'+report_highlights[x].Property.replace('_',' ')+'</u> is set to <strong>'+report_highlights[x].Value.replace('_',' ')+'</strong>:</h6></div><div class="col-sm-2 text-center" style="align-self:center"><img class="img-fluid" id="" src="'+image+'" style="min-width:32px" width="10%"><br>'+image_description+' </div><div class="col-sm-10 rule" style="font-size:15px;"> '+advice_content+' </div> </div> </div>';
        }

        document.getElementById('report-highlights').innerHTML+=element_skeleton;



    }



    //we increase the counters for the highlights and the errors
    document.getElementById('report_errors_found').innerHTML = errors_counter;
    document.getElementById('highlights_found').innerHTML = highlights_amount;


}


function generateFinalLabel(){




// Add Two.js scene
let brightness="low";
const two = new Two({
  type: Two.Types.canvas,
  width: 768,
  height: 1366,
  fullscreen:true,
  autostart: true
}).appendTo(document.body);


let base_label = two.makeRectangle(0,0,768,1366);
base_label.fill = "#ffffff";
let category_a_background = two.makeRectangle(60,60,100,20);
category_a_background.fill="#33a357";
var category_a = two.makeText('A',60,60);
// For category B
let category_b_background = two.makeRectangle(60,80,100,20);
category_b_background.fill="#79b752";
let category_b = two.makeText('B',60,80);
let category_c_background = two.makeRectangle(60,100,100,20);
category_c_background.fill="#c3d545";
// For category C
let category_c= two.makeText('C',60,100);
let category_d_background = two.makeRectangle(60,120,100,20);
category_d_background.fill="#fff12c";
let category_d= two.makeText('D',60,120);
// For Category E
let category_e_background = two.makeRectangle(60,140,100,20);
category_e_background.fill="#edb731";
let category_e = two.makeText('E',60,140);

// For Category F
let category_f_background = two.makeRectangle(60,160,100,20);
category_f_background.fill="#d66f2c";
let category_f = two.makeText('F',60,160);

// For Category G
let category_g_background = two.makeRectangle(60,180,100,20);
category_g_background.fill="#cc232a";
let category_g = two.makeText('G',60,180);

//FOR THE BRIGHTNESS ICON
// Create a polygon (for example, a triangle)
var vertices = [
  new Two.Vector(300, 100),
  new Two.Vector(400, 300),
  new Two.Vector(200, 300)
];

var polygon = two.makePolygon(vertices);
polygon.fill = "#87CEEB"; // Set a sky blue color for the polygon

// Create a sun (circle) at the center of the polygon
var sun_x = 300;
var sun_y=200;
var sun = two.makeCircle(sun_x, sun_y, 20);
sun.fill = "#FFD700"; // Set a gold color for the sun

// Draw sun rays (lines) extending from the sun
for (let i = 0; i < 12; i++) {
  var angle = (i / 12) * Math.PI * 2; // Divide 360 degrees into 12 rays
  var length = 30; // Length of each ray
  var x = sun_x + Math.cos(angle) * length;
  var y = sun_y + Math.sin(angle) * length;

  var ray = two.makeLine(300, 200, x, y);
  ray.linewidth = 2;
  ray.stroke = "#FFD700"; // Set the same gold color for the rays
}

// Decide the letter to add to the sun
let brightness_text='';
if (brightness === "low") {
  brightness_text = "L";
} else if (brightness === "medium") {
  brightness_text = "M";
} else if (brightness === "high") {
  brightness_text = "H";
} else if (brightness === "auto") {
  brightness_text = "A";
}
var textA = two.makeText(brightness_text, sun_x, sun_y);
textA.fill = "#87CEEB"; // Set the same sky blue color as the polyggon
textA.size = 30;
textA.fill='#000000';

//FOR the GPS ICON.. just use an icon.
}