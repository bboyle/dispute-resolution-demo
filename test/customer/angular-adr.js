// JSONP receiver
var cachedData = [];
var getAlternativeDisputeResolutionData = function( data ) {
	cachedData = data;
};


// basic angular
angular.module( 'disputeResolution', [] )


// custom filter to match story
// check for term; (semi-colon prevents accidental partial matches)
.filter( 'storyFilter', function() {

	return function( records, story ) {
		return records.filter(function( record ) {
			var matched = story &&
			              record.disputeType.indexOf( story.disputeType + ';' ) > -1 &&
			              record.party.indexOf( story.party + ';' ) > -1 &&
			              record.disputeSubject.indexOf( story.disputeSubject + ';' ) > -1;

			return matched;
		});
	};
})


// custom filter to match councils
// only show matching councils (pass-through non-council results)
.filter( 'councilFilter', function() {

	return function( records, council ) {
		return records.filter(function( record ) {
			// is this a council?
			var isCouncil = /Council/i.test( record.jurisdiction );
			return ! isCouncil || council.toLowerCase() === record.jurisdiction.toLowerCase();
		});
	};
})


// custom filter to match pathway and prevent duplicates
.filter( 'resolutionFilter', function() {

	return function( records, resolution ) {
		return records.filter(function( record ) {
			console.log( 'resolutionFilter', record, resolution );
			var matched = record.resolution.indexOf( resolution ) > -1;
			var alreadySeen = ( resolution === 'Assisted' && /Self/.test( record.resolution )) ||
							  ( resolution === 'Formal'   && /Self|Assisted/.test( record.resolution ));

			return matched && ! alreadySeen;
		});
	};
})


// a/an filter
.filter( 'aOrAn', function() {
	return function( s ) {
		return s && /^[aeiou]/i.test( s ) ? 'an' : 'a';
	};
})


