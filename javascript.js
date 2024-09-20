document.addEventListener('DOMContentLoaded', function() {
    const cronjobInput = document.getElementById('cronjob');       // Cron job input field
    const aliasnameInput = document.getElementById('aliasname');   // Alias name input field
    const generateButton = document.getElementById('generate');    // Generate button
    const outputArea = document.getElementById('output');          // Output textarea
    const curlCommandArea = document.getElementById('curlcommand'); // Curl command output area

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
     * Function to send the aliases to Hastebin and get the URL.
     * @param {string} aliasText - The alias text to send.
     * @return {Promise<string>} - A promise that resolves to the Hastebin raw URL.
     */
    function sendToHastebin(aliasText) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://www.toptal.com/developers/hastebin/documents', true);
            xhr.setRequestHeader('Content-Type', 'text/plain; charset=UTF-8');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        try {
                            var response = JSON.parse(xhr.responseText);
                            var key = response.key;
                            var rawUrl = 'https://www.toptal.com/developers/hastebin/raw/' + key;
                            resolve(rawUrl);
                        } catch (e) {
                            reject('Failed to parse Hastebin response.');
                        }
                    } else {
                        reject('Error posting to Hastebin: ' + xhr.statusText);
                    }
                }
            };

            xhr.onerror = function() {
                reject('Network error while posting to Hastebin.');
            };

            xhr.send(aliasText);
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
        curlCommandArea.value = '';

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

        // Combine the aliases
        let aliasText = offAlias + "\n\n" + onAlias;

        // Display the generated alias commands in the output textarea
        outputArea.value = aliasText;

        // Send the alias text to Hastebin and get the raw URL
        sendToHastebin(aliasText)
            .then(function(rawUrl) {
                // Construct the curl command
                let curlCommand = 'curl -L ' + rawUrl + ' >> ~/.bashrc';

                // Display the curl command in the curlCommandArea
                curlCommandArea.value = curlCommand;
            })
            .catch(function(error) {
                curlCommandArea.value = 'Error: ' + error;
            });
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
