const cli = require("./lib/cli");
const dedent = require("dedent");

module.exports = {
  transforms: {
    helpMessage() {
      return "\n```sh\n" + dedent(cli.help_message) + "\n```\n";
    },
  },
};
