# How

Make sure you have docker installed as well as the Flow CLI: https://docs.onflow.org/flow-cli/install/

1) Run `yarn` at the project root

2) `cd` into the fcl-dev-wallet directory and run this command: `docker-compose up -d`. This will start the local emulator and dev wallet

3) From the root directory, run `yarn start`. This will launch the webpage. You can then login through FCL and run an example transaction (minting FlowToken) and an example script (reading FlowToken balance). You can change these inside App.js

