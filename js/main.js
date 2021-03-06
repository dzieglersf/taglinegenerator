(function() {
	
	$('#generateDesigned').click(function(e) {
		  e.preventDefault();
		  return generateDesigned();
		});
	
	$('#generateRandom').click(function(e) {
		  e.preventDefault();
		  return generateRandom();
		});


	var RESULT_LENGTH_THRESHOLD = 70;

	var SETUP_ERROR_MESSAGE = "The robot has blown a fuse!  Our bad.  Please try again later!"
	var SELECTIONS_INCOMPLETE_ERROR_MESSAGE = "Select all the options in the Tagline Robot's central command console to get your result!";

	var dropdownSelections = []; // stores all the selection options/values
	var categories, ctas, benefits, urgencies; // stores options/values for each dropdown
	var phrases; // stores all the phrases
	var randomResults; // stores the results of the random phrase gets
	var tagline; // stores the tagline 

	window.pulse_image = null;
	window.pulse_continue_loop = false;
	window.pulse_image = $('#generateDesigned');
	
	setupSelectionData();

	function setupSelectionData() {
        $.ajax({
            url : "data/selections.csv",
            async: false,
			error: function() { messageUser(SETUP_ERROR_MESSAGE); },
			success : function (data) {
            	dropdownSelections = $.csv.toObjects(data);
            },
    		dataType: "text",
    		complete: setupDropdowns
        });
	}

	function ShouldPulse() {
		if ( $("select.category").val() > 0 && $("select.cta").val() > 0 && $("select.benefit").val() > 0 && $("select.urgency").val() > 0 ) {
			window.pulse_continue_loop = true;
			return true;
		} else {
			window.pulse_continue_loop = false;
			return false;
		}
	}

	function setupDropdowns() {

		function bindDropDown(control, selections) {

			// sort the options
			var options = selections.sort( function(a,b){return a.value - b.value});

			// add all the sorted options to the select
			$.each(options, function(index, o) { control.append($('<option></option>').val(o.value).html(o.option)); });
			
			// green button for answered, yellow button for unanswered
			$(control).change(function() {
				if (control.val() != 0) {
					control.prev().removeClass("unanswered").addClass("answered");
					control.next().removeClass("visible").addClass("invisible");
					control.next().next().removeClass("invisible").addClass("visible");
  				} else {
					control.prev().removeClass("answered").addClass("unanswered");
					control.next().removeClass("invisible").addClass("visible");
					control.next().next().removeClass("visible").addClass("invisible");
  				}
				if (ShouldPulse()) { PulseButton(); }
			});
		}

		categories = dropdownSelections.filter( function(row){ return row.type == 1; });
		ctas = dropdownSelections.filter( function(row){ return row.type == 2; });
		benefits = dropdownSelections.filter( function(row){ return row.type == 3; });
		urgencies = dropdownSelections.filter( function(row){ return row.type == 4; });

		bindDropDown($("select.category"), categories);
		bindDropDown($("select.cta"), ctas);
		bindDropDown($("select.benefit"), benefits);
		bindDropDown($("select.urgency"), urgencies);
	}

	function generateRandom() {

		var randomCategory = Math.floor(Math.random()*categories.length + 1);
		var randomCta = Math.floor(Math.random()*ctas.length + 1);
		var randomBenefit = Math.floor(Math.random()*benefits.length + 1);
		var randomUrgency = Math.floor(Math.random()*urgencies.length + 1);

		getTagline(randomCategory, randomCta, randomBenefit, randomUrgency);
	}

	function generateDesigned() {

		var category = $("select.category").val();
		var cta = $("select.cta").val();
		var benefit = $("select.benefit").val();
		var urgency = $("select.urgency").val();

		if (category <=0 || cta <= 0 || benefit <= 0 || urgency <= 0) {
			messageUser(SELECTIONS_INCOMPLETE_ERROR_MESSAGE);
		}
		else {
			getTagline(category, cta, benefit, urgency);
		}
	}

	function getTagline(categorySelection, ctaSelection, benefitSelection, urgencySelection) {
		
		beginAnimation();

		// re-initialize results array
		randomResults = [];

		// a list of things to call
		var actions = [ getRandomPhrase(1, categorySelection)
						, getRandomPhrase(2, ctaSelection)
						, getRandomPhrase(3, benefitSelection)
						, getRandomPhrase(4, urgencySelection) ]

		// call the functions in the actions array in order, and finally display the results
		_(actions).reduceRight(_.wrap, function() { displayResult(); endAnimation(); })();

	}


	function getRandomPhrase(type, selection) { return function(next) { 

		if (phrases === undefined) { setupPhraseData(); }
		
		var candidatePhrases = phrases.filter( function(p) { return p.type == type && p.selection == selection; } );
		var randomNumber = Math.floor(Math.random() * (candidatePhrases.length));
		var result = candidatePhrases[randomNumber].phrase;
		randomResults.push({ type: type, phrase: result });
		next();
	 	}
	 }

	function displayResult() {

		var p1 = randomResults.filter( function(r){ return r.type === 1; })[0].phrase;
		var p2 = randomResults.filter( function(r){ return r.type === 2; })[0].phrase;
		var p3 = randomResults.filter( function(r){ return r.type === 3; })[0].phrase;
		var p4 = randomResults.filter( function(r){ return r.type === 4; })[0].phrase;

		tagline = p2 + " " + p1 + " " + p3 + p4;

		var resultField = $("#result p");
		resultField.text(tagline);

		if (tagline.length < RESULT_LENGTH_THRESHOLD) {
			resultField.removeClass("font-small");
			resultField.addClass("font-large");
		} else {
			resultField.removeClass("font-large");
			resultField.addClass("font-small");
		}
	}

	function setupPhraseData() {
			$.ajax({
            url : "data/phrases.csv",
            async: false,
			error: function() { messageUser(SETUP_ERROR_MESSAGE); },
			success : function (data) {
            	phrases = $.csv.toObjects(data);
            },
    		dataType: "text"
        });
	}
	
 	function beginAnimation() {

 		clr = null;

 	    function loop() {
 	    	
 	    	// prepare the stop handle and the number of interations
            clearTimeout(clr);
            var NUMBER_OF_ITERATIONS = 12; // even to end wires at initial state; mod 3 = 0 to end faceplate at initial state
            var iteration = 0;

            // define the animation
            function inloop() {

	       		iteration += 1;

	       		if (iteration % 3 == 1)	{
	       			$('#robot-image1').removeClass("visible").addClass("invisible");
	       			$('#robot-image2').removeClass("invisible").addClass("visible");
	       			$('#robot-image3').removeClass("visible").addClass("invisible");
	       		}
	       		else if (iteration % 3 == 2) {
	       			$('#robot-image1').removeClass("visible").addClass("invisible");
	       			$('#robot-image2').removeClass("visible").addClass("invisible");
	       			$('#robot-image3').removeClass("invisible").addClass("visible");
	       		}
				else if (iteration % 3 == 0) {
	       			$('#robot-image1').removeClass("invisible").addClass("visible");
	       			$('#robot-image2').removeClass("visible").addClass("invisible");
	       			$('#robot-image3').removeClass("visible").addClass("invisible");
				}

				$('#right-arm1').toggleClass("visible").toggleClass("invisible");
				$('#right-arm2').toggleClass("visible").toggleClass("invisible");
				$('#left-arm1').toggleClass("visible").toggleClass("invisible");
				$('#left-arm2').toggleClass("visible").toggleClass("invisible");

				$('#wire1-on').toggleClass("visible").toggleClass("invisible");
				$('#wire2-on').toggleClass("visible").toggleClass("invisible");
				$('#wire3-on').toggleClass("visible").toggleClass("invisible");
				$('#wire4-on').toggleClass("visible").toggleClass("invisible");

	          	if (!(iteration < NUMBER_OF_ITERATIONS)) { return; }
    	       	clr = setTimeout(inloop, 100);

            }
            inloop();
        };
        loop();
    }

	function endAnimation() {

	}

	function messageUser(str) {
		alertify.alert(str);
	}


	function PulseButton() {
		var minOpacity = .5;
		var fadeOutDuration = 450;
		var fadeInDuration = 450;
		
		window.pulse_image.animate(
			{ opacity: minOpacity }, 
			fadeOutDuration, 
			function() {
				window.pulse_image.animate(
					{ opacity: 1 }, 
					fadeInDuration, 
					function() {
						if(window.pulse_continue_loop) {
							PulseButton();
						}
					}
				)
			}
		);
	}

}).call(this);