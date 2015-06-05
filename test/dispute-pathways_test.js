var URL = 'http://localhost:9999/test/acceptance/simulate-results.html';
var TITLE = 'Simulate results';

// turns an object into GET query string
function queryFromObject( params ) {
	var s = Object.keys( params ).map(function( key ) {
		return encodeURIComponent( key ) + '=' + encodeURIComponent( params[ key ]);
	}).join( '&' );
	return s.length ? '?' + s : '';
}


// Given a customer visits the tool,
// when they use the default web address
// then they will see the default form asking for their story
// and the form is not prefilled
casper.test.begin( 'form state', 11, function suite( test ) {
	casper.start( URL )
	.then(function() {
		var options;

		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );

		// questions for each story component are present
		test.assertExists( 'select[name="have"]', 'question exists: have' );
		test.assertField( 'have', '', 'I have a ___ (is blank)' );
		test.assertExists( 'select[name="with"]', 'question exists: with' );
		test.assertField( 'with', '', 'with ___ (is blank)' );
		test.assertExists( 'select[name="about"]', 'question exists: about' );
		test.assertField( 'about', '', 'about ___ (is blank)' );

		// have list is in priority order (ignore first blank option)
		test.assertSelectorHasText( 'select[name="have"] > option:nth-child(2)', 'question', 'first option is "question"' );
		test.assertSelectorHasText( 'select[name="have"] > option:last-child', 'dispute', 'last option is "dispute"' );

		// with and about lists are in alphabetical order (ignore first blank option)
		options = casper.getElementsInfo( 'select[name="with"] > option' ).map(function( info ) { return info.text; });
		test.assertEquals( options.slice( 1 ), options.slice( 1 ).sort(), 'with options are in alphabetical order' );
		options = casper.getElementsInfo( 'select[name="about"] > option' ).map(function( info ) { return info.text; });
		test.assertEquals( options.slice( 1 ), options.slice( 1 ).sort(), 'about options are in alphabetical order' );
	})

	.run(function() {
		test.done();
	});
});


// Given a customer visits the tool,
// when the URL contains a complete story
// then they will see search results
casper.test.begin( 'search results for fences', 38, function suite( test ) {

	casper.start( URL + queryFromObject({ have: 'dispute', 'with': 'a neighbour', about: 'fences' }))
	.then(function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );
		test.assertSelectorHasText( '.story', 'I have a dispute with a neighbour about fences', 'story is correct (fences)' );

		test.assertExists( '.status.success', 'success message is shown (fences)' );
		test.assertSelectorHasText( '.status.success h2', 'We have found 1 option about fences', 'heading displays: 1 result' );
		test.assertElementCount( '.success li', 1, 'one list item (fences)' );
		test.assertSelectorHasText( '.success li a', '1 resource for resolving the dispute yourself', 'status text for self resolution (fences)' );
		test.assertSelectorDoesntHaveText( '.success', 'for getting help to resolve your', 'assisted resolution status not present (fences)' );
		test.assertSelectorDoesntHaveText( '.success', 'about formal resolution of your', 'formal resolution status not present (fences)' );

		// only self resolution section is shown
		test.assertExists( '#self-resolution', 'Self resolution section is present (fences)' );
		test.assertDoesntExist( '#assisted-resolution', 'Assisted resolution section is NOT present (fences)' );
		test.assertDoesntExist( '#formal-resolution', 'Formal resolution section is NOT present (fences)' );

		// 1 result for self resolution present
		test.assertElementCount( '.self tbody tr', 1, '1 result for self resolution' );
		test.assertSelectorHasText( '.self a', 'A', 'first result has correct title' );
		test.assertEquals( casper.getElementAttribute( '.self a', 'href' ), 'http://www.example.com/a', 'first result has correct URL' );
	})

	.thenOpen( URL + queryFromObject({ have: 'dispute', 'with': 'a neighbour', about: 'dogs and other pets' }))
	.then(function() {
		test.assertSelectorHasText( '.story', 'I have a dispute with a neighbour about dogs and other pets', 'story is correct (dogs)' );
		test.assertExists( '.status.success', 'success message is shown (dogs)' );
		test.assertSelectorHasText( '.status.success h2', 'We have found 2 options about dogs and other pets', 'heading displays: 2 results' );
		test.assertExists( '#assisted-resolution', 'Assisted resolution section is present (dogs)' );
		test.assertDoesntExist( '#self-resolution', 'Self resolution section is NOT present (dogs)' );
		test.assertSelectorDoesntHaveText( '.success', 'yourself', 'self resolution status not present (dogs)' );
		test.assertSelectorDoesntHaveText( '.success', 'about formal resolution of your', 'formal resolution status not present (dogs)' );
		test.assertDoesntExist( '#formal-resolution', 'Formal resolution section is NOT present (dogs)' );
		test.assertElementCount( '.success li', 1, 'one list item (dogs)' );
		test.assertSelectorHasText( '.success li a', '2 resources for getting help to resolve your dispute', 'status text for assisted resolution (dogs)' );
	})

	.thenOpen( URL + queryFromObject({ have: 'issue', 'with': 'a neighbour', about: 'noise' }))
	.then(function() {
		test.assertSelectorHasText( '.story', 'I have an issue with a neighbour about noise', 'story is correct (noise)' );
		test.assertExists( '.status.success', 'success message is shown (noise)' );
		test.assertSelectorHasText( '.status.success h2', 'We have found 7 options about noise', 'heading displays: 7 results' );
		test.assertElementCount( '#dispute-pathways-view .section', 3, 'three sections (noise)' );
		test.assertExists( '#self-resolution', 'Self resolution section is present (noise)' );
		test.assertExists( '#assisted-resolution', 'Assisted resolution section is present (noise)' );
		test.assertExists( '#formal-resolution', 'Formal resolution section is present (noise)' );
		test.assertSelectorHasText( '.success li:nth-child(1)', '3 resources for resolving the issue yourself', 'status text for self resolution (noise)' );
		test.assertSelectorHasText( '.success li:nth-child(2)', '4 resources for getting help to resolve your issue', 'status text for assisted resolution (noise)' );
		test.assertSelectorHasText( '.success li:nth-child(3)', '1 resource about formal resolution of your issue', 'status text for formal resolution (noise)' );
		test.assertSelectorDoesntHaveText( '#dispute-pathways-view tbody', 'legislation', 'no legislation results shown in tables' );
		test.assertSelectorHasText( '.aside.tip:nth-child(2) h2', 'Check the law', 'legislation aside is present' );
		test.assertSelectorHasText( '.aside.tip:nth-child(2) li', 'J', 'legislation link is present in aside' );

		// check initial state of datatable
		test.assertSelectorHasText( '#assisted-resolution tr:last-child', 'form', 'form result is placed last' );
	})

	.run(function() {
		test.done();
	});
});


