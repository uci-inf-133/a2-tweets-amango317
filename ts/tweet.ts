class Tweet {

    private tweetData: any;
    // private text: string;
    // time: Date;

    constructor(data: any){
        this.tweetData = data;
    }

    // Regex pattern to extract activity details from tweet text
    // Matches patterns like:
    // - "5 km run"
    // - "8.2km Run"
    // - "3 miles cycling"
    // - "10.5 mi trail run"
    // - "5kms biking"
    private static readonly activityPattern = /(\d+\.?\d*)\s*(km|kms|mi|mile|miles)\b[.\s\S]*?([A-Za-z][A-Za-z ]{0,30})/i;    // constructor(tweet_text: string, tweet_time: string) {
    //     this.text = tweet_text;
    //     this.time = new Date(tweet_time);
    // }

    get time(): Date{
        return new Date(this.tweetData.created_at);
    }

    get text(): string{
        return this.tweetData.text;
    }

    //returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source(): string {
        const textLower = this.text.toLowerCase();
        
        // Define category patterns
        const completedPattern = /(?:completed|finished|just posted|just did).*(?:\d+\.?\d*\s+(?:km|mi))/i;
        const achievementPattern = /(?:achieved|new record|personal best|milestone|new pb|set a goal)/i;
        const liveEventPattern = /(?:is live|watch my|join me|right now|starting now|#rklive)/i;

        // Test patterns in order of most specific to least specific
        if (completedPattern.test(textLower)) {
            return 'completed_event';
        }
        if (achievementPattern.test(textLower)) {
            return 'achievement';
        }
        if (liveEventPattern.test(textLower)) {
            return 'live_event';
        }
        return 'miscellaneous';
    }

get writtenText(): string {
    let cleanString = this.text;

    // --- Things we want to strip ---
    const staticBoilerplate = [
        /(?:https?:\/\/[^\s]+|www\.[^\s]+)/gi, // URLs
        /#Runkeeper/gi, //Hashtags and Mentions
        /@Runkeeper/gi,
        /Check it out!/gi, //Phrase often used
        / with \./gi,      // The residual " with ." after stripping @Runkeeper
        /Just completed a/gi, //Phrases often found at the beginning
        /Just posted a/gi,
        /Just finished a/gi,
        /Check out my/gi,
        / on /gi,
        / with /gi,
        / for /gi,
        /Runkeeper\./gi, 
    ];

    for (const pattern of staticBoilerplate) {
        cleanString = cleanString.replace(pattern, ' '); 
    }

    // This removes the core dynamic part (distance, unit, activity type).
    const dynamicDataPattern = /(\d+\.?\d*)\s(km|mi)\s(\w+)[^a-zA-Z\s]*/i; 
    cleanString = cleanString.replace(dynamicDataPattern, ' ');

    // These specific remnants are not user-written.
    const activityRemnants = [
        /walk \./gi,
        /bike \./gi,
        /workout \./gi,
        /run \./gi,
    ];

    for (const pattern of activityRemnants) {
        cleanString = cleanString.replace(pattern, ' '); 
    }
    
    // This removes any single period that remains after cleanup.
    cleanString = cleanString.replace(/\s\.\s/g, ' '); 
    

    //Remove common residual punctuation and then strip the hyphen.
    cleanString = cleanString.replace(/[.,!?:;]/g, ' '); 
    cleanString = cleanString.replace(/-/g, ' '); // Remove all hyphens (they are only used by the system formatting in these tweets)
    
    // clean up
    cleanString = cleanString.replace(/\s+/g, ' '); 
    let finalUserText = cleanString.trim();

    return finalUserText;
}
    /**
     * Returns true if any text remains after stripping the boilerplate.
     */
    get written(): boolean {
        return this.writtenText.length > 0;
    }

    get activityType(): string {
        // Only process completed events
        if (this.source !== 'completed_event') {
            return 'other';
        }

        // Extract activity type from the text
        const match = this.text.match(Tweet.activityPattern);
        if (!match || !match[3]) {
            return 'other';
        }

        // Clean and normalize the activity name
        let activity = match[3].replace(/[^a-zA-Z\s]+$/, '').trim().toLowerCase();
        activity = activity.replace(/\s+(with|a|an|the|of)\s*$/, '').trim();
        if (!activity) {
            return 'other';
        }

        // Normalize spaces for multi-word activities (e.g., "trail run")
        return activity.replace(/\s+/g, ' ');
    }

    get distance(): number {
        // Only process completed events
        if (this.source !== 'completed_event') {
            return 0;
        }

        // Try to match the distance pattern
        const match = this.text.match(Tweet.activityPattern);
        if (!match) {
            return 0;
        }

        // Parse the numeric distance
        const value = parseFloat(match[1]);
        if (isNaN(value)) {
            return 0;
        }

        // Convert to miles based on the unit
        const unit = match[2].toLowerCase();
        if (unit.startsWith('km')) {
            return value * 0.621371; // Convert kilometers to miles
        } else if (unit.startsWith('mi') || unit.includes('mile')) {
            return value; // Already in miles
        }

        return 0; // Unknown unit
    }



    get activityLink(): string | null {
        const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
        const match = this.text.match(urlPattern);

        if (match){
            return match[0];
        }
        return null;
    }
   getHTMLTableRow(rowNumber: number): string {
    // Get data needed for row
    const link = this.activityLink;
    const activity = this.activityType || 'N/A';

    // 1. Create a generic clickable link label
    const linkHTML = link 
        ? `<a href="${link}" target="_blank"> [View Activity]</a>`
        : 'Link Unavailable';

    // 2. Get the full tweet text
    let fullTweetText = this.text;

    // 3. Remove the raw URL from the tweet text to prevent duplication
    if (link) {
        // Escape special regex characters in the link string
        const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Use a global, case-insensitive regex to replace all instances of the link with nothing
        const linkPattern = new RegExp(escapedLink, 'gi'); 
        fullTweetText = fullTweetText.replace(linkPattern, '').trim();
    }
    
    // 4. Combine the clean text and the clickable link
    const finalContent = fullTweetText + ' ' + linkHTML;

    return `
        <tr>
            <td>${rowNumber}</td>
            <td>${activity}</td>
            <td>${finalContent}</td>
        </tr>
    `;
}
}