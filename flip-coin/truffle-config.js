const path = require("path");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),

  networks: {
    development: {
      network_id: "5777",
      host: '127.0.0.1',
      port: 7545
    }
  }

  // networks: {
  //   rinkeby: {
  //     provider: function() {
  //       return new HDWalletProvider(mnemonic,     “https://rinkeby.infura.io/thisistheapikey");
  //     },
  //     network_id: 1
  //   }
  // }
};