// Given a custom visits the tool,
// when the URL contains part of a story
// then they will see the form with those values prefilled
casper.test.begin( 'partial state prefills form', 21, function suite( test ) {
	casper.start()
	.thenOpen( URL + queryFromObject({ have: 'dispute' }), function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );

		// questions for each story component are present
		test.assertExists( 'select[name="have"]', 'question exists: have' );
		test.assertField( 'have', 'dispute', 'I have a dispute (is prefilled)' );
		test.assertExists( 'select[name="with"]', 'question exists: with' );
		test.assertField( 'with', '', 'with ___ (is blank)' );
		test.assertExists( 'select[name="about"]', 'question exists: about' );
		test.assertField( 'about', '', 'about ___ (is blank)' );
	})
	.thenOpen( URL + queryFromObject({ have: 'dispute', 'with': 'a neighbour' }), function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );

		// questions for each story component are present
		test.assertExists( 'select[name="have"]', 'question exists: have' );
		test.assertField( 'have', 'dispute', 'I have a dispute (is prefilled)' );
		test.assertExists( 'select[name="with"]', 'question exists: with' );
		test.assertField( 'with', 'a neighbour', 'with a neighbour (is prefilled)' );
		test.assertExists( 'select[name="about"]', 'question exists: about' );
		test.assertField( 'about', '', 'about ___ (is blank)' );
	})
	.thenOpen( URL + queryFromObject({ about: 'fences' }), function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );

		// questions for each story component are present
		test.assertExists( 'select[name="have"]', 'question exists: have' );
		test.assertField( 'have', '', 'I have a ___ (is blank)' );
		test.assertExists( 'select[name="with"]', 'question exists: with' );
		test.assertField( 'with', '', 'with ___ (is blank)' );
		test.assertExists( 'select[name="about"]', 'question exists: about' );
		test.assertField( 'about', 'fences', 'about fences (is prefilled)' );
	})

	.run(function() {
		test.done();
	});
});


