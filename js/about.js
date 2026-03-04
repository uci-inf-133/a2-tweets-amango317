function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet);
	});

	//Tweet Dates: find the earliest and latest tweet dates
	function getTweetDates(tweets) {
		if (tweets.length === 0) {
			window.alert('No tweets to process');
			return { earliest: '', latest: '' };
		}

		// tweets[i].time is already a Date object from Tweet class
		let earliest = tweets[0].time;
		let latest = tweets[0].time;

		for (let i = 1; i < tweets.length; i++) {
			const d = tweets[i].time;
			if (d < earliest) earliest = d;
			if (d > latest) latest = d;
		}

		const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' };
		return { earliest: earliest.toLocaleDateString('en-US', opts), latest: latest.toLocaleDateString('en-US', opts) };
	}

	//Tweet Categories: count by Tweet.source getter
	function categorizeTweets(tweets) {
		const categories = {
			completedEvents: 0,
			liveEvents: 0,
			achievements: 0,
			miscellaneous: 0
		};

		for (const t of tweets) {
			const src = t.source;
			if (src === 'completed_event') categories.completedEvents++;
			else if (src === 'live_event') categories.liveEvents++;
			else if (src === 'achievement') categories.achievements++;
			else categories.miscellaneous++;
		}

		return categories;
	}

	// Format a percentage with exactly two decimals using math.format
	function formatPct(part, total) {
		if (total === 0) return math.format(0, { notation: 'fixed', precision: 2 }) + '%';
		const pct = (part / total) * 100;
		return math.format(pct, { notation: 'fixed', precision: 2 }) + '%';
	}

	// Update DOM with computed values
	const counts = categorizeTweets(tweet_array);
	const dates = getTweetDates(tweet_array);

	document.getElementById('numberTweets').innerText = tweet_array.length;
	document.getElementById('firstDate').innerText = dates.earliest;
	document.getElementById('lastDate').innerText = dates.latest;

	// Update category counts and percentages
	const completedEls = document.getElementsByClassName('completedEvents');
	for (const el of completedEls) { el.innerText = counts.completedEvents; }
	const completedPctEls = document.getElementsByClassName('completedEventsPct');
	for (const el of completedPctEls) { el.innerText = formatPct(counts.completedEvents, tweet_array.length); }

	const liveEls = document.getElementsByClassName('liveEvents');
	for (const el of liveEls) { el.innerText = counts.liveEvents; }
	const livePctEls = document.getElementsByClassName('liveEventsPct');
	for (const el of livePctEls) { el.innerText = formatPct(counts.liveEvents, tweet_array.length); }

	const achEls = document.getElementsByClassName('achievements');
	for (const el of achEls) { el.innerText = counts.achievements; }
	const achPctEls = document.getElementsByClassName('achievementsPct');
	for (const el of achPctEls) { el.innerText = formatPct(counts.achievements, tweet_array.length); }

	const miscEls = document.getElementsByClassName('miscellaneous');
	for (const el of miscEls) { el.innerText = counts.miscellaneous; }
	const miscPctEls = document.getElementsByClassName('miscellaneousPct');
	for (const el of miscPctEls) { el.innerText = formatPct(counts.miscellaneous, tweet_array.length); }

	// Of the completed events, how many have user-written text?
	const completedTweets = tweet_array.filter(t => t.source === 'completed_event');
	const writtenCount = completedTweets.reduce((acc, t) => acc + (t.written ? 1 : 0), 0);

	const writtenEls = document.getElementsByClassName('written');
	for (const el of writtenEls) { el.innerText = writtenCount; }
	const writtenPctEls = document.getElementsByClassName('writtenPct');
	for (const el of writtenPctEls) { el.innerText = formatPct(writtenCount, completedTweets.length); }
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});