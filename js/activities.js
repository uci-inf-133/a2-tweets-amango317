function parseTweets(runkeeper_tweets) {
    //Do not proceed if no tweets loaded
    if(runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }
    
    tweet_array = runkeeper_tweets.map(function(tweet) {
        return new Tweet(tweet);
    });

    // Get completed event tweets and their activity types
    const completedEvents = tweet_array.filter(tweet => tweet.source === 'completed_event');
    
    // Count activities and sort by frequency
    const activityCounts = {};
    completedEvents.forEach(tweet => {
        const activity = tweet.activityType;
        if (activity !== 'unknown') {
            activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        }
    });

    // Sort activities by count
    const sortedActivities = Object.entries(activityCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([activity]) => activity);

    // Get top 3 activities
    const topActivities = sortedActivities.slice(0, 3);

    // Update DOM with activity counts
    document.getElementById('numberActivities').textContent = sortedActivities.length;
    document.getElementById('firstMost').textContent = topActivities[0];
    document.getElementById('secondMost').textContent = topActivities[1];
    document.getElementById('thirdMost').textContent = topActivities[2];

    // Create activity visualization data
    const activityData = completedEvents.map(tweet => ({
        activityType: tweet.activityType,
        count: 1
    })).filter(d => d.activityType !== 'unknown' && d.activityType.trim() !== '');

	console.log("Activity Data:", activityData);

    // Bar chart for activity counts
    activity_vis_spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "A graph of the number of Tweets containing each type of activity.",
        "mark": "bar",
        "encoding": {
            "x": {
                "field": "activityType",
                "type": "nominal",
                "title": "Activity Type",
                "sort": {"op": "count", "order": "descending"}
            },
            "y": {
                "aggregate": "count",
                "title": "Number of Tweets"
            }
        },
        "data": {
            "values": activityData
        }
    };
    vegaEmbed('#activityVis', activity_vis_spec, {actions:false});

    // Prepare data for distance visualization
    const distanceData = completedEvents
        .filter(tweet => topActivities.includes(tweet.activityType))
        .map(tweet => ({
            activity: tweet.activityType,
            // FIX 1A: Ensure distance is a number
            distance: Number(tweet.distance),
            dayOfWeek: tweet.time.toLocaleDateString('en-US', { weekday: 'long' })
        }))
        // FIX 1B: Filter out non-finite (NaN, Infinity) and non-positive numbers
        .filter(d => Number.isFinite(d.distance) && d.distance > 0);

    // Calculate activity statistics
    const activityStats = {};
    topActivities.forEach(activity => {
        const distances = distanceData
            .filter(d => d.activity === activity)
            .map(d => d.distance);
        activityStats[activity] = {
            // FIX 2: Check for distances.length > 0 to prevent division by zero
            avg: distances.length > 0 ? distances.reduce((a,b) => a + b, 0) / distances.length : 0,
            count: distances.length
        };
    });

	const activityEntries = Object.entries(activityStats);
    let longestActivity = 'N/A';
    let shortestActivity = 'N/A';

    // Find longest and shortest activities
    if (activityEntries.length > 0) {
        // Find Longest Activity: Destructure the result of the sorting into a NEW const variable
        const [longestEntry] = [...activityEntries].sort(([,a], [,b]) => b.avg - a.avg);
        // Then assign the result (the activity name) 
        longestActivity = longestEntry[0]; 

        // Find Shortest Activity: Destructure the result of the sorting into a NEW const variable
        const [shortestEntry] = [...activityEntries].sort(([,a], [,b]) => a.avg - b.avg);
        // Then assign the result (the activity name) 
        shortestActivity = shortestEntry[0];
    }
    // Update DOM with activity analysis
    document.getElementById('longestActivityType').textContent = longestActivity;
    document.getElementById('shortestActivityType').textContent = shortestActivity;

    // Create scatter plot for distances by day
    const distanceVis = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Distance by day of week and activity type",
        "width": 600,
        "height": 300,
        "mark": "point",
        "encoding": {
            "x": {
                "field": "dayOfWeek",
                "type": "nominal",
                "title": "Day of Week",
                "sort": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
            },
            "y": {
                "field": "distance",
                "type": "quantitative",
                "title": "Distance (miles)"
            },
            "color": {
                "field": "activity",
                "type": "nominal",
                "title": "Activity Type"
            }
        },
        "data": {
            "values": distanceData
        }
    };

    // Create aggregated view
    const distanceVisAggregated = {
        ...distanceVis,
        "mark": "line",
        "encoding": {
            ...distanceVis.encoding,
            "y": {
                "field": "distance",
                "type": "quantitative",
                "title": "Average Distance (miles)",
                "aggregate": "mean"
            }
        }
    };

    // Initial visualization
    vegaEmbed('#distanceVis', distanceVis, {actions:false});
    document.getElementById('distanceVisAggregated').style.display = 'none';

    // Calculate weekday vs weekend statistics
    const weekdayDistances = distanceData.filter(d => 
        !['Sunday', 'Saturday'].includes(d.dayOfWeek)
    ).map(d => d.distance);
    const weekendDistances = distanceData.filter(d => 
        ['Sunday', 'Saturday'].includes(d.dayOfWeek)
    ).map(d => d.distance);

    //Check for array length > 0 before division to prevent Infinity/NaN
    const weekdayAvg = weekdayDistances.length > 0 ? weekdayDistances.reduce((a,b) => a + b, 0) / weekdayDistances.length : 0;
    const weekendAvg = weekendDistances.length > 0 ? weekendDistances.reduce((a,b) => a + b, 0) / weekendDistances.length : 0;

    document.getElementById('weekdayOrWeekendLonger').textContent = 
        weekendAvg > weekdayAvg ? 'weekends' : 'weekdays';

    // Toggle between visualizations
    document.getElementById('aggregate').addEventListener('click', function() {
        const distanceVisDiv = document.getElementById('distanceVis');
        const distanceVisAggDiv = document.getElementById('distanceVisAggregated');
        
        if (distanceVisDiv.style.display !== 'none') {
            distanceVisDiv.style.display = 'none';
            distanceVisAggDiv.style.display = 'block';
            vegaEmbed('#distanceVisAggregated', distanceVisAggregated, {actions:false});
            this.textContent = 'Show all activities';
        } else {
            distanceVisDiv.style.display = 'block';
            distanceVisAggDiv.style.display = 'none';
            this.textContent = 'Show means';
        }
    });
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});