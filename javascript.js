document.addEventListener('DOMContentLoaded', function() {
    const cronjobInput = document.getElementById('cronjob');       // Cron job input field
    const aliasnameInput = document.getElementById('aliasname');   // Alias name input field
    const generateButton = document.getElementById('generate');    // Generate button
    const outputArea = document.getElementById('output');          // Output textarea

    /**
     * Function to escape special characters for use in an Awk regular expression.
     * This ensures that characters like *, ?, [, ], etc., are treated literally.
     * @param {string} str - The string to be escaped.
     * @return {string} - The escaped string.
     */
    function escapeForAwkRegex(str) {
        // Escape backslashes and forward slashes
        str = str.replace(/[\\\/]/g, '\\$&');
        // Escape special regex characters
        return str.replace(/[\^\$\.\*\+\?\(\)\[\]\{\}\|]/g, '\\$&');
    }

    /**
     * Function to escape special characters for use in a Grep pattern.
     * Escapes backslashes, forward slashes, and double quotes.
     * @param {string} str - The string to be escaped.
     * @return {string} - The escaped string.
     */
    function escapeForGrep(str) {
        return str.replace(/([\\\/\*\?\+\[\]\^\$\.\|\{\}\(\)])/g, '\\$1').replace(/"/g, '\\"');
    }

    /**
     * Main function to generate the 'on' and 'off' aliases based on user input.
     */
    function generateAliases() {
        // Retrieve and trim the values from the input fields
        let cronJob = cronjobInput.value.trim();       // User-provided cron job string
        let aliasName = aliasnameInput.value.trim();   // User-provided alias name

        // Clear previous outputs
        outputArea.value = '';

        // Check if both inputs are provided
        if (!cronJob || !aliasName) {
            outputArea.value = "Please enter both the cron job string and alias name.";
            return; // Exit the function if inputs are missing
        }

        // Escape the cron job string for use in Awk and Grep patterns
        let escapedCronJobForAwk = escapeForAwkRegex(cronJob);
        let escapedCronJobForGrep = escapeForGrep(cronJob);

        // Capitalize the alias name for messages
        let capitalizedAliasName = aliasName.charAt(0).toUpperCase() + aliasName.slice(1);

        // Build the 'off' alias
        let offAlias = "alias " + aliasName + "off='crontab -l | awk '\\''/^#/{print;next}/^" + escapedCronJobForAwk + "$/{print \"#\" $0;next}1'\\'' > /tmp/crontab.txt && if grep -q \"^#" + escapedCronJobForGrep + "$\" /tmp/crontab.txt; then crontab /tmp/crontab.txt; echo \"" + capitalizedAliasName + " has been disabled.\"; else echo \"Crontab task not found!\"; fi && rm /tmp/crontab.txt'";

        // Build the 'on' alias
        let onAlias = "alias " + aliasName + "on='crontab -l | awk '\\''/^#" + escapedCronJobForAwk + "$/{sub(/^#/,\"\",$0);print;next}1'\\'' > /tmp/crontab.txt && if grep -q \"^" + escapedCronJobForGrep + "$\" /tmp/crontab.txt; then crontab /tmp/crontab.txt; echo \"" + capitalizedAliasName + " has been enabled.\"; else echo \"Crontab task not found!\"; fi && rm /tmp/crontab.txt'";

        // Display the generated alias commands in the output textarea
        outputArea.value = offAlias + "\n\n" + onAlias;
    }

    // Add an event listener to the 'Generate' button to trigger alias generation on click
    generateButton.addEventListener('click', generateAliases);

    // Add an event listener for keypress events to trigger alias generation on 'Enter' keypress
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') { // Check if the pressed key is 'Enter'
            generateAliases();   // Call the function to generate aliases
        }
    });
});