// controller
.controller( 'resultsController', [ '$scope', '$http', '$anchorScroll', '$filter',
	                      function(  $scope ,  $http ,  $anchorScroll ,  $filter ) {
	'use strict';

	$scope.results = cachedData;

	$scope.model = {
		disputeType: [],
		party: [],
		disputeSubject: [],
		// TODO how is this list maintained? data portal?
		councilSubject: [
			'Dogs and other pets',
			'Fences',
			'Noise'
		]
	};


	// customer input
	var oldParty;
	function init() {
		oldParty = '';

		$scope.story = {
			disputeType: '',
			party: '',
			disputeSubject: ''
		};

		$scope.storySituation = {
			outcome: '',
			blocker: '',
			council: ''
		};

		$scope.storyHistory = {
			Self: { tried: false },
			Assisted: { tried: false },
			Formal: { tried: false }
		};


		$scope.vm = {
			storyComplete: false,
			results: [],
			count: {
				pathway: {},
				disputeType: {},
				documentType: {}
			}
		};
	}
	// init customer data
	init();


	// filters
	$scope.resultFilter = {
		documentType: {}
	};

	$scope.documentTypeFilter = function( record ) {
		return record.documentType !== 'legislation' && $scope.resultFilter.documentType[ record.documentType ] === true;
	};


	// turn body corporate results on/off
	$scope.toggleBodyCorporate = function() {
		if ( ! oldParty ) {
			oldParty = $scope.story.party;
		}
		if ( $scope.storySituation.bodyCorporate ) {
			$scope.story.party = oldParty.indexOf( 'body corporate' ) > -1 ? oldParty : 'a neighbour in my body corporate';
		} else {
			$scope.story.party = oldParty.indexOf( 'body corporate' ) > -1 ? 'a neighbour' : oldParty;
		}

		if ( $scope.story.party === oldParty ) {
			oldParty = '';
		}
	};


	// init
	for ( var i = 0, len = cachedData.length; i < len; i++ ) {
		// ES6: let, exploder
		var type = cachedData[ i ].disputeType.split( /\s*;\s*/ );
		var party = cachedData[ i ].party.split( /\s*;\s*/ );
		var subject = cachedData[ i ].disputeSubject.split( /\s*;\s*/ );

		// collect all document types in use
		if ( cachedData[ i ].documentType ) {
			$scope.resultFilter.documentType[ cachedData[ i ].documentType ] = true;
		}

		// create lists of disputes, parties and topics
		$scope.model.disputeType = $scope.model.disputeType.concat( type.filter(function( item ) {
			return item.length && item !== 'undefined' && $scope.model.disputeType.indexOf( item ) === -1;
		}));
		$scope.model.party = $scope.model.party.concat( party.filter(function( item ) {
			return item.length && item !== 'undefined' && $scope.model.party.indexOf( item ) === -1;
		}));
		$scope.model.disputeSubject = $scope.model.disputeSubject.concat( subject.filter(function( item ) {
			return item.length && item !== 'undefined' && $scope.model.disputeSubject.indexOf( item ) === -1;
		}));

		// councils
		// TODO create a service wrapper
		// NOTE: many councils operate a separate domain for their website!!
		$http.get( 'council-domains.json' )
		.success(function( data ) {
			$scope.model.councils = {};
			angular.forEach( data, function( domain, council ) {
				$scope.model.councils[ council ] = {
					domain: domain
				};
			});
		});
		// fetch from data portal
		// https://data.qld.gov.au/dataset/local-government-contacts
		// https://data.qld.gov.au/api/action/datastore_search?resource_id=e5eed270-880f-4226-b640-4fa5bae6ddb7&fields=Council,Generic%20council%20email%20address&limit=500
		// $http.jsonp( 'https://data.qld.gov.au/api/action/datastore_search', {
		// 	params: {
		// 		resource_id: 'e5eed270-880f-4226-b640-4fa5bae6ddb7',
		// 		fields: 'Council,Generic council email address',
		// 		limit: 500, // make sure we get them all!
		// 		callback: 'JSON_CALLBACK'
		// 	},
		// 	cache: true
		// }).success(function( data ) {
		// 	$scope.model.councils = {};
		// 	data.result.records.forEach(function( record ) {
		// 		$scope.model.councils[ record.Council ] = {
		// 			domain: record[ 'Generic council email address' ].replace( /^.*@/, '' )
		// 		};
		// 	});
		// });
	}

	// TODO initial state!?
	// $scope.story = {
	// 	disputeSubject: $scope.model.disputeSubject[ 0 ],
	// 	disputeType: $scope.model.disputeType[ 0 ],
	// 	party: $scope.model.party[ 0 ]
	// };

	// calculate totals
	$scope.$watchCollection( 'story', function() {

		// story complete?
		$scope.vm.storyComplete = $scope.story && $scope.story.disputeType && $scope.story.party && $scope.story.disputeSubject;

		// results that match story
		var resultsMatchingStory = $filter( 'storyFilter' )( $scope.results, $scope.story );
		$scope.vm.results = resultsMatchingStory;

		$scope.vm.resultsReady = $scope.vm.storyComplete && resultsMatchingStory.length > 0;

		// $filter('filter')(array, expression)
		angular.forEach([ 'Self', 'Assisted', 'Formal' ], function( value ) {
			$scope.vm.count.pathway[ value ] = $filter( 'filter' )( resultsMatchingStory, { resolution: value }).length;
		});

		// how many results for each dispute type? (helps with on results)
		angular.forEach( $scope.model.disputeType, function( value ) {
			$scope.vm.count.disputeType[ value ] = $filter( 'storyFilter' )( $scope.results, angular.extend({}, $scope.story, { disputeType: value })).length;
		});


		// results that match story, by document type
		angular.forEach( $scope.resultFilter.documentType, function( value, key ) {
			$scope.vm.count.documentType[ key ] = $filter( 'filter' )( resultsMatchingStory, { documentType: key }).length;
		});
	});

	// for wizard interface, toggle 'show results'
	$scope.vm.resultsView = false;

	$scope.showResults = function() {
		$scope.vm.resultsView = true;
		$anchorScroll( 'results' );
	};
	$scope.showForm = function() {
		$scope.vm.resultsView = false;
		init();
		$anchorScroll( 'form' );
	};

}]);
