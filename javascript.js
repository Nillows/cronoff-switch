// Wait for the entire HTML document to be loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    // Get references to the input fields and output area in the HTML
    const cronjobInput = document.getElementById('cronjob');       // Cron job input field
    const aliasnameInput = document.getElementById('aliasname');   // Alias name input field
    const generateButton = document.getElementById('generate');    // Generate button
    const outputArea = document.getElementById('output');          // Output textarea

    /**
     * Function to escape special characters for use in an awk regular expression.
     * This ensures that characters like *, ?, [, ], etc., are treated literally.
     * @param {string} str - The string to be escaped.
     * @return {string} - The escaped string.
     */
    function escapeForAwkRegex(str) {
        // Use a regular expression to find special regex characters and escape them
        return str.replace(/[\\^$.*+?()[\]{}|\/]/g, '\\$&');
    }

    /**
     * Function to escape special characters for use in a grep command.
     * This ensures that characters like \, *, ?, [, ], etc., are properly escaped.
     * @param {string} str - The string to be escaped.
     * @return {string} - The escaped string.
     */
    function escapeForGrep(str) {
        return str
            .replace(/\\/g, '\\\\')    // Escape backslashes
            .replace(/"/g, '\\"')      // Escape double quotes
            .replace(/\$/g, '\\$')     // Escape dollar signs
            .replace(/\^/g, '\\^')     // Escape caret symbols
            .replace(/\*/g, '\\*')     // Escape asterisks
            .replace(/\./g, '\\.')     // Escape dots
            .replace(/\//g, '\\/')     // Escape slashes
            .replace(/\[/g, '\\[')     // Escape opening square brackets
            .replace(/\]/g, '\\]')     // Escape closing square brackets
            .replace(/\?/g, '\\?')     // Escape question marks
            .replace(/\+/g, '\\+');    // Escape plus signs
    }

    /**
     * Main function to generate the 'on' and 'off' aliases based on user input.
     */
    function generateAliases() {
        // Retrieve and trim the values from the input fields
        let cronJob = cronjobInput.value.trim();       // User-provided cron job string
        let aliasName = aliasnameInput.value.trim();   // User-provided alias name

        // Check if both inputs are provided
        if (!cronJob || !aliasName) {
            outputArea.value = "Please enter both the cron job string and alias name.";
            return; // Exit the function if inputs are missing
        }

        // Escape the cron job string for use in awk and grep commands
        let escapedCronJobForAwk = escapeForAwkRegex(cronJob); // Escaped for awk regex
        let escapedCronJobForGrep = escapeForGrep(cronJob);    // Escaped for grep

        // Construct the 'off' alias command
        let offAlias = "alias " + aliasName + "off='crontab -l | awk '\\''/^#/{print;next}/" + escapedCronJobForAwk + "/{print \"#\" $0;next}1'\\'' > /tmp/crontab.txt && " +
                       "if grep -q \"^" + escapedCronJobForGrep + "\" /tmp/crontab.txt; then crontab /tmp/crontab.txt; echo \"" + aliasName + " is now off\"; " +
                       "else echo \"" + aliasName + " is already off\"; fi'";

        // Construct the 'on' alias command
        let onAlias = "alias " + aliasName + "on='crontab -l | awk '\\''/^#" + escapedCronJobForAwk + "/{sub(/^#/,\"\",$0);print;next}1'\\'' > /tmp/crontab.txt && " +
                      "if grep -q \"^" + escapedCronJobForGrep + "\" /tmp/crontab.txt; then crontab /tmp/crontab.txt; echo \"" + aliasName + " is now on\"; " +
                      "else echo \"" + aliasName + " is already on\"; fi'";

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
