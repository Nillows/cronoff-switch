document.addEventListener('DOMContentLoaded', function() {
    const cronjobInput = document.getElementById('cronjob');
    const aliasnameInput = document.getElementById('aliasname');
    const generateButton = document.getElementById('generate');
    const outputArea = document.getElementById('output');

    function escapeForAwkRegex(str) {
        return str.replace(/[\\^$.*+?()[\]{}|\/]/g, '\\$&');
    }

    function escapeForGrep(str) {
        return str.replace(/\\/g, '\\\\')
                   .replace(/"/g, '\\"')
                   .replace(/\$/g, '\\$')
                   .replace(/\^/g, '\\^');
    }

    function generateAliases() {
        let cronJob = cronjobInput.value.trim();
        let aliasName = aliasnameInput.value.trim();

        if (!cronJob || !aliasName) {
            outputArea.value = "Please enter both the cron job string and alias name.";
            return;
        }

        let escapedCronJobForAwk = escapeForAwkRegex(cronJob);
        let escapedCronJobForGrep = escapeForGrep(cronJob);

        let offAlias = "alias " + aliasName + "off='crontab -l | awk '\\''/^#/{print;next}/" + escapedCronJobForAwk + "/{print \"#\" $0;next}1'\\'' > /tmp/crontab.txt && if grep -q \"" + escapedCronJobForGrep + "\" /tmp/crontab.txt; then crontab /tmp/crontab.txt; echo \"" + aliasName + " is now off\"; else echo \"" + aliasName + " is already off\"; fi'";

        let onAlias = "alias " + aliasName + "on='crontab -l | awk '\\''/^#" + escapedCronJobForAwk + "/{sub(/^#/,\"\",$0);print;next}1'\\'' > /tmp/crontab.txt && if grep -q \"^" + escapedCronJobForGrep + "\" /tmp/crontab.txt; then crontab /tmp/crontab.txt; echo \"" + aliasName + " is now on\"; else echo \"" + aliasName + " is already on\"; fi'";

        outputArea.value = offAlias + "\n\n" + onAlias;
    }

    generateButton.addEventListener('click', generateAliases);

    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateAliases();
        }
    });
});
