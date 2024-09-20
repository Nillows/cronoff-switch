document.addEventListener('DOMContentLoaded', function() {
    const cronjobInput = document.getElementById('cronjob');          // Cron job input field
    const aliasnameInput = document.getElementById('aliasname');      // Alias name input field
    const generateButton = document.getElementById('generate');       // Generate button
    const outputArea = document.getElementById('output');             // Output textarea
    const copyAliasesButton = document.getElementById('copyAliases'); // Copy Aliases button
    const appendCommandArea = document.getElementById('appendCommand'); // Command to append aliases
    const copyCommandButton = document.getElementById('copyCommand'); // Copy Command button

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
     * Function to copy text to the clipboard and update the button text
     * @param {string} text - The text to copy to the clipboard
     * @param {HTMLElement} button - The button that was clicked
     */
    function copyToClipboard(text, button) {
        navigator.clipboard.writeText(text)
            .then(function() {
                // Change the button text to 'Copied!'
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.disabled = true; // Disable the button temporarily
                // After 2 seconds, reset the button text
                setTimeout(function() {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            })
            .catch(function(err) {
                console.error('Failed to copy to clipboard: ', err);
            });
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
        appendCommandArea.value = '';

        // Reset copy buttons text
        copyAliasesButton.textContent = 'Copy Aliases';
        copyCommandButton.textContent = 'Copy Command';

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

        // Combine the aliases
        let aliasText = offAlias + "\n\n" + onAlias;

        // Display the generated alias commands in the output textarea
        outputArea.value = aliasText;

        // Generate the command to append aliases to .bashrc
        let appendCommand = "printf '\\n' >> ~/.bashrc && cat >> ~/.bashrc << 'END_OF_ALIASES'\n" + aliasText + "\nEND_OF_ALIASES";

        // Display the command in the appendCommandArea
        appendCommandArea.value = appendCommand;

        // Reset the copy buttons text (in case they were showing 'Copied!')
        copyAliasesButton.textContent = 'Copy Aliases';
        copyAliasesButton.disabled = false;
        copyCommandButton.textContent = 'Copy Command';
        copyCommandButton.disabled = false;
    }

    // Add an event listener to the 'Generate' button to trigger alias generation on click
    generateButton.addEventListener('click', generateAliases);

    // Add event listener to 'Copy Aliases' button
    copyAliasesButton.addEventListener('click', function() {
        copyToClipboard(outputArea.value, copyAliasesButton);
    });

    // Add event listener to 'Copy Command' button
    copyCommandButton.addEventListener('click', function() {
        copyToClipboard(appendCommandArea.value, copyCommandButton);
    });
});
