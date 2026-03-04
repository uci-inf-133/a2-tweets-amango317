// Test cases for Tweet parsing
const Tweet = require('./js/tweet.js').Tweet;

const testCases = [
    {
        text: "Just completed a 5 km run with @RunKeeper",
        expected: {
            source: "completed_event",
            activity: "run",
            distance: 5 * 0.621371
        }
    },
    {
        text: "Finished an 8.2km Trail Run #Runkeeper",
        expected: {
            source: "completed_event",
            activity: "trail run",
            distance: 8.2 * 0.621371
        }
    },
    {
        text: "Just completed 3 miles cycling",
        expected: {
            source: "completed_event",
            activity: "cycling",
            distance: 3
        }
    },
    {
        text: "45 mins yoga session",
        expected: {
            source: "miscellaneous",
            activity: "unknown",
            distance: 0
        }
    }
];

console.log("Running Tweet parsing tests...\n");

testCases.forEach((testCase, index) => {
    const tweet = new Tweet(testCase.text, new Date().toString());
    
    console.log(`Test ${index + 1}: "${testCase.text}"`);
    console.log(`  Source: ${tweet.source} (expected: ${testCase.expected.source})`);
    console.log(`  Activity: ${tweet.activityType} (expected: ${testCase.expected.activity})`);
    console.log(`  Distance: ${tweet.distance.toFixed(2)} miles (expected: ${testCase.expected.distance.toFixed(2)})`);
    console.log();
});