// Given the customer visits the tool
// when there are invalid values in the URL
// then they are ignored (treated as blank/unsupplied)
casper.test.begin( 'invalid values in URL ignored', 14, function suite( test ) {
	casper.start()
	.thenOpen( URL + queryFromObject({ have: 'foo', 'with': 'bar', about: 'baz' }), function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );

		// questions for each story component are present
		test.assertExists( 'select[name="have"]', 'question exists: have' );
		test.assertField( 'have', '', 'I have ___ (is blank)' );
		test.assertExists( 'select[name="with"]', 'question exists: with' );
		test.assertField( 'with', '', 'with ___ (is blank)' );
		test.assertExists( 'select[name="about"]', 'question exists: about' );
		test.assertField( 'about', '', 'about ___ (is blank)' );
	})
	.thenOpen( URL + queryFromObject({ have: 'dispute', 'with': 'a neighbour', about: 'baz' }), function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );

		// questions for each story component are present
		test.assertExists( 'select[name="have"]', 'question exists: have' );
		test.assertField( 'have', 'dispute', 'I have a dispute (is prefilled)' );
		test.assertExists( 'select[name="with"]', 'question exists: with' );
		test.assertField( 'with', 'a neighbour', 'with a neighbour (is prefilled)' );
		test.assertExists( 'select[name="about"]', 'question exists: about' );
		test.assertField( 'about', '', 'about ___ (is blank)' );
	})

	.run(function() {
		test.done();
	});
});


// Given a customer is viewing results,
// when they select a result and return to tool,
// then they should see the same results

// Given a customer is viewing results,
// when they go back to the form
// then they should see the form prefilled
casper.test.begin( 'back button behaves as expected', 19, function suite( test ) {
	casper.start()

	.thenOpen( URL, function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );
		// questions for each story component are present
		test.assertExists( 'select[name="have"]', 'question exists: have' );
		test.assertExists( 'select[name="with"]', 'question exists: with' );
		test.assertExists( 'select[name="about"]', 'question exists: about' );

		casper.fill( '#dispute-pathways-view form', { have: 'dispute', 'with': 'a neighbour', about: 'fences' });
		casper.click( '#dispute-pathways-view .actions strong input' );
	})

	// wait for querystring in URL
	.waitForUrl( '?' )

	.then(function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );
		// 1 result for self resolution present
		test.assertElementCount( '.self tbody tr', 1, '1 result for self resolution' );
		test.assertSelectorHasText( '.self a', 'A', 'first result has correct title' );
		test.assertEquals( casper.getElementAttribute( '.self a', 'href' ), 'http://www.example.com/a', 'first result has correct URL' );

		casper.click( '.self a' );
	})

	.waitForUrl( 'example.com' )
	.back()
	.waitForUrl( 'localhost' )

	.then(function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );
		// 1 result for self resolution present
		test.assertElementCount( '.self tbody tr', 1, '1 result for self resolution' );
		test.assertSelectorHasText( '.self a', 'A', 'first result has correct title' );
		test.assertEquals( casper.getElementAttribute( '.self a', 'href' ), 'http://www.example.com/a', 'first result has correct URL' );
	})

	.back()
	// no querystring
	.waitForUrl( /html$/ )

	.then(function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );
		// questions for each story component are present
		test.assertExists( 'select[name="have"]', 'question exists: have' );
		test.assertField( 'have', 'dispute', 'I have a dispute (is prefilled)' );
		test.assertExists( 'select[name="with"]', 'question exists: with' );
		test.assertField( 'with', 'a neighbour', 'with a neighbour (is prefilled)' );
		test.assertExists( 'select[name="about"]', 'question exists: about' );
		test.assertField( 'about', 'fences', 'about fences (is prefilled)' );
	})

	.run(function() {
		test.done();
	});
});


// Given the customer has not completed all form fields,
// when they submit the form,
// then the form status should be shown
casper.test.begin( 'form validation integration', 6, function suite( test ) {
	casper.start()

	.thenOpen( URL, function() {
		test.assertTitle( TITLE, 'loaded neighbourhood dispute page' );
		// questions for each story component are present
		test.assertExists( 'select[name="have"]', 'question exists: have' );
		test.assertExists( 'select[name="with"]', 'question exists: with' );
		test.assertExists( 'select[name="about"]', 'question exists: about' );

		casper.fill( '#dispute-pathways-view form', { have: '', 'with': '', about: '' });
		casper.click( '#dispute-pathways-view .actions strong input' );

		// 1 result for self resolution present
		test.assertExists( '.warn', 'form validation warning is shown' );
		test.assertSelectorHasText( '.warn h2', 'Please check your answers', 'form validation warning is displayed' );
	})

	.run(function() {
		test.done();
	});
});