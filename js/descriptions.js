function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	all_tweets = runkeeper_tweets.map(tweet => new Tweet(tweet));
}

let all_tweets =[];
const searchBoxId = 'textFilter'; // Verify your search input ID
const tableBodyId = 'tweetTable';

function parseTweets(runkeeper_tweets){
	if(runkeeper_tweets === undefined){
		window.alert('No tweets returned');
		return;
	}

	//Map raw JSON data to the Tweet instances
	all_tweets = runkeeper_tweets.map(tweet => new Tweet(tweet));
	addEventHandlerForSearch();
}

	//TODO: Filter to just the written tweets
	function isWrittenTweet(tweet) {
			return tweet.written;
	}


function addEventHandlerForSearch() {
	//TODO: Search the written tweets as text is entered into the search box, and add them to the table
	const searchBox = document.getElementById(searchBoxId);

	if (searchBox){
		searchBox.onkeyup = filterAndDisplayTweets;
	}


}


function filterAndDisplayTweets() {
	const searchBox = document.getElementById(searchBoxId);
	const tableBody = document.getElementById(tableBodyId);
	const countSpan = document.getElementById('searchCount');
	const textSpan = document.getElementById('searchText');

	const searchTerm = searchBox.value.toLowerCase().trim();
	//Update search text span
	textSpan.innerText = searchTerm || 'no text';

	//Clear the table and count if the search text is empty
	if (searchTerm.length === 0){
		tableBody.innerHTML = '';
		countSpan.innerText = '0';
		return;
	}

	if (searchTerm.length === 0){
		tableBody.innerHTML = '';
		countSpan.innerText = '0';
		return;
	}

	//Filter tweets: must be user-written AND contain search term
	const filteredTweets = all_tweets.filter(tweet => {
		//Only search user-written tweets
		if (!isWrittenTweet(tweet)){
			return false;
		}

		return tweet.writtenText.toLowerCase().includes(searchTerm);
	});

	//Fill out table
	tableBody.innerHTML = ''; //clear existing rows
	countSpan.innerText = filteredTweets.length;

	let tableContent = '';
	for (let i = 0; i < filteredTweets.length; i++) {
		const tweet = filteredTweets[i];
		tableContent += tweet.getHTMLTableRow(i + 1);
	}
	tableBody.innerHTML = tableContent;


}




//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